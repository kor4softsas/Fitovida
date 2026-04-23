import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { pdf } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import InventoryExportPDF from '@/components/admin/InventoryExportPDF';
import { query, queryOne } from '@/lib/db';
import { getInventoryData } from '@/lib/admin/inventory-export';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CompanySettings = {
  company_name?: string;
  nit?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  department?: string | null;
  invoice_footer?: string | null;
};

const DEFAULT_SETTINGS: CompanySettings = {
  company_name: 'Fitovida SAS',
  nit: '900000000-0',
  email: null,
  phone: null,
  address: null,
  city: null,
  department: null,
  invoice_footer: 'Documento generado automáticamente por el sistema de inventario.'
};

async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const [tableExists] = await query("SHOW TABLES LIKE 'company_settings'") as Array<Record<string, unknown>>;
    if (!tableExists) {
      return DEFAULT_SETTINGS;
    }

    const settings = await queryOne<CompanySettings>('SELECT company_name, nit, email, phone, address, city, department, invoice_footer FROM company_settings WHERE id = 1');
    return {
      ...DEFAULT_SETTINGS,
      ...(settings || {})
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function getLogoDataUrl(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'img', 'logo.png');
    const logoBuffer = await readFile(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getInventoryData({
      category: searchParams.get('category'),
      status: searchParams.get('status'),
      searchTerm: searchParams.get('search'),
      lowStock: searchParams.get('lowStock') === 'true'
    });

    const generatedAt = new Date();
    const settings = await getCompanySettings();
    const logoDataUrl = await getLogoDataUrl();
    const pdfDocument = React.createElement(InventoryExportPDF, {
      rows: data.exportRows,
      generatedAt,
      settings,
      logoDataUrl
    }) as unknown as React.ReactElement<DocumentProps>;
    const pdfStream = await pdf(pdfDocument).toBuffer();
    const buffer = await new Response(pdfStream as unknown as BodyInit).arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="inventario.pdf"'
      }
    });
  } catch (error) {
    console.error('Error en GET /api/admin/inventory/export/pdf:', error);
    return NextResponse.json({ error: 'No fue posible exportar el inventario en PDF' }, { status: 500 });
  }
}
