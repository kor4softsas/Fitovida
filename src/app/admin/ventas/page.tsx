'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Printer,
  X,
  User,
  Package,
  RotateCcw,
  Store
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import FacturaHTML from '@/components/admin/FacturaHTML';
import type { Sale, SaleItem } from '@/types/admin';
import { useAdminFeedback } from '@/components/admin/AdminFeedback';
import { getActiveLocations, getDefaultLocation, useLocations } from '@/lib/admin/location-store';

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  pse: 'PSE',
  wompi: 'Wompi',
};

// Producto de /api/admin/inventory con el stock del local de venta
type SaleProductRow = {
  product_id: number | string;
  name: string;
  price: number | string;
  current_stock: number;
  tax_rate: number | string;
  barcode?: string | null;
};

// Fecha local en formato YYYY-MM-DD (para filtros y comparación cronológica por texto)
const toYMD = (d: Date | string) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  // Modal HTML para impresión nativa en la misma página
  const [showFactura, setShowFactura] = useState(false);
  const [facturaSale, setFacturaSale] = useState<Sale | null>(null);
  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const { pushMessage } = useAdminFeedback();

  const readErrorMessage = async (response: Response, fallback: string) => {
    try {
      const raw = await response.text();
      if (!raw) {
        return fallback;
      }

      try {
        const parsed = JSON.parse(raw) as { error?: string; message?: string; detail?: string };
        if (typeof parsed.error === 'string' && parsed.error.trim()) {
          return parsed.error;
        }
        if (typeof parsed.message === 'string' && parsed.message.trim()) {
          return parsed.message;
        }
        if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
          return parsed.detail;
        }
      } catch {
        // Non-JSON response body.
      }

      return raw.length <= 180 ? raw : fallback;
    } catch {
      return fallback;
    }
  };
  const printFactura = (sale: Sale) => {
    setFacturaSale(sale);
    setShowFactura(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // El inventario se carga en el modal de nueva venta, según el local elegido
        const salesRes = await fetch('/api/admin/sales?limit=10000');

        if (salesRes.ok) {
          const data = await salesRes.json();
          const mappedSales = data.sales.map((s: any) => ({
            id: s.id,
            saleNumber: s.sale_number,
            date: new Date(s.created_at),
            customerName: s.customer_name,
            customerEmail: s.customer_email,
            customerPhone: s.customer_phone || '',
            customerDocument: s.customer_document || '',
            items: s.items || [],
            subtotal: s.subtotal || s.total,
            tax: s.tax || 0,
            discount: s.discount || 0,  
            total: s.total,
            paymentMethod: s.payment_method,
            status: s.status || 'completed',
            locationId: s.location_id ?? undefined,
            locationName: s.location_name ?? undefined,
            createdBy: 'admin',
            createdAt: new Date(s.created_at),
            updatedAt: new Date(s.created_at)
          }));
          setSales(mappedSales);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status: Sale['status']) => {
    const styles = {
      completed: 'bg-[#a0f4c8] text-[#002113]',
      pending: 'bg-amber-100 text-amber-900',
      cancelled: 'bg-[#ffdad6] text-[#93000a]'
    };
    const labels = {
      completed: 'Completada',
      pending: 'Pendiente',
      cancelled: 'Cancelada'
    };
    return (
      <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: Sale['paymentMethod']) => {
    const labels = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      pse: 'PSE',
      wompi: 'Wompi'
    };
    return labels[method];
  };

  const filteredSales = sales.filter(sale => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      sale.saleNumber.toLowerCase().includes(term) ||
      sale.customerName.toLowerCase().includes(term) ||
      (sale.customerDocument?.toLowerCase().includes(term) ?? false);
    if (!matchesSearch) return false;
    if (filterStatus && sale.status !== filterStatus) return false;
    if (filterPayment && sale.paymentMethod !== filterPayment) return false;
    const ymd = toYMD(sale.date);
    if (filterFrom && ymd < filterFrom) return false;
    if (filterTo && ymd > filterTo) return false;
    return true;
  });

  const activeFilterCount = [filterStatus, filterPayment, filterFrom, filterTo].filter(Boolean).length;

  const clearFilters = () => {
    setFilterStatus('');
    setFilterPayment('');
    setFilterFrom('');
    setFilterTo('');
  };

  // Exporta un consolidado a Excel basado en la estructura de la BD
  // (admin_sales → hoja "Ventas", admin_sale_items → hoja "Detalle productos").
  const handleExport = () => {
    if (filteredSales.length === 0) {
      pushMessage('No hay ventas para exportar con los filtros actuales.', 'warning');
      return;
    }
    try {
      setExporting(true);

      // Hoja 1: resumen por venta
      const resumen: Record<string, string | number>[] = filteredSales.map(s => ({
        'Número': s.saleNumber,
        'Fecha': toYMD(s.date),
        'Cliente': s.customerName,
        'Documento': s.customerDocument || '',
        'Email': s.customerEmail || '',
        'Teléfono': s.customerPhone || '',
        'Subtotal': Number(s.subtotal || 0),
        'IVA': Number(s.tax || 0),
        'Descuento': Number(s.discount || 0),
        'Total': Number(s.total || 0),
        'Método de pago': PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod,
        'Estado': STATUS_LABELS[s.status] ?? s.status,
        'Local': s.locationName || '',
        'Factura DIAN': s.invoiceNumber || '',
        'N° productos': s.items?.length ?? 0,
      }));

      // Fila de totales
      resumen.push({
        'Número': '', 'Fecha': '', 'Cliente': 'TOTALES', 'Documento': '', 'Email': '', 'Teléfono': '',
        'Subtotal': filteredSales.reduce((a, s) => a + Number(s.subtotal || 0), 0),
        'IVA': filteredSales.reduce((a, s) => a + Number(s.tax || 0), 0),
        'Descuento': filteredSales.reduce((a, s) => a + Number(s.discount || 0), 0),
        'Total': filteredSales.reduce((a, s) => a + Number(s.total || 0), 0),
        'Método de pago': '', 'Estado': '', 'Local': '', 'Factura DIAN': '',
        'N° productos': filteredSales.reduce((a, s) => a + (s.items?.length ?? 0), 0),
      });

      // Hoja 2: detalle por producto vendido
      const detalle = filteredSales.flatMap(s =>
        (s.items || []).map(it => ({
          'Número venta': s.saleNumber,
          'Fecha': toYMD(s.date),
          'Cliente': s.customerName,
          'Producto': it.productName,
          'Cantidad': Number(it.quantity || 0),
          'Precio unit.': Number(it.unitPrice || 0),
          'Descuento': Number(it.discount || 0),
          'IVA': Number(it.tax || 0),
          'Subtotal': Number(it.subtotal || 0),
          'Total': Number(it.total || 0),
        }))
      );

      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.json_to_sheet(resumen);
      ws1['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 24 }, { wch: 14 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, ws1, 'Ventas');

      if (detalle.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(detalle);
        ws2['!cols'] = [
          { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 30 }, { wch: 10 },
          { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, ws2, 'Detalle productos');
      }

      XLSX.writeFile(wb, `ventas-fitovida-${toYMD(new Date())}.xlsx`);
      pushMessage(`Exportadas ${filteredSales.length} ventas a Excel.`, 'success');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      pushMessage('Ocurrió un error al generar el Excel.', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#012d1d]">Ventas</h1>
          <p className="text-[#414844] font-medium">Gestión de ventas internas y registro</p>
        </div>
        <button
          onClick={() => setShowNewSaleModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#012d1d] text-white rounded-full font-bold hover:scale-[1.02] transition-transform shadow-lg"
        >
          <Plus size={20} />
          Nueva Venta
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#f2f4f3] rounded-[2.5rem] p-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#414844]/50" size={20} />
            <input
              type="text"
              placeholder="Buscar por número, cliente o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-full text-sm font-medium focus:ring-2 focus:ring-[#012d1d]/20 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-full shadow-sm transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-[#012d1d] text-white hover:bg-[#014028]'
                : 'bg-white text-[#012d1d] hover:bg-[#e1e3e2]'
            }`}
          >
            <Filter size={20} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a0f4c8] px-1.5 text-[11px] font-extrabold text-[#002113]">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || filteredSales.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#012d1d] font-bold text-sm rounded-full shadow-sm hover:bg-[#e1e3e2] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            title="Exportar consolidado a Excel"
          >
            <Download size={20} />
            {exporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="fv-modal-panel mt-6 grid grid-cols-1 gap-4 rounded-[1.5rem] bg-white p-6 shadow-sm md:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#414844]">Desde</label>
              <input
                type="date"
                value={filterFrom}
                max={filterTo || undefined}
                onChange={e => setFilterFrom(e.target.value)}
                className="w-full rounded-2xl border-none bg-[#f2f4f3] px-4 py-3 text-sm font-medium text-[#012d1d] focus:ring-2 focus:ring-[#012d1d]/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#414844]">Hasta</label>
              <input
                type="date"
                value={filterTo}
                min={filterFrom || undefined}
                onChange={e => setFilterTo(e.target.value)}
                className="w-full rounded-2xl border-none bg-[#f2f4f3] px-4 py-3 text-sm font-medium text-[#012d1d] focus:ring-2 focus:ring-[#012d1d]/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#414844]">Estado</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full cursor-pointer rounded-2xl border-none bg-[#f2f4f3] px-4 py-3 text-sm font-medium text-[#012d1d] focus:ring-2 focus:ring-[#012d1d]/20"
              >
                <option value="">Todos</option>
                <option value="completed">Completada</option>
                <option value="pending">Pendiente</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#414844]">Método de pago</label>
              <select
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
                className="w-full cursor-pointer rounded-2xl border-none bg-[#f2f4f3] px-4 py-3 text-sm font-medium text-[#012d1d] focus:ring-2 focus:ring-[#012d1d]/20"
              >
                <option value="">Todos</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="pse">PSE</option>
                <option value="wompi">Wompi</option>
              </select>
            </div>

            <div className="flex items-center justify-between md:col-span-4">
              <span className="text-sm font-medium text-[#414844]">
                {filteredSales.length} venta{filteredSales.length === 1 ? '' : 's'} coinciden
              </span>
              <button
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="flex items-center gap-2 rounded-full bg-[#f2f4f3] px-4 py-2 text-sm font-bold text-[#414844] transition-colors hover:bg-[#e1e3e2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-[#f2f4f3] rounded-[2.5rem] overflow-hidden p-8">
        <div className="overflow-x-auto bg-white rounded-3xl pb-2">
          <table className="w-full">
            <thead className="bg-[#e6e9e8] border-b border-[#d8dada]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#414844] uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#414844] uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#414844] uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#414844] uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#414844] uppercase tracking-wider">
                  Método de Pago
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#414844] uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#414844] uppercase tracking-wider">
                  Factura DIAN
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#414844] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#eceeed]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#414844] font-medium">
                    No se encontraron ventas
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#f8faf9] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-[#012d1d]">{sale.saleNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#414844]">
                      {new Date(sale.date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-bold text-[#012d1d]">{sale.customerName}</div>
                        <div className="text-[#414844] font-medium">{sale.customerDocument}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-extrabold text-[#012d1d]">{formatCurrency(sale.total)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#414844]">
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {sale.invoiceNumber ? (
                        <div>
                          <div className="font-bold text-[#012d1d]">{sale.invoiceNumber}</div>
                          <div className={`text-[10px] uppercase tracking-wider font-bold mt-1 ${
                            sale.invoiceStatus === 'authorized' ? 'text-[#005236]' :
                            sale.invoiceStatus === 'pending' ? 'text-amber-600' :
                            'text-[#ba1a1a]'
                          }`}>
                            {sale.invoiceStatus === 'authorized' ? 'Autorizada' :
                             sale.invoiceStatus === 'pending' ? 'Pendiente' : 'Rechazada'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#414844]/60 font-medium italic">Sin facturar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-2 bg-[#c1ecd4] rounded-full text-[#012d1d] hover:bg-[#a5d0b9] transition-all hover:scale-110"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="p-2 bg-[#cce6d0] rounded-full text-[#012d1d] hover:bg-[#b3cdb7] transition-all hover:scale-110"
                          title="Imprimir"
                          onClick={() => printFactura(sale)}
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onPrint={() => printFactura(selectedSale)}
        />
      )}
            {/* Modal HTML para impresión nativa */}
            {showFactura && facturaSale && (
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{background:'#fff',borderRadius:12,padding:24,boxShadow:'0 2px 16px #0002',maxWidth:700,width:'100%',maxHeight:'90vh',overflow:'auto',position:'relative'}}>
                  <button onClick={()=>setShowFactura(false)} style={{position:'absolute',top:12,right:12,fontSize:20,color:'#888',background:'none',border:'none',cursor:'pointer'}}>×</button>
                  <FacturaHTML sale={facturaSale} />
                </div>
              </div>
            )}
      {/* Eliminado modal PDF personalizado, solo impresión nativa */}

      {/* New Sale Modal */}
      {showNewSaleModal && (
        <NewSaleModal
          onClose={() => setShowNewSaleModal(false)}
          onSave={async (sale) => {
            try {
              // Preparar payload para el backend con snake_case
              const payload = {
                location_id: sale.locationId,
                customer_name: sale.customerName,
                customer_email: sale.customerEmail,
                customer_phone: sale.customerPhone,
                customer_document: sale.customerDocument,
                payment_method: sale.paymentMethod,
                subtotal: sale.subtotal,
                tax: sale.tax,
                discount: sale.discount,
                total: sale.total,
                notes: '',
                created_by: 'admin',
                items: sale.items.map(item => ({
                  product_id: parseInt(item.productId),
                  product_name: item.productName,
                  quantity: item.quantity,
                  unit_price: item.unitPrice,
                  discount: item.discount,
                  tax: item.tax,
                  subtotal: item.subtotal,
                  total: item.total
                }))
              };

              const response = await fetch('/api/admin/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!response.ok) {
                const message = await readErrorMessage(response, 'Error al guardar la venta');
                throw new Error(message);
              }

              await response.json();
              
              // Refetch para actualizar listado real desde BD
              // Simplemente recargamos la página o llamamos a fetchData de nuevo
              window.location.reload(); 
            } catch (error) {
              console.error('Error:', error);
              pushMessage(error instanceof Error ? error.message : 'Error al procesar la venta', 'error');
            }
          }}
        />
      )}
    </div>
  );
}

// Sale Detail Modal Component
function SaleDetailModal({ sale, onClose, onPrint }: { sale: Sale; onClose: () => void; onPrint: () => void }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#f2f4f3] rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8 border-b border-[#e1e3e2] flex items-center justify-between sticky top-0 bg-[#f2f4f3]/90 backdrop-blur-md z-10 rounded-t-[2.5rem]">
          <h2 className="text-2xl font-extrabold text-[#012d1d]">Detalle de Venta {sale.saleNumber}</h2>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-[#414844] hover:bg-[#e6e9e8] transition-all">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          {/* Customer Info */}
          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm">
            <h3 className="font-bold text-[#012d1d] mb-4 flex items-center gap-2">
               <User size={18} className="text-[#3f6653]" />
               Información del Cliente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#414844]">Nombre:</span>
                <span className="ml-2 font-bold text-[#012d1d]">{sale.customerName}</span>
              </div>
              <div>
                <span className="text-[#414844]">Documento:</span>
                <span className="ml-2 font-bold text-[#012d1d]">{sale.customerDocument}</span>
              </div>
              <div>
                <span className="text-[#414844]">Email:</span>
                <span className="ml-2 font-bold text-[#012d1d]">{sale.customerEmail}</span>
              </div>
              <div>
                <span className="text-[#414844]">Teléfono:</span>
                <span className="ml-2 font-bold text-[#012d1d]">{sale.customerPhone}</span>
              </div>
              {sale.locationName && (
                <div>
                  <span className="text-[#414844]">Local:</span>
                  <span className="ml-2 font-bold text-[#012d1d]">{sale.locationName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm">
            <h3 className="font-bold text-[#012d1d] mb-4 flex items-center gap-2">
               <Package size={18} className="text-[#3f6653]" />
               Productos
            </h3>
            <div className="rounded-xl overflow-hidden border border-[#e1e3e2]">
              <table className="w-full text-sm">
                <thead className="bg-[#e6e9e8]">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-[#414844]">Producto</th>
                    <th className="px-4 py-3 text-center font-bold text-[#414844]">Cant.</th>
                    <th className="px-4 py-3 text-right font-bold text-[#414844]">Precio Unit.</th>
                    <th className="px-4 py-3 text-right font-bold text-[#414844]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e3e2]">
                  {sale.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8faf9]">
                      <td className="px-4 py-3 font-medium text-[#012d1d]">{item.productName}</td>
                      <td className="px-4 py-3 text-center text-[#414844]">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-[#414844]">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#012d1d]">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="pt-4 flex justify-end">
            <div className="w-64 space-y-3 bg-white p-6 rounded-[1.5rem] shadow-sm text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#414844]">Subtotal:</span>
                <span className="font-bold text-[#012d1d]">{formatCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#414844]">IVA:</span>
                <span className="font-bold text-[#012d1d]">{formatCurrency(sale.tax)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between items-center text-[#005236]">
                  <span>Descuento:</span>
                  <span className="font-bold">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t border-[#e1e3e2] pt-3 text-[#012d1d]">
                <span>Total:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-[#e1e3e2] flex gap-4 justify-end rounded-b-[2.5rem] bg-[#f2f4f3]">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white rounded-full font-bold text-[#414844] hover:bg-[#e1e3e2] transition-colors shadow-sm"
          >
            Cerrar
          </button>
          <button
            className="px-6 py-3 bg-[#012d1d] text-white rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.02] shadow-lg transition-transform"
            onClick={onPrint}
          >
            <Printer size={18} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

// New Sale Modal Component
function NewSaleModal({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: (sale: Sale) => void;
}) {
  // Local de venta: el activo del panel, o el principal si se está viendo "Todos los locales"
  const { locations, schemaReady, loaded: locationsLoaded, selectedLocationId } = useLocations();
  const activeLocations = getActiveLocations(locations);
  const [saleLocationId, setSaleLocationId] = useState<number | null>(() =>
    typeof selectedLocationId === 'number' ? selectedLocationId : getDefaultLocation(locations)?.id ?? null
  );
  const [products, setProducts] = useState<SaleProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    // Si el modal se abrió antes de cargar los locales
    if (saleLocationId === null && schemaReady) {
      setSaleLocationId(getDefaultLocation(locations)?.id ?? null);
    }
  }, [saleLocationId, schemaReady, locations]);

  useEffect(() => {
    if (!locationsLoaded || (schemaReady && saleLocationId === null)) return;

    let active = true;
    setProductsLoading(true);
    setProductsError(null);
    fetch(`/api/admin/inventory${schemaReady && saleLocationId ? `?locationId=${saleLocationId}` : ''}`)
      .then((response) => {
        if (!response.ok) throw new Error('Error cargando inventario');
        return response.json();
      })
      .then((data) => {
        if (active) setProducts(data.products || []);
      })
      .catch(() => {
        if (active) setProductsError('No se pudo cargar el inventario del local.');
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [locationsLoaded, schemaReady, saleLocationId]);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const { pushMessage } = useAdminFeedback();

  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Enfocar automáticamente el input del código de barras al abrir
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  }, []);

  // Filtra el grid en vivo por código o nombre del producto
  const productQuery = barcodeInput.trim().toLowerCase();
  const filteredProducts = productQuery
    ? products.filter(p =>
        (p.name?.toLowerCase().includes(productQuery) ?? false) ||
        String(p.barcode ?? '').toLowerCase().includes(productQuery)
      )
    : products;

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Prioriza coincidencia exacta de código (lector físico);
    // si no hay, pero el grid quedó con un único resultado, agrega ese.
    const exact = products.find(p => String(p.barcode ?? '') === code);
    const target = exact ?? (filteredProducts.length === 1 ? filteredProducts[0] : null);

    if (!target) {
      pushMessage('Producto no encontrado. Revisa el código o el nombre.', 'warning');
      return;
    }
    if (target.current_stock <= 0) {
      pushMessage('Este producto no tiene stock disponible.', 'warning');
      return;
    }
    addItem(target.product_id);
    setBarcodeInput('');
  };

  const addItem = (productId: string | number) => {
    const product = products.find(p => p.product_id === productId);
    if (!product) return;

    const existingItem = selectedItems.find(item => item.productId === String(productId));
    if (existingItem) {
      if (existingItem.quantity >= product.current_stock) {
        pushMessage('Stock máximo alcanzado para este producto.', 'warning');
        return;
      }
      setSelectedItems(selectedItems.map(item => 
        item.productId === String(productId)
          ? { ...item, quantity: item.quantity + 1, subtotal: item.unitPrice * (item.quantity + 1), total: (item.unitPrice * (item.quantity + 1)) + ((item.unitPrice * (item.quantity + 1) * Number(product.tax_rate)) / 100), tax: ((item.unitPrice * (item.quantity + 1) * Number(product.tax_rate)) / 100) }
          : item
      ));
    } else {
      if (product.current_stock <= 0) {
        pushMessage('Producto sin stock.', 'warning');
        return;
      }
      const taxRate = Number(product.tax_rate) || 0;
      const price = Number(product.price);
      const taxAmount = (price * taxRate) / 100;

      const newItem: SaleItem = {
        id: `item-${Date.now()}`,
        productId: String(product.product_id),
        productName: product.name,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        tax: taxAmount,
        subtotal: price,
        total: price + taxAmount
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setSelectedItems(selectedItems.map(item => {
      if (item.id === itemId) {
        const subtotal = item.unitPrice * quantity;
        const tax = (subtotal * 19) / 100;
        return {
          ...item,
          quantity,
          subtotal,
          total: subtotal + tax
        };
      }
      return item;
    }));
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = selectedItems.reduce((sum, item) => sum + item.tax, 0);
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || selectedItems.length === 0) return;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      saleNumber: `V-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      date: new Date(),
      customerName,
      customerEmail,
      customerPhone,
      customerDocument,
      items: selectedItems,
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod,
      status: 'completed',
      locationId: saleLocationId ?? undefined,
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onSave(newSale);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#f2f4f3] rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8 border-b border-[#e1e3e2] flex items-center justify-between sticky top-0 bg-[#f2f4f3]/90 backdrop-blur-md z-10 rounded-t-[2.5rem]">
          <h2 className="text-2xl font-extrabold text-[#012d1d]">Nueva Venta</h2>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-[#414844] hover:bg-[#e6e9e8] transition-all">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Local de venta */}
          {schemaReady && activeLocations.length > 0 && (
            <div className="bg-white p-6 rounded-[1.5rem] shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-bold text-[#012d1d] flex items-center gap-2">
                  <Store size={18} className="text-[#3f6653]" />
                  Local de venta
                </h3>
                <p className="text-xs font-medium text-[#414844]">El stock se descuenta de este local.</p>
              </div>
              <select
                value={saleLocationId ?? ''}
                onChange={(e) => setSaleLocationId(Number(e.target.value))}
                className="md:w-72 px-4 py-3 bg-[#f2f4f3] border-none rounded-2xl focus:ring-2 focus:ring-[#012d1d]/20 transition-all font-bold text-[#012d1d] cursor-pointer"
              >
                {activeLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}{location.isDefault ? ' (principal)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Información del Cliente */}
          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm space-y-4">
            <h3 className="font-bold text-[#012d1d] flex items-center gap-2">
               <span className="material-symbols-outlined text-[#3f6653]">person_add</span>
               Información del Cliente
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#414844] uppercase tracking-wider mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f2f4f3] border-none rounded-2xl focus:ring-2 focus:ring-[#012d1d]/20 transition-all font-medium text-[#012d1d]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#414844] uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f2f4f3] border-none rounded-2xl focus:ring-2 focus:ring-[#012d1d]/20 transition-all font-medium text-[#012d1d]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#414844] uppercase tracking-wider mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f2f4f3] border-none rounded-2xl focus:ring-2 focus:ring-[#012d1d]/20 transition-all font-medium text-[#012d1d]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#414844] uppercase tracking-wider mb-2">Documento</label>
                <input
                  type="text"
                  value={customerDocument}
                  onChange={(e) => setCustomerDocument(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f2f4f3] border-none rounded-2xl focus:ring-2 focus:ring-[#012d1d]/20 transition-all font-medium text-[#012d1d]"
                />
              </div>
            </div>
          </div>

          {/* Productos y Lector de Código de Barras */}
          <div className="bg-white p-6 rounded-[1.5rem] shadow-sm space-y-6">
            <h3 className="font-bold text-[#012d1d] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#3f6653]">barcode_scanner</span>
              Productos
            </h3>
            
            {/* Buscador / Lector */}
            <div className="bg-[#f2f4f3] p-6 rounded-[1.5rem]">
              <label className="block text-xs font-bold text-[#414844] uppercase tracking-wider mb-2">Buscar por código o nombre (o escanea y presiona Enter)</label>
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeSubmit}
                  placeholder="Escanea, o escribe código o nombre del producto..."
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#c1ecd4] rounded-2xl focus:ring-2 focus:ring-[#012d1d]/20 focus:border-[#a0f4c8] text-lg font-bold text-[#012d1d] shadow-sm transition-all"
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#3f6653]">qr_code_scanner</span>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-[1.5rem] p-4 bg-[#f2f4f3] flex gap-3 flex-wrap">
              {productsLoading || productsError ? (
                <p className={`w-full py-6 text-center text-sm font-medium ${productsError ? 'text-[#93000a]' : 'text-[#414844]'}`}>
                  {productsError || 'Cargando productos del local...'}
                </p>
              ) : filteredProducts.length === 0 ? (
                <p className="w-full py-6 text-center text-sm font-medium text-[#414844]">
                  {productQuery
                    ? `No se encontraron productos para “${barcodeInput.trim()}”.`
                    : 'No hay productos en el inventario.'}
                </p>
              ) : (
                filteredProducts.map(product => (
                <button
                  key={`product-${product.product_id}`}
                  type="button"
                  onClick={() => addItem(product.product_id)}
                  disabled={product.current_stock <= 0}
                  className={`px-4 py-3 rounded-2xl text-sm text-left flex flex-col min-w-[160px] shadow-sm transition-transform active:scale-95
                    ${product.current_stock > 0 
                      ? 'bg-white hover:bg-[#c1ecd4] hover:scale-[1.02] border border-[#e1e3e2]/50' 
                      : 'bg-[#e6e9e8] opacity-60 cursor-not-allowed'}`}
                >
                  <span className="font-bold text-[#012d1d] truncate w-full">{product.name}</span>
                  <div className="flex justify-between items-center w-full mt-2">
                     <span className="text-[#005236] font-extrabold">{formatCurrency(Number(product.price))}</span>
                     <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${product.current_stock > 0 ? 'bg-[#a0f4c8] text-[#002113]' : 'bg-[#ffdad6] text-[#93000a]'}`}>
                       Stock: {product.current_stock}
                     </span>
                  </div>
                </button>
                ))
              )}
            </div>

            {selectedItems.length > 0 && (
              <div className="rounded-[1.5rem] overflow-hidden border border-[#e1e3e2]">
                <table className="w-full">
                  <thead className="bg-[#e6e9e8]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-[#414844] uppercase tracking-wider">Producto</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-[#414844] uppercase tracking-wider">Cant.</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[#414844] uppercase tracking-wider">P. Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-[#414844] uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-[#414844] uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e1e3e2]">
                    {selectedItems.map(item => (
                      <tr key={item.id} className="hover:bg-[#f8faf9]">
                        <td className="px-4 py-3 text-sm font-bold text-[#012d1d]">{item.productName}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border-none bg-[#f2f4f3] rounded-lg text-center font-bold focus:ring-2 focus:ring-[#012d1d]/20"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-[#414844]">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right text-sm font-extrabold text-[#012d1d]">{formatCurrency(item.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 min-h-0 bg-[#ffdad6] text-[#93000a] rounded-full hover:bg-[#ffb4ab] transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Método de Pago */}
            <div className="bg-white p-6 rounded-[1.5rem] shadow-sm">
              <label className="block text-xs font-bold text-[#414844] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3f6653]">payments</span>
                Método de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as Sale['paymentMethod'])}
                className="w-full px-4 py-3 bg-[#f2f4f3] border-none rounded-2xl focus:ring-2 focus:ring-[#012d1d]/20 transition-all font-bold text-[#012d1d] cursor-pointer"
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="pse">PSE</option>
                <option value="wompi">Wompi</option>
              </select>
            </div>

            {/* Totales */}
            {selectedItems.length > 0 && (
              <div className="bg-[#c1ecd4]/20 p-6 rounded-[1.5rem] border border-[#c1ecd4] space-y-3 flex flex-col justify-center">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-[#414844] font-medium">Subtotal:</span>
                  <span className="font-bold text-[#012d1d]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-[#414844] font-medium">IVA (19%):</span>
                  <span className="font-bold text-[#012d1d]">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-xl font-extrabold border-t border-[#a0f4c8] pt-3 text-[#012d1d]">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-[#e1e3e2] flex gap-4 justify-end rounded-b-[2.5rem] bg-[#f2f4f3] -mx-8 -mb-8 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white rounded-full font-bold text-[#414844] hover:bg-[#e1e3e2] transition-colors shadow-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={!customerName || selectedItems.length === 0}
              className="px-6 py-3 bg-[#012d1d] text-white rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.02] shadow-lg transition-transform disabled:bg-[#d8dada] disabled:text-[#717973] disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
            >
              Guardar Venta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
