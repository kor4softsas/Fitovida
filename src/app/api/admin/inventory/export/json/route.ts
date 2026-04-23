import { NextRequest, NextResponse } from 'next/server';
import { getInventoryData } from '@/lib/admin/inventory-export';

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

    return new NextResponse(JSON.stringify(data.exportRows, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="inventario.json"'
      }
    });
  } catch (error) {
    console.error('Error en GET /api/admin/inventory/export/json:', error);
    return NextResponse.json({ error: 'No fue posible exportar el inventario en JSON' }, { status: 500 });
  }
}
