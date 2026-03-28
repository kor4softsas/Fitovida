'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface CompanySettings {
  company_name: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  website: string;
  invoice_prefix: string;
  invoice_next_number: number;
  tax_rate: number;
  currency: string;
  terms_and_conditions: string;
  invoice_footer: string;
  dian_resolution: string;
  dian_range_from: number;
  dian_range_to: number;
}

const DEFAULT_SETTINGS: CompanySettings = {
  company_name: '',
  nit: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  department: '',
  website: '',
  invoice_prefix: 'FAC',
  invoice_next_number: 1001,
  tax_rate: 19,
  currency: 'COP',
  terms_and_conditions: '',
  invoice_footer: '',
  dian_resolution: '',
  dian_range_from: 1,
  dian_range_to: 999999,
};

function normalizeSettings(data: any): CompanySettings {
  return {
    company_name: data?.company_name ?? '',
    nit: data?.nit ?? '',
    email: data?.email ?? '',
    phone: data?.phone ?? '',
    address: data?.address ?? '',
    city: data?.city ?? '',
    department: data?.department ?? '',
    website: data?.website ?? '',
    invoice_prefix: data?.invoice_prefix ?? 'FAC',
    invoice_next_number: Number(data?.invoice_next_number ?? 1001),
    tax_rate: Number(data?.tax_rate ?? 19),
    currency: data?.currency ?? 'COP',
    terms_and_conditions: data?.terms_and_conditions ?? '',
    invoice_footer: data?.invoice_footer ?? '',
    dian_resolution: data?.dian_resolution ?? '',
    dian_range_from: Number(data?.dian_range_from ?? 1),
    dian_range_to: Number(data?.dian_range_to ?? 999999),
  };
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        setSettings(normalizeSettings(data));
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSettings(DEFAULT_SETTINGS);
        setMessage({ type: 'error', text: 'Error al cargar configuración' });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    if (settings) {
      setSettings({
        ...settings,
        [field]: value
      });
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Error al guardar configuración' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar configuración' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#e6e9e8] bg-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-[#012d1d]">
              <Settings className="text-[#005236]" size={32} />
              Configuración
            </h1>
            <p className="mt-1 font-medium text-[#414844]">Datos de la empresa y configuración general</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-[#005236] px-4 py-2 font-bold text-white transition-colors hover:bg-[#003d2d] disabled:cursor-not-allowed disabled:bg-[#9fc9b2]"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-[#414844]">Cargando configuración...</div>
          </div>
        ) : !settings ? (
          <div className="flex items-start gap-3 rounded-[1.25rem] border border-[#ffdad6] bg-[#ffedea] p-4">
            <AlertCircle className="mt-1 flex-shrink-0 text-[#93000a]" size={20} />
            <div>
              <h3 className="font-bold text-[#93000a]">Error</h3>
              <p className="text-[#93000a]">No se pudo cargar la configuración</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Mensaje de estado */}
            {message && (
              <div className={`flex items-start gap-3 rounded-[1.25rem] p-4 ${
                message.type === 'success' 
                  ? 'border border-[#a0f4c8] bg-[#e9f9f0]' 
                  : 'border border-[#ffdad6] bg-[#ffedea]'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="mt-0.5 flex-shrink-0 text-[#005236]" size={20} />
                ) : (
                  <AlertCircle className="mt-0.5 flex-shrink-0 text-[#93000a]" size={20} />
                )}
                <p className={message.type === 'success' ? 'text-[#005236] font-semibold' : 'text-[#93000a] font-semibold'}>
                  {message.text}
                </p>
              </div>
            )}

            {/* Información de la Empresa */}
            <div className="rounded-[2rem] border border-[#e6e9e8] bg-[#f2f4f3] p-6">
              <h2 className="mb-6 text-xl font-bold text-[#012d1d]">Información de la Empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Razón Social</label>
                  <input
                    type="text"
                    value={settings.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">NIT</label>
                  <input
                    type="text"
                    value={settings.nit}
                    onChange={(e) => handleChange('nit', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Teléfono</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Dirección</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Ciudad</label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Departamento</label>
                  <input
                    type="text"
                    value={settings.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Sitio Web</label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
              </div>
            </div>

            {/* Configuración de Facturación */}
            <div className="rounded-[2rem] border border-[#e6e9e8] bg-[#f2f4f3] p-6">
              <h2 className="mb-6 text-xl font-bold text-[#012d1d]">Facturación</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Prefijo de Factura</label>
                  <input
                    type="text"
                    value={settings.invoice_prefix}
                    onChange={(e) => handleChange('invoice_prefix', e.target.value.toUpperCase())}
                    placeholder="e.g., FAC"
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Próximo Número</label>
                  <input
                    type="number"
                    value={settings.invoice_next_number}
                    onChange={(e) => handleChange('invoice_next_number', parseInt(e.target.value))}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">IVA (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tax_rate}
                    onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Moneda</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  >
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="USD">USD - Dólar Americano</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Pie de Página</label>
                  <textarea
                    value={settings.invoice_footer}
                    onChange={(e) => handleChange('invoice_footer', e.target.value)}
                    rows={3}
                    className="w-full rounded-[1.25rem] border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
              </div>
            </div>

            {/* Configuración DIAN */}
            <div className="rounded-[2rem] border border-[#e6e9e8] bg-[#f2f4f3] p-6">
              <h2 className="mb-6 text-xl font-bold text-[#012d1d]">Configuración DIAN</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Resolución DIAN</label>
                  <input
                    type="text"
                    value={settings.dian_resolution}
                    onChange={(e) => handleChange('dian_resolution', e.target.value)}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Rango Desde</label>
                  <input
                    type="number"
                    value={settings.dian_range_from}
                    onChange={(e) => handleChange('dian_range_from', parseInt(e.target.value))}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#414844]">Rango Hasta</label>
                  <input
                    type="number"
                    value={settings.dian_range_to}
                    onChange={(e) => handleChange('dian_range_to', parseInt(e.target.value))}
                    className="w-full rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
              </div>
            </div>

            {/* Términos y Condiciones */}
            <div className="rounded-[2rem] border border-[#e6e9e8] bg-[#f2f4f3] p-6">
              <h2 className="mb-6 text-xl font-bold text-[#012d1d]">Términos y Condiciones</h2>
              <textarea
                value={settings.terms_and_conditions}
                onChange={(e) => handleChange('terms_and_conditions', e.target.value)}
                rows={6}
                className="w-full rounded-[1.25rem] border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
