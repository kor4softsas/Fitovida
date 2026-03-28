'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Eye,
  X,
  Clock,
  Loader2,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  paid: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700', icon: CreditCard },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const paymentMethodLabels = {
  card: 'Tarjeta',
  pse: 'PSE',
  transfer: 'Transferencia',
  cash_on_delivery: 'Efectivo contra entrega',
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await fetch('/api/admin/pedidos');
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        setApiError(data.detail || data.error || 'Error desconocido al cargar pedidos');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      setApiError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Number(value));
  };

  const getStatusBadge = (status: keyof typeof statusConfig) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 w-max ${config.color}`}>
        <Icon className={status === 'processing' ? 'animate-spin h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
        {config.label}
      </span>
    );
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/pedidos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      if (res.ok) {
        // Refrescar lista abierta
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        await fetchOrders();
      } else {
        alert('Error al actualizar el estado');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const filteredOrders = orders.filter(o =>
    (o.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos de Clientes</h1>
          <p className="text-gray-600 mt-1">Gestión de órdenes realizadas desde la web</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Actualizar
        </button>
      </div>

      {/* Error Banner */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Error al cargar pedidos:</strong> {apiError}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por número, cliente o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-gray-500">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {paymentMethodLabels[order.payment_method as keyof typeof paymentMethodLabels] || order.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status as keyof typeof statusConfig)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Ver detalles"
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalles */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Pedido {selectedOrder.order_number}</h2>
                <p className="text-sm text-gray-500">{new Date(selectedOrder.created_at).toLocaleString('es-CO')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Estado Actual</h3>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status as keyof typeof statusConfig)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Actualizar Estado</h3>
                  <select
                    className="border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="processing">Procesando</option>
                    <option value="paid">Pagado</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="failed">Fallido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 border-b pb-2">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Nombre:</span> <span className="font-medium">{selectedOrder.customer_name}</span></p>
                    <p><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedOrder.customer_email}</span></p>
                    <p><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{selectedOrder.customer_phone}</span></p>
                    <p><span className="text-gray-500">Pago:</span> <span className="font-medium">{paymentMethodLabels[selectedOrder.payment_method as keyof typeof paymentMethodLabels] || selectedOrder.payment_method}</span></p>
                    {selectedOrder.payment_id && <p><span className="text-gray-500">ID Transacción:</span> <span className="font-medium">{selectedOrder.payment_id}</span></p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 border-b pb-2">Información de Envío</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Dirección:</span> <span className="font-medium">{selectedOrder.shipping_address}</span></p>
                    <p><span className="text-gray-500">Ciudad:</span> <span className="font-medium">{selectedOrder.shipping_city}, {selectedOrder.shipping_department}</span></p>
                    <p><span className="text-gray-500">Código Postal:</span> <span className="font-medium">{selectedOrder.shipping_zip}</span></p>
                    {selectedOrder.notes && (
                      <div className="mt-2 p-3 bg-yellow-50 rounded text-yellow-800 text-xs">
                        <strong>Notas:</strong> {selectedOrder.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-500 font-medium">Producto</th>
                        <th className="px-4 py-2 text-center text-gray-500 font-medium">Cant.</th>
                        <th className="px-4 py-2 text-right text-gray-500 font-medium">Precio Unit.</th>
                        <th className="px-4 py-2 text-right text-gray-500 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 flex items-center gap-3">
                            {item.product_image ? (
                              <div className="relative w-10 h-10 rounded overflow-hidden">
                                <Image src={item.product_image} alt={item.product_name} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Sin img</span>
                              </div>
                            )}
                            <span className="font-medium text-gray-900">{item.product_name}</span>
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Envío:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                  {Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Descuento {selectedOrder.discount_code && `(${selectedOrder.discount_code})`}:</span>
                      <span className="font-medium">-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 text-gray-900">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
