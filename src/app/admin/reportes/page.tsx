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
        const response = await fetch(`/api/admin/reports?period=${period}`);
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
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="text-green-600" size={32} />
              Reportes y Analytics
            </h1>
            <p className="text-gray-600 mt-1">Análisis de ventas y desempeño</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            <Download size={20} />
            Exportar
          </button>
        </div>

        {/* Controles */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-600" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Generando reportes...</div>
          </div>
        ) : !reports ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No hay datos para mostrar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">Ventas en Período</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{reports.sales_count}</p>
                  </div>
                  <TrendingUp className="text-blue-400" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">Monto Total</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      ${(reports.sales_amount / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <TrendingUp className="text-green-400" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">Ticket Promedio</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      ${(reports.average_ticket / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <TrendingUp className="text-purple-400" size={24} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">Productos Vendidos</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{reports.products_sold}</p>
                  </div>
                  <TrendingUp className="text-orange-400" size={24} />
                </div>
              </div>
            </div>

            {/* Top Productos */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top 10 Productos</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Producto</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Cantidad</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Ingresos</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">% Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reports?.top_products || []).map((product, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{product.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ${product.revenue.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${(product.revenue / (reports?.sales_amount || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 w-8 text-right">
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top 10 Clientes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Cliente</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Compras</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">Gasto Total</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">% Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reports?.top_customers || []).map((customer, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{customer.purchases}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          ${customer.total.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500"
                                style={{ width: `${(customer.total / (reports?.sales_amount || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 w-8 text-right">
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ventas por Categoría</h2>
              <div className="space-y-4">
                {(reports?.categories_breakdown || []).map((category, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{category.category}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${category.amount.toLocaleString('es-CO')} ({category.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
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
