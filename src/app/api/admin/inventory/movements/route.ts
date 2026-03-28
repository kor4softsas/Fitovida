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
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const reason = searchParams.get('reason');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const rawLimit = parseInt(searchParams.get('limit') || '100', 10);
    const limit = Number.isNaN(rawLimit) ? 100 : Math.max(1, Math.min(rawLimit, 500));

    const movementColumns = await getColumnSet('inventory_movements');
    if (movementColumns.size === 0) {
      return NextResponse.json(
        { movements: [], total: 0, degraded: true, reason: 'schema_unavailable' },
        { status: 200 }
      );
    }

    const selectFields = [
      has(movementColumns, 'id') ? 'id' : 'NULL as id',
      has(movementColumns, 'product_id') ? 'product_id' : 'NULL as product_id',
      has(movementColumns, 'product_name') ? 'product_name' : "'' as product_name",
      has(movementColumns, 'type') ? 'type' : "'entry' as type",
      has(movementColumns, 'quantity') ? 'quantity' : '0 as quantity',
      has(movementColumns, 'previous_stock') ? 'previous_stock' : '0 as previous_stock',
      has(movementColumns, 'new_stock') ? 'new_stock' : '0 as new_stock',
      has(movementColumns, 'unit_cost') ? 'unit_cost' : '0 as unit_cost',
      has(movementColumns, 'total_cost') ? 'total_cost' : '0 as total_cost',
      has(movementColumns, 'reason') ? 'reason' : "'' as reason",
      has(movementColumns, 'reference') ? '`reference`' : 'NULL as `reference`',
      has(movementColumns, 'notes') ? 'notes' : 'NULL as notes',
      has(movementColumns, 'created_by') ? 'created_by' : "'' as created_by",
      has(movementColumns, 'created_at') ? 'created_at' : 'CURRENT_TIMESTAMP as created_at'
    ];

    let sql = `
      SELECT ${selectFields.join(', ')}
      FROM inventory_movements
      WHERE 1=1
    `;
    const params: any[] = [];

    if (productId && has(movementColumns, 'product_id')) {
      sql += ' AND product_id = ?';
      params.push(productId);
    }

    if (type && type !== 'all' && has(movementColumns, 'type')) {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (reason && reason !== 'all' && has(movementColumns, 'reason')) {
      sql += ' AND reason = ?';
      params.push(reason);
    }

    if (fromDate && has(movementColumns, 'created_at')) {
      sql += ' AND DATE(created_at) >= ?';
      params.push(fromDate);
    }

    if (toDate && has(movementColumns, 'created_at')) {
      sql += ' AND DATE(created_at) <= ?';
      params.push(toDate);
    }

    if (has(movementColumns, 'created_at')) {
      sql += ' ORDER BY created_at DESC';
    } else if (has(movementColumns, 'id')) {
      sql += ' ORDER BY id DESC';
    }

    sql += ' LIMIT ?';
    params.push(limit);

    const movements = await query(sql, params);

    return NextResponse.json({
      movements,
      total: movements.length
    });
  } catch (error) {
    if (isSchemaIssue(error) || isDatabaseIssue(error)) {
      return NextResponse.json(
        { movements: [], total: 0, degraded: true, reason: 'database_unavailable' },
        { status: 200 }
      );
    }

    console.error('Error en GET /api/admin/inventory/movements:', error);
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      type,
      quantity,
      reason,
      reference,
      notes,
      created_by,
      unit_cost
    } = body;

    // Validar datos requeridos
    if (!product_id || !type || !quantity || !reason || !created_by) {
      return NextResponse.json(
        { error: 'Datos incompletos para registrar movimiento' },
        { status: 400 }
      );
    }

    // Obtener información actual del producto
    const inventoryProduct = await queryOne(
      `SELECT ip.*, p.name FROM inventory_products ip
       JOIN products p ON ip.product_id = p.id
       WHERE ip.product_id = ?`,
      [product_id]
    );

    if (!inventoryProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado en inventario' },
        { status: 404 }
      );
    }

    const previousStock = inventoryProduct.current_stock;
    let newStock = previousStock;

    // Calcular nuevo stock según tipo de movimiento
    if (type === 'entry') {
      newStock = previousStock + quantity;
    } else if (type === 'exit') {
      newStock = previousStock - quantity;
      if (newStock < 0) {
        return NextResponse.json(
          { error: 'Stock insuficiente para esta salida' },
          { status: 400 }
        );
      }
    } else if (type === 'adjustment') {
      newStock = quantity; // Para ajuste, quantity es el nuevo stock total
    }

    // Registrar movimiento
    await query(
      `INSERT INTO inventory_movements 
       (product_id, product_name, type, quantity, previous_stock, new_stock, unit_cost, total_cost, reason, reference, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        inventoryProduct.name,
        type,
        quantity,
        previousStock,
        newStock,
        unit_cost || inventoryProduct.unit_cost || 0,
        (unit_cost || inventoryProduct.unit_cost || 0) * (type === 'adjustment' ? 0 : quantity),
        reason,
        reference || null,
        notes || null,
        created_by
      ]
    );

    // Actualizar stock en inventory_products
    await query(
      'UPDATE inventory_products SET current_stock = ? WHERE product_id = ?',
      [newStock, product_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Movimiento registrado exitosamente',
      data: {
        previous_stock: previousStock,
        new_stock: newStock,
        quantity: quantity
      }
    });
  } catch (error) {
    console.error('Error en POST /api/admin/inventory/movements:', error);
    return NextResponse.json(
      { error: 'Error al registrar movimiento' },
      { status: 500 }
    );
  }
}
