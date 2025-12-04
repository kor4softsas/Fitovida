'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Percent,
  Calculator,
  Download,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Save,
  X
} from 'lucide-react';

interface ProductCost {
  id: number;
  name: string;
  sku: string;
  category: string;
  cost: number;
  price: number;
  margin: number;
  marginPercent: number;
  stock: number;
  totalCostValue: number;
  totalSaleValue: number;
  lastUpdated: string;
}

// Datos de ejemplo
const mockProducts: ProductCost[] = [
  {
    id: 1,
    name: 'Vitamina C 1000mg',
    sku: 'VIT-C-1000',
    category: 'Vitaminas',
    cost: 25000,
    price: 45000,
    margin: 20000,
    marginPercent: 44.4,
    stock: 50,
    totalCostValue: 1250000,
    totalSaleValue: 2250000,
    lastUpdated: '2024-01-15',
  },
  {
    id: 2,
    name: 'Omega 3 Fish Oil',
    sku: 'OMG-3-FO',
    category: 'Suplementos',
    cost: 35000,
    price: 65000,
    margin: 30000,
    marginPercent: 46.2,
    stock: 30,
    totalCostValue: 1050000,
    totalSaleValue: 1950000,
    lastUpdated: '2024-01-14',
  },
  {
    id: 3,
    name: 'Proteína Vegana',
    sku: 'PRO-VEG-01',
    category: 'Proteínas',
    cost: 55000,
    price: 89500,
    margin: 34500,
    marginPercent: 38.5,
    stock: 25,
    totalCostValue: 1375000,
    totalSaleValue: 2237500,
    lastUpdated: '2024-01-13',
  },
  {
    id: 4,
    name: 'Colágeno Hidrolizado',
    sku: 'COL-HID-01',
    category: 'Suplementos',
    cost: 42000,
    price: 78000,
    margin: 36000,
    marginPercent: 46.2,
    stock: 45,
    totalCostValue: 1890000,
    totalSaleValue: 3510000,
    lastUpdated: '2024-01-12',
  },
  {
    id: 5,
    name: 'Té Verde Orgánico',
    sku: 'TE-VER-ORG',
    category: 'Tés',
    cost: 18000,
    price: 33900,
    margin: 15900,
    marginPercent: 46.9,
    stock: 100,
    totalCostValue: 1800000,
    totalSaleValue: 3390000,
    lastUpdated: '2024-01-11',
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function CostsPage() {
  const [products, setProducts] = useState<ProductCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCost, setEditCost] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(mockProducts);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Obtener categorías únicas
  const categories = [...new Set(products.map(p => p.category))];

  // Calcular estadísticas generales
  const stats = {
    totalCost: products.reduce((acc, p) => acc + p.totalCostValue, 0),
    totalSale: products.reduce((acc, p) => acc + p.totalSaleValue, 0),
    totalMargin: products.reduce((acc, p) => acc + (p.margin * p.stock), 0),
    avgMarginPercent: products.length > 0 
      ? products.reduce((acc, p) => acc + p.marginPercent, 0) / products.length 
      : 0,
  };

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStartEdit = (product: ProductCost) => {
    setEditingId(product.id);
    setEditCost(product.cost.toString());
    setEditPrice(product.price.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCost('');
    setEditPrice('');
  };

  const handleSaveEdit = (productId: number) => {
    const newCost = parseFloat(editCost);
    const newPrice = parseFloat(editPrice);

    if (isNaN(newCost) || isNaN(newPrice) || newCost <= 0 || newPrice <= 0) {
      return;
    }

    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const margin = newPrice - newCost;
          const marginPercent = (margin / newPrice) * 100;
          return {
            ...p,
            cost: newCost,
            price: newPrice,
            margin,
            marginPercent,
            totalCostValue: newCost * p.stock,
            totalSaleValue: newPrice * p.stock,
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );

    handleCancelEdit();
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Costos</h1>
          <p className="text-gray-600 mt-1">Analiza y gestiona los costos y márgenes de tus productos</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-5 h-5" />
          Exportar reporte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Costo total inventario</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalCost)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor venta inventario</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalSale)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Margen potencial</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalMargin)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Margen promedio</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgMarginPercent.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Margin calculator */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-medium text-gray-900">Calculadora de margen rápida</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Costo</label>
            <input
              type="number"
              id="calcCost"
              placeholder="25000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              onChange={(e) => {
                const cost = parseFloat(e.target.value) || 0;
                const priceInput = document.getElementById('calcPrice') as HTMLInputElement;
                const price = parseFloat(priceInput?.value) || 0;
                const marginInput = document.getElementById('calcMargin') as HTMLInputElement;
                const percentInput = document.getElementById('calcPercent') as HTMLInputElement;
                if (price > 0) {
                  const margin = price - cost;
                  const percent = (margin / price) * 100;
                  if (marginInput) marginInput.value = margin.toString();
                  if (percentInput) percentInput.value = percent.toFixed(1);
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio venta</label>
            <input
              type="number"
              id="calcPrice"
              placeholder="45000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              onChange={(e) => {
                const price = parseFloat(e.target.value) || 0;
                const costInput = document.getElementById('calcCost') as HTMLInputElement;
                const cost = parseFloat(costInput?.value) || 0;
                const marginInput = document.getElementById('calcMargin') as HTMLInputElement;
                const percentInput = document.getElementById('calcPercent') as HTMLInputElement;
                if (cost > 0) {
                  const margin = price - cost;
                  const percent = (margin / price) * 100;
                  if (marginInput) marginInput.value = margin.toString();
                  if (percentInput) percentInput.value = percent.toFixed(1);
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Margen ($)</label>
            <input
              type="text"
              id="calcMargin"
              readOnly
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-green-600 font-medium"
              placeholder="20000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Margen (%)</label>
            <input
              type="text"
              id="calcPercent"
              readOnly
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-green-600 font-medium"
              placeholder="44.4%"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margen
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Margen
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                      />
                    ) : (
                      <span className="text-gray-900">{formatCurrency(product.cost)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                      />
                    ) : (
                      <span className="text-gray-900">{formatCurrency(product.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-green-600 font-medium">{formatCurrency(product.margin)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      product.marginPercent >= 40 ? 'bg-green-100 text-green-800' :
                      product.marginPercent >= 25 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.marginPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{product.stock}</td>
                  <td className="px-4 py-3 text-right">
                    <div>
                      <p className="text-gray-900 font-medium">{formatCurrency(product.totalSaleValue)}</p>
                      <p className="text-xs text-gray-500">Costo: {formatCurrency(product.totalCostValue)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === product.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleSaveEdit(product.id)}
                          className="p-1 rounded text-green-600 hover:bg-green-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 rounded text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(product)}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} productos
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

      {/* Summary by category */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen por categoría</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => {
            const categoryProducts = products.filter(p => p.category === category);
            const totalCost = categoryProducts.reduce((acc, p) => acc + p.totalCostValue, 0);
            const totalSale = categoryProducts.reduce((acc, p) => acc + p.totalSaleValue, 0);
            const avgMargin = categoryProducts.reduce((acc, p) => acc + p.marginPercent, 0) / categoryProducts.length;

            return (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{category}</h4>
                  <span className="text-sm text-gray-500">{categoryProducts.length} productos</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo total:</span>
                    <span className="font-medium">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor venta:</span>
                    <span className="font-medium">{formatCurrency(totalSale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Margen promedio:</span>
                    <span className={`font-medium ${avgMargin >= 40 ? 'text-green-600' : avgMargin >= 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {avgMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
