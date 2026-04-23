import { NextRequest, NextResponse } from 'next/server';
import { buildInventorySqlExport, getInventoryData } from '@/lib/admin/inventory-export';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getInventoryData({
      category: searchParams.get('category'),
      status: searchParams.get('status'),
      searchTerm: searchParams.get('search'),
      lowStock: searchParams.get('lowStock') === 'true'
    });

    const sql = buildInventorySqlExport(data);

    return new NextResponse(sql, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="inventario.sql"'
      }
    });
  } catch (error) {
    console.error('Error en GET /api/admin/inventory/export/sql:', error);
    return NextResponse.json({ error: 'No fue posible exportar el inventario en SQL' }, { status: 500 });
  }
}
