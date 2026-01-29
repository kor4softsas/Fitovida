'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  Eye,
  Printer,
  X
} from 'lucide-react';
import type { Sale, SaleItem } from '@/types/admin';

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    // TODO: Cargar ventas desde la API
    // Datos de ejemplo
    const mockSales: Sale[] = [
      {
        id: '1',
        saleNumber: 'V-2026-001',
        date: new Date(),
        customerName: 'Juan Pérez',
        customerEmail: 'juan@example.com',
        customerPhone: '+57 300 123 4567',
        customerDocument: '1234567890',
        items: [
          {
            id: '1',
            productId: 'prod-1',
            productName: 'Proteína Whey 2kg',
            quantity: 2,
            unitPrice: 150000,
            discount: 0,
            tax: 57000,
            subtotal: 300000,
            total: 357000
          }
        ],
        subtotal: 300000,
        tax: 57000,
        discount: 0,
        total: 357000,
        paymentMethod: 'card',
        status: 'completed',
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    setSales(mockSales);
    setLoading(false);
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
      completed: 'bg-emerald-100 text-emerald-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      completed: 'Completada',
      pending: 'Pendiente',
      cancelled: 'Cancelada'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
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

  const filteredSales = sales.filter(sale =>
    sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerDocument?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600 mt-1">Gestión de ventas internas y registro</p>
        </div>
        <button
          onClick={() => setShowNewSaleModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          Nueva Venta
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por número, cliente o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={20} />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={20} />
            Exportar
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factura DIAN
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron ventas
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{sale.saleNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{sale.customerName}</div>
                        <div className="text-gray-500">{sale.customerDocument}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{formatCurrency(sale.total)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sale.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {sale.invoiceNumber ? (
                        <div>
                          <div className="font-medium text-gray-900">{sale.invoiceNumber}</div>
                          <div className={`text-xs ${
                            sale.invoiceStatus === 'authorized' ? 'text-emerald-600' :
                            sale.invoiceStatus === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {sale.invoiceStatus === 'authorized' ? 'Autorizada' :
                             sale.invoiceStatus === 'pending' ? 'Pendiente' : 'Rechazada'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin facturar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="text-emerald-600 hover:text-emerald-900"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Imprimir"
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
        />
      )}

      {/* New Sale Modal */}
      {showNewSaleModal && (
        <NewSaleModal onClose={() => setShowNewSaleModal(false)} />
      )}
    </div>
  );
}

// Sale Detail Modal Component
function SaleDetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Detalle de Venta {sale.saleNumber}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <span className="ml-2 font-medium">{sale.customerName}</span>
              </div>
              <div>
                <span className="text-gray-600">Documento:</span>
                <span className="ml-2 font-medium">{sale.customerDocument}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{sale.customerEmail}</span>
              </div>
              <div>
                <span className="text-gray-600">Teléfono:</span>
                <span className="ml-2 font-medium">{sale.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Producto</th>
                    <th className="px-4 py-2 text-center">Cant.</th>
                    <th className="px-4 py-2 text-right">Precio Unit.</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA:</span>
                  <span className="font-medium">{formatCurrency(sale.tax)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Descuento:</span>
                    <span className="font-medium">-{formatCurrency(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Printer size={18} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

// New Sale Modal Component (placeholder)
function NewSaleModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Nueva Venta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600">Formulario de nueva venta en desarrollo...</p>
          {/* TODO: Implementar formulario completo de nueva venta */}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Guardar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
