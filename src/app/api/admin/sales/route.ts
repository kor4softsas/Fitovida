import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'client', 'admin'
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    let sales: any[] = [];

    // Obtener ventas de clientes (órdenes)
    if (type === 'all' || type === 'client') {
      let clientSql = `
        SELECT 
          o.id, o.order_number as sale_number, o.customer_name, o.customer_email,
          o.total, o.status, o.payment_method, o.created_at,
          'client' as sale_type,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE 1=1
      `;
      
      const clientParams: any[] = [];

      if (status) {
        clientSql += ' AND o.status = ?';
        clientParams.push(status);
      }

      if (fromDate) {
        clientSql += ' AND DATE(o.created_at) >= ?';
        clientParams.push(fromDate);
      }

      if (toDate) {
        clientSql += ' AND DATE(o.created_at) <= ?';
        clientParams.push(toDate);
      }

      clientSql += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ?';
      clientParams.push(limit);

      const clientSales = await query(clientSql, clientParams);
      sales = sales.concat(clientSales);
    }

    // Obtener ventas admin (manuales)
    if (type === 'all' || type === 'admin') {
      let adminSql = `
        SELECT 
          a.id, a.sale_number, a.customer_name, a.customer_email,
          a.total, a.payment_status as status, a.payment_method, a.created_at,
          'admin' as sale_type,
          COUNT(asi.id) as item_count
        FROM admin_sales a
        LEFT JOIN admin_sale_items asi ON a.id = asi.sale_id
        WHERE 1=1
      `;
      
      const adminParams: any[] = [];

      if (status) {
        adminSql += ' AND a.payment_status = ?';
        adminParams.push(status);
      }

      if (fromDate) {
        adminSql += ' AND DATE(a.created_at) >= ?';
        adminParams.push(fromDate);
      }

      if (toDate) {
        adminSql += ' AND DATE(a.created_at) <= ?';
        adminParams.push(toDate);
      }

      adminSql += ' GROUP BY a.id ORDER BY a.created_at DESC LIMIT ?';
      adminParams.push(limit);

      const adminSales = await query(adminSql, adminParams);
      sales = sales.concat(adminSales);
    }

    // Ordenar todas las ventas por fecha descendente
    sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      sales: sales.slice(0, limit),
      total: sales.length
    });
  } catch (error) {
    console.error('Error en GET /api/admin/sales:', error);
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_document,
      payment_method,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      created_by
    } = body;

    // Validar datos requeridos
    if (!customer_name || !items || items.length === 0 || !total || !created_by) {
      return NextResponse.json(
        { error: 'Datos incompletos para registrar venta' },
        { status: 400 }
      );
    }

    // Generar número de venta
    const [lastSale] = await query(
      `SELECT sale_number FROM admin_sales ORDER BY created_at DESC LIMIT 1`
    );

    let saleNumber = 'V-2026-001';
    if (lastSale && lastSale.sale_number) {
      const parts = lastSale.sale_number.split('-');
      const lastNum = parseInt(parts[2]) + 1;
      saleNumber = `V-2026-${String(lastNum).padStart(3, '0')}`;
    }

    // Insertar venta principal
    const [saleResult] = await query(
      `INSERT INTO admin_sales 
       (sale_number, customer_name, customer_email, customer_phone, customer_document,
        subtotal, tax, discount, total, payment_method, payment_status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saleNumber,
        customer_name,
        customer_email || null,
        customer_phone || null,
        customer_document || null,
        subtotal || 0,
        tax || 0,
        discount || 0,
        total,
        payment_method || 'cash',
        'completed',
        notes || null,
        created_by
      ]
    );

    const saleId = (saleResult as any).insertId;

    // Insertar items de la venta
    for (const item of items) {
      // Validar stock y registrar movimiento de inventario
      const inventoryProduct = await queryOne(
        'SELECT product_id, current_stock FROM inventory_products WHERE product_id = ?',
        [item.product_id]
      );

      if (inventoryProduct && inventoryProduct.current_stock >= item.quantity) {
        // Registrar movimiento de salida
        await query(
          `INSERT INTO inventory_movements 
           (product_id, product_name, type, quantity, previous_stock, new_stock, reason, reference, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.product_id,
            item.product_name,
            'exit',
            item.quantity,
            inventoryProduct.current_stock,
            inventoryProduct.current_stock - item.quantity,
            'sale',
            saleNumber,
            created_by
          ]
        );

        // Actualizar stock
        await query(
          'UPDATE inventory_products SET current_stock = current_stock - ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Insertar item de venta
      await query(
        `INSERT INTO admin_sale_items 
         (sale_id, product_id, product_name, quantity, unit_price, discount, tax, subtotal, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.discount || 0,
          item.tax || 0,
          item.subtotal || (item.unit_price * item.quantity),
          item.total || (item.unit_price * item.quantity)
        ]
      );
    }

    // Registrar ingreso automáticamente
    await query(
      `INSERT INTO incomes (description, amount, source, reference, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `Venta: ${saleNumber}`,
        total,
        'sales',
        saleNumber,
        notes || null,
        created_by
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Venta registrada exitosamente',
      sale_number: saleNumber,
      sale_id: saleId
    });
  } catch (error) {
    console.error('Error en POST /api/admin/sales:', error);
    return NextResponse.json(
      { error: 'Error al registrar venta' },
      { status: 500 }
    );
  }
}
