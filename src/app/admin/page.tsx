'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  DollarSign,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import type { DashboardStats } from '@/types/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    sales: { today: 0, week: 0, month: 0, year: 0 },
    inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 },
    finances: { totalIncome: 0, totalExpenses: 0, balance: 0, pendingPayments: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        
        const data = await response.json();
        
        setStats({
          sales: {
            today: data.sales.today || 0,
            week: data.sales.week || 0,
            month: data.sales.month || 0,
            year: data.sales.year || 0
          },
          inventory: {
            totalProducts: data.inventory.total_products || 0,
            lowStock: data.inventory.low_stock || 0,
            outOfStock: data.inventory.out_of_stock || 0,
            totalValue: data.inventory.total_value || 0
          },
          finances: {
            totalIncome: data.finances.total_income || 0,
            totalExpenses: data.finances.total_expenses || 0,
            balance: data.finances.balance || 0,
            pendingPayments: data.orders.pending || 0
          }
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // Mantener con valores por defecto si hay error
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('es-CO', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas de Hoy */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.sales.today)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <ShoppingCart className="text-emerald-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="text-emerald-600 mr-1" size={16} />
            <span className="text-emerald-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-2">vs ayer</span>
          </div>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.sales.month)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="text-blue-600 mr-1" size={16} />
            <span className="text-blue-600 font-medium">+8%</span>
            <span className="text-gray-500 ml-2">vs mes anterior</span>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Balance Mensual</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.finances.balance)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div>Ingresos: {formatCurrency(stats.finances.totalIncome)}</div>
            <div>Gastos: {formatCurrency(stats.finances.totalExpenses)}</div>
          </div>
        </div>

        {/* Inventario */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.inventory.totalProducts}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <AlertTriangle className="text-orange-600 mr-1" size={16} />
            <span className="text-orange-600 font-medium">
              {stats.inventory.lowStock} bajo stock
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas Recientes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/admin/ventas?action=new"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="text-emerald-600" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Registrar Venta</h3>
                  <p className="text-sm text-gray-600">Crear nueva venta manual</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/inventario?action=entry"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="text-blue-600" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Entrada de Inventario</h3>
                  <p className="text-sm text-gray-600">Registrar compra de productos</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/finanzas?action=expense"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-500 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="text-purple-600" size={20} />
                <div>
                  <h3 className="font-medium text-gray-900">Registrar Gasto</h3>
                  <p className="text-sm text-gray-600">Añadir nuevo gasto</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Alertas</h2>
          </div>
          <div className="space-y-3">
            {stats.inventory.lowStock > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-orange-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-medium text-orange-900">Stock Bajo</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      {stats.inventory.lowStock} productos con stock bajo
                    </p>
                    <Link 
                      href="/admin/inventario?filter=lowStock" 
                      className="text-sm text-orange-600 hover:text-orange-800 font-medium mt-2 inline-block"
                    >
                      Ver productos →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {stats.inventory.outOfStock > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-medium text-red-900">Sin Stock</h3>
                    <p className="text-sm text-red-700 mt-1">
                      {stats.inventory.outOfStock} productos sin stock
                    </p>
                    <Link 
                      href="/admin/inventario?filter=outOfStock" 
                      className="text-sm text-red-600 hover:text-red-800 font-medium mt-2 inline-block"
                    >
                      Ver productos →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {stats.finances.pendingPayments > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <DollarSign className="text-yellow-600 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-medium text-yellow-900">Pagos Pendientes</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      {formatCurrency(stats.finances.pendingPayments)} en pagos pendientes
                    </p>
                    <Link 
                      href="/admin/finanzas?filter=pending" 
                      className="text-sm text-yellow-600 hover:text-yellow-800 font-medium mt-2 inline-block"
                    >
                      Ver detalles →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {stats.inventory.lowStock === 0 && stats.inventory.outOfStock === 0 && stats.finances.pendingPayments === 0 && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-emerald-900">Todo en Orden</h3>
                    <p className="text-sm text-emerald-700 mt-1">
                      No hay alertas pendientes en este momento
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
