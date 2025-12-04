import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// Ventana de cancelación: 24 horas
const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

interface OrderRow {
  id: number;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_zip: string;
  payment_method: string;
  payment_id: string | null;
  payment_provider: string | null;
  status: string;
  notes: string | null;
  subtotal: string;
  shipping: string;
  discount: string;
  discount_code: string | null;
  total: string;
  created_at: Date;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
}

interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price: string;
}

// GET - Obtener una orden específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    
    const order = await queryOne<OrderRow>(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    const orderItems = await query<OrderItemRow>(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );

    return NextResponse.json({ 
      order: {
        ...order,
        order_items: orderItems
      }
    });
  } catch (error) {
    console.error('Error en GET /api/orders/[orderNumber]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar una orden (cancelar, cambiar estado, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const body = await request.json();
    const { action, reason, userId } = body;

    // Obtener la orden actual
    const order = await queryOne<OrderRow>(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el dueño de la orden
    if (userId && order.user_id && order.user_id !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar esta orden' },
        { status: 403 }
      );
    }

    // Manejar acción de cancelación
    if (action === 'cancel') {
      // Verificar si está dentro de la ventana de cancelación
      const orderDate = new Date(order.created_at).getTime();
      const now = Date.now();
      const timePassed = now - orderDate;

      if (timePassed > CANCELLATION_WINDOW_MS) {
        return NextResponse.json(
          { error: 'El período de cancelación ha expirado (24 horas)' },
          { status: 400 }
        );
      }

      // Verificar que el estado permite cancelación
      const cancellableStatuses = ['pending', 'confirmed', 'processing'];
      if (!cancellableStatuses.includes(order.status)) {
        return NextResponse.json(
          { error: `No se puede cancelar una orden con estado: ${order.status}` },
          { status: 400 }
        );
      }

      // Actualizar la orden
      await query(
        'UPDATE orders SET status = ?, cancelled_at = NOW(), cancellation_reason = ? WHERE order_number = ?',
        ['cancelled', reason || 'Cancelado por el usuario', orderNumber]
      );

      // Obtener la orden actualizada
      const updatedOrder = await queryOne<OrderRow>(
        'SELECT * FROM orders WHERE order_number = ?',
        [orderNumber]
      );

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: 'Orden cancelada exitosamente'
      });
    }

    // Manejar actualización de estado genérica
    if (body.status) {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Estado inválido' },
          { status: 400 }
        );
      }

      await query(
        'UPDATE orders SET status = ? WHERE order_number = ?',
        [body.status, orderNumber]
      );

      // Obtener la orden actualizada
      const updatedOrder = await queryOne<OrderRow>(
        'SELECT * FROM orders WHERE order_number = ?',
        [orderNumber]
      );

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        message: 'Orden actualizada exitosamente'
      });
    }

    return NextResponse.json(
      { error: 'Acción no especificada' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error en PATCH /api/orders/[orderNumber]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
