import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';

function isSchemaOrDbIssue(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = String((error as { code?: string }).code || '');
  return [
    'ER_NO_SUCH_TABLE',
    'ER_BAD_FIELD_ERROR',
    'ER_BAD_DB_ERROR',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    'ER_ACCESS_DENIED_ERROR',
    'ER_ACCESS_DENIED_NO_PASSWORD_ERROR'
  ].includes(code);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'client', 'admin'
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    let sales: any[] = [];
    const degradedSources: string[] = [];

    // Obtener ventas de clientes (órdenes)
    if (type === 'all' || type === 'client') {
      try {
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
      } catch (error) {
        if (isSchemaOrDbIssue(error)) {
          degradedSources.push('client');
        } else {
          throw error;
        }
      }
    }

    // Obtener ventas admin (manuales)
    if (type === 'all' || type === 'admin') {
      try {
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
      } catch (error) {
        if (isSchemaOrDbIssue(error)) {
          degradedSources.push('admin');
        } else {
          throw error;
        }
      }
    }

    // Ordenar todas las ventas por fecha descendente
    sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const finalSales = sales.slice(0, limit);

    // Fetch items limitando a las que se van a retornar
    const clientIds = finalSales.filter(s => s.sale_type === 'client').map(s => s.id);
    const adminIds = finalSales.filter(s => s.sale_type === 'admin').map(s => s.id);

    try {
      const clientItems = clientIds.length > 0 
        ? await query(`SELECT * FROM order_items WHERE order_id IN (${clientIds.map(() => '?').join(',')})`, clientIds)
        : [];
        
      const adminItems = adminIds.length > 0
        ? await query(`SELECT * FROM admin_sale_items WHERE sale_id IN (${adminIds.map(() => '?').join(',')})`, adminIds)
        : [];

      finalSales.forEach(sale => {
        if (sale.sale_type === 'client') {
          const items = clientItems.filter((i: any) => i.order_id === sale.id);
          sale.items = items.map((i: any) => ({
            id: i.id,
            productId: String(i.product_id),
            productName: i.product_name,
            quantity: i.quantity,
            unitPrice: Number(i.price),
            discount: 0,
            tax: 0,
            subtotal: Number(i.price) * i.quantity,
            total: Number(i.price) * i.quantity
          }));
        } else {
          const items = adminItems.filter((i: any) => i.sale_id === sale.id);
          sale.items = items.map((i: any) => ({
            id: i.id,
            productId: String(i.product_id),
            productName: i.product_name,
            quantity: i.quantity,
            unitPrice: Number(i.unit_price),
            discount: Number(i.discount) || 0,
            tax: Number(i.tax) || 0,
            subtotal: Number(i.subtotal) || (Number(i.unit_price) * i.quantity),
            total: Number(i.total) || (Number(i.unit_price) * i.quantity)
          }));
        }
      });
    } catch (itemError) {
      console.error('Error fetching items for sales:', itemError);
      // Opcionalmente podemos continuar sin items y se mostrarían vacíos
      finalSales.forEach(sale => { if (!sale.items) sale.items = []; });
    }

    return NextResponse.json({
      sales: finalSales,
      total: sales.length,
      degraded: degradedSources.length > 0,
      degradedSources
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
  let conn: Awaited<ReturnType<typeof pool.getConnection>> | null = null;
  let transactionStarted = false;

  try {
    const body = await request.json();
    console.log('POST /api/admin/sales body:', JSON.stringify(body));
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

    if (!customer_name || !items || items.length === 0 || !total || !created_by) {
      return NextResponse.json({ error: 'Datos incompletos para registrar venta' }, { status: 400 });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();
    transactionStarted = true;

    // Generar número de venta usando conexión
    const [lastSaleRows] = await conn.query(`SELECT sale_number FROM admin_sales ORDER BY created_at DESC LIMIT 1`);
    const lastSale = (lastSaleRows as any[])[0];
    let saleNumber = 'V-2026-001';
    if (lastSale && lastSale.sale_number) {
      const parts = lastSale.sale_number.split('-');
      const lastNum = parseInt(parts[2]) + 1;
      saleNumber = `V-2026-${String(lastNum).padStart(3, '0')}`;
    }

    const saleId = crypto.randomUUID();

    // Insertar venta principal
    console.log('Inserting admin_sales', saleId, saleNumber);
    await conn.query(
      `INSERT INTO admin_sales 
       (id, sale_number, customer_name, customer_email, customer_phone, customer_document,
        subtotal, tax, discount, total, payment_method, payment_status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saleId,
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

    // Procesar cada item: descontar de lotes (por barcode si viene) priorizando vencimiento
    console.log('Processing items count=', items.length);
    for (const item of items) {
      const productId = Number(item.product_id || item.productId || item.product_id);
      let required = Number(item.quantity || item.qty || 0);
      if (!productId || required <= 0) {
        console.error('Invalid item data', item);
        await conn.rollback();
        return NextResponse.json({ error: 'Item con product_id o quantity inválidos' }, { status: 400 });
      }

      // Bloquear fila de inventory_products para consistencia
      const [ipRows] = await conn.query('SELECT current_stock FROM inventory_products WHERE product_id = ? FOR UPDATE', [productId]);
      const ip = (ipRows as any[])[0];
      const currentStock = ip ? Number(ip.current_stock || 0) : 0;
      if (currentStock < required) {
        await conn.rollback();
        return NextResponse.json({ error: `Stock insuficiente para el producto ${productId}` }, { status: 400 });
      }

      // We'll keep track of the remaining global stock locally and update DB after each lot consume
      let remainingGlobal = currentStock;

      // If item has barcode, prefer that specific lot first
      const barcode = item.barcode || item.barcode_lot || null;
      let firstLoop = true;

      while (required > 0) {
        let lotRows: any[] = [];

        if (barcode && firstLoop) {
          const [rows] = await conn.query('SELECT * FROM inventory_lots WHERE barcode = ? FOR UPDATE', [barcode]);
          lotRows = rows as any[];
        } else {
          const [rows] = await conn.query(
            `SELECT * FROM inventory_lots WHERE product_id = ? AND (quantity - COALESCE(reserved,0)) > 0 ORDER BY (expiration_date IS NULL), expiration_date ASC, created_at ASC LIMIT 1 FOR UPDATE`,
            [productId]
          );
          lotRows = rows as any[];
        }

        if (!lotRows || lotRows.length === 0) {
          console.error('No lot rows for product', productId);
          await conn.rollback();
          return NextResponse.json({ error: `No hay lotes con stock disponible para el producto ${productId}` }, { status: 400 });
        }

        const lot = lotRows[0];
        const available = Number(lot.quantity || 0) - Number(lot.reserved || 0);
        if (available <= 0) {
          // mark consumed and continue
          await conn.query('UPDATE inventory_lots SET status = ? WHERE id = ?', ['consumed', lot.id]);
          firstLoop = false;
          continue;
        }

        const take = Math.min(available, required);
        const newLotQty = Number(lot.quantity) - take;
        const newLotStatus = newLotQty <= 0 ? 'consumed' : lot.status;

        await conn.query('UPDATE inventory_lots SET quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newLotQty, newLotStatus, lot.id]);
        console.log('Updated lot', lot.id, 'newQty=', newLotQty);

        // Registrar movimiento por lote
        const prevStock = remainingGlobal;
        remainingGlobal = remainingGlobal - take;

        await conn.query(
          `INSERT INTO inventory_movements (id, product_id, product_name, type, quantity, previous_stock, new_stock, unit_cost, total_cost, reason, reference, notes, created_by)
           VALUES (UUID(), ?, ?, 'exit', ?, ?, ?, ?, ?, 'sale', ?, ?, ?)`,
          [
            productId,
            item.product_name || item.name || '',
            take,
            prevStock,
            remainingGlobal,
            lot.unit_cost || null,
            (Number(lot.unit_cost || 0) * take) || null,
            saleNumber,
            `lot:${lot.id} code:${lot.lot_code}`,
            created_by
          ]
        );
        console.log('Inserted movement for product', productId, 'lot', lot.id, 'qty', take);

        // Actualizar stock global en inventory_products
        await conn.query('UPDATE inventory_products SET current_stock = ? WHERE product_id = ?', [remainingGlobal, productId]);
        console.log('Updated inventory_products for', productId, 'newStock=', remainingGlobal);

        required -= take;
        firstLoop = false;
      }

      // Insertar item de venta (una fila por producto)
      await conn.query(
        `INSERT INTO admin_sale_items 
         (sale_id, product_id, product_name, quantity, unit_price, discount, tax, subtotal, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          productId,
          item.product_name || item.name || '',
          item.quantity,
          item.unit_price,
          item.discount || 0,
          item.tax || 0,
          item.subtotal || (item.unit_price * item.quantity),
          item.total || (item.unit_price * item.quantity)
        ]
      );
    }

    // Registrar ingreso en incomes
    console.log('Inserting incomes for sale', saleId, 'total=', total);
    await conn.query(
      `INSERT INTO incomes (date, description, amount, category, reference, payment_method, status, notes, created_by)
       VALUES (CURDATE(), ?, ?, 'sales', ?, ?, 'received', ?, ?)`,
      [
        `Venta: ${saleNumber}`,
        total,
        saleNumber,
        payment_method || 'cash',
        notes || null,
        created_by
      ]
    );

    // Generar número de factura
    const [lastInvoiceRows] = await conn.query('SELECT invoice_number FROM admin_sales WHERE invoice_number IS NOT NULL ORDER BY created_at DESC LIMIT 1');
    const lastInvoice = (lastInvoiceRows as any[])[0];
    let nextNum = 1001;
    if (lastInvoice && lastInvoice.invoice_number) {
       const parts = lastInvoice.invoice_number.split('-');
       if (parts.length > 1) {
          nextNum = parseInt(parts[1]) + 1;
       } else {
          nextNum++;
       }
    }
    const invoiceNumber = `FAC-${nextNum}`;

    await conn.query('UPDATE admin_sales SET invoice_number = ?, invoice_status = ? WHERE id = ?', [invoiceNumber, 'authorized', saleId]);
    console.log('Sale committed', saleId);

    await conn.commit();
    transactionStarted = false;

    return NextResponse.json({ success: true, message: 'Venta registrada exitosamente', sale_number: saleNumber, sale_id: saleId });
  } catch (error: any) {
    if (conn && transactionStarted) {
      try { await conn.rollback(); } catch {}
    }
    console.error('Error en POST /api/admin/sales:', error);
    return NextResponse.json({ error: 'Error al registrar venta', detail: error?.message || String(error) }, { status: 500 });
  } finally {
    if (conn) conn?.release();
  }
}
