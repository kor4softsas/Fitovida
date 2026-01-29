'use server';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query, queryOne } from './db';
import { isDemoMode, verifyDemoCredentials, findDemoUser, type DemoUser } from './demo-users';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fitovida-secret-key-change-in-production'
);

const COOKIE_NAME = 'fitovida_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_verified: boolean;
  created_at: Date;
}

export interface SessionPayload {
  userId: string;
  email: string;
  exp: number;
}

// Crear token JWT
export async function createToken(user: User): Promise<string> {
  const token = await new SignJWT({ 
    userId: user.id, 
    email: user.email 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

// Verificar token JWT
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Hash de contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verificar contraseña
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Registrar usuario
export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Verificar si el email ya existe
    const existingUser = await queryOne<User>(
      'SELECT id FROM users WHERE email = ?',
      [data.email.toLowerCase()]
    );

    if (existingUser) {
      return { success: false, error: 'Este correo electrónico ya está registrado' };
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(data.password);

    // Crear usuario
    await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, is_verified) 
       VALUES (?, ?, ?, ?, ?, true)`,
      [data.email.toLowerCase(), passwordHash, data.firstName, data.lastName, data.phone || null]
    );

    // Obtener el usuario creado
    const user = await queryOne<User>(
      'SELECT id, email, first_name, last_name, phone, is_verified, created_at FROM users WHERE email = ?',
      [data.email.toLowerCase()]
    );

    if (!user) {
      return { success: false, error: 'Error al crear el usuario' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error en registerUser:', error);
    return { success: false, error: 'Error al registrar el usuario' };
  }
}

// Login de usuario
export async function loginUser(email: string, password: string): Promise<{
  success: boolean;
  error?: string;
  user?: User;
  token?: string;
}> {
  try {
    console.log('[AUTH] loginUser - Iniciando login para:', email);
    console.log('[AUTH] DEMO_MODE:', isDemoMode());

    // MODO DEMO: Verificar credenciales demo
    if (isDemoMode()) {
      console.log('[AUTH] Modo DEMO activado');
      const demoUser = verifyDemoCredentials(email, password);
      if (!demoUser) {
        return { success: false, error: 'Correo electrónico o contraseña incorrectos' };
      }

      // Convertir DemoUser a User
      const user: User = {
        id: demoUser.id,
        email: demoUser.email,
        first_name: demoUser.firstName,
        last_name: demoUser.lastName,
        phone: demoUser.phone,
        is_verified: true,
        created_at: new Date(demoUser.createdAt),
      };

      // Crear token para el usuario demo
      const token = await createToken(user);

      return { success: true, user, token };
    }

    // MODO NORMAL: Verificar con base de datos
    console.log('[AUTH] Modo NORMAL - Consultando BD');
    
    // Buscar usuario por email
    let user;
    try {
      user = await queryOne<User & { password_hash: string }>(
        'SELECT id, email, password_hash, first_name, last_name, phone, is_verified, created_at FROM users WHERE email = ?',
        [email.toLowerCase()]
      );
      console.log('[AUTH] Query BD completada. Usuario encontrado:', user ? 'SÍ' : 'NO');
    } catch (dbError) {
      console.error('[AUTH] Error en query BD:', dbError);
      return { success: false, error: 'Error de conexión a base de datos' };
    }

    if (!user) {
      console.log('[AUTH] Usuario NO encontrado:', email);
      return { success: false, error: 'Correo electrónico o contraseña incorrectos' };
    }

    console.log('[AUTH] Usuario encontrado. Verificando contraseña...');

    // Verificar contraseña
    let isValid = false;
    try {
      isValid = await comparePassword(password, user.password_hash);
      console.log('[AUTH] Contraseña válida:', isValid);
    } catch (bcryptError) {
      console.error('[AUTH] Error en bcrypt:', bcryptError);
      return { success: false, error: 'Error al verificar contraseña' };
    }
    
    if (!isValid) {
      console.log('[AUTH] Contraseña incorrecta para:', email);
      return { success: false, error: 'Correo electrónico o contraseña incorrectos' };
    }

    console.log('[AUTH] Contraseña correcta. Creando token...');

    // Crear token
    const token = await createToken(user);

    // Guardar sesión en la base de datos
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    try {
      await query(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt]
      );
      console.log('[AUTH] Sesión guardada en BD');
    } catch (sessionError) {
      console.error('[AUTH] Error al guardar sesión:', sessionError);
      return { success: false, error: 'Error al crear sesión' };
    }

    // Eliminar password_hash antes de devolver
    const { password_hash: _, ...userWithoutPassword } = user;

    console.log('[AUTH] Login exitoso para:', email);
    return { success: true, user: userWithoutPassword, token };
  } catch (error) {
    console.error('[AUTH] Error en loginUser:', error);
    return { success: false, error: 'Error al iniciar sesión' };
  }
}

// Obtener usuario actual desde cookies
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const payload = await verifyToken(sessionCookie.value);
    if (!payload) {
      return null;
    }

    // MODO DEMO: Obtener usuario demo
    if (isDemoMode()) {
      const demoUser = findDemoUser(payload.email);
      if (!demoUser) {
        return null;
      }

      return {
        id: demoUser.id,
        email: demoUser.email,
        first_name: demoUser.firstName,
        last_name: demoUser.lastName,
        phone: demoUser.phone,
        is_verified: true,
        created_at: new Date(demoUser.createdAt),
      };
    }

    // MODO NORMAL: Verificar con base de datos
    // Verificar que la sesión existe en la base de datos
    const session = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW()',
      [sessionCookie.value]
    );

    if (!session) {
      return null;
    }

    // Obtener usuario
    const user = await queryOne<User>(
      'SELECT id, email, first_name, last_name, phone, is_verified, created_at FROM users WHERE id = ?',
      [session.user_id]
    );

    return user;
  } catch {
    return null;
  }
}

// Logout
export async function logoutUser(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (sessionCookie?.value && !isDemoMode()) {
      // Solo eliminar sesión de BD si NO es modo demo
      await query('DELETE FROM sessions WHERE token = ?', [sessionCookie.value]);
    }

    // Eliminar cookie
    cookieStore.delete(COOKIE_NAME);
  } catch (error) {
    console.error('Error en logoutUser:', error);
  }
}

// Limpiar sesiones expiradas (para ejecutar periódicamente)
export async function cleanExpiredSessions(): Promise<void> {
  await query('DELETE FROM sessions WHERE expires_at < NOW()');
}
