import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Obtener todas las órdenes de los clientes (pedidos)
    const orders = await query(`
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `) as any[];

    // Obtener items para cada orden
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await query(
          'SELECT * FROM order_items WHERE order_id = ?',
          [order.id]
        );
        return {
          ...order,
          items: items
        };
      })
    );

    return NextResponse.json({ orders: ordersWithItems, count: ordersWithItems.length });
  } catch (error: any) {
    console.error('Error en GET /api/admin/pedidos:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener pedidos',
        detail: error?.message || String(error),
        code: error?.code || null
      },
      { status: 500 }
    );
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID de orden y estado son requeridos' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    return NextResponse.json({ success: true, message: 'Estado del pedido actualizado' });
  } catch (error) {
    console.error('Error en PATCH /api/admin/pedidos:', error);
    return NextResponse.json(
      { error: 'Error al actualizar pedido' },
      { status: 500 }
    );
  }
}
