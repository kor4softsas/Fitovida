'use client';

import { Store } from 'lucide-react';
import { getActiveLocations, useLocations } from '@/lib/admin/location-store';

interface LocationSelectorProps {
  variant?: 'sidebar' | 'inline';
  className?: string;
}

// Selector del local activo. Todas sus instancias comparten el mismo estado.
export default function LocationSelector({ variant = 'inline', className = '' }: LocationSelectorProps) {
  const { locations, schemaReady, selectedLocationId, setSelectedLocationId } = useLocations();
  const activeLocations = getActiveLocations(locations);

  if (!schemaReady || activeLocations.length === 0) {
    return null;
  }

  const options = (
    <>
      <option value="all">Todos los locales</option>
      {activeLocations.map((location) => (
        <option key={location.id} value={location.id}>
          {location.name}
          {location.isDefault ? ' (principal)' : ''}
        </option>
      ))}
    </>
  );

  const handleChange = (value: string) => {
    setSelectedLocationId(value === 'all' ? 'all' : Number(value));
  };

  if (variant === 'sidebar') {
    return (
      <div className={className}>
        <label
          htmlFor="admin-location-selector"
          className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-700/60"
        >
          <Store size={14} />
          Local activo
        </label>
        <select
          id="admin-location-selector"
          value={String(selectedLocationId)}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full cursor-pointer rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          {options}
        </select>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Store className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#005236]" size={18} />
      <select
        aria-label="Local"
        value={String(selectedLocationId)}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full cursor-pointer rounded-full border border-[#e6e9e8] bg-white py-2 pl-10 pr-4 font-semibold text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
      >
        {options}
      </select>
    </div>
  );
}
