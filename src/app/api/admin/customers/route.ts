import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  department: string;
  total_orders: number;
  total_spent: number;
  last_purchase: string;
  status: 'active' | 'inactive';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';

    const sql = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        COALESCE(u.phone, '') as phone,
        COALESCE(a.city, '') as city,
        COALESCE(a.department, '') as department,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_spent,
        COALESCE(MAX(o.created_at), NOW()) as last_purchase,
        'active' as status
      FROM users u
      LEFT JOIN user_addresses a ON u.id = a.user_id AND a.is_default = 1
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, a.city, a.department
      ORDER BY total_spent DESC
      LIMIT ${parseInt(limit)}
    `;

    const customers = await query(sql, []) as Customer[];

    return NextResponse.json({ customers: customers || [] }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/customers error:', error);
    // Retornar lista vacía en caso de error
    return NextResponse.json({ customers: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      city,
      department,
      document_id
    } = body;

    if (!first_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 200 }
      );
    }

    try {
      // Verificar email único
      const existing = await query(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
      ) as any[];

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists', success: false },
          { status: 200 }
        );
      }

      // Crear usuario
      const result = await query(
        `INSERT INTO users (first_name, last_name, email, phone, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [first_name, last_name, email, phone]
      ) as any;

      // Crear dirección por defecto
      if (city && department && result.insertId) {
        try {
          await query(
            `INSERT INTO user_addresses (user_id, city, department, is_default, created_at)
             VALUES (?, ?, ?, 1, NOW())`,
            [result.insertId, city, department]
          );
        } catch (addrError) {
          console.error('Error adding address:', addrError);
        }
      }

      return NextResponse.json(
        { id: result.insertId, status: 'created', success: true },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error in POST /api/admin/customers:', dbError);
      return NextResponse.json(
        { error: 'Database error', success: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('POST /api/admin/customers error:', error);
    return NextResponse.json(
      { error: 'Error creating customer', success: false },
      { status: 200 }
    );
  }
}
