import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

interface UserData {
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface UserRow {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: Date;
  updated_at: Date;
}

// POST - Sincronizar usuario de Clerk con MySQL
export async function POST(request: NextRequest) {
  try {
    const userData: UserData = await request.json();

    if (!userData.clerk_id || !userData.email) {
      return NextResponse.json(
        { error: 'clerk_id y email son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await queryOne<UserRow>(
      'SELECT * FROM users WHERE clerk_id = ?',
      [userData.clerk_id]
    );

    if (existingUser) {
      // Actualizar usuario existente
      await query(
        `UPDATE users SET 
          email = ?, 
          first_name = ?, 
          last_name = ?,
          updated_at = NOW()
        WHERE clerk_id = ?`,
        [
          userData.email,
          userData.first_name,
          userData.last_name,
          userData.clerk_id
        ]
      );

      return NextResponse.json({
        success: true,
        user: { ...existingUser, ...userData },
        message: 'Usuario actualizado'
      });
    } else {
      // Crear nuevo usuario
      await query(
        `INSERT INTO users (id, clerk_id, email, first_name, last_name) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          userData.clerk_id, // Usar clerk_id como id principal
          userData.clerk_id,
          userData.email,
          userData.first_name,
          userData.last_name
        ]
      );

      return NextResponse.json({
        success: true,
        user: userData,
        message: 'Usuario creado'
      });
    }
  } catch (error) {
    console.error('Error sincronizando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
