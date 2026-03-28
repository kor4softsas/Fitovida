import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_zip: string;
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
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price: string;
}

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

    // Obtener órdenes del usuario
    const orders = await query<OrderRow>(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Obtener items para cada orden
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await query<OrderItemRow>(
          'SELECT * FROM order_items WHERE order_id = ?',
          [order.id]
        );
        return {
          ...order,
          order_items: items
        };
      })
    );

    return NextResponse.json({ orders: ordersWithItems });
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

    // 1. Crear la orden
    await query(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,   
        shipping_address, shipping_city, shipping_department, shipping_zip, payment_method,
        payment_id, payment_provider, status, notes,
        subtotal, shipping, discount, discount_code, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        userId || null,
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.city || 'Cali',
        customer.department || 'Valle del Cauca',
        customer.zip || '',
        paymentMethod,
        paymentId || null,
        paymentProvider || null,
        status || 'pending',
        notes || null,
        subtotal,
        shipping,
        discount || 0,
        discountCode || null,
        total
      ]
    );

    // Obtener el ID generado por la base de datos
    const [insertedOrder] = await query<OrderRow>(
      'SELECT id FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (!insertedOrder || !insertedOrder.id) {
      return NextResponse.json(
        { error: 'Error creando orden, no se pudo recuperar el ID' },
        { status: 500 }
      );
    }
    
    const orderId = insertedOrder.id;
    // 2. Crear los items de la orden y registrar movimientos de inventario
    const orderItemsValues = items.map((item: { id: number; name: string; image: string; quantity: number; price: number }) => [
      orderId,
      item.id,
      item.name,
      item.image,
      item.quantity,
      item.price
    ]);

    try {
      for (const item of items) {
        // Insertar item de orden
        await query(
          'INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price) VALUES (?, ?, ?, ?, ?, ?)',
          [orderId, item.id, item.name, item.image || '', item.quantity, item.price]
        );

        // Obtener información de inventario
        const inventoryProduct = await query(
          `SELECT ip.*, p.name FROM inventory_products ip
           JOIN products p ON ip.product_id = p.id
           WHERE ip.product_id = ?`,
          [item.id]
        );

        if (inventoryProduct && inventoryProduct.length > 0) {
          const prod = inventoryProduct[0];
          const previousStock = prod.current_stock;
          const newStock = previousStock - item.quantity;
          
          // Nota: Permitimos stock negativo para no perder órdenes que ya fueron pagadas
          // o que el cliente finalizó con éxito en el frontend

          // Registrar movimiento de inventario
          await query(
            `INSERT INTO inventory_movements 
             (product_id, product_name, type, quantity, previous_stock, new_stock, reason, reference, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.id,
              item.name,
              'exit',
              item.quantity,
              previousStock,
              newStock,
              'sale',
              orderNumber,
              userId || 'guest'
            ]
          );

          // Actualizar stock en inventory_products
          await query(
            'UPDATE inventory_products SET current_stock = ? WHERE product_id = ?',
            [newStock, item.id]
          );

          // Actualizar stock en tabla products
          await query(
            'UPDATE products SET stock = stock - ? WHERE id = ?',
            [item.quantity, item.id]
          );
        }
      }
    } catch (itemsError) {
      console.error('Error creando items:', itemsError);
      // Intentar eliminar la orden si falló crear los items
      await query('DELETE FROM orders WHERE id = ?', [orderId]);
      return NextResponse.json(
        { error: 'Error creando items de orden' },
        { status: 500 }
      );
    }

    // 3. Obtener la orden completa con items
    const [order] = await query<OrderRow>(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    const orderItems = await query<OrderItemRow>(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );

    const completeOrder = {
      ...order,
      order_items: orderItems
    };

    return NextResponse.json({ 
      success: true, 
      order: completeOrder,
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
