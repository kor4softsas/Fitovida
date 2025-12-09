import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    // Validaciones
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del correo electrónico no es válido' },
        { status: 400 }
      );
    }

    // Registrar usuario
    const result = await registerUser({
      email,
      password,
      firstName,
      lastName,
      phone,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Crear token para auto-login después del registro
    const token = await createToken(result.user!);

    // Crear respuesta con cookie de sesión
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Establecer cookie de sesión
    response.cookies.set('fitovida_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en /api/auth/register:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
