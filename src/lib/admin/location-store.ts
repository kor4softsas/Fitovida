'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationSelection, StoreLocation } from '@/types/admin';

// Local activo del panel admin (se recuerda en este navegador).
// Lo usan el selector del menú lateral, Inventario y Ventas.

type LocationApiRow = {
  id: number | string;
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  is_default: number | boolean | string;
  status: 'active' | 'inactive';
  product_count?: number | string;
  total_units?: number | string;
};

export function mapLocationRow(row: LocationApiRow): StoreLocation {
  return {
    id: Number(row.id),
    name: row.name,
    code: row.code || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    phone: row.phone || undefined,
    isDefault: Boolean(Number(row.is_default)),
    status: row.status,
    productCount: Number(row.product_count || 0),
    totalUnits: Number(row.total_units || 0)
  };
}

interface LocationStore {
  locations: StoreLocation[];
  /** false si la BD aún no tiene la migración mysql/07-locations.sql */
  schemaReady: boolean;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  selectedLocationId: LocationSelection;
  setSelectedLocationId: (id: LocationSelection) => void;
  loadLocations: () => Promise<void>;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      locations: [],
      schemaReady: false,
      loaded: false,
      loading: false,
      error: null,
      selectedLocationId: 'all',

      setSelectedLocationId: (id) => set({ selectedLocationId: id }),

      loadLocations: async () => {
        if (get().loading) return;
        set({ loading: true, error: null });

        try {
          const response = await fetch('/api/admin/locations', { cache: 'no-store' });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data?.error || 'Error cargando locales');
          }

          const locations = ((data.locations || []) as LocationApiRow[]).map(mapLocationRow);
          const selected = get().selectedLocationId;
          const selectionIsValid =
            selected === 'all' || locations.some((location) => location.id === selected && location.status === 'active');

          set({
            locations,
            schemaReady: Boolean(data.schemaReady),
            loaded: true,
            selectedLocationId: selectionIsValid ? selected : 'all'
          });
        } catch (error) {
          set({ loaded: true, error: error instanceof Error ? error.message : 'Error cargando locales' });
        } finally {
          set({ loading: false });
        }
      }
    }),
    {
      name: 'fitovida-admin-location',
      partialize: (state) => ({ selectedLocationId: state.selectedLocationId })
    }
  )
);

export function getActiveLocations(locations: StoreLocation[]): StoreLocation[] {
  return locations.filter((location) => location.status === 'active');
}

export function getDefaultLocation(locations: StoreLocation[]): StoreLocation | null {
  return locations.find((location) => location.isDefault) || getActiveLocations(locations)[0] || null;
}

/** Store de locales, cargándolos la primera vez que se usa. */
export function useLocations() {
  const store = useLocationStore();
  const { loaded, loading, loadLocations } = store;

  useEffect(() => {
    if (!loaded && !loading) void loadLocations();
  }, [loaded, loading, loadLocations]);

  return store;
}
