'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Usuarios de prueba para desarrollo local
export const TEST_USERS = [
  {
    id: 'test-user-1',
    email: 'demo@fitovida.com',
    password: 'Demo1234',
    firstName: 'María',
    lastName: 'González',
    phone: '3001234567',
    createdAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'test-user-2',
    email: 'cliente@fitovida.com',
    password: 'Cliente123',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    phone: '3009876543',
    createdAt: new Date('2024-06-20').toISOString(),
  },
];

// Tipo para direcciones de usuario
export interface UserAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  department: string;
  zipCode: string;
  phone: string;
  instructions?: string;
  isDefault: boolean;
}

// Tipo para el usuario autenticado localmente
export interface LocalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  addresses: UserAddress[];
}

interface AuthStore {
  // Estado de autenticación
  user: LocalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Acciones de autenticación
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // Acciones de perfil
  updateProfile: (data: Partial<LocalUser>) => void;
  
  // Acciones de direcciones
  addAddress: (address: Omit<UserAddress, 'id'>) => void;
  updateAddress: (id: string, address: Partial<UserAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  getDefaultAddress: () => UserAddress | undefined;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

// Generar ID único para direcciones
const generateAddressId = () => `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      // Login con usuarios de prueba o registrados
      login: async (email, password) => {
        set({ isLoading: true });
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Buscar en usuarios de prueba
        const testUser = TEST_USERS.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        
        if (testUser) {
          const { password: _, ...userWithoutPassword } = testUser;
          set({ 
            user: { ...userWithoutPassword, addresses: [] },
            isAuthenticated: true, 
            isLoading: false 
          });
          return { success: true };
        }
        
        // Buscar en usuarios registrados (localStorage)
        const registeredUsers = JSON.parse(localStorage.getItem('fitovida-registered-users') || '[]');
        const registeredUser = registeredUsers.find(
          (u: { email: string; password: string }) => 
            u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        
        if (registeredUser) {
          const { password: _, ...userWithoutPassword } = registeredUser;
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
      
      // Registro de nuevos usuarios
      register: async (data) => {
        set({ isLoading: true });
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar si el email ya existe
        const existsInTest = TEST_USERS.some(
          u => u.email.toLowerCase() === data.email.toLowerCase()
        );
        
        const registeredUsers = JSON.parse(localStorage.getItem('fitovida-registered-users') || '[]');
        const existsInRegistered = registeredUsers.some(
          (u: { email: string }) => u.email.toLowerCase() === data.email.toLowerCase()
        );
        
        if (existsInTest || existsInRegistered) {
          set({ isLoading: false });
          return { success: false, error: 'Este correo ya está registrado' };
        }
        
        // Crear nuevo usuario
        const newUser: LocalUser & { password: string } = {
          id: `user-${Date.now()}`,
          ...data,
          createdAt: new Date().toISOString(),
          addresses: [],
        };
        
        // Guardar en localStorage
        registeredUsers.push(newUser);
        localStorage.setItem('fitovida-registered-users', JSON.stringify(registeredUsers));
        
        // Autenticar automáticamente
        const { password: _, ...userWithoutPassword } = newUser;
        set({ 
          user: userWithoutPassword, 
          isAuthenticated: true, 
          isLoading: false 
        });
        
        return { success: true };
      },
      
      // Cerrar sesión
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      // Actualizar perfil
      updateProfile: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null
        }));
      },
      
      // Agregar dirección
      addAddress: (address) => {
        set((state) => {
          if (!state.user) return state;
          
          const newAddress: UserAddress = {
            ...address,
            id: generateAddressId(),
            // Si es la primera dirección, hacerla predeterminada
            isDefault: state.user.addresses.length === 0 ? true : address.isDefault,
          };
          
          // Si la nueva dirección es predeterminada, quitar el default de las demás
          const updatedAddresses = address.isDefault
            ? state.user.addresses.map(a => ({ ...a, isDefault: false }))
            : state.user.addresses;
          
          return {
            user: {
              ...state.user,
              addresses: [...updatedAddresses, newAddress]
            }
          };
        });
      },
      
      // Actualizar dirección
      updateAddress: (id, address) => {
        set((state) => {
          if (!state.user) return state;
          
          let addresses = state.user.addresses.map(a => 
            a.id === id ? { ...a, ...address } : a
          );
          
          // Si esta dirección se marca como predeterminada, quitar de las demás
          if (address.isDefault) {
            addresses = addresses.map(a => ({
              ...a,
              isDefault: a.id === id
            }));
          }
          
          return {
            user: {
              ...state.user,
              addresses
            }
          };
        });
      },
      
      // Eliminar dirección
      deleteAddress: (id) => {
        set((state) => {
          if (!state.user) return state;
          
          const filteredAddresses = state.user.addresses.filter(a => a.id !== id);
          
          // Si se eliminó la dirección predeterminada, hacer la primera como default
          if (filteredAddresses.length > 0 && !filteredAddresses.some(a => a.isDefault)) {
            filteredAddresses[0].isDefault = true;
          }
          
          return {
            user: {
              ...state.user,
              addresses: filteredAddresses
            }
          };
        });
      },
      
      // Establecer dirección predeterminada
      setDefaultAddress: (id) => {
        set((state) => {
          if (!state.user) return state;
          
          return {
            user: {
              ...state.user,
              addresses: state.user.addresses.map(a => ({
                ...a,
                isDefault: a.id === id
              }))
            }
          };
        });
      },
      
      // Obtener dirección predeterminada
      getDefaultAddress: () => {
        const state = get();
        return state.user?.addresses.find(a => a.isDefault);
      },
    }),
    {
      name: 'fitovida-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook para verificar si hay una sesión activa
export function useLocalAuth() {
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    isLoading,
    isSignedIn: isAuthenticated,
    login,
    logout,
    register,
  };
}
