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
  pending: { label: 'Pendiente', color: 'bg-amber-50 text-amber-900', icon: Clock },
  processing: { label: 'Procesando', color: 'bg-blue-50 text-blue-900', icon: Loader2 },
  paid: { label: 'Pagado', color: 'bg-[#a0f4c8] text-[#005236]', icon: CreditCard },
  shipped: { label: 'Enviado', color: 'bg-cyan-50 text-cyan-900', icon: Truck },
  delivered: { label: 'Entregado', color: 'bg-[#a0f4c8] text-[#005236]', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-900', icon: XCircle },
  failed: { label: 'Fallido', color: 'bg-red-50 text-red-900', icon: AlertCircle },
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005236]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-extrabold tracking-tight text-[#012d1d]">Pedidos de Clientes</h2>
        <p className="text-[#414844] font-medium">
          Gestión de órdenes realizadas desde la web
        </p>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 border border-[#e6e9e8] rounded-full bg-white hover:bg-[#f2f4f3] transition-colors text-sm font-bold text-[#414844]"
        >
          Actualizar
        </button>
      </div>

      {/* Error Banner */}
      {apiError && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a] rounded-[1.5rem] p-4 text-[#93000a] text-sm font-bold">
          <strong>Error al cargar pedidos:</strong> {apiError}
        </div>
      )}

      <div className="bg-[#f2f4f3] rounded-[3rem] p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#414844]" size={20} />
            <input
              type="text"
              placeholder="Buscar por número, cliente o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#e6e9e8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#005236] focus:border-transparent text-[#012d1d] placeholder-[#414844]"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#f2f4f3] rounded-[3rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#e6e9e8] border-b border-[#d9ddd9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-[#414844] uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e6e9e8]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#414844]">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f2f4f3]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-[#012d1d]">{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#414844]">
                      {new Date(order.created_at).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-bold text-[#012d1d]">{order.customer_name}</div>
                        <div className="text-[#414844]">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-[#012d1d]">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#414844]">
                      {paymentMethodLabels[order.payment_method as keyof typeof paymentMethodLabels] || order.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status as keyof typeof statusConfig)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[#005236] hover:text-[#003d2d]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2.5rem] bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e6e9e8] bg-white p-8">
              <div>
                <h2 className="text-xl font-bold text-[#012d1d]">Pedido {selectedOrder.order_number}</h2>
                <p className="text-sm text-[#414844]">{new Date(selectedOrder.created_at).toLocaleString('es-CO')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[#414844] transition-colors hover:text-[#012d1d]">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 p-8">
              <div className="flex items-center justify-between rounded-[1.5rem] border border-[#e6e9e8] bg-[#f2f4f3] p-6">
                <div>
                  <h3 className="mb-1 text-sm font-bold text-[#414844]">Estado Actual</h3>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status as keyof typeof statusConfig)}</div>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-bold text-[#414844]">Actualizar Estado</h3>
                  <select
                    className="rounded-full border border-[#e6e9e8] p-2 text-sm text-[#012d1d] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#005236]"
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

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 border-b border-[#e6e9e8] pb-2 font-bold text-[#012d1d]">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#414844]">Nombre:</span> <span className="font-bold text-[#012d1d]">{selectedOrder.customer_name}</span></p>
                    <p><span className="text-[#414844]">Email:</span> <span className="font-bold text-[#012d1d]">{selectedOrder.customer_email}</span></p>
                    <p><span className="text-[#414844]">Teléfono:</span> <span className="font-bold text-[#012d1d]">{selectedOrder.customer_phone}</span></p>
                    <p><span className="text-[#414844]">Pago:</span> <span className="font-bold text-[#012d1d]">{paymentMethodLabels[selectedOrder.payment_method as keyof typeof paymentMethodLabels] || selectedOrder.payment_method}</span></p>
                    {selectedOrder.payment_id && (
                      <p><span className="text-[#414844]">ID Transacción:</span> <span className="font-bold text-[#012d1d]">{selectedOrder.payment_id}</span></p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 border-b border-[#e6e9e8] pb-2 font-bold text-[#012d1d]">Información de Envío</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-[#414844]">Dirección:</span> <span className="font-bold text-[#012d1d]">{selectedOrder.shipping_address}</span></p>
                    <p><span className="text-[#414844]">Ciudad:</span> <span className="font-bold text-[#012d1d]">{selectedOrder.shipping_city}, {selectedOrder.shipping_department}</span></p>
                    <p><span className="text-[#414844]">Código Postal:</span> <span className="font-bold text-[#012d1d]">{selectedOrder.shipping_zip}</span></p>
                    {selectedOrder.notes && (
                      <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
                        <strong>Notas:</strong> {selectedOrder.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-bold text-[#012d1d]">Productos</h3>
                <div className="overflow-hidden rounded-[1.5rem] border border-[#e6e9e8] bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f2f4f3]">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold text-[#414844]">Producto</th>
                        <th className="px-4 py-2 text-center font-bold text-[#414844]">Cant.</th>
                        <th className="px-4 py-2 text-right font-bold text-[#414844]">Precio Unit.</th>
                        <th className="px-4 py-2 text-right font-bold text-[#414844]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e9e8]">
                      {selectedOrder.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="flex items-center gap-3 px-4 py-3">
                            {item.product_image ? (
                              <div className="relative h-10 w-10 overflow-hidden rounded">
                                <Image src={item.product_image} alt={item.product_name} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-[#e6e9e8]">
                                <span className="text-xs text-[#414844]">Sin img</span>
                              </div>
                            )}
                            <span className="font-bold text-[#012d1d]">{item.product_name}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-[#012d1d]">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-[#012d1d]">{formatCurrency(item.price)}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#012d1d]">{formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end border-t border-[#e6e9e8] pt-4">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#414844]">Subtotal:</span>
                    <span className="font-bold text-[#012d1d]">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#414844]">Envío:</span>
                    <span className="font-bold text-[#012d1d]">{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                  {Number(selectedOrder.discount) > 0 && (
                    <div className="flex justify-between font-bold text-[#005236]">
                      <span>Descuento {selectedOrder.discount_code && `(${selectedOrder.discount_code})`}:</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#e6e9e8] pt-2 text-lg font-bold text-[#012d1d]">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#e6e9e8] p-8">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full bg-[#f2f4f3] px-6 py-2 font-bold text-[#414844] transition-colors hover:bg-[#e6e9e8]"
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
