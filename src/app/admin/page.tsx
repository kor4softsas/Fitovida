'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingCart, 
  Package, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Barcode,
  Activity,
  Calendar,
  MoreHorizontal,
  Eye,
  Plus,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useAdminAuthStore } from '@/lib/adminAuth';

// Datos de ejemplo para el dashboard
const mockStats = {
  totalUsers: 1250,
  usersChange: 12.5,
  totalOrders: 856,
  ordersChange: 8.3,
  totalProducts: 324,
  lowStockProducts: 15,
  totalRevenue: 45678900,
  revenueChange: 15.2,
  pendingOrders: 23,
  todayOrders: 12,
};

const mockRecentOrders = [
  { id: 'ORD-001', customer: 'María González', email: 'maria@email.com', total: 125000, status: 'pending', date: '2024-01-15', items: 3 },
  { id: 'ORD-002', customer: 'Carlos Rodríguez', email: 'carlos@email.com', total: 89500, status: 'processing', date: '2024-01-15', items: 2 },
  { id: 'ORD-003', customer: 'Ana Martínez', email: 'ana@email.com', total: 234000, status: 'shipped', date: '2024-01-14', items: 5 },
  { id: 'ORD-004', customer: 'Pedro López', email: 'pedro@email.com', total: 67800, status: 'delivered', date: '2024-01-14', items: 1 },
  { id: 'ORD-005', customer: 'Laura Sánchez', email: 'laura@email.com', total: 156000, status: 'pending', date: '2024-01-13', items: 4 },
];

const mockLowStockProducts = [
  { id: 1, name: 'Vitamina C 1000mg', sku: 'VIT-C-1000', stock: 5, minStock: 20, image: '💊' },
  { id: 2, name: 'Omega 3 Fish Oil', sku: 'OMG-3-FO', stock: 8, minStock: 25, image: '🐟' },
  { id: 3, name: 'Proteína Vegana', sku: 'PRO-VEG-01', stock: 3, minStock: 15, image: '🌱' },
  { id: 4, name: 'Colágeno Hidrolizado', sku: 'COL-HID-01', stock: 10, minStock: 30, image: '✨' },
];

const mockTopProducts = [
  { id: 1, name: 'Vitamina D3 5000 IU', sales: 156, revenue: 7020000, trend: 23 },
  { id: 2, name: 'Magnesio Citrato', sales: 134, revenue: 5360000, trend: 15 },
  { id: 3, name: 'Zinc + Vitamina C', sales: 98, revenue: 3920000, trend: -5 },
  { id: 4, name: 'Probióticos 50B', sales: 87, revenue: 6960000, trend: 32 },
];

const statusConfig: Record<string, { bg: string; text: string; dot: string; icon: typeof CheckCircle }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', icon: Clock },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: RefreshCw },
  shipped: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', icon: Package },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', icon: AlertCircle },
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAdminAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin border-t-green-600"></div>
          <Sparkles className="w-6 h-6 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-2xl p-6 lg:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-green-100 text-sm font-medium">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold mt-1">
                ¡Hola, {user?.firstName || 'Admin'}! 👋
              </h1>
              <p className="text-green-100 mt-2 max-w-lg">
                Aquí tienes un resumen de lo que está pasando en tu tienda hoy.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/productos/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 rounded-xl font-medium hover:bg-green-50 transition-all shadow-lg shadow-green-900/20"
              >
                <Plus className="w-5 h-5" />
                Nuevo producto
              </Link>
              <Link
                href="/admin/pedidos"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-all backdrop-blur-sm"
              >
                <Eye className="w-5 h-5" />
                Ver pedidos
              </Link>
            </div>
          </div>
          
          {/* Quick stats in header */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-100 text-sm">
                <Calendar className="w-4 h-4" />
                Pedidos hoy
              </div>
              <p className="text-2xl font-bold mt-1">{mockStats.todayOrders}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-100 text-sm">
                <Clock className="w-4 h-4" />
                Pendientes
              </div>
              <p className="text-2xl font-bold mt-1">{mockStats.pendingOrders}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-100 text-sm">
                <AlertCircle className="w-4 h-4" />
                Bajo stock
              </div>
              <p className="text-2xl font-bold mt-1">{mockStats.lowStockProducts}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-100 text-sm">
                <Activity className="w-4 h-4" />
                Activos
              </div>
              <p className="text-2xl font-bold mt-1">{mockStats.totalProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              mockStats.usersChange >= 0 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {mockStats.usersChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(mockStats.usersChange)}%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">{mockStats.totalUsers.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Usuarios registrados</p>
          </div>
          <Link href="/admin/usuarios" className="mt-4 flex items-center gap-1 text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver usuarios <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Orders */}
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              mockStats.ordersChange >= 0 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {mockStats.ordersChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(mockStats.ordersChange)}%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">{mockStats.totalOrders.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Pedidos totales</p>
          </div>
          <Link href="/admin/pedidos" className="mt-4 flex items-center gap-1 text-sm text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver pedidos <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Products */}
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-violet-200 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Package className="w-7 h-7 text-white" />
            </div>
            {mockStats.lowStockProducts > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                <AlertCircle className="w-3 h-3" />
                {mockStats.lowStockProducts} alertas
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">{mockStats.totalProducts.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Productos activos</p>
          </div>
          <Link href="/admin/productos" className="mt-4 flex items-center gap-1 text-sm text-violet-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver productos <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Revenue */}
        <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              mockStats.revenueChange >= 0 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {mockStats.revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(mockStats.revenueChange)}%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">{formatCompactCurrency(mockStats.totalRevenue)}</p>
            <p className="text-sm text-gray-500 mt-1">Ingresos del mes</p>
          </div>
          <Link href="/admin/costos" className="mt-4 flex items-center gap-1 text-sm text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver costos <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent orders - takes 2 columns */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-900">Pedidos recientes</h2>
              <p className="text-sm text-gray-500 mt-0.5">Últimos pedidos realizados</p>
            </div>
            <Link 
              href="/admin/pedidos"
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Pedido</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Cliente</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Items</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Total</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockRecentOrders.map((order) => {
                  const status = statusConfig[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">{order.id}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{order.customer}</p>
                          <p className="text-sm text-gray-500">{order.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                          {order.items}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-gray-900">{formatCurrency(order.total)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock alert */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-900">Stock bajo</h2>
              <p className="text-sm text-gray-500 mt-0.5">Productos que necesitan reposición</p>
            </div>
            <Link 
              href="/admin/inventario"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {mockLowStockProducts.map((product) => {
              const percentage = (product.stock / product.minStock) * 100;
              const isVeryLow = product.stock <= 5;
              
              return (
                <div key={product.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                      {product.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isVeryLow ? 'text-red-600' : 'text-amber-600'}`}>
                        {product.stock}
                      </p>
                      <p className="text-xs text-gray-500">de {product.minStock}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${isVeryLow ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 bg-gray-50/50 border-t border-gray-100">
            <Link 
              href="/admin/inventario"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
            >
              Ver todo el inventario
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-900">Productos más vendidos</h2>
              <p className="text-sm text-gray-500 mt-0.5">Este mes</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {mockTopProducts.map((product, index) => (
              <div key={product.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} ventas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCompactCurrency(product.revenue)}</p>
                    <div className={`flex items-center justify-end gap-1 text-xs font-medium ${
                      product.trend >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {product.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(product.trend)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Acciones rápidas</h2>
          <p className="text-sm text-gray-500 mb-5">Accede rápidamente a las funciones más usadas</p>
          
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/usuarios/nuevo"
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nuevo usuario</p>
                <p className="text-xs text-gray-500">Agregar cliente</p>
              </div>
            </Link>
            
            <Link
              href="/admin/productos/nuevo"
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all group"
            >
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                <Barcode className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nuevo producto</p>
                <p className="text-xs text-gray-500">Con código de barras</p>
              </div>
            </Link>
            
            <Link
              href="/admin/inventario"
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Ajustar stock</p>
                <p className="text-xs text-gray-500">Inventario</p>
              </div>
            </Link>
            
            <Link
              href="/admin/costos"
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Ver costos</p>
                <p className="text-xs text-gray-500">Márgenes y precios</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
