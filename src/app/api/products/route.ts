import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PublicProductRow {
  id: number;
  name: string;
  description: string;
  price: string | number;
  original_price: string | number | null;
  image: string;
  category: string;
  stock: number;
  featured: boolean;
  discount: number | null;
  rating: string | number;
  reviews: number;
  benefits: string | string[] | null;
  inventory_stock: number | null;
}

async function hasProductsColumn(columnName: string): Promise<boolean> {
  try {
    const rows = await query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'products'
         AND COLUMN_NAME = ?`,
      [columnName]
    );

    return Number(rows?.[0]?.count || 0) > 0;
  } catch {
    return false;
  }
}

// GET - Obtener todos los productos o filtrar por categoría
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    const supportsInvima = await hasProductsColumn('has_invima');

    // Fail-closed: si el esquema no tiene INVIMA, no exponer productos en la vitrina.
    if (!supportsInvima) {
      return NextResponse.json({
        products: [],
        count: 0,
        degraded: true,
        reason: 'invima_schema_missing'
      });
    }

    // Construir query SQL uniendo estrictamente con inventory_products
    // para que productos eliminados del inventario no aparezcan en la tienda
    let sql = `
      SELECT p.*, ip.current_stock as inventory_stock, ip.status as inventory_status
      FROM products p
      JOIN inventory_products ip ON p.id = ip.product_id
      WHERE ip.status = 'active'
    `;
        // Solo productos con INVIMA vigente en vitrina publica.
        sql += ' AND p.has_invima = 1';

    const params: Array<string | number> = [];

    // Filtrar por categoría
    if (category && category !== 'todos') {
      sql += ' AND p.category = ?';
      params.push(category);
    }

    // Filtrar solo destacados
    if (featured === 'true') {
      sql += ' AND p.featured = true';
    }

    // Se permite mostrar productos sin stock porque la UI tiene etiqueta "Agotado"
    /* sql += ' AND (ip.current_stock > 0 OR (ip.current_stock IS NULL AND p.stock > 0))'; */

    // Ordenar por destacados primero, luego por nombre
    sql += ' ORDER BY p.featured DESC, p.name ASC';

    // Limitar resultados
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    // El tipo de los resultados
    const products = await query<PublicProductRow>(sql, params);

    // Transformar al formato esperado por el frontend
    const transformedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      image: p.image,
      category: p.category,
      stock: p.inventory_stock !== null ? p.inventory_stock : p.stock,
      featured: p.featured,
      discount: p.discount,
      rating: Number(p.rating),
      reviews: p.reviews,
      benefits: p.benefits ? (typeof p.benefits === 'string' ? JSON.parse(p.benefits) : p.benefits) : []
    }));

    return NextResponse.json({ 
      products: transformedProducts,
      count: transformedProducts.length
    });
  } catch (error) {
    console.error('Error en GET /api/products:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
