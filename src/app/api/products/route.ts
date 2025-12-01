import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET - Obtener todos los productos o filtrar por categoría
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    const supabase = await createServiceClient();
    
    let query = supabase.from('products').select('*');

    // Filtrar por categoría
    if (category && category !== 'todos') {
      query = query.eq('category', category);
    }

    // Filtrar solo destacados
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Limitar resultados
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    // Ordenar por destacados primero, luego por nombre
    query = query.order('featured', { ascending: false }).order('name');

    const { data: products, error } = await query;

    if (error) {
      console.error('Error obteniendo productos:', error);
      return NextResponse.json(
        { error: 'Error obteniendo productos' },
        { status: 500 }
      );
    }

    // Transformar al formato esperado por el frontend
    const transformedProducts = products?.map(p => ({
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
      benefits: p.benefits || []
    })) || [];

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
