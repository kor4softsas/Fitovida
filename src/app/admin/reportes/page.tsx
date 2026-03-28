'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react';

interface ReportData {
  period: string;
  sales_count: number;
  sales_amount: number;
  products_sold: number;
  average_ticket: number;
  top_products: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  top_customers: Array<{
    name: string;
    purchases: number;
    total: number;
  }>;
  categories_breakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export default function ReportesPage() {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('month');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // Añadir un timestamp para romper por completo cualquier caché del navegador o Next.js
        const response = await fetch(`/api/admin/reports?period=${period}&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        const data = await response.json();
        setReports(data || {
          period,
          sales_count: 0,
          sales_amount: 0,
          products_sold: 0,
          average_ticket: 0,
          top_products: [],
          top_customers: [],
          categories_breakdown: []
        });
      } catch (error) {
        console.error('Error fetching reports:', error);
        setReports({
          period,
          sales_count: 0,
          sales_amount: 0,
          products_sold: 0,
          average_ticket: 0,
          top_products: [],
          top_customers: [],
          categories_breakdown: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [period]);

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#e6e9e8] bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-[#012d1d]">
              <BarChart3 className="text-[#005236]" size={32} />
              Reportes y Analytics
            </h1>
            <p className="mt-1 font-medium text-[#414844]">Análisis de ventas y desempeño</p>
          </div>
          <button className="flex items-center gap-2 rounded-full bg-[#005236] px-4 py-2 font-bold text-white transition-colors hover:bg-[#003d2d]">
            <Download size={20} />
            Exportar
          </button>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap gap-4 rounded-[2rem] bg-[#f2f4f3] p-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-[#414844]" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
            >
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
              <option value="quarter">Este Trimestre</option>
              <option value="year">Este Año</option>
              <option value="all">Todo el Tiempo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-[#414844]">Generando reportes...</div>
          </div>
        ) : !reports ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto mb-4 text-[#9aa39f]" size={48} />
            <p className="font-medium text-[#414844]">No hay datos para mostrar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Ventas en Período</p>
                    <p className="mt-2 text-3xl font-extrabold text-[#012d1d]">{reports.sales_count}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cce6d0] text-[#506856]">
                    <TrendingUp size={22} />
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Monto Total</p>
                    <p className="mt-2 text-3xl font-extrabold text-[#005236]">
                      ${(reports.sales_amount / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a0f4c8] text-[#005236]">
                    <TrendingUp size={22} />
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Ticket Promedio</p>
                    <p className="mt-2 text-3xl font-extrabold text-[#506856]">
                      ${(reports.average_ticket / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cce6d0] text-[#506856]">
                    <TrendingUp size={22} />
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Productos Vendidos</p>
                    <p className="mt-2 text-3xl font-extrabold text-[#012d1d]">{reports.products_sold}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-900">
                    <TrendingUp size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Productos */}
            <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
              <h2 className="mb-4 text-xl font-bold text-[#012d1d]">Top 10 Productos</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#d9ddd9]">
                      <th className="px-4 py-3 text-left font-bold text-[#414844]">Producto</th>
                      <th className="px-4 py-3 text-right font-bold text-[#414844]">Cantidad</th>
                      <th className="px-4 py-3 text-right font-bold text-[#414844]">Ingresos</th>
                      <th className="px-4 py-3 text-right font-bold text-[#414844]">% Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reports?.top_products || []).map((product, index) => (
                      <tr key={index} className="border-b border-[#e6e9e8] transition hover:bg-[#eaf1ed]">
                        <td className="px-4 py-3 font-bold text-[#012d1d]">{product.name}</td>
                        <td className="px-4 py-3 text-right text-[#414844]">{product.quantity}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#012d1d]">
                          ${product.revenue.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-[#d9ddd9]">
                              <div
                                className="h-full bg-[#005236]"
                                style={{ width: `${(product.revenue / (reports?.sales_amount || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs font-bold text-[#414844]">
                              {((product.revenue / reports.sales_amount) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Clientes */}
            <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
              <h2 className="mb-4 text-xl font-bold text-[#012d1d]">Top 10 Clientes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#d9ddd9]">
                      <th className="px-4 py-3 text-left font-bold text-[#414844]">Cliente</th>
                      <th className="px-4 py-3 text-right font-bold text-[#414844]">Compras</th>
                      <th className="px-4 py-3 text-right font-bold text-[#414844]">Gasto Total</th>
                      <th className="px-4 py-3 text-right font-bold text-[#414844]">% Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reports?.top_customers || []).map((customer, index) => (
                      <tr key={index} className="border-b border-[#e6e9e8] transition hover:bg-[#eaf1ed]">
                        <td className="px-4 py-3 font-bold text-[#012d1d]">{customer.name}</td>
                        <td className="px-4 py-3 text-right text-[#414844]">{customer.purchases}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#012d1d]">
                          ${customer.total.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-[#d9ddd9]">
                              <div
                                className="h-full bg-[#506856]"
                                style={{ width: `${(customer.total / (reports?.sales_amount || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs font-bold text-[#414844]">
                              {((customer.total / reports.sales_amount) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Desglose por Categoría */}
            <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
              <h2 className="mb-4 text-xl font-bold text-[#012d1d]">Ventas por Categoría</h2>
              <div className="space-y-4">
                {(reports?.categories_breakdown || []).map((category, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#012d1d]">{category.category}</span>
                      <span className="text-sm font-bold text-[#012d1d]">
                        ${category.amount.toLocaleString('es-CO')} ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#d9ddd9]">
                      <div
                        className="h-full bg-gradient-to-r from-[#005236] to-[#506856]"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
