import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo electrónico y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Intentar login
    const result = await loginUser(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Crear respuesta con cookie de sesión
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Establecer cookie de sesión
    response.cookies.set('fitovida_session', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
