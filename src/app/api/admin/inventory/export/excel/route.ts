import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
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

    const header = [
      'ID',
      'Producto',
      'Descripcion',
      'Precio',
      'Stock',
      'Fecha Vencimiento',
      'Estado Vencimiento',
      'Tiene INVIMA',
      'Numero INVIMA',
      'Fecha Creacion',
      'Categoria',
      'SKU',
      'Codigo Barras',
      'Costo Unitario',
      'Stock Minimo',
      'Stock Maximo',
      'IVA',
      'Proveedor',
      'Estado'
    ];

    const rows = data.exportRows.map((row) => ([
      row.id,
      row.nombre,
      row.descripcion,
      row.precio,
      row.stock,
      row.fechaVencimiento,
      row.estadoVencimiento,
      row.tieneInvima ? 'Si' : 'No',
      row.numeroInvima,
      row.fechaCreacion,
      row.categoria,
      row.sku,
      row.barcode,
      row.costoUnitario,
      row.stockMinimo,
      row.stockMaximo,
      row.tasaIva,
      row.proveedor,
      row.estado
    ]));

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 28 },
      { wch: 34 },
      { wch: 14 },
      { wch: 10 },
      { wch: 16 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 18 },
      { wch: 14 }
    ];

    worksheet['!autofilter'] = {
      ref: `A1:S${rows.length + 1}`
    };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="inventario.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error en GET /api/admin/inventory/export/excel:', error);
    return NextResponse.json({ error: 'No fue posible exportar el inventario en Excel' }, { status: 500 });
  }
}
