import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Deshabilitar caché para que siempre se obtenga data fresca
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const searchTerm = searchParams.get('search');
    
    // Obtener si la tabla invoices existe
    const [tableExists] = await query("SHOW TABLES LIKE 'invoices'") as any[];
    const hasInvoicesTable = tableExists !== undefined && Object.keys(tableExists).length > 0;

    let params: any[] = [];
    let sql = '';

    if (hasInvoicesTable) {
      sql = `
        SELECT * FROM (
          SELECT id, number, dian_resolution, sale_id, sale_type, 
                 customer_name, customer_email, customer_document,
                 subtotal, tax, total, payment_method, status, 
                 issued_date, due_date, created_at
          FROM invoices
          
          UNION ALL
          
          SELECT 
            id, 
            COALESCE(invoice_number, sale_number) as number, 
            'Resolución 000123-2025' as dian_resolution, 
            id as sale_id, 
            'admin' as sale_type, 
            customer_name, 
            customer_email, 
            customer_document,
            subtotal, 
            tax, 
            total, 
            payment_method, 
            CASE 
              WHEN invoice_status = 'authorized' THEN 'issued'
              WHEN invoice_status = 'rejected' THEN 'cancelled'
              WHEN payment_status = 'completed' THEN 'paid'
              ELSE 'draft' 
            END as status, 
            COALESCE(invoice_date, created_at) as issued_date, 
            created_at as due_date, 
            created_at
          FROM admin_sales

          UNION ALL

          SELECT 
            id, 
            order_number as number, 
            'Resolución 000123-2025' as dian_resolution, 
            id as sale_id, 
            'client' as sale_type, 
            customer_name, 
            customer_email, 
            '' as customer_document,
            subtotal, 
            0 as tax, 
            total, 
            payment_method, 
            CASE 
              WHEN status = 'completed' THEN 'paid'
              WHEN status = 'cancelled' THEN 'cancelled'
              ELSE 'draft' 
            END as status, 
            created_at as issued_date, 
            created_at as due_date, 
            created_at
          FROM orders
        ) AS all_invoices
        WHERE 1=1
      `;
    } else {
      sql = `
        SELECT * FROM (
          SELECT 
            id, 
            COALESCE(invoice_number, sale_number) as number, 
            'Resolución 000123-2025' as dian_resolution, 
            id as sale_id, 
            'admin' as sale_type, 
            customer_name, 
            customer_email, 
            customer_document,
            subtotal, 
            tax, 
            total, 
            payment_method, 
            CASE 
              WHEN invoice_status = 'authorized' THEN 'issued'
              WHEN invoice_status = 'rejected' THEN 'cancelled'
              WHEN payment_status = 'completed' THEN 'paid'
              ELSE 'draft' 
            END as status, 
            COALESCE(invoice_date, created_at) as issued_date, 
            created_at as due_date, 
            created_at
          FROM admin_sales

          UNION ALL

          SELECT 
            id, 
            order_number as number, 
            'Resolución 000123-2025' as dian_resolution, 
            id as sale_id, 
            'client' as sale_type, 
            customer_name, 
            customer_email, 
            '' as customer_document,
            subtotal, 
            0 as tax, 
            total, 
            payment_method, 
            CASE 
              WHEN status = 'completed' THEN 'paid'
              WHEN status = 'cancelled' THEN 'cancelled'
              ELSE 'draft' 
            END as status, 
            created_at as issued_date, 
            created_at as due_date, 
            created_at
          FROM orders
        ) AS all_invoices
        WHERE 1=1
      `;
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (searchTerm) {
      sql += ' AND (number LIKE ? OR customer_name LIKE ? OR customer_document LIKE ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    sql += ' ORDER BY created_at DESC';

    // Eliminar duplicados si estaban en ambas tablas (para cuando se insertaba en ambas)
    const rawInvoices = await query(sql, params) as any[];
    const uniqueIds = new Set();
    const finalInvoices = rawInvoices.filter(inv => {
      // Como preferimos priorizar la que tenga el ID original de admin_sales, 
      // si coinciden en sale_id y number, filtramos. 
      // Para simplificar, usamos el ID combinando sale_id:
      const uniqueKey = inv.sale_id + '-' + inv.number;
      if (uniqueIds.has(uniqueKey)) return false;
      uniqueIds.add(uniqueKey);
      return true;
    });

    return NextResponse.json({
      invoices: finalInvoices,
      total: finalInvoices.length
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/invoices:', error);
    return NextResponse.json(
      { error: 'Error al obtener facturas', details: error.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sale_id, sale_type, customer_name, customer_email, customer_document,
      subtotal, tax, total, payment_method
    } = body;

    if (!sale_id || !customer_name || total === undefined) {
      return NextResponse.json({ error: 'Faltan datos requeridos (sale_id, customer_name, total)' }, { status: 400 });
    }

    // Obtener configuración DIAN (resolución y siguiente número)
    // Para simplificar asumo que se lee el último número de factura y suma 1
    const [lastInvoice] = await query('SELECT number FROM invoices ORDER BY id DESC LIMIT 1');
    let nextNum = 1001;
    if (lastInvoice && lastInvoice.number) {
       const parts = lastInvoice.number.split('-');
       if (parts.length > 1) {
          nextNum = parseInt(parts[1]) + 1;
       } else {
          nextNum++;
       }
    }
    const invoiceNumber = `FAC-${nextNum}`;
    const dianResolution = 'Resolución 000123-2025';

    await query(
      `INSERT INTO invoices 
        (number, dian_resolution, sale_id, sale_type, customer_name, customer_email, 
         customer_document, subtotal, tax, total, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'issued')`,
      [
        invoiceNumber, dianResolution, sale_id, sale_type || 'admin', 
        customer_name, customer_email || null, customer_document || null,
        subtotal || 0, tax || 0, total, payment_method || 'cash'
      ]
    );

    return NextResponse.json({ success: true, invoice_number: invoiceNumber });
  } catch (error) {
    console.error('Error en POST /api/admin/invoices:', error);
    return NextResponse.json(
      { error: 'Error al generar factura' },
      { status: 500 }
    );
  }
}
