import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const searchTerm = searchParams.get('search');
    const lowStock = searchParams.get('lowStock') === 'true';

    let sql = `
      SELECT 
        ip.id, ip.product_id, p.name, p.description, p.price, p.category,
        ip.sku, ip.barcode, ip.current_stock, ip.min_stock, ip.max_stock,
        ip.unit_cost, ip.tax_rate, ip.supplier, ip.status,
        (ip.current_stock * ip.unit_cost) as stock_value,
        CASE 
          WHEN ip.current_stock <= ip.min_stock THEN 'low'
          WHEN ip.current_stock > ip.max_stock THEN 'high'
          ELSE 'normal'
        END as stock_status
      FROM inventory_products ip
      JOIN products p ON ip.product_id = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' AND ip.status = ?';
      params.push(status);
    }

    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    if (lowStock) {
      sql += ' AND ip.current_stock <= ip.min_stock';
    }

    if (searchTerm) {
      sql += ' AND (p.name LIKE ? OR ip.barcode LIKE ? OR ip.sku LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY p.name ASC';

    const products = await query(sql, params);

    return NextResponse.json({
      products,
      total: products.length
    });
  } catch (error) {
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
