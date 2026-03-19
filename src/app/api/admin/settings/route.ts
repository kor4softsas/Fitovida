import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: NextRequest) {
  try {
    const settings = await queryOne(
      'SELECT * FROM company_settings WHERE id = 1'
    );

    if (!settings) {
      return NextResponse.json(
        { error: 'No settings found' },
        { status: 404 }
      );
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/settings error:', error);
    return NextResponse.json(
      { error: 'Error fetching settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      company_name,
      nit,
      email,
      phone,
      address,
      city,
      department,
      website,
      invoice_prefix,
      invoice_next_number,
      tax_rate,
      currency,
      terms_and_conditions,
      invoice_footer,
      dian_resolution,
      dian_range_from,
      dian_range_to,
    } = body;

    if (!company_name || !nit) {
      return NextResponse.json(
        { error: 'El nombre de la empresa y el NIT son requeridos' },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO company_settings 
        (id, company_name, nit, email, phone, address, city, department, website,
         invoice_prefix, invoice_next_number, tax_rate, currency,
         terms_and_conditions, invoice_footer, dian_resolution, dian_range_from, dian_range_to)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         company_name = VALUES(company_name),
         nit = VALUES(nit),
         email = VALUES(email),
         phone = VALUES(phone),
         address = VALUES(address),
         city = VALUES(city),
         department = VALUES(department),
         website = VALUES(website),
         invoice_prefix = VALUES(invoice_prefix),
         invoice_next_number = VALUES(invoice_next_number),
         tax_rate = VALUES(tax_rate),
         currency = VALUES(currency),
         terms_and_conditions = VALUES(terms_and_conditions),
         invoice_footer = VALUES(invoice_footer),
         dian_resolution = VALUES(dian_resolution),
         dian_range_from = VALUES(dian_range_from),
         dian_range_to = VALUES(dian_range_to)`,
      [
        company_name,
        nit,
        email || null,
        phone || null,
        address || null,
        city || null,
        department || null,
        website || null,
        invoice_prefix || 'FAC',
        invoice_next_number || 1001,
        tax_rate || 19,
        currency || 'COP',
        terms_and_conditions || null,
        invoice_footer || null,
        dian_resolution || null,
        dian_range_from || 1,
        dian_range_to || 999999,
      ]
    );

    const updated = await queryOne('SELECT * FROM company_settings WHERE id = 1');
    return NextResponse.json({ success: true, settings: updated }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/admin/settings error:', error);
    return NextResponse.json(
      { error: 'Error al guardar la configuración', detail: error?.message },
      { status: 500 }
    );
  }
}
