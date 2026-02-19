import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sale = await queryOne(
      'SELECT * FROM admin_sales WHERE id = ?',
      [id]
    );

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    const items = await query(
      'SELECT * FROM admin_sale_items WHERE sale_id = ?',
      [id]
    );

    return NextResponse.json({
      sale: {
        ...sale,
        items
      }
    });
  } catch (error) {
    console.error('Error en GET /api/admin/sales/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener venta' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      customer_name, customer_email, customer_phone, customer_document,
      payment_method, payment_status, notes 
    } = body;

    const sale = await queryOne(
      'SELECT id FROM admin_sales WHERE id = ?',
      [id]
    );

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    await query(
      `UPDATE admin_sales 
       SET customer_name = ?, customer_email = ?, customer_phone = ?, customer_document = ?,
           payment_method = ?, payment_status = ?, notes = ?
       WHERE id = ?`,
      [
        customer_name, customer_email || null, customer_phone || null, customer_document || null,
        payment_method, payment_status, notes || null, id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Venta actualizada'
    });
  } catch (error) {
    console.error('Error en PUT /api/admin/sales/[id]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar venta' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sale = await queryOne(
      'SELECT id, sale_number FROM admin_sales WHERE id = ?',
      [id]
    );

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    // Obtener items para revertir movimientos de inventario
    const items = await query(
      'SELECT product_id, quantity FROM admin_sale_items WHERE sale_id = ?',
      [id]
    );

    for (const item of items) {
      // Registrar movimiento de entrada (devolver stock)
      const inventoryProduct = await queryOne(
        'SELECT current_stock FROM inventory_products WHERE product_id = ?',
        [item.product_id]
      );

      if (inventoryProduct) {
        const newStock = inventoryProduct.current_stock + item.quantity;

        await query(
          `INSERT INTO inventory_movements 
           (product_id, product_name, type, quantity, previous_stock, new_stock, reason, reference, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.product_id,
            'Cancelación de venta',
            'entry',
            item.quantity,
            inventoryProduct.current_stock,
            newStock,
            'return',
            sale.sale_number,
            'system'
          ]
        );

        // Actualizar stock
        await query(
          'UPDATE inventory_products SET current_stock = ? WHERE product_id = ?',
          [newStock, item.product_id]
        );
      }
    }

    // Marcar venta como cancelada
    await query(
      'UPDATE admin_sales SET payment_status = ? WHERE id = ?',
      ['cancelled', id]
    );

    return NextResponse.json({
      success: true,
      message: 'Venta cancelada y stock restaurado'
    });
  } catch (error) {
    console.error('Error en DELETE /api/admin/sales/[id]:', error);
    return NextResponse.json(
      { error: 'Error al cancelar venta' },
      { status: 500 }
    );
  }
}
