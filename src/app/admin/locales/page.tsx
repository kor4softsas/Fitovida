'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Store,
  Star,
  Package,
  Power,
  AlertTriangle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import type { StoreLocation } from '@/types/admin';
import { useLocations } from '@/lib/admin/location-store';
import { useAdminFeedback } from '@/components/admin/AdminFeedback';

type LocationForm = {
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  status: 'active' | 'inactive';
  isDefault: boolean;
};

const EMPTY_FORM: LocationForm = {
  name: '',
  code: '',
  address: '',
  city: '',
  phone: '',
  status: 'active',
  isDefault: false
};

function toForm(location: StoreLocation): LocationForm {
  return {
    name: location.name,
    code: location.code || '',
    address: location.address || '',
    city: location.city || '',
    phone: location.phone || '',
    status: location.status,
    isDefault: location.isDefault
  };
}

function toPayload(form: LocationForm) {
  return {
    name: form.name,
    code: form.code,
    address: form.address,
    city: form.city,
    phone: form.phone,
    status: form.status,
    is_default: form.isDefault
  };
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json() as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export default function LocalesPage() {
  const router = useRouter();
  const { locations, schemaReady, loaded, error, loadLocations, setSelectedLocationId } = useLocations();
  const { pushMessage, pushConfirm } = useAdminFeedback();
  const [editing, setEditing] = useState<StoreLocation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const activeCount = locations.filter((location) => location.status === 'active').length;
  const totalUnits = locations.reduce((sum, location) => sum + location.totalUnits, 0);
  const defaultLocation = locations.find((location) => location.isDefault);

  const formatNumber = (value: number) => new Intl.NumberFormat('es-CO').format(value);

  const saveLocation = async (form: LocationForm, location: StoreLocation | null) => {
    const response = await fetch(location ? `/api/admin/locations/${location.id}` : '/api/admin/locations', {
      method: location ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPayload(form))
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Error al guardar el local'));
    }

    await loadLocations();
  };

  const runAction = async (location: StoreLocation, action: () => Promise<void>, successMessage: string) => {
    setBusyId(location.id);
    try {
      await action();
      pushMessage(successMessage, 'success');
    } catch (actionError) {
      pushMessage(actionError instanceof Error ? actionError.message : 'No se pudo completar la acción', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = (location: StoreLocation) => {
    const nextStatus = location.status === 'active' ? 'inactive' : 'active';
    const apply = () =>
      runAction(
        location,
        () => saveLocation({ ...toForm(location), status: nextStatus }, location),
        nextStatus === 'active' ? `${location.name} activado` : `${location.name} desactivado`
      );

    if (nextStatus === 'inactive') {
      pushConfirm(
        `"${location.name}" dejará de aparecer para vender e ingresar mercancía. Su stock (${formatNumber(location.totalUnits)} unidades) seguirá contando en el total del inventario.`,
        () => void apply(),
        'Desactivar local'
      );
      return;
    }

    void apply();
  };

  const handleSetDefault = (location: StoreLocation) => {
    pushConfirm(
      `"${location.name}" será el local principal: recibirá los pedidos de la tienda web y será el local por defecto.`,
      () =>
        void runAction(
          location,
          () => saveLocation({ ...toForm(location), isDefault: true, status: 'active' }, location),
          `${location.name} es ahora el local principal`
        ),
      'Cambiar local principal'
    );
  };

  const handleDelete = (location: StoreLocation) => {
    pushConfirm(
      `¿Eliminar "${location.name}"? Solo se puede eliminar un local sin stock ni historial; si ya tuvo movimientos, desactívalo.`,
      () =>
        void runAction(
          location,
          async () => {
            const response = await fetch(`/api/admin/locations/${location.id}`, { method: 'DELETE' });
            if (!response.ok) {
              throw new Error(await readErrorMessage(response, 'Error al eliminar el local'));
            }
            await loadLocations();
          },
          `${location.name} eliminado`
        ),
      'Eliminar local'
    );
  };

  const handleViewInventory = (location: StoreLocation) => {
    setSelectedLocationId(location.id);
    router.push('/admin/inventario');
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#012d1d]">Locales</h2>
          <p className="mt-1 font-medium text-[#414844]">Sedes del negocio. Cada local maneja su propio inventario.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          disabled={!schemaReady}
          className="flex items-center gap-2 self-start rounded-full bg-[#012d1d] px-4 py-2 font-bold text-white transition-colors hover:bg-[#005236] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={20} />
          Nuevo local
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-[1.25rem] border border-[#ffdad6] bg-[#ffedea] p-4 text-[#93000a]">
          <AlertTriangle className="mt-0.5 flex-shrink-0" size={20} />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {!schemaReady && !error && (
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <AlertTriangle className="mt-0.5 flex-shrink-0" size={22} />
          <div>
            <p className="font-bold">La base de datos aún no tiene locales</p>
            <p className="mt-1 text-sm">
              Ejecuta la migración <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">mysql/07-locations.sql</code> para
              habilitar los locales. Mientras tanto el inventario sigue funcionando con un stock único.
            </p>
          </div>
        </div>
      )}

      {schemaReady && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Locales activos</p>
                  <p className="text-3xl font-extrabold text-[#012d1d]">
                    {activeCount}
                    <span className="ml-1 text-base font-semibold text-[#414844]">/ {locations.length}</span>
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#cce6d0] text-[#506856]">
                  <Store size={26} />
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Unidades en locales</p>
                  <p className="text-3xl font-extrabold text-[#012d1d]">{formatNumber(totalUnits)}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#a0f4c8] text-[#002113]">
                  <Package size={26} />
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Local principal</p>
                  <p className="truncate text-2xl font-extrabold text-[#012d1d]">{defaultLocation?.name || '—'}</p>
                  <p className="text-xs text-[#414844]">Recibe los pedidos de la tienda web</p>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900">
                  <Star size={26} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-[2.5rem] bg-[#f2f4f3]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#d9ddd9] bg-[#e6e9e8]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">Local</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">Dirección</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">Teléfono</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">Productos con stock</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">Unidades</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#414844]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e9e8] bg-white">
                  {locations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-[#414844]">
                        No hay locales. Crea el primero con &quot;Nuevo local&quot;.
                      </td>
                    </tr>
                  )}
                  {locations.map((location) => {
                    const isBusy = busyId === location.id;
                    return (
                      <tr key={location.id} className={location.status === 'inactive' ? 'bg-[#f8faf9] opacity-70' : 'hover:bg-[#f8faf9]'}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#012d1d]">{location.name}</span>
                            {location.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                                <Star size={10} />
                                Principal
                              </span>
                            )}
                          </div>
                          {location.code && <div className="mt-0.5 font-mono text-xs text-[#414844]">{location.code}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#414844]">
                          {[location.address, location.city].filter(Boolean).join(', ') || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#414844]">{location.phone || '—'}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-[#012d1d]">{formatNumber(location.productCount)}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-[#012d1d]">{formatNumber(location.totalUnits)}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              location.status === 'active' ? 'bg-[#a0f4c8] text-[#005236]' : 'bg-[#e6e9e8] text-[#414844]'
                            }`}
                          >
                            {location.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isBusy && <Loader2 size={18} className="animate-spin text-[#005236]" />}
                            {location.status === 'active' && (
                              <button
                                onClick={() => handleViewInventory(location)}
                                className="flex items-center gap-1 rounded-full bg-[#e7f9ee] px-3 py-1 text-xs font-bold text-[#005236] transition-colors hover:bg-[#d6f2df]"
                                title="Ver el inventario de este local"
                              >
                                Inventario
                                <ArrowRight size={14} />
                              </button>
                            )}
                            {!location.isDefault && location.status === 'active' && (
                              <button
                                onClick={() => handleSetDefault(location)}
                                disabled={isBusy}
                                className="text-amber-700 transition-colors hover:text-amber-900 disabled:opacity-50"
                                title="Marcar como local principal"
                              >
                                <Star size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditing(location);
                                setShowForm(true);
                              }}
                              disabled={isBusy}
                              className="text-[#005236] transition-colors hover:text-[#003d2d] disabled:opacity-50"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            {!location.isDefault && (
                              <>
                                <button
                                  onClick={() => handleToggleStatus(location)}
                                  disabled={isBusy}
                                  className="text-[#414844] transition-colors hover:text-[#012d1d] disabled:opacity-50"
                                  title={location.status === 'active' ? 'Desactivar' : 'Activar'}
                                >
                                  <Power size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete(location)}
                                  disabled={isBusy}
                                  className="text-[#ba1a1a] transition-colors hover:text-[#93000a] disabled:opacity-50"
                                  title="Eliminar"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <LocationFormModal
          location={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={async (form) => {
            await saveLocation(form, editing);
            pushMessage(editing ? 'Local actualizado correctamente' : 'Local creado correctamente', 'success');
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function LocationFormModal({
  location,
  onClose,
  onSave
}: {
  location: StoreLocation | null;
  onClose: () => void;
  onSave: (form: LocationForm) => Promise<void>;
}) {
  const [form, setForm] = useState<LocationForm>(location ? toForm(location) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isCurrentDefault = Boolean(location?.isDefault);

  const update = <K extends keyof LocationForm>(field: K, value: LocationForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (form.name.trim().length < 2) {
      setFormError('El nombre del local es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Error al guardar el local');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]';

  return (
    <div className="fv-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="fv-modal-panel w-full max-w-2xl rounded-[2.5rem] bg-white">
        <div className="flex items-center justify-between border-b border-[#e6e9e8] p-8">
          <h2 className="text-xl font-bold text-[#012d1d]">{location ? 'Editar local' : 'Nuevo local'}</h2>
          <button type="button" onClick={onClose} className="text-[#414844] hover:text-[#012d1d]">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-[#414844]">Nombre *</label>
            <input
              type="text"
              required
              autoFocus
              maxLength={150}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Ej: San Miguel"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">Código</label>
            <input
              type="text"
              maxLength={30}
              value={form.code}
              onChange={(e) => update('code', e.target.value.toUpperCase())}
              placeholder="Ej: SM"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">Teléfono</label>
            <input
              type="tel"
              maxLength={50}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">Dirección</label>
            <input
              type="text"
              maxLength={255}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">Ciudad</label>
            <input
              type="text"
              maxLength={120}
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">Estado</label>
            <select
              value={form.status}
              disabled={isCurrentDefault || form.isDefault}
              onChange={(e) => update('status', e.target.value as LocationForm['status'])}
              className={`${inputClass} disabled:bg-[#f2f4f3]`}
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-start gap-3 rounded-[1.25rem] bg-[#f2f4f3] px-4 py-3">
              <input
                type="checkbox"
                checked={form.isDefault}
                disabled={isCurrentDefault}
                onChange={(e) => {
                  update('isDefault', e.target.checked);
                  if (e.target.checked) update('status', 'active');
                }}
                className="mt-1 rounded border-[#c7cdc9] text-[#005236] focus:ring-[#005236]"
              />
              <span>
                <span className="block text-sm font-bold text-[#012d1d]">Local principal</span>
                <span className="block text-xs text-[#414844]">
                  {isCurrentDefault ? 'Para cambiarlo, marca otro local como principal.' : 'Recibe los pedidos de la tienda web.'}
                </span>
              </span>
            </label>
          </div>

          {formError && (
            <div className="rounded-[1.25rem] border border-[#ffdad6] bg-[#ffedea] px-4 py-3 text-sm font-semibold text-[#93000a] md:col-span-2">
              {formError}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#e6e9e8] p-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#e6e9e8] px-4 py-2 font-bold text-[#414844] transition-colors hover:bg-[#f2f4f3]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-[#005236] px-4 py-2 font-bold text-white transition-colors hover:bg-[#003d2d] disabled:opacity-60"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {location ? 'Guardar cambios' : 'Crear local'}
          </button>
        </div>
      </form>
    </div>
  );
}
