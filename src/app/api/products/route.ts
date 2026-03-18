import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Obtener todos los productos o filtrar por categoría
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    // Construir query SQL uniendo estrictamente con inventory_products
    // para que productos eliminados del inventario no aparezcan en la tienda
    let sql = `
      SELECT p.*, ip.current_stock as inventory_stock, ip.status as inventory_status
      FROM products p
      JOIN inventory_products ip ON p.id = ip.product_id
      WHERE ip.status = 'active'
    `;
    const params: any[] = [];

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
    const products = await query<any>(sql, params);

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
