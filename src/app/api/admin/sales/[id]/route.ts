import { NextRequest, NextResponse } from 'next/server';
import pool, { query, queryOne } from '@/lib/db';
import { applyStockChange, InventoryLocationError, resolveLocationId } from '@/lib/admin/locations';

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
  let conn: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  let transactionStarted = false;

  try {
    const { id } = await params;

    conn = await pool.getConnection();
    await conn.beginTransaction();
    transactionStarted = true;

    const [saleRows] = await conn.query('SELECT * FROM admin_sales WHERE id = ? FOR UPDATE', [id]);
    const sale = (saleRows as Array<{ sale_number: string; payment_status: string; location_id?: number | null }>)[0];

    if (!sale) {
      throw new InventoryLocationError('Venta no encontrada', 404);
    }
    if (sale.payment_status === 'cancelled') {
      throw new InventoryLocationError('La venta ya está cancelada');
    }

    // Obtener items para revertir movimientos de inventario
    const [itemRows] = await conn.query(
      `SELECT asi.product_id, asi.product_name, asi.quantity
       FROM admin_sale_items asi
       JOIN inventory_products ip ON ip.product_id = asi.product_id
       WHERE asi.sale_id = ?`,
      [id]
    );

    // El stock vuelve al local donde se hizo la venta
    const locationId = await resolveLocationId(conn, sale.location_id, { allowInactive: true });

    for (const item of itemRows as Array<{ product_id: number; product_name: string; quantity: number }>) {
      await applyStockChange(conn, {
        productId: Number(item.product_id),
        locationId,
        type: 'entry',
        quantity: Number(item.quantity),
        reason: 'return',
        reference: sale.sale_number,
        notes: 'Cancelación de venta',
        productName: item.product_name,
        createdBy: 'system'
      });
    }

    // Marcar venta como cancelada
    await conn.query(
      'UPDATE admin_sales SET payment_status = ? WHERE id = ?',
      ['cancelled', id]
    );

    await conn.commit();
    transactionStarted = false;

    return NextResponse.json({
      success: true,
      message: 'Venta cancelada y stock restaurado'
    });
  } catch (error) {
    if (conn && transactionStarted) {
      try {
        await conn.rollback();
      } catch {
        // Ignorar errores de rollback.
      }
    }
    if (error instanceof InventoryLocationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error en DELETE /api/admin/sales/[id]:', error);
    return NextResponse.json(
      { error: 'Error al cancelar venta' },
      { status: 500 }
    );
  } finally {
    conn?.release();
  }
}
