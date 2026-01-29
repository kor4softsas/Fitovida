/**
 * Usuarios demo para pruebas locales sin base de datos
 * Activa el modo demo estableciendo DEMO_MODE=true en .env.local
 */

import { UserAddress } from './auth';

export interface DemoUser {
  id: string;
  email: string;
  password: string; // En texto plano para facilitar las pruebas
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  addresses: UserAddress[];
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-user-1',
    email: 'demo@fitovida.com',
    password: 'demo123',
    firstName: 'Usuario',
    lastName: 'Demo',
    phone: '+57 300 123 4567',
    createdAt: new Date().toISOString(),
    addresses: [
      {
        id: 'addr-1',
        label: 'Casa',
        address: 'Calle 123 #45-67, Apto 301',
        city: 'Bogotá',
        department: 'Cundinamarca',
        zipCode: '110111',
        phone: '+57 300 123 4567',
        instructions: 'Apartamento 301, edificio azul',
        isDefault: true,
      },
      {
        id: 'addr-2',
        label: 'Oficina',
        address: 'Carrera 7 #32-16, Piso 5',
        city: 'Bogotá',
        department: 'Cundinamarca',
        zipCode: '110311',
        phone: '+57 300 123 4567',
        instructions: 'Piso 5, oficina 502',
        isDefault: false,
      },
    ],
  },
  {
    id: 'demo-user-2',
    email: 'admin@fitovida.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'Fitovida',
    phone: '+57 310 987 6543',
    createdAt: new Date().toISOString(),
    addresses: [
      {
        id: 'addr-3',
        label: 'Casa Principal',
        address: 'Calle 85 #12-34',
        city: 'Medellín',
        department: 'Antioquia',
        zipCode: '050021',
        phone: '+57 310 987 6543',
        isDefault: true,
      },
    ],
  },
  {
    id: 'demo-user-3',
    email: 'test@test.com',
    password: '123456',
    firstName: 'Test',
    lastName: 'User',
    phone: '+57 320 555 1234',
    createdAt: new Date().toISOString(),
    addresses: [],
  },
];

/**
 * Verifica si el modo demo está activo
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

/**
 * Busca un usuario demo por email
 */
export function findDemoUser(email: string): DemoUser | undefined {
  return DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Verifica las credenciales de un usuario demo
 */
export function verifyDemoCredentials(email: string, password: string): DemoUser | null {
  const user = findDemoUser(email);
  if (user && user.password === password) {
    return user;
  }
  return null;
}
