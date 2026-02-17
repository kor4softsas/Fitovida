import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[LOGIN] Intento de login con email:', email);

    // Validaciones
    if (!email || !password) {
      console.log('[LOGIN] Validación fallida: email o password faltantes');
      return NextResponse.json(
        { error: 'Correo electrónico y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Intentar login
    console.log('[LOGIN] Llamando a loginUser...');
    const result = await loginUser(email, password);
    console.log('[LOGIN] Resultado:', { success: result.success, error: result.error });

    if (!result.success) {
      console.log('[LOGIN] Login fallido:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    console.log('[LOGIN] Login exitoso para:', email);
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
    console.error('[LOGIN] Error en /api/auth/login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}
