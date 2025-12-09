'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// Tipo para el usuario autenticado
export interface LocalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  addresses: UserAddress[];
}

interface AuthStore {
  // Estado de autenticación
  user: LocalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Acciones de autenticación
  setUser: (user: LocalUser) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loadAddresses: () => Promise<void>;
  
  // Acciones de perfil
  updateProfile: (data: Partial<LocalUser>) => void;
  
  // Acciones de direcciones
  addAddress: (address: Omit<UserAddress, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<UserAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  getDefaultAddress: () => UserAddress | undefined;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      // Establecer usuario después de login/register
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      },
      
      // Verificar autenticación con el servidor
      checkAuth: async () => {
        try {
          set({ isLoading: true });
          
          const response = await fetch('/api/auth/me');
          const data = await response.json();
          
          if (data.authenticated && data.user) {
            // Cargar direcciones desde la API
            let addresses: UserAddress[] = [];
            try {
              const addrResponse = await fetch('/api/addresses');
              const addrData = await addrResponse.json();
              if (addrData.addresses) {
                addresses = addrData.addresses;
              }
            } catch {
              // Ignorar errores de carga de direcciones
            }
            
            set({ 
              user: {
                id: data.user.id,
                email: data.user.email,
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                phone: data.user.phone,
                createdAt: data.user.createdAt,
                addresses,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
      
      // Logout
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
          // Ignorar errores de logout
        }
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      },
      
      // Cargar direcciones desde la API
      loadAddresses: async () => {
        try {
          const response = await fetch('/api/addresses');
          const data = await response.json();
          
          if (data.addresses) {
            const { user } = get();
            if (user) {
              set({
                user: { ...user, addresses: data.addresses }
              });
            }
          }
        } catch (error) {
          console.error('Error cargando direcciones:', error);
        }
      },
      
      // Actualizar perfil
      updateProfile: (data) => {
        const { user } = get();
        if (!user) return;
        
        set({
          user: { ...user, ...data }
        });
      },
      
      // Agregar dirección
      addAddress: async (addressData) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const response = await fetch('/api/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addressData),
          });
          
          const data = await response.json();
          
          if (data.success && data.address) {
            // Si es default, quitar default de las demás
            let updatedAddresses = user.addresses;
            if (data.address.isDefault) {
              updatedAddresses = user.addresses.map(a => ({ ...a, isDefault: false }));
            }
            
            set({
              user: { ...user, addresses: [...updatedAddresses, data.address] }
            });
          }
        } catch (error) {
          console.error('Error agregando dirección:', error);
        }
      },
      
      // Actualizar dirección
      updateAddress: async (id, addressData) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const response = await fetch('/api/addresses', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...addressData }),
          });
          
          if (response.ok) {
            let updatedAddresses = user.addresses.map(a => 
              a.id === id ? { ...a, ...addressData } : a
            );
            
            // Si se marcó como default, quitar default de las demás
            if (addressData.isDefault) {
              updatedAddresses = updatedAddresses.map(a => ({
                ...a,
                isDefault: a.id === id
              }));
            }
            
            set({
              user: { ...user, addresses: updatedAddresses }
            });
          }
        } catch (error) {
          console.error('Error actualizando dirección:', error);
        }
      },
      
      // Eliminar dirección
      deleteAddress: async (id) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const response = await fetch(`/api/addresses?id=${id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            const filteredAddresses = user.addresses.filter(a => a.id !== id);
            
            // Si eliminamos la default, hacer default la primera que quede
            if (filteredAddresses.length > 0 && !filteredAddresses.some(a => a.isDefault)) {
              filteredAddresses[0].isDefault = true;
            }
            
            set({
              user: { ...user, addresses: filteredAddresses }
            });
          }
        } catch (error) {
          console.error('Error eliminando dirección:', error);
        }
      },
      
      // Establecer dirección como predeterminada
      setDefaultAddress: async (id) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const response = await fetch('/api/addresses', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isDefault: true }),
          });
          
          if (response.ok) {
            const updatedAddresses = user.addresses.map(a => ({
              ...a,
              isDefault: a.id === id
            }));
            
            set({
              user: { ...user, addresses: updatedAddresses }
            });
          }
        } catch (error) {
          console.error('Error estableciendo dirección predeterminada:', error);
        }
      },
      
      // Obtener dirección predeterminada
      getDefaultAddress: () => {
        const { user } = get();
        if (!user) return undefined;
        return user.addresses.find(a => a.isDefault);
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
