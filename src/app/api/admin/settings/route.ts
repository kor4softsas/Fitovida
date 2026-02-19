import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CompanySettings {
  company_name: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  website: string;
  invoice_prefix: string;
  invoice_next_number: number;
  tax_rate: number;
  currency: string;
  terms_and_conditions: string;
  invoice_footer: string;
  dian_resolution: string;
  dian_range_from: number;
  dian_range_to: number;
}

export async function GET(request: NextRequest) {
  try {
    // En un escenario real, estos datos vendrían de una tabla de configuración
    // Por ahora retornaremos valores por defecto
    
    const settings: CompanySettings = {
      company_name: 'Fitovida SAS',
      nit: '900.123.456-7',
      email: 'admin@fitovida.co',
      phone: '+57 300 123 4567',
      address: 'Cra 50 #25-20',
      city: 'Medellín',
      department: 'Antioquia',
      website: 'www.fitovida.co',
      invoice_prefix: 'FAC',
      invoice_next_number: 1001,
      tax_rate: 19,
      currency: 'COP',
      terms_and_conditions: 'Los términos y condiciones aplican según lo establecido en la normativa vigente.',
      invoice_footer: 'Gracias por su compra. Para más información: www.fitovida.co',
      dian_resolution: 'Resolución 000123-2025',
      dian_range_from: 1,
      dian_range_to: 999999
    };

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
    
    // En un escenario real, guardaríamos en base de datos
    // Por ahora solo validamos y retornamos
    
    const settings: CompanySettings = {
      company_name: body.company_name || 'Fitovida',
      nit: body.nit || '',
      email: body.email || '',
      phone: body.phone || '',
      address: body.address || '',
      city: body.city || '',
      department: body.department || '',
      website: body.website || '',
      invoice_prefix: body.invoice_prefix || 'FAC',
      invoice_next_number: body.invoice_next_number || 1001,
      tax_rate: body.tax_rate || 19,
      currency: body.currency || 'COP',
      terms_and_conditions: body.terms_and_conditions || '',
      invoice_footer: body.invoice_footer || '',
      dian_resolution: body.dian_resolution || '',
      dian_range_from: body.dian_range_from || 1,
      dian_range_to: body.dian_range_to || 999999
    };

    return NextResponse.json(
      { status: 'success', settings },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/admin/settings error:', error);
    return NextResponse.json(
      { error: 'Error updating settings' },
      { status: 500 }
    );
  }
}
