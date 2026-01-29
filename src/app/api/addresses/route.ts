import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-server';
import { isDemoMode, findDemoUser } from '@/lib/demo-users';

interface AddressRow {
  id: string;
  user_id: string;
  label: string;
  address: string;
  city: string;
  department: string;
  zip_code: string;
  phone: string;
  instructions: string | null;
  is_default: boolean;
}

// GET - Obtener direcciones del usuario
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // MODO DEMO: Retornar direcciones del usuario demo
    if (isDemoMode()) {
      const demoUser = findDemoUser(user.email);
      if (demoUser) {
        return NextResponse.json({ addresses: demoUser.addresses });
      }
      return NextResponse.json({ addresses: [] });
    }

    // MODO NORMAL: Obtener de la base de datos
    const addresses = await query<AddressRow>(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [user.id]
    );

    // Transformar a formato del frontend
    const formattedAddresses = addresses.map(addr => ({
      id: addr.id,
      label: addr.label,
      address: addr.address,
      city: addr.city,
      department: addr.department || 'Valle del Cauca',
      zipCode: addr.zip_code || '',
      phone: addr.phone || '',
      instructions: addr.instructions || '',
      isDefault: addr.is_default,
    }));

    return NextResponse.json({ addresses: formattedAddresses });
  } catch (error) {
    console.error('Error obteniendo direcciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva dirección
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { label, address, city, department, zipCode, phone, instructions, isDefault } = body;

    if (!label || !address || !city) {
      return NextResponse.json(
        { error: 'Etiqueta, dirección y ciudad son obligatorios' },
        { status: 400 }
      );
    }

    // Si es default, quitar default de las demás
    if (isDefault) {
      await query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?',
        [user.id]
      );
    }

    // Verificar si es la primera dirección (hacerla default automáticamente)
    const existingAddresses = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = ?',
      [user.id]
    );
    const isFirstAddress = existingAddresses[0]?.count === 0;

    // Insertar nueva dirección
    const addressId = `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await query(
      `INSERT INTO user_addresses (id, user_id, label, address, city, department, zip_code, phone, instructions, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [addressId, user.id, label, address, city, department || 'Valle del Cauca', zipCode || '', phone || '', instructions || '', isDefault || isFirstAddress]
    );

    // Obtener la dirección creada
    const newAddress = await queryOne<AddressRow>(
      'SELECT * FROM user_addresses WHERE id = ?',
      [addressId]
    );

    return NextResponse.json({
      success: true,
      address: {
        id: newAddress!.id,
        label: newAddress!.label,
        address: newAddress!.address,
        city: newAddress!.city,
        department: newAddress!.department || 'Valle del Cauca',
        zipCode: newAddress!.zip_code || '',
        phone: newAddress!.phone || '',
        instructions: newAddress!.instructions || '',
        isDefault: newAddress!.is_default,
      }
    });
  } catch (error) {
    console.error('Error creando dirección:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar dirección
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, label, address, city, department, zipCode, phone, instructions, isDefault } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de dirección es obligatorio' },
        { status: 400 }
      );
    }

    // Verificar que la dirección pertenece al usuario
    const existingAddress = await queryOne<AddressRow>(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    // Si es default, quitar default de las demás
    if (isDefault) {
      await query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?',
        [user.id]
      );
    }

    // Actualizar dirección
    await query(
      `UPDATE user_addresses SET 
        label = COALESCE(?, label),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        department = COALESCE(?, department),
        zip_code = COALESCE(?, zip_code),
        phone = COALESCE(?, phone),
        instructions = COALESCE(?, instructions),
        is_default = COALESCE(?, is_default)
       WHERE id = ? AND user_id = ?`,
      [label, address, city, department, zipCode, phone, instructions, isDefault, id, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando dirección:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar dirección
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de dirección es obligatorio' },
        { status: 400 }
      );
    }

    // Verificar que la dirección pertenece al usuario
    const existingAddress = await queryOne<AddressRow>(
      'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    const wasDefault = existingAddress.is_default;

    // Eliminar dirección
    await query(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    // Si era default, hacer default la primera que quede
    if (wasDefault) {
      await query(
        `UPDATE user_addresses SET is_default = TRUE 
         WHERE user_id = ? 
         ORDER BY created_at ASC 
         LIMIT 1`,
        [user.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando dirección:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
