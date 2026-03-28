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
      case 'issued': return 'bg-[#cce6d0] text-[#506856]';
      case 'paid': return 'bg-[#a0f4c8] text-[#005236]';
      case 'draft': return 'bg-[#e6e9e8] text-[#414844]';
      case 'cancelled': return 'bg-[#ffdad6] text-[#93000a]';
      default: return 'bg-[#e6e9e8] text-[#414844]';
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
      <div className="sticky top-0 z-10 border-b border-[#e6e9e8] bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-[#012d1d]">
              <FileText className="text-[#005236]" size={32} />
              Facturación
            </h1>
            <p className="mt-1 font-medium text-[#414844]">Gestión de facturas electrónicas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 rounded-[2rem] bg-[#f2f4f3] p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]" size={18} />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-[#e6e9e8] bg-white py-2 pl-10 pr-4 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
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
          <div className="flex h-64 items-center justify-center text-[#414844]">Cargando facturas...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center text-[#414844]">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-bold text-[#012d1d]">No hay facturas registradas</p>
            <p className="text-sm mt-1">Las facturas se generan automáticamente al registrar una venta</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2.5rem] bg-[#f2f4f3]">
            <table className="w-full">
              <thead className="border-b border-[#d9ddd9] bg-[#e6e9e8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider text-[#414844]">N° Factura</th>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider text-[#414844]">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider text-[#414844]">Fecha</th>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider text-[#414844]">Total</th>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider text-[#414844]">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider text-[#414844]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e9e8] bg-white">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="transition hover:bg-[#f8faf9]">
                    <td className="px-6 py-4 text-sm font-bold text-[#005236]">{invoice.number}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#012d1d]">{invoice.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-[#414844]">
                      {new Date(invoice.issued_date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#012d1d]">{fmt(Number(invoice.total))}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="rounded-full p-2 text-[#005236] transition hover:bg-[#cce6d0]"
                        title="Ver factura"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => { setSelectedInvoice(invoice); setTimeout(handlePrint, 300); }}
                        className="rounded-full p-2 text-[#005236] transition hover:bg-[#a0f4c8]"
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
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-[1.5rem] bg-[#f2f4f3] p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Total Facturas</p>
              <p className="text-2xl font-extrabold text-[#012d1d]">{filteredInvoices.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#f2f4f3] p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Pagadas</p>
              <p className="text-2xl font-extrabold text-[#005236]">{filteredInvoices.filter((f) => f.status === 'paid').length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#f2f4f3] p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Emitidas</p>
              <p className="text-2xl font-extrabold text-[#506856]">{filteredInvoices.filter((f) => f.status === 'issued').length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#f2f4f3] p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Ingresos Total</p>
              <p className="text-2xl font-extrabold text-[#012d1d]">{fmt(filteredInvoices.reduce((s, f) => s + Number(f.total), 0))}</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL VISTA PREVIA ===== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-2xl rounded-[2.5rem] bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#e6e9e8] p-6">
              <h2 className="text-lg font-bold text-[#012d1d]">
                Factura {selectedInvoice.number}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-full bg-[#005236] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#003d2d]"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-full p-2 text-[#414844] transition hover:bg-[#f2f4f3]"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Vista previa de la factura */}
            <div className="max-h-[80vh] overflow-auto p-4">
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
