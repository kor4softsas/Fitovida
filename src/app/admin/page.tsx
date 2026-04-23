'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign,
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
            totalValue: data.inventory.total_value || 0,
            expirationCritical: data.inventory.expiration_critical || 0,
            expirationWarning: data.inventory.expiration_warning || 0
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-extrabold tracking-tight text-[#012d1d]">Vista General</h2>
        <p className="text-[#414844] font-medium">
          Bienvenido de vuelta. Tu tienda está respirando.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas de Hoy */}
        <div className="bg-[#f2f4f3] p-8 rounded-[3rem] hover:scale-[1.02] transition-transform duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#c1ecd4] flex items-center justify-center text-[#002114]">
              <ShoppingCart size={24} />
            </div>
            <span className="text-[#005236] font-bold text-sm bg-[#a0f4c8] px-3 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={14} /> +12%
            </span>
          </div>
          <p className="text-[#414844] text-sm font-semibold tracking-wider uppercase">Ventas Hoy</p>
          <h3 className="text-3xl font-extrabold text-[#012d1d] mt-1">
            {formatCurrency(stats.sales.today)}
          </h3>
        </div>

        {/* Ventas del Mes */}
        <div className="bg-[#f2f4f3] p-8 rounded-[3rem] hover:scale-[1.02] transition-transform duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#cce6d0] flex items-center justify-center text-[#506856]">
              <Calendar size={24} />
            </div>
            <span className="text-[#005236] font-bold text-sm bg-[#a0f4c8] px-3 py-1 rounded-full flex items-center gap-1">
               <TrendingUp size={14} /> +8%
            </span>
          </div>
          <p className="text-[#414844] text-sm font-semibold tracking-wider uppercase">Ventas del Mes</p>
          <h3 className="text-3xl font-extrabold text-[#012d1d] mt-1">
            {formatCurrency(stats.sales.month)}
          </h3>
        </div>

        {/* Balance */}
        <div className="bg-[#f2f4f3] p-8 rounded-[3rem] hover:scale-[1.02] transition-transform duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#a0f4c8] flex items-center justify-center text-[#002113]">
              <DollarSign size={24} />
            </div>
            <span className="text-[#005236] font-bold text-sm bg-[#a0f4c8] px-3 py-1 rounded-full flex items-center gap-1">Mensual</span>
          </div>
          <p className="text-[#414844] text-sm font-semibold tracking-wider uppercase">Balance</p>
          <h3 className="text-3xl font-extrabold text-[#012d1d] mt-1">
            {formatCurrency(stats.finances.balance)}
          </h3>
        </div>

        {/* Inventario */}
        <div className="bg-[#f2f4f3] p-8 rounded-[3rem] hover:scale-[1.02] transition-transform duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#cee9d3] flex items-center justify-center text-[#092012]">
              <Package size={24} />
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#f2f4f3] bg-[#a0f4c8] text-[#005236] text-[10px] flex items-center justify-center font-bold">
                {stats.inventory.lowStock}
              </div>
            </div>
          </div>
          <p className="text-[#414844] text-sm font-semibold tracking-wider uppercase">Productos</p>
          <h3 className="text-3xl font-extrabold text-[#012d1d] mt-1">
            {stats.inventory.totalProducts}
          </h3>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acciones Rápidas */}
        <div className="col-span-1 bg-[#f2f4f3] p-10 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-2xl font-bold text-[#012d1d]">Acciones Rápidas</h4>
            <span className="material-symbols-outlined text-[#414844] cursor-pointer">more_horiz</span>
          </div>
          <div className="space-y-6">
            <Link
              href="/admin/ventas?action=new"
              className="flex gap-4 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#c1ecd4] flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart className="text-[#012d1d] text-sm" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#012d1d]">Registrar Venta</p>
                <p className="text-xs text-[#414844]">Crear nueva venta manual</p>
                <span className="text-[10px] text-[#3f6653] font-bold uppercase mt-1 block">Acción Principal</span>
              </div>
            </Link>

            <Link
              href="/admin/inventario?action=entry"
              className="flex gap-4 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#cce6d0] flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="text-[#506856] text-sm" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#012d1d]">Entrada de Inventario</p>
                <p className="text-xs text-[#414844]">Registrar compra de productos</p>
                <span className="text-[10px] text-[#3f6653] font-bold uppercase mt-1 block">Gestión</span>
              </div>
            </Link>

            <Link
              href="/admin/finanzas?action=expense"
              className="flex gap-4 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#a0f4c8] flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="text-[#002113] text-sm" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#012d1d]">Registrar Gasto</p>
                <p className="text-xs text-[#414844]">Añadir nuevo gasto</p>
                <span className="text-[10px] text-[#3f6653] font-bold uppercase mt-1 block">Finanzas</span>
              </div>
            </Link>
          </div>
          <Link href="/admin/ventas" className="w-full block text-center mt-10 py-3 rounded-full border border-[#c1c8c2]/30 text-xs font-bold text-[#414844] hover:bg-[#e6e9e8] transition-all">
             Ver Todo el Historial
          </Link>
        </div>

        {/* Alertas */}
        <div className="col-span-1 bg-[#f2f4f3] p-10 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#012d1d]">notifications_active</span>
              <h4 className="text-2xl font-bold text-[#012d1d]">Alertas</h4>
            </div>
            <div className="flex -space-x-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#f2f4f3] bg-[#ba1a1a] text-[10px] text-white flex items-center justify-center font-bold">
                 {stats.inventory.outOfStock + stats.inventory.lowStock}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {stats.inventory.lowStock > 0 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-[1.25rem]">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-amber-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-bold text-[#012d1d]">Stock Bajo</p>
                    <p className="text-xs text-[#414844]">{stats.inventory.lowStock} productos por reponer</p>
                  </div>
                </div>
                <Link href="/admin/inventario?filter=lowStock" className="bg-[#c1ecd4] text-[#012d1d] px-4 py-2 rounded-full text-xs font-bold hover:bg-[#a5d0b9] transition-colors">Ver</Link>
              </div>
            )}

            {stats.inventory.outOfStock > 0 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-[1.25rem]">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-[#ba1a1a] rounded-full"></div>
                  <div>
                    <p className="text-sm font-bold text-[#012d1d]">Sin Stock</p>
                    <p className="text-xs text-[#414844]">{stats.inventory.outOfStock} productos agotados</p>
                  </div>
                </div>
                <Link href="/admin/inventario?filter=outOfStock" className="bg-[#ffdad6] text-[#93000a] px-4 py-2 rounded-full text-xs font-bold hover:bg-[#ffb4ab] transition-colors">Ver</Link>
              </div>
            )}

            {stats.finances.pendingPayments > 0 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-[1.25rem] bg-opacity-80">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-amber-400 rounded-full"></div>
                  <div>
                    <p className="text-sm font-bold text-[#012d1d]">Pagos Pendientes</p>
                    <p className="text-xs text-[#414844]">{formatCurrency(stats.finances.pendingPayments)} pendientes</p>
                  </div>
                </div>
                <Link href="/admin/finanzas?filter=pending" className="bg-amber-100 text-amber-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-amber-200 transition-colors">Revisar</Link>
              </div>
            )}

            {(stats.inventory.expirationCritical || 0) > 0 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-[1.25rem]">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-[#ba1a1a] rounded-full"></div>
                  <div>
                    <p className="text-sm font-bold text-[#012d1d]">Vencimiento Crítico</p>
                    <p className="text-xs text-[#414844]">{stats.inventory.expirationCritical} productos vencen en 0-3 meses</p>
                  </div>
                </div>
                <Link href="/admin/inventario" className="bg-[#ffdad6] text-[#93000a] px-4 py-2 rounded-full text-xs font-bold hover:bg-[#ffb4ab] transition-colors">Ver</Link>
              </div>
            )}

            {(stats.inventory.expirationWarning || 0) > 0 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-[1.25rem]">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-amber-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-bold text-[#012d1d]">Próximo a Vencer</p>
                    <p className="text-xs text-[#414844]">{stats.inventory.expirationWarning} productos vencen en 3-6 meses</p>
                  </div>
                </div>
                <Link href="/admin/inventario" className="bg-amber-100 text-amber-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-amber-200 transition-colors">Ver</Link>
              </div>
            )}

            {stats.inventory.lowStock === 0 && stats.inventory.outOfStock === 0 && stats.finances.pendingPayments === 0 && (stats.inventory.expirationCritical || 0) === 0 && (stats.inventory.expirationWarning || 0) === 0 && (
              <div className="flex items-center justify-between bg-white p-4 rounded-[1.25rem]">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-[#a0f4c8] rounded-full"></div>
                  <div>
                    <p className="text-sm font-bold text-[#012d1d]">Todo en Orden</p>
                    <p className="text-xs text-[#414844]">No hay alertas en curso</p>
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
