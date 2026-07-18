import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportProductPayload {
  name: string;
  description?: string;
  category: string;
  salePrice: number;
  unitCost?: number;
  currentStock?: number;
  minStock?: number;
  maxStock?: number | null;
  sku?: string | null;
  barcode?: string | null;
  supplier?: string | null;
  taxRate?: number;
  status?: 'active' | 'inactive' | 'discontinued';
  hasInvima?: boolean;
  invimaRegistryNumber?: string | null;
  expirationDate: string;
  image?: string;
}

interface RowError {
  row: number;
  name: string;
  error: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeExpirationDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return trimmed;
}

async function supportsRequiredColumns(
  conn: Awaited<ReturnType<typeof pool.getConnection>>
): Promise<boolean> {
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME IN ('has_invima', 'invima_registry_number', 'fecha_vencimiento')`
  );
  return Number((rows[0] as RowDataPacket & { count?: number })?.count ?? 0) === 3;
}

// ─── POST /api/admin/inventory/import ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  let connection: Awaited<ReturnType<typeof pool.getConnection>> | null = null;

  try {
    const body = await request.json() as { products?: unknown; mode?: string };
    const products = body?.products;
    const mode = body?.mode === 'replace' ? 'replace' : 'add';

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'No se recibieron productos para importar.' },
        { status: 400 }
      );
    }

    if (products.length > 2000) {
      return NextResponse.json(
        { error: 'El límite por importación es de 2000 productos.' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    const schemaOk = await supportsRequiredColumns(connection);
    if (!schemaOk) {
      return NextResponse.json(
        {
          error:
            'La base de datos no tiene los campos INVIMA / fecha de vencimiento. Ejecuta mysql/add-invima-fields.sql y mysql/add-expiration-date.sql antes de importar.',
        },
        { status: 409 }
      );
    }

    // ── Replace mode: wipe existing inventory first ────────────────────────
    if (mode === 'replace') {
      await connection.beginTransaction();
      try {
        // Must delete in FK-safe order:
        // inventory_movements and inventory_lots reference products(id) without CASCADE
        // inventory_products references products(id) WITH CASCADE (but we delete it first anyway)
        await connection.execute('DELETE FROM inventory_movements');
        await connection.execute('DELETE FROM inventory_lots');
        await connection.execute('DELETE FROM inventory_products');
        await connection.execute('DELETE FROM products');
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      }
    }

    let imported = 0;
    let failed = 0;
    const errors: RowError[] = [];

    for (let i = 0; i < products.length; i++) {
      const rowNumber = i + 2; // row 1 = headers
      const item = products[i] as ImportProductPayload;

      // ── Validate / fallback required fields ──────────────────────────────
      const rowErrors: string[] = [];
      const productName = item.name?.trim() || `Producto fila ${rowNumber}`;
      const productCategory = item.category?.trim() || 'Sin categoría';
      const expirationDate = normalizeExpirationDate(item.expirationDate) ?? '2099-12-31';

      if (rowErrors.length > 0) {
        errors.push({ row: rowNumber, name: item.name ?? '', error: rowErrors.join(' ') });
        failed++;
        continue;
      }

      const hasInvima = Boolean(item.hasInvima);
      const invimaRegistryNumber =
        hasInvima && item.invimaRegistryNumber
          ? String(item.invimaRegistryNumber).trim()
          : null;

      let transactionStarted = false;
      try {
        await connection.beginTransaction();
        transactionStarted = true;

        // Insert into `products`
        const [productResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO products (
            name, description, price, category, stock, image,
            has_invima, invima_registry_number, fecha_vencimiento,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            productName,
            item.description?.trim() ?? '',
            item.salePrice ?? 0,
            productCategory,
            item.currentStock ?? 0,
            item.image ?? '',
            hasInvima,
            invimaRegistryNumber,
            expirationDate,
          ]
        );

        const productId = productResult.insertId;

        // Insert into `inventory_products`
        await connection.execute(
          `INSERT INTO inventory_products (
            product_id, sku, barcode, current_stock, min_stock, max_stock,
            unit_cost, tax_rate, supplier, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productId,
            item.sku?.trim() || null,
            item.barcode?.trim() || null,
            item.currentStock ?? 0,
            item.minStock ?? 5,
            item.maxStock ?? null,
            item.unitCost ?? 0,
            item.taxRate ?? 19,
            item.supplier?.trim() || null,
            item.status ?? 'active',
          ]
        );

        await connection.commit();
        transactionStarted = false;
        imported++;
      } catch (rowError) {
        if (transactionStarted) {
          try {
            await connection.rollback();
          } catch {
            // ignore rollback error
          }
        }

        const err = rowError as { code?: string; sqlMessage?: string; message?: string };
        let errorMessage = 'Error al guardar el producto.';

        if (err.code === 'ER_DUP_ENTRY') {
          if (/barcode/i.test(err.sqlMessage ?? '')) {
            errorMessage = 'El código de barras ya existe en el sistema.';
          } else if (/sku/i.test(err.sqlMessage ?? '')) {
            errorMessage = 'El SKU ya existe en el sistema.';
          } else {
            errorMessage = 'Producto duplicado.';
          }
        }

        errors.push({ row: rowNumber, name: item.name ?? '', error: errorMessage });
        failed++;
      }
    }

    return NextResponse.json({ imported, failed, errors });
  } catch (error) {
    console.error('Error in POST /api/admin/inventory/import:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar la importación.' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
