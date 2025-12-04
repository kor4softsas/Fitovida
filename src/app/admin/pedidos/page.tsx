'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  Eye,
  MoreVertical,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar
} from 'lucide-react';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
  shippingAddress: string;
}

// Datos de ejemplo
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customerName: 'María González',
    customerEmail: 'maria@gmail.com',
    customerPhone: '3001234567',
    status: 'pending',
    total: 125000,
    items: [
      { id: '1', productName: 'Vitamina C 1000mg', quantity: 2, price: 45000 },
      { id: '2', productName: 'Omega 3', quantity: 1, price: 35000 },
    ],
    createdAt: '2024-01-15T10:30:00',
    shippingAddress: 'Calle 123 #45-67, Bogotá',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customerName: 'Carlos Rodríguez',
    customerEmail: 'carlos@gmail.com',
    customerPhone: '3009876543',
    status: 'processing',
    total: 89500,
    items: [
      { id: '3', productName: 'Proteína Vegana', quantity: 1, price: 89500 },
    ],
    createdAt: '2024-01-15T09:15:00',
    shippingAddress: 'Carrera 50 #30-20, Medellín',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    customerName: 'Ana Martínez',
    customerEmail: 'ana@gmail.com',
    customerPhone: '3005551234',
    status: 'shipped',
    total: 234000,
    items: [
      { id: '4', productName: 'Colágeno Hidrolizado', quantity: 3, price: 78000 },
    ],
    createdAt: '2024-01-14T16:45:00',
    shippingAddress: 'Avenida 68 #12-34, Cali',
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-004',
    customerName: 'Pedro López',
    customerEmail: 'pedro@gmail.com',
    customerPhone: '3007778899',
    status: 'delivered',
    total: 67800,
    items: [
      { id: '5', productName: 'Té Verde Orgánico', quantity: 2, price: 33900 },
    ],
    createdAt: '2024-01-14T11:20:00',
    shippingAddress: 'Calle 80 #55-10, Barranquilla',
  },
  {
    id: '5',
    orderNumber: 'ORD-2024-005',
    customerName: 'Laura Sánchez',
    customerEmail: 'laura@gmail.com',
    customerPhone: '3002223344',
    status: 'cancelled',
    total: 156000,
    items: [
      { id: '6', productName: 'Multivitamínico', quantity: 2, price: 78000 },
    ],
    createdAt: '2024-01-13T14:00:00',
    shippingAddress: 'Carrera 15 #100-50, Bogotá',
  },
];

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmado', bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
  processing: { label: 'Procesando', bg: 'bg-indigo-100', text: 'text-indigo-800', icon: Package },
  shipped: { label: 'Enviado', bg: 'bg-purple-100', text: 'text-purple-800', icon: Truck },
  delivered: { label: 'Entregado', bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState<Order | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders(mockOrders);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const matchesDate = !dateFilter || order.createdAt.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (orderToUpdate) {
      setOrders(prev => 
        prev.map(o => 
          o.id === orderToUpdate.id ? { ...o, status: newStatus } : o
        )
      );
      setShowStatusModal(false);
      setOrderToUpdate(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-600 mt-1">Administra y da seguimiento a los pedidos</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-5 h-5" />
          Exportar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = orders.filter(o => o.status === status).length;
          const StatusIcon = config.icon;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status as OrderStatus)}
              className={`p-4 rounded-xl border transition-all ${
                statusFilter === status 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center mb-2`}>
                <StatusIcon className={`w-4 h-4 ${config.text}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-600">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de pedido, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Todos los estados</option>
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="px-3 py-2 text-sm text-green-600 hover:text-green-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.map((order) => {
                const status = statusConfig[order.status];
                const StatusIcon = status.icon;
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{order.items.length} producto(s)</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === order.id ? null : order.id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        
                        {openMenuId === order.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Eye className="w-4 h-4" />
                                  Ver detalles
                                </button>
                                <button
                                  onClick={() => {
                                    setOrderToUpdate(order);
                                    setShowStatusModal(true);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Package className="w-4 h-4" />
                                  Cambiar estado
                                </button>
                              </div>
                            </div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length} pedidos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Pedido {selectedOrder.orderNumber}
                </h3>
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].text}`}>
                  {statusConfig[selectedOrder.status].label}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Cliente</h4>
                  <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                  <p className="text-gray-600">{selectedOrder.customerEmail}</p>
                  <p className="text-gray-600">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Dirección de envío</h4>
                  <p className="text-gray-900">{selectedOrder.shippingAddress}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Productos</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Cantidad</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Precio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-right font-medium text-gray-900">Total:</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(selectedOrder.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setOrderToUpdate(selectedOrder);
                    setShowStatusModal(true);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Cambiar estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && orderToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowStatusModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actualizar estado del pedido
            </h3>
            <p className="text-gray-600 mb-4">
              Pedido: <strong>{orderToUpdate.orderNumber}</strong>
            </p>
            <div className="space-y-2">
              {Object.entries(statusConfig).map(([status, config]) => {
                const StatusIcon = config.icon;
                return (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status as OrderStatus)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      orderToUpdate.status === status
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                      <StatusIcon className={`w-4 h-4 ${config.text}`} />
                    </div>
                    <span className="font-medium text-gray-900">{config.label}</span>
                    {orderToUpdate.status === status && (
                      <span className="ml-auto text-green-600 text-sm">Actual</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
