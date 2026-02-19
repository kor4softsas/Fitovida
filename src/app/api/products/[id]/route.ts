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

// GET - Obtener un producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    const product = await query<ProductRow>(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    if (product.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const p = product[0];
    const transformedProduct = {
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
    };

    return NextResponse.json({ product: transformedProduct });
  } catch (error) {
    console.error('Error en GET /api/products/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
