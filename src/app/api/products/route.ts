import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface ProductRow {
  id: number;
  name: string;
  description: string;
  price: string;
  original_price: string | null;
  image: string;
  category: string;
  stock: number;
  featured: boolean;
  discount: number | null;
  rating: string;
  reviews: number;
  benefits: string | null;
}

// GET - Obtener todos los productos o filtrar por categoría
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    // Construir query SQL
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    // Filtrar por categoría
    if (category && category !== 'todos') {
      sql += ' AND category = ?';
      params.push(category);
    }

    // Filtrar solo destacados
    if (featured === 'true') {
      sql += ' AND featured = true';
    }

    // Ordenar por destacados primero, luego por nombre
    sql += ' ORDER BY featured DESC, name ASC';

    // Limitar resultados
    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const products = await query<ProductRow>(sql, params);

    // Transformar al formato esperado por el frontend
    const transformedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      image: p.image,
      category: p.category,
      stock: p.stock,
      featured: p.featured,
      discount: p.discount,
      rating: Number(p.rating),
      reviews: p.reviews,
      benefits: p.benefits ? JSON.parse(p.benefits) : []
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
