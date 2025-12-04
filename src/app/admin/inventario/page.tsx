'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingUp,
  TrendingDown,
  History,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  maxStock: number;
  price: number;
  cost: number;
  lastUpdated: string;
  image: string;
}

interface StockMovement {
  id: string;
  productId: number;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
  user: string;
}

// Datos de ejemplo
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Vitamina C 1000mg',
    sku: 'VIT-C-1000',
    category: 'Vitaminas',
    stock: 5,
    minStock: 20,
    maxStock: 100,
    price: 45000,
    cost: 25000,
    lastUpdated: '2024-01-15',
    image: '/products/vitamina-c.jpg',
  },
  {
    id: 2,
    name: 'Omega 3 Fish Oil',
    sku: 'OMG-3-FO',
    category: 'Suplementos',
    stock: 8,
    minStock: 25,
    maxStock: 150,
    price: 65000,
    cost: 35000,
    lastUpdated: '2024-01-14',
    image: '/products/omega3.jpg',
  },
  {
    id: 3,
    name: 'Proteína Vegana',
    sku: 'PRO-VEG-01',
    category: 'Proteínas',
    stock: 3,
    minStock: 15,
    maxStock: 80,
    price: 89500,
    cost: 55000,
    lastUpdated: '2024-01-15',
    image: '/products/proteina.jpg',
  },
  {
    id: 4,
    name: 'Colágeno Hidrolizado',
    sku: 'COL-HID-01',
    category: 'Suplementos',
    stock: 45,
    minStock: 30,
    maxStock: 120,
    price: 78000,
    cost: 42000,
    lastUpdated: '2024-01-13',
    image: '/products/colageno.jpg',
  },
  {
    id: 5,
    name: 'Té Verde Orgánico',
    sku: 'TE-VER-ORG',
    category: 'Tés',
    stock: 120,
    minStock: 50,
    maxStock: 200,
    price: 33900,
    cost: 18000,
    lastUpdated: '2024-01-12',
    image: '/products/te-verde.jpg',
  },
];

const mockMovements: StockMovement[] = [
  { id: '1', productId: 1, productName: 'Vitamina C 1000mg', type: 'out', quantity: 10, reason: 'Venta', date: '2024-01-15', user: 'Admin' },
  { id: '2', productId: 2, productName: 'Omega 3 Fish Oil', type: 'in', quantity: 50, reason: 'Reposición', date: '2024-01-14', user: 'Admin' },
  { id: '3', productId: 3, productName: 'Proteína Vegana', type: 'adjustment', quantity: -5, reason: 'Ajuste inventario', date: '2024-01-13', user: 'Admin' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

function getStockStatus(stock: number, minStock: number): { label: string; color: string; icon: typeof CheckCircle } {
  if (stock <= 0) {
    return { label: 'Sin stock', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
  }
  if (stock < minStock) {
    return { label: 'Bajo stock', color: 'text-orange-600 bg-orange-100', icon: AlertTriangle };
  }
  return { label: 'En stock', color: 'text-green-600 bg-green-100', icon: CheckCircle };
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(mockProducts);
      setMovements(mockMovements);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Obtener categorías únicas
  const categories = [...new Set(products.map(p => p.category))];

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    const matchesStock = 
      stockFilter === 'all' ||
      (stockFilter === 'low' && product.stock < product.minStock && product.stock > 0) ||
      (stockFilter === 'out' && product.stock <= 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Estadísticas
  const stats = {
    totalProducts: products.length,
    lowStock: products.filter(p => p.stock < p.minStock && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock <= 0).length,
    totalValue: products.reduce((acc, p) => acc + (p.stock * p.cost), 0),
  };

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAdjustStock = () => {
    if (!selectedProduct || !adjustmentQuantity) return;

    const qty = parseInt(adjustmentQuantity);
    let newStock = selectedProduct.stock;

    if (adjustmentType === 'add') {
      newStock += qty;
    } else if (adjustmentType === 'remove') {
      newStock = Math.max(0, newStock - qty);
    } else {
      newStock = qty;
    }

    setProducts(prev =>
      prev.map(p =>
        p.id === selectedProduct.id
          ? { ...p, stock: newStock, lastUpdated: new Date().toISOString().split('T')[0] }
          : p
      )
    );

    // Agregar movimiento
    const newMovement: StockMovement = {
      id: Date.now().toString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      type: adjustmentType === 'add' ? 'in' : adjustmentType === 'remove' ? 'out' : 'adjustment',
      quantity: adjustmentType === 'set' ? newStock - selectedProduct.stock : (adjustmentType === 'add' ? qty : -qty),
      reason: adjustmentReason || 'Ajuste manual',
      date: new Date().toISOString().split('T')[0],
      user: 'Admin',
    };
    setMovements(prev => [newMovement, ...prev]);

    setShowAdjustModal(false);
    setSelectedProduct(null);
    setAdjustmentQuantity('');
    setAdjustmentReason('');
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
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Control y gestión de stock de productos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <History className="w-5 h-5" />
            Historial
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="text-sm text-gray-600">Total productos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
              <p className="text-sm text-gray-600">Bajo stock</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
              <p className="text-sm text-gray-600">Sin stock</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-gray-600">Valor inventario</p>
            </div>
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

          {/* Stock filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Todo el stock</option>
            <option value="low">Bajo stock</option>
            <option value="out">Sin stock</option>
          </select>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.map((product) => {
                const status = getStockStatus(product.stock, product.minStock);
                const StatusIcon = status.icon;
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">Mín: {product.minStock} | Máx: {product.maxStock}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xl font-bold text-gray-900">{product.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(product.stock * product.cost)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setAdjustmentType('add');
                            setShowAdjustModal(true);
                          }}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          title="Agregar stock"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setAdjustmentType('remove');
                            setShowAdjustModal(true);
                          }}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Retirar stock"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
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

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAdjustModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ajustar stock
            </h3>
            <p className="text-gray-600 mb-4">
              Producto: <strong>{selectedProduct.name}</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Stock actual: <strong>{selectedProduct.stock}</strong> unidades
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de ajuste</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustmentType('add')}
                    className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                      adjustmentType === 'add'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Agregar
                  </button>
                  <button
                    onClick={() => setAdjustmentType('remove')}
                    className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                      adjustmentType === 'remove'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Minus className="w-4 h-4 inline mr-1" />
                    Retirar
                  </button>
                  <button
                    onClick={() => setAdjustmentType('set')}
                    className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                      adjustmentType === 'set'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Establecer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="0"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón (opcional)</label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Reposición de inventario"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={!adjustmentQuantity}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Guardar ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowHistoryModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Historial de movimientos</h3>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{movement.date}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{movement.productName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          movement.type === 'in' ? 'bg-green-100 text-green-800' :
                          movement.type === 'out' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.type === 'in' ? 'Entrada' : movement.type === 'out' ? 'Salida' : 'Ajuste'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{movement.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
