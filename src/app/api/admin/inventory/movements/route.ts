import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const reason = searchParams.get('reason');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    let sql = `
      SELECT * FROM inventory_movements
      WHERE 1=1
    `;
    const params: any[] = [];

    if (productId) {
      sql += ' AND product_id = ?';
      params.push(productId);
    }

    if (type && type !== 'all') {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (reason && reason !== 'all') {
      sql += ' AND reason = ?';
      params.push(reason);
    }

    if (fromDate) {
      sql += ' AND DATE(created_at) >= ?';
      params.push(fromDate);
    }

    if (toDate) {
      sql += ' AND DATE(created_at) <= ?';
      params.push(toDate);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const movements = await query(sql, params);

    return NextResponse.json({
      movements,
      total: movements.length
    });
  } catch (error) {
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
