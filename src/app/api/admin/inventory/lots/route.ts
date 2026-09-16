import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  applyStockChange,
  InventoryLocationError,
  isLocationsSchemaReady,
  parseLocationParam,
  resolveLocationId
} from '@/lib/admin/locations';

type DbConnection = Awaited<ReturnType<typeof pool.getConnection>>;

const LOTS_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS inventory_lots (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id INT NOT NULL,
  location_id INT NULL COMMENT 'Local donde está físicamente el lote',
  lot_code VARCHAR(150) NOT NULL,
  barcode VARCHAR(150) NULL COMMENT 'Código de barras asignado al lote',
  quantity INT NOT NULL DEFAULT 0,
  reserved INT NOT NULL DEFAULT 0 COMMENT 'Cantidad reservada para pedidos en proceso',
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price_override DECIMAL(12,2) NULL COMMENT 'Si se quiere actualizar precio de venta por lote',
  expiration_date DATE NULL,
  received_date DATE DEFAULT CURRENT_DATE,
  status ENUM('active','consumed','expired') DEFAULT 'active',
  created_by VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_inventory_lots_product_id (product_id),
  INDEX idx_inventory_lots_barcode (barcode),
  INDEX idx_inventory_lots_expiration (expiration_date),
  INDEX idx_inventory_lots_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function tableExists(connection: DbConnection, tableName: string): Promise<boolean> {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );

  return Number(((rows as any[])[0] as { total?: number })?.total || 0) > 0;
}

async function ensureLotsTable(connection: DbConnection) {
  if (!(await tableExists(connection, 'inventory_lots'))) {
    await connection.query(LOTS_TABLE_DDL);
  }
}

// Ya no se usa el procedimiento register_lot_entry: no conoce los locales.
async function registerLot(
  connection: DbConnection,
  data: {
    productId: number;
    locationId: number | null;
    lotCode: string;
    barcode: string | null;
    quantity: number;
    unitCost: number;
    salePriceOverride: number | null;
    expirationDate: string | null;
    reference: string | null;
    notes: string | null;
    userId: string;
  }
) {
  const [productRows] = await connection.query('SELECT name FROM products WHERE id = ? LIMIT 1', [data.productId]);
  const productName = (productRows as any[])[0]?.name;

  if (!productName) {
    throw new InventoryLocationError('Producto no existe', 404);
  }

  await connection.query(
    `INSERT INTO inventory_products (
      product_id, sku, barcode, current_stock, min_stock, max_stock, unit_cost, tax_rate, supplier, status
    ) VALUES (?, NULL, ?, 0, 5, NULL, ?, 19, NULL, 'active')
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    [data.productId, data.barcode, data.unitCost]
  );

  const withLocation = data.locationId !== null;
  await connection.query(
    `INSERT INTO inventory_lots (
      id, product_id${withLocation ? ', location_id' : ''}, lot_code, barcode, quantity, unit_cost, sale_price_override, expiration_date, received_date, status, created_by
    ) VALUES (UUID(), ?${withLocation ? ', ?' : ''}, ?, ?, ?, ?, ?, ?, CURRENT_DATE, 'active', ?)`,
    [
      data.productId,
      ...(withLocation ? [data.locationId] : []),
      data.lotCode,
      data.barcode,
      data.quantity,
      data.unitCost,
      data.salePriceOverride,
      data.expirationDate,
      data.userId
    ]
  );

  const result = await applyStockChange(connection, {
    productId: data.productId,
    locationId: data.locationId,
    type: 'entry',
    quantity: data.quantity,
    reason: 'purchase',
    reference: data.reference,
    notes: data.notes,
    unitCost: data.unitCost,
    productName,
    createdBy: data.userId
  });

  await connection.query(
    'UPDATE inventory_products SET unit_cost = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
    [data.unitCost, data.productId]
  );

  return result;
}

export async function POST(request: NextRequest) {
  let conn: DbConnection | null = null;
  let tx = false;

  try {
    const data = await request.json();
    const productId = Number(data.productId || data.product_id);
    const lotCode = String(data.lotCode || data.lote || '').trim();
    const barcode = data.barcode ? String(data.barcode).trim() : null;
    const quantity = Number(data.quantity || 0);
    const unitCost = Number(data.unitCost || data.unit_cost || 0);
    const salePriceOverrideRaw = data.salePriceOverride ?? data.sale_price_override ?? null;
    const salePriceOverride = salePriceOverrideRaw === null || salePriceOverrideRaw === '' ? null : Number(salePriceOverrideRaw);
    const expirationDate = data.expirationDate || data.fecha_vencimiento || null;
    const reference = data.reference || null;
    const notes = data.notes || null;
    const userId = data.userId || data.createdBy || 'system';

    if (!productId || !lotCode || quantity <= 0) {
      return bad('productId, lotCode y quantity son obligatorios');
    }

    conn = await pool.getConnection();
    await ensureLotsTable(conn);
    await conn.beginTransaction();
    tx = true;

    const locationId = await resolveLocationId(conn, data.locationId ?? data.location_id);

    const result = await registerLot(conn, {
      productId,
      locationId,
      lotCode,
      barcode,
      quantity,
      unitCost,
      salePriceOverride,
      expirationDate,
      reference,
      notes,
      userId
    });

    const updateProductBarcode = Boolean(data.updateProductBarcode);
    if (updateProductBarcode && barcode) {
      try {
        await conn.query('UPDATE inventory_products SET barcode = ? WHERE product_id = ?', [barcode, productId]);

        try {
          await conn.query('UPDATE products SET barcode = ? WHERE id = ?', [barcode, productId]);
        } catch {
          // Ignorar si products no tiene la columna barcode.
        }
      } catch (err) {
        console.error('Error updating product barcode:', err);
      }
    }

    await conn.commit();
    tx = false;
    return NextResponse.json({ success: true, locationId, newStock: result.newStock, totalStock: result.totalStock });
  } catch (error: any) {
    if (conn && tx) {
      try {
        await conn.rollback();
      } catch {
        // Ignore rollback errors.
      }
    }

    if (error instanceof InventoryLocationError) {
      return bad(error.message, error.status);
    }

    console.error('Error creating lot:', error);
    return bad(error?.message || 'Error creando lote', 500);
  } finally {
    if (conn) conn.release();
  }
}

export async function GET(request: NextRequest) {
  let conn: DbConnection | null = null;

  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const barcode = url.searchParams.get('barcode');
    const locationId = parseLocationParam(url.searchParams.get('locationId'));

    conn = await pool.getConnection();

    if (!(await tableExists(conn, 'inventory_lots'))) {
      return NextResponse.json({ lots: [] });
    }

    const locationsReady = await isLocationsSchemaReady();
    const baseSelect = locationsReady
      ? 'SELECT il.*, l.name AS location_name FROM inventory_lots il LEFT JOIN locations l ON l.id = il.location_id'
      : 'SELECT il.* FROM inventory_lots il';

    if (barcode) {
      const [rows] = await conn.query(`${baseSelect} WHERE il.barcode = ? LIMIT 1`, [barcode]);
      return NextResponse.json({ lot: (rows as any[])[0] || null });
    }

    if (productId) {
      const pid = Number(productId);
      const byLocation = locationsReady && locationId !== null;
      const [rows] = await conn.query(
        `${baseSelect}
         WHERE il.product_id = ?${byLocation ? ' AND il.location_id = ?' : ''}
         ORDER BY il.expiration_date IS NULL, il.expiration_date ASC, il.created_at DESC`,
        byLocation ? [pid, locationId] : [pid]
      );
      return NextResponse.json({ lots: rows as any[] });
    }

    const [rows] = await conn.query(`${baseSelect} ORDER BY il.created_at DESC LIMIT 100`);
    return NextResponse.json({ lots: rows as any[] });
  } catch (error) {
    console.error('Error fetching lots:', error);
    return bad('Error al obtener lotes', 500);
  } finally {
    if (conn) conn.release();
  }
}
