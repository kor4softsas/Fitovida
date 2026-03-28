import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_SETTINGS = {
  id: 1,
  company_name: 'Fitovida SAS',
  nit: '900000000-0',
  email: null,
  phone: null,
  address: null,
  city: null,
  department: null,
  website: null,
  invoice_prefix: 'FAC',
  invoice_next_number: 1001,
  tax_rate: 19,
  currency: 'COP',
  terms_and_conditions: null,
  invoice_footer: null,
  dian_resolution: null,
  dian_range_from: 1,
  dian_range_to: 999999,
};

function normalizeSettings(raw: any) {
  return {
    ...DEFAULT_SETTINGS,
    ...(raw || {}),
    invoice_next_number: Number(raw?.invoice_next_number ?? DEFAULT_SETTINGS.invoice_next_number),
    tax_rate: Number(raw?.tax_rate ?? DEFAULT_SETTINGS.tax_rate),
    dian_range_from: Number(raw?.dian_range_from ?? DEFAULT_SETTINGS.dian_range_from),
    dian_range_to: Number(raw?.dian_range_to ?? DEFAULT_SETTINGS.dian_range_to),
  };
}

export async function GET(_request: NextRequest) {
  try {
    const { query, queryOne } = await import('@/lib/db');

    const [tableExists] = await query("SHOW TABLES LIKE 'company_settings'") as any[];
    if (!tableExists) {
      return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });
    }

    const settings = await queryOne(
      'SELECT * FROM company_settings WHERE id = 1'
    );

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });
    }

    return NextResponse.json(normalizeSettings(settings), { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/settings error:', error);
    return NextResponse.json(
      {
        ...DEFAULT_SETTINGS,
        _fallback: true,
        _error: error?.message || 'Error fetching settings',
      },
      { status: 200 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { query, queryOne } = await import('@/lib/db');
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

    await query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id INT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        nit VARCHAR(50) NOT NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        address VARCHAR(255) NULL,
        city VARCHAR(120) NULL,
        department VARCHAR(120) NULL,
        website VARCHAR(255) NULL,
        invoice_prefix VARCHAR(20) NOT NULL DEFAULT 'FAC',
        invoice_next_number INT NOT NULL DEFAULT 1001,
        tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19,
        currency VARCHAR(10) NOT NULL DEFAULT 'COP',
        terms_and_conditions TEXT NULL,
        invoice_footer TEXT NULL,
        dian_resolution VARCHAR(255) NULL,
        dian_range_from INT NOT NULL DEFAULT 1,
        dian_range_to INT NOT NULL DEFAULT 999999,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

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
    return NextResponse.json({ success: true, settings: normalizeSettings(updated) }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/admin/settings error:', error);
    return NextResponse.json(
      { error: 'Error al guardar la configuración', detail: error?.message },
      { status: 500 }
    );
  }
}
