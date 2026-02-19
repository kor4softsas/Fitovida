import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await queryOne(
      `SELECT 
        ip.id, ip.product_id, p.name, p.description, p.price, p.category,
        ip.sku, ip.barcode, ip.current_stock, ip.min_stock, ip.max_stock,
        ip.unit_cost, ip.tax_rate, ip.supplier, ip.status,
        (ip.current_stock * ip.unit_cost) as stock_value
      FROM inventory_products ip
      JOIN products p ON ip.product_id = p.id
      WHERE ip.id = ?`,
      [id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error en GET /api/admin/inventory/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sku, barcode, min_stock, max_stock, unit_cost, tax_rate, supplier, status } = body;

    // Verificar que el producto existe
    const product = await queryOne(
      'SELECT id FROM inventory_products WHERE id = ?',
      [id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Si se proporciona barcode nuevo, validar que sea único
    if (barcode) {
      const existingBarcode = await queryOne(
        'SELECT id FROM inventory_products WHERE barcode = ? AND id != ?',
        [barcode, id]
      );
      if (existingBarcode) {
        return NextResponse.json(
          { error: 'El código de barras ya está registrado' },
          { status: 400 }
        );
      }
    }

    await query(
      `UPDATE inventory_products 
       SET sku = ?, barcode = ?, min_stock = ?, max_stock = ?, unit_cost = ?, tax_rate = ?, supplier = ?, status = ?
       WHERE id = ?`,
      [sku || null, barcode || null, min_stock, max_stock || null, unit_cost, tax_rate, supplier || null, status, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Producto actualizado'
    });
  } catch (error) {
    console.error('Error en PUT /api/admin/inventory/[id]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Marcar como inactivo en lugar de eliminar
    await query(
      'UPDATE inventory_products SET status = ? WHERE id = ?',
      ['inactive', id]
    );

    return NextResponse.json({
      success: true,
      message: 'Producto desactivado'
    });
  } catch (error) {
    console.error('Error en DELETE /api/admin/inventory/[id]:', error);
    return NextResponse.json(
      { error: 'Error al desactivar producto' },
      { status: 500 }
    );
  }
}
