import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Ventana de cancelación: 24 horas
const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

// GET - Obtener una orden específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    
    const supabase = await createServiceClient();
    
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      console.error('Error obteniendo orden:', error);
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
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

    const supabase = await createServiceClient();

    // Obtener la orden actual
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (fetchError || !data) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Cast para evitar error de tipo
    const order = data as { 
      user_id?: string; 
      created_at: string; 
      status: string;
      [key: string]: unknown;
    };

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
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || 'Cancelado por el usuario'
        } as never)
        .eq('order_number', orderNumber)
        .select()
        .single();

      if (updateError) {
        console.error('Error cancelando orden:', updateError);
        return NextResponse.json(
          { error: 'Error al cancelar la orden' },
          { status: 500 }
        );
      }

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

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ status: body.status } as never)
        .eq('order_number', orderNumber)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando orden:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar la orden' },
          { status: 500 }
        );
      }

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
