import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET - Obtener órdenes de un usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere userId' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();
    
    // Obtener órdenes con sus items
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo órdenes:', error);
      return NextResponse.json(
        { error: 'Error obteniendo órdenes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error('Error en GET /api/orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva orden
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      userId,
      customer,
      paymentMethod,
      paymentId,
      paymentProvider,
      status,
      notes,
      items,
      subtotal,
      shipping,
      discount,
      discountCode,
      total
    } = body;

    // Validaciones básicas
    if (!orderNumber || !customer || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Datos de orden incompletos' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // 1. Crear la orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_address: customer.address,
        customer_city: customer.city,
        customer_zip: customer.zip,
        payment_method: paymentMethod,
        payment_id: paymentId || null,
        payment_provider: paymentProvider || null,
        status: status || 'pending',
        notes: notes || null,
        subtotal,
        shipping,
        discount: discount || 0,
        discount_code: discountCode || null,
        total
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creando orden:', orderError);
      return NextResponse.json(
        { error: 'Error creando orden', details: orderError.message },
        { status: 500 }
      );
    }

    // 2. Crear los items de la orden
    const orderItems = items.map((item: { id: number; name: string; image: string; quantity: number; price: number }) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      product_image: item.image,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creando items:', itemsError);
      // Intentar eliminar la orden si falló crear los items
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Error creando items de orden', details: itemsError.message },
        { status: 500 }
      );
    }

    // 3. Obtener la orden completa con items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      console.error('Error obteniendo orden completa:', fetchError);
    }

    return NextResponse.json({ 
      success: true, 
      order: completeOrder || order,
      message: 'Orden creada exitosamente'
    });
  } catch (error) {
    console.error('Error en POST /api/orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
