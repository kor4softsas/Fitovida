'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Download, Eye, Search, X, Printer } from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  dian_resolution: string;
  sale_id: string;
  customer_name: string;
  customer_email: string;
  customer_document: string;
  total: number;
  subtotal: number;
  tax: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issued_date: string;
  due_date: string;
  payment_method: string;
}

interface CompanySettings {
  company_name: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  website: string;
  tax_rate: number;
  terms_and_conditions: string;
  invoice_footer: string;
  dian_resolution: string;
  dian_range_from: number;
  dian_range_to: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

const PAY_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  pse: 'PSE',
  wompi: 'Wompi',
};

export default function FacturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [invoicesRes, settingsRes] = await Promise.all([
          fetch('/api/admin/invoices'),
          fetch('/api/admin/settings'),
        ]);
        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data.invoices || []);
        }
        if (settingsRes.ok) {
          setSettings(await settingsRes.json());
        }
      } catch (e) {
        console.error('Error loading facturas:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'issued': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'issued': return 'Emitida';
      case 'paid': return 'Pagada';
      case 'draft': return 'Borrador';
      case 'cancelled': return 'Cancelada';
      default: return s;
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const html = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=800,height=1000');
    if (!w) return;
    w.document.write(`
      <html><head><title>Factura ${selectedInvoice?.number}</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 11px; color: #111; }
        table { border-collapse: collapse; width: 100%; }
        th, td { padding: 4px 6px; }
        @media print { body { margin: 0; padding: 0; } }
      </style>
      </head><body>${html}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-600" size={32} />
              Facturación
            </h1>
            <p className="text-gray-600 mt-1">Gestión de facturas electrónicas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="issued">Emitidas</option>
            <option value="paid">Pagadas</option>
            <option value="draft">Borrador</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-500">Cargando facturas...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium">No hay facturas registradas</p>
            <p className="text-sm mt-1">Las facturas se generan automáticamente al registrar una venta</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">N° Factura</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{invoice.number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invoice.issued_date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{fmt(Number(invoice.total))}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Ver factura"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => { setSelectedInvoice(invoice); setTimeout(handlePrint, 300); }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Imprimir / Descargar PDF"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Resumen */}
        {filteredInvoices.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Facturas</p>
              <p className="text-2xl font-bold text-blue-600">{filteredInvoices.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Pagadas</p>
              <p className="text-2xl font-bold text-green-600">{filteredInvoices.filter((f) => f.status === 'paid').length}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Emitidas</p>
              <p className="text-2xl font-bold text-orange-600">{filteredInvoices.filter((f) => f.status === 'issued').length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Ingresos Total</p>
              <p className="text-2xl font-bold text-purple-600">{fmt(filteredInvoices.reduce((s, f) => s + Number(f.total), 0))}</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL VISTA PREVIA ===== */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            {/* Modal header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                Factura {selectedInvoice.number}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Vista previa de la factura */}
            <div className="p-4 overflow-auto max-h-[80vh]">
              <div ref={printRef}>
                <InvoicePreview invoice={selectedInvoice} settings={settings} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Componente de vista previa de factura ===== */
function InvoicePreview({ invoice, settings }: { invoice: Invoice; settings: CompanySettings | null }) {
  const fecha = new Date(invoice.issued_date);
  const fechaStr = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const taxRate = settings?.tax_rate ?? 19;

  const wrapStyle: React.CSSProperties = {
    padding: 24,
    background: '#fff',
    color: '#111',
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
  };

  return (
    <div style={wrapStyle}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #167c3c', paddingBottom: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <img src="/img/logo.png" alt="Logo" width={44} height={44} style={{ objectFit: 'contain', borderRadius: 4 }} />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 15, color: '#167c3c' }}>{settings?.company_name || 'Fitovida SAS'}</div>
              <div style={{ fontSize: 10, color: '#555' }}>NIT: {settings?.nit || '—'}</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#333', lineHeight: 1.6 }}>
            <div>{settings?.address} — {settings?.city}, {settings?.department}</div>
            <div>Tel: {settings?.phone} | {settings?.email}</div>
            <div>{settings?.website}</div>
          </div>
        </div>
        <div style={{ border: '2px solid #167c3c', borderRadius: 4, padding: '8px 14px', textAlign: 'center', minWidth: 185 }}>
          <div style={{ fontWeight: 'bold', fontSize: 12, color: '#167c3c', letterSpacing: 1 }}>FACTURA DE VENTA</div>
          <div style={{ fontWeight: 'bold', fontSize: 14, marginTop: 2 }}>{invoice.number}</div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>Fecha: {fechaStr}</div>
          <div style={{ fontSize: 10, color: '#555' }}>Hora: {horaStr}</div>
          {(invoice.dian_resolution || settings?.dian_resolution) && (
            <div style={{ fontSize: 9, color: '#888', marginTop: 4, borderTop: '1px dashed #ccc', paddingTop: 4 }}>
              Res. DIAN: {invoice.dian_resolution || settings?.dian_resolution}<br />
              Rango: {settings?.dian_range_from} – {settings?.dian_range_to}
            </div>
          )}
        </div>
      </div>

      {/* Datos cliente */}
      <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
        <div style={{ fontWeight: 'bold', color: '#167c3c', marginBottom: 4 }}>DATOS DEL ADQUIRENTE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, fontSize: 10 }}>
          <div><b>Nombre:</b> {invoice.customer_name}</div>
          <div><b>NIT / C.C.:</b> {invoice.customer_document || '222222222222'}</div>
          <div><b>Correo:</b> {invoice.customer_email || '—'}</div>
          <div><b>Método pago:</b> {PAY_LABELS[invoice.payment_method] || invoice.payment_method}</div>
        </div>
      </div>

      {/* Tabla ítems — La venta actual no guarda ítems en invoices, así que mostramos subtotal/tax/total */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: 10 }}>
        <thead>
          <tr style={{ background: '#167c3c', color: '#fff' }}>
            <th style={{ padding: '5px 6px', textAlign: 'left' }}>Descripción</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', width: 90 }}>Base</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', width: 60 }}>%IVA</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', width: 90 }}>IVA</th>
            <th style={{ padding: '5px 6px', textAlign: 'right', width: 90 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '4px 6px' }}>Venta {invoice.number}</td>
            <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmt(Number(invoice.subtotal))}</td>
            <td style={{ padding: '4px 6px', textAlign: 'right' }}>{taxRate}%</td>
            <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmt(Number(invoice.tax))}</td>
            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>{fmt(Number(invoice.total))}</td>
          </tr>
        </tbody>
      </table>

      {/* Totales */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <table style={{ fontSize: 11, minWidth: 240, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 8px', color: '#555' }}>Subtotal (base gravable):</td>
              <td style={{ padding: '2px 8px', textAlign: 'right' }}>{fmt(Number(invoice.subtotal))}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 8px', color: '#555' }}>IVA ({taxRate}%):</td>
              <td style={{ padding: '2px 8px', textAlign: 'right' }}>{fmt(Number(invoice.tax))}</td>
            </tr>
            <tr style={{ borderTop: '2px solid #167c3c' }}>
              <td style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: 13 }}>TOTAL A PAGAR:</td>
              <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: 13, color: '#167c3c' }}>{fmt(Number(invoice.total))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pie */}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: 10, fontSize: 9, color: '#666', display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <b>Términos y Condiciones:</b><br />{settings?.terms_and_conditions || 'Según normativa vigente.'}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <b>Notas:</b><br />{settings?.invoice_footer || 'Gracias por su compra.'}
        </div>
      </div>

      {/* CUFE */}
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #ccc', fontSize: 8, color: '#aaa', textAlign: 'center' }}>
        <div>Factura Electrónica de Venta — {settings?.company_name || 'Fitovida SAS'} — NIT: {settings?.nit}</div>
        <div>CUFE: {invoice.id}</div>
      </div>
    </div>
  );
}
