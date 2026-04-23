import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryOne } from '@/lib/db';
import { getInventoryData } from '@/lib/admin/inventory-export';

function isSchemaIssue(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = String((error as { code?: string }).code || '');
  return [
    'ER_NO_SUCH_TABLE',
    'ER_BAD_FIELD_ERROR',
    'ER_BAD_DB_ERROR'
  ].includes(code);
}

function isDatabaseIssue(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = String((error as { code?: string }).code || '');
  return [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    'ER_ACCESS_DENIED_ERROR',
    'ER_ACCESS_DENIED_NO_PASSWORD_ERROR'
  ].includes(code);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getInventoryData({
      category: searchParams.get('category'),
      status: searchParams.get('status') || 'active',
      searchTerm: searchParams.get('search'),
      lowStock: searchParams.get('lowStock') === 'true'
    });

    return NextResponse.json({
      products: data.rows,
      total: data.rows.length
    });
  } catch (error) {
    if (isSchemaIssue(error) || isDatabaseIssue(error)) {
      return NextResponse.json(
        { products: [], total: 0, degraded: true, reason: 'database_unavailable' },
        { status: 200 }
      );
    }

    console.error('Error en GET /api/admin/inventory:', error);
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      sku,
      barcode,
      current_stock,
      min_stock,
      max_stock,
      unit_cost,
      tax_rate,
      supplier,
      status
    } = body;

    // Validar que el producto exista
    const product = await queryOne(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Validar barcode único si se proporciona
    if (barcode) {
      const existingBarcode = await queryOne(
        'SELECT id FROM inventory_products WHERE barcode = ?',
        [barcode]
      );
      if (existingBarcode) {
        return NextResponse.json(
          { error: 'El código de barras ya está registrado' },
          { status: 400 }
        );
      }
    }

    await query(
      `INSERT INTO inventory_products 
       (product_id, sku, barcode, current_stock, min_stock, max_stock, unit_cost, tax_rate, supplier, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        sku || null,
        barcode || null,
        current_stock || 0,
        min_stock || 5,
        max_stock || null,
        unit_cost || 0,
        tax_rate || 19,
        supplier || null,
        status || 'active'
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Producto agregado al inventario'
    });
  } catch (error) {
    console.error('Error en POST /api/admin/inventory:', error);
    return NextResponse.json(
      { error: 'Error al crear producto en inventario' },
      { status: 500 }
    );
  }
}
