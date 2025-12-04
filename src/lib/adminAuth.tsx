'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/user';

// Usuario administrador de prueba
export const ADMIN_USERS = [
  {
    id: 'admin-1',
    email: 'admin@fitovida.com',
    password: 'Admin123!',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin' as UserRole,
    phone: '3001234567',
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: 'admin-2',
    email: 'vendedor@fitovida.com',
    password: 'Vendedor123!',
    firstName: 'Carlos',
    lastName: 'Vendedor',
    role: 'admin' as UserRole,
    phone: '3009876543',
    isActive: true,
    createdAt: new Date('2024-01-05').toISOString(),
  },
];

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminAuthStore {
  // Estado
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Acciones
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // Verificación de permisos
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Buscar usuario admin
        const adminUser = ADMIN_USERS.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        
        if (adminUser) {
          if (!adminUser.isActive) {
            set({ isLoading: false });
            return { success: false, error: 'Usuario desactivado' };
          }
          
          const { password: _, ...userWithoutPassword } = adminUser;
          set({ 
            user: userWithoutPassword,
            isAuthenticated: true, 
            isLoading: false 
          });
          return { success: true };
        }
        
        set({ isLoading: false });
        return { success: false, error: 'Credenciales incorrectas' };
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        
        const userPermissions = ROLE_PERMISSIONS[user.role];
        return userPermissions.includes(permission);
      },
      
      hasAnyPermission: (permissions) => {
        const { user } = get();
        if (!user) return false;
        
        const userPermissions = ROLE_PERMISSIONS[user.role];
        return permissions.some(p => userPermissions.includes(p));
      },
      
      hasAllPermissions: (permissions) => {
        const { user } = get();
        if (!user) return false;
        
        const userPermissions = ROLE_PERMISSIONS[user.role];
        return permissions.every(p => userPermissions.includes(p));
      },
    }),
    {
      name: 'fitovida-admin-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook para verificar permisos
export function usePermission(permission: Permission): boolean {
  const hasPermission = useAdminAuthStore(state => state.hasPermission);
  return hasPermission(permission);
}

// Componente HOC para proteger rutas por permiso
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: Permission
) {
  return function ProtectedComponent(props: P) {
    const hasPermission = useAdminAuthStore(state => state.hasPermission);
    
    if (!hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Acceso denegado</h2>
            <p className="text-gray-600 mt-2">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}
