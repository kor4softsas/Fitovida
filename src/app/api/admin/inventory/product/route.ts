import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

type DbError = {
  code?: string;
  sqlMessage?: string;
  message?: string;
};

function mapDbError(error: unknown): { status: number; message: string } {
  const dbError = (error || {}) as DbError;
  const code = String(dbError.code || '');
  const sqlMessage = String(dbError.sqlMessage || dbError.message || '');

  if (code === 'ER_DUP_ENTRY') {
    if (/barcode/i.test(sqlMessage)) {
      return { status: 400, message: 'El codigo de barras ya existe. Usa otro o regeneralo.' };
    }
    if (/sku/i.test(sqlMessage)) {
      return { status: 400, message: 'El SKU ya existe. Usa un SKU unico.' };
    }
    return { status: 400, message: 'El producto tiene datos duplicados.' };
  }

  if (code === 'ER_NO_SUCH_TABLE' || code === 'ER_BAD_FIELD_ERROR' || code === 'ER_BAD_DB_ERROR') {
    return {
      status: 500,
      message: 'La base de datos no tiene el esquema completo para inventario. Ejecuta mysql/add-invima-fields.sql para habilitar campos INVIMA.'
    };
  }

  if (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'PROTOCOL_CONNECTION_LOST' ||
    code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR' ||
    code === 'ER_ACCESS_DENIED_ERROR' ||
    code === 'ER_ACCESS_DENIED_NO_PASSWORD_ERROR'
  ) {
    return { status: 503, message: 'No fue posible conectar con la base de datos.' };
  }

  return { status: 500, message: 'Error interno al guardar el producto.' };
}

async function supportsRequiredProductColumns(connection: Awaited<ReturnType<typeof pool.getConnection>>): Promise<boolean> {
  const [rows] = await connection.execute<Array<{ count: number }>>(
    `SELECT COUNT(*) as count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME IN ('has_invima', 'invima_registry_number', 'fecha_vencimiento')`
  );

  return Number(rows?.[0]?.count || 0) === 3;
}

function normalizeExpirationDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) {
    return null;
  }

  return trimmed;
}

export async function POST(request: NextRequest) {
  let connection: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  let transactionStarted = false;

  try {
    connection = await pool.getConnection();
    const data = await request.json();
    await connection.beginTransaction();
    transactionStarted = true;

    const hasInvima = Boolean(data.hasInvima);
    const invimaRegistryNumber = hasInvima && data.invimaRegistryNumber
      ? String(data.invimaRegistryNumber).trim()
      : null;
    const expirationDate = normalizeExpirationDate(data.expirationDate);
    if (!expirationDate) {
      return NextResponse.json(
        { error: 'La fecha de vencimiento es obligatoria, debe tener formato valido y no puede estar en el pasado.' },
        { status: 400 }
      );
    }

    const hasRequiredColumns = await supportsRequiredProductColumns(connection);

    if (!hasRequiredColumns) {
      return NextResponse.json(
        {
          error: 'La base de datos no tiene los campos requeridos de INVIMA y/o fecha de vencimiento. Ejecuta mysql/add-invima-fields.sql y mysql/add-expiration-date.sql.'
        },
        { status: 409 }
      );
    }

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO products (
        name,
        description,
        price,
        category,
        stock,
        image,
        has_invima,
        invima_registry_number,
        fecha_vencimiento,
        created_at,
        updated_at
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.name,
        data.description || '',
        data.salePrice || 0,
        data.category || '',
        data.currentStock || 0,
        data.image || '',
        hasInvima,
        invimaRegistryNumber,
        expirationDate
      ]
    );
    const productId = result.insertId;

    await connection.execute(
      `INSERT INTO inventory_products 
       (product_id, sku, barcode, current_stock, min_stock, max_stock, unit_cost, tax_rate, supplier, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        data.sku || null,
        data.barcode || null,
        data.currentStock || 0,
        data.minStock || 5,
        data.maxStock || null,
        data.unitCost || 0,
        data.taxRate || 19,
        data.supplier || null,
        data.status || 'active'
      ]
    );

    await connection.commit();
    transactionStarted = false;
    
    return NextResponse.json({ success: true, productId });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback errors to preserve the original exception handling.
      }
    }

    console.error('Error in POST /api/admin/inventory/product:', error);
    const mapped = mapDbError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  } finally {
    connection?.release();
  }
}

export async function PUT(request: NextRequest) {
  let connection: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  let transactionStarted = false;

  try {
    connection = await pool.getConnection();
    const data = await request.json();
    const productId = data.id || data.product_id;
    if (!productId || productId === 'new') {
      throw new Error('Invalid product ID');
    }

    await connection.beginTransaction();
  transactionStarted = true;

    const hasInvima = Boolean(data.hasInvima);
    const invimaRegistryNumber = hasInvima && data.invimaRegistryNumber
      ? String(data.invimaRegistryNumber).trim()
      : null;
    const expirationDate = normalizeExpirationDate(data.expirationDate);
    if (!expirationDate) {
      return NextResponse.json(
        { error: 'La fecha de vencimiento es obligatoria, debe tener formato valido y no puede estar en el pasado.' },
        { status: 400 }
      );
    }

    const hasRequiredColumns = await supportsRequiredProductColumns(connection);

    if (!hasRequiredColumns) {
      return NextResponse.json(
        {
          error: 'La base de datos no tiene los campos requeridos de INVIMA y/o fecha de vencimiento. Ejecuta mysql/add-invima-fields.sql y mysql/add-expiration-date.sql.'
        },
        { status: 409 }
      );
    }

    await connection.execute(
      `UPDATE products 
        SET name=?, description=?, price=?, category=?, stock=?, image=?, has_invima=?, invima_registry_number=?, fecha_vencimiento=?, updated_at=NOW()
       WHERE id=?`,
      [
        data.name,
        data.description || '',
        data.salePrice || 0,
        data.category || '',
        data.currentStock || 0,
        data.image || '',
        hasInvima,
        invimaRegistryNumber,
        expirationDate,
        productId
      ]
    );

    await connection.execute(
      `UPDATE inventory_products 
       SET sku=?, barcode=?, current_stock=?, min_stock=?, max_stock=?, unit_cost=?, tax_rate=?, supplier=?, status=?
       WHERE product_id=?`,
      [
        data.sku || null,
        data.barcode || null,
        data.currentStock || 0,
        data.minStock || 5,
        data.maxStock || null,
        data.unitCost || 0,
        data.taxRate || 19,
        data.supplier || null,
        data.status || 'active',
        productId
      ]
    );

    await connection.commit();
    transactionStarted = false;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback errors to preserve the original exception handling.
      }
    }

    console.error('Error in PUT /api/admin/inventory/product:', error);
    const mapped = mapDbError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  } finally {
    connection?.release();
  }
}

export async function DELETE(request: NextRequest) {
  let connection: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  let transactionStarted = false;

  try {
    connection = await pool.getConnection();
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) return NextResponse.json({ error: 'IDs faltantes' }, { status: 400 });

    const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (ids.length === 0) return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });

    const placeholders = ids.map(() => '?').join(',');

    await connection.beginTransaction();
    transactionStarted = true;

    await connection.execute(`DELETE FROM inventory_products WHERE product_id IN (${placeholders})`, ids);
    await connection.execute(`DELETE FROM products WHERE id IN (${placeholders})`, ids);

    await connection.commit();
    transactionStarted = false;
    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error: unknown) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback errors to preserve the original exception handling.
      }
    }

    console.error('Error in DELETE /api/admin/inventory/product:', error);
    const errorCode = String((error as { code?: string })?.code || '');
    if (errorCode === 'ER_ROW_IS_REFERENCED_2') {
      return NextResponse.json({ error: 'No se puede eliminar porque algunos productos seleccionados tienen movimientos o pedidos asociados. Puedes marcarlos como INACTIVOS en su lugar.' }, { status: 400 });
    }

    const mapped = mapDbError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  } finally {
    connection?.release();
  }
}
