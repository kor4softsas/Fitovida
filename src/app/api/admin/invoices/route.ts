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
    
    let sql = `
      SELECT id, number, dian_resolution, sale_id, sale_type, 
             customer_name, customer_email, customer_document,
             subtotal, tax, total, payment_method, status, 
             issued_date, due_date, created_at
      FROM invoices
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (searchTerm) {
      sql += ' AND (number LIKE ? OR customer_name LIKE ? OR customer_document LIKE ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    sql += ' ORDER BY issued_date DESC';

    const invoices = await query(sql, params);

    return NextResponse.json({
      invoices,
      total: invoices.length
    });
  } catch (error) {
    console.error('Error en GET /api/admin/invoices:', error);
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
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
