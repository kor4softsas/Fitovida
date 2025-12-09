import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error en /api/auth/me:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}
