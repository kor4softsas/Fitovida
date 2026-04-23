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

    const supportsInvima = await hasProductsColumn('has_invima');
    if (!supportsInvima) {
      return NextResponse.json(
        { error: 'Producto no disponible para venta' },
        { status: 404 }
      );
    }

    const sql = 'SELECT * FROM products WHERE id = ? AND has_invima = 1';

    const product = await query<ProductRow>(sql, [productId]);

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
