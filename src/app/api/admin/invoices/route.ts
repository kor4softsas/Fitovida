import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Invoice {
  id: string;
  number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  subtotal: number;
  tax: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issued_date: string;
  due_date: string;
  payment_method: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '100';

    let sql = `
      SELECT 
        a.id,
        CONCAT(a.sale_number, '') as number,
        CONCAT(a.customer_first_name, ' ', a.customer_last_name) as customer_name,
        a.customer_email,
        a.total,
        a.subtotal,
        COALESCE(a.tax, 0) as tax,
        COALESCE(a.status, 'issued') as status,
        a.created_at as issued_date,
        DATE_ADD(a.created_at, INTERVAL 30 DAY) as due_date,
        COALESCE(a.payment_method, 'pending') as payment_method
      FROM admin_sales a
      WHERE 1=1
    `;

    if (status && status !== 'all') {
      sql += ` AND a.status = ?`;
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ${parseInt(limit)}`;

    const params: any[] = [];
    if (status && status !== 'all') {
      params.push(status);
    }

    const invoices = await query(sql, params) as Invoice[];

    return NextResponse.json({ invoices: invoices || [] }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/invoices error:', error);
    // Retornar lista vacía en caso de error
    return NextResponse.json({ invoices: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_first_name,
      customer_last_name,
      customer_email,
      items,
      subtotal,
      tax,
      total,
      payment_method = 'pending',
      status = 'draft'
    } = body;

    // Generar número de factura
    const lastInvoice = await query(
      'SELECT MAX(CAST(sale_number as UNSIGNED)) as last_number FROM admin_sales',
      []
    ) as any[];
    
    const nextNumber = (lastInvoice[0]?.last_number || 0) + 1;
    const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`;

    // Insertar factura
    const result = await query(
      `INSERT INTO admin_sales (
        sale_number, customer_first_name, customer_last_name, customer_email,
        subtotal, tax, total, payment_method, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [invoiceNumber, customer_first_name, customer_last_name, customer_email, subtotal, tax, total, payment_method, status]
    ) as any;

    // Insertar items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query(
          `INSERT INTO admin_sale_items (sale_id, product_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [result.insertId, item.product_id, item.quantity, item.unit_price, item.subtotal]
        );
      }
    }

    return NextResponse.json(
      { id: result.insertId, number: invoiceNumber, status: 'created' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/invoices error:', error);
    return NextResponse.json(
      { error: 'Error creating invoice' },
      { status: 500 }
    );
  }
}
