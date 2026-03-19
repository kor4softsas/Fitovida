import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

type ColumnRow = { column_name: string };

const SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000;
const columnCache = new Map<string, { expiresAt: number; columns: Set<string> }>();

function isSchemaIssue(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = String((error as { code?: string }).code || '');
  return [
    'ER_NO_SUCH_TABLE',
    'ER_BAD_FIELD_ERROR',
    'ER_BAD_DB_ERROR'
  ].includes(code);
}

function isDatabaseIssue(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = String((error as { code?: string }).code || '');
  return [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    'ER_ACCESS_DENIED_ERROR',
    'ER_ACCESS_DENIED_NO_PASSWORD_ERROR'
  ].includes(code);
}

async function getColumnSet(tableName: string): Promise<Set<string>> {
  const now = Date.now();
  const cached = columnCache.get(tableName);
  if (cached && cached.expiresAt > now) {
    return cached.columns;
  }

  try {
    const rows = await query<ColumnRow>(
      `SELECT LOWER(COLUMN_NAME) as column_name
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [tableName]
    );

    const columns = new Set(rows.map((row) => row.column_name));
    columnCache.set(tableName, { expiresAt: now + SCHEMA_CACHE_TTL_MS, columns });

    return columns;
  } catch {
    return new Set<string>();
  }
}

function has(columns: Set<string>, columnName: string): boolean {
  return columns.has(columnName.toLowerCase());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const searchTerm = searchParams.get('search');
    const lowStock = searchParams.get('lowStock') === 'true';

    const inventoryColumns = await getColumnSet('inventory_products');
    const productColumns = await getColumnSet('products');

    const selectFields = [
      'ip.id',
      'ip.product_id',
      'p.name',
      has(productColumns, 'description') ? 'p.description' : "'' as description",
      has(productColumns, 'price') ? 'p.price' : '0 as price',
      has(productColumns, 'category') ? 'p.category' : "'general' as category",
      has(inventoryColumns, 'sku') ? 'ip.sku' : 'NULL as sku',
      has(inventoryColumns, 'barcode') ? 'ip.barcode' : 'NULL as barcode',
      has(inventoryColumns, 'current_stock') ? 'ip.current_stock' : '0 as current_stock',
      has(inventoryColumns, 'min_stock') ? 'ip.min_stock' : '0 as min_stock',
      has(inventoryColumns, 'max_stock') ? 'ip.max_stock' : 'NULL as max_stock',
      has(inventoryColumns, 'unit_cost') ? 'ip.unit_cost' : '0 as unit_cost',
      has(inventoryColumns, 'tax_rate') ? 'ip.tax_rate' : '19 as tax_rate',
      has(inventoryColumns, 'supplier') ? 'ip.supplier' : 'NULL as supplier',
      has(inventoryColumns, 'status') ? 'ip.status' : "'active' as status",
      has(inventoryColumns, 'current_stock') && has(inventoryColumns, 'unit_cost')
        ? '(ip.current_stock * ip.unit_cost) as stock_value'
        : '0 as stock_value',
      has(inventoryColumns, 'current_stock') && has(inventoryColumns, 'min_stock') && has(inventoryColumns, 'max_stock')
        ? `CASE
             WHEN ip.current_stock <= ip.min_stock THEN 'low'
             WHEN ip.current_stock > ip.max_stock THEN 'high'
             ELSE 'normal'
           END as stock_status`
        : "'normal' as stock_status"
    ];

    let sql = `
      SELECT
        ${selectFields.join(',\n        ')}
      FROM inventory_products ip
      JOIN products p ON ip.product_id = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (status && status !== 'all' && has(inventoryColumns, 'status')) {
      sql += ' AND ip.status = ?';
      params.push(status);
    }

    if (category && has(productColumns, 'category')) {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    if (lowStock && has(inventoryColumns, 'current_stock') && has(inventoryColumns, 'min_stock')) {
      sql += ' AND ip.current_stock <= ip.min_stock';
    }

    if (searchTerm) {
      const searchConditions: string[] = ['p.name LIKE ?'];
      const searchPattern = `%${searchTerm}%`;

      params.push(searchPattern);
      if (has(inventoryColumns, 'barcode')) {
        searchConditions.push('ip.barcode LIKE ?');
        params.push(searchPattern);
      }
      if (has(inventoryColumns, 'sku')) {
        searchConditions.push('ip.sku LIKE ?');
        params.push(searchPattern);
      }

      sql += ` AND (${searchConditions.join(' OR ')})`;
    }

    sql += ' ORDER BY p.name ASC';

    const products = await query(sql, params);

    return NextResponse.json({
      products,
      total: products.length
    });
  } catch (error) {
    if (isSchemaIssue(error) || isDatabaseIssue(error)) {
      return NextResponse.json(
        { products: [], total: 0, degraded: true, reason: 'database_unavailable' },
        { status: 200 }
      );
    }

    console.error('Error en GET /api/admin/inventory:', error);
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      sku,
      barcode,
      current_stock,
      min_stock,
      max_stock,
      unit_cost,
      tax_rate,
      supplier,
      status
    } = body;

    // Validar que el producto exista
    const product = await queryOne(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Validar barcode único si se proporciona
    if (barcode) {
      const existingBarcode = await queryOne(
        'SELECT id FROM inventory_products WHERE barcode = ?',
        [barcode]
      );
      if (existingBarcode) {
        return NextResponse.json(
          { error: 'El código de barras ya está registrado' },
          { status: 400 }
        );
      }
    }

    await query(
      `INSERT INTO inventory_products 
       (product_id, sku, barcode, current_stock, min_stock, max_stock, unit_cost, tax_rate, supplier, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        sku || null,
        barcode || null,
        current_stock || 0,
        min_stock || 5,
        max_stock || null,
        unit_cost || 0,
        tax_rate || 19,
        supplier || null,
        status || 'active'
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Producto agregado al inventario'
    });
  } catch (error) {
    console.error('Error en POST /api/admin/inventory:', error);
    return NextResponse.json(
      { error: 'Error al crear producto en inventario' },
      { status: 500 }
    );
  }
}
