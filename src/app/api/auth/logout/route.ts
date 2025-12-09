import { NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth-server';

export async function POST() {
  try {
    await logoutUser();

    const response = NextResponse.json({ success: true });

    // Eliminar cookie de sesión
    response.cookies.delete('fitovida_session');

    return response;
  } catch (error) {
    console.error('Error en /api/auth/logout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
