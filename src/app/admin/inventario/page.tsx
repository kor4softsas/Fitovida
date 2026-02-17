'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  X,
  Scan,
  Barcode
} from 'lucide-react';
import type { InventoryProduct, InventoryMovement } from '@/types/admin';
import BarcodeInput, { validateBarcodeFormat } from '@/components/admin/BarcodeInput';

export default function InventarioPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [view, setView] = useState<'products' | 'movements'>('products');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);

  useEffect(() => {
    // TODO: Cargar desde API
    const mockProducts: InventoryProduct[] = [
      {
        id: '1',
        name: 'Proteína Whey 2kg',
        sku: 'PROT-WHE-2K',
        category: 'Proteínas',
        description: 'Proteína de suero aislada',
        currentStock: 25,
        minStock: 10,
        maxStock: 100,
        unitCost: 120000,
        salePrice: 180000,
        taxRate: 19,
        status: 'active',
        supplier: 'NutriSupply',
        barcode: '7891234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Creatina Monohidrato 300g',
        sku: 'CREA-MONO-300',
        category: 'Suplementos',
        currentStock: 8,
        minStock: 10,
        unitCost: 35000,
        salePrice: 55000,
        taxRate: 19,
        status: 'active',
        barcode: '7891234567891',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'BCAA 500g',
        sku: 'BCAA-500',
        category: 'Aminoácidos',
        currentStock: 0,
        minStock: 5,
        unitCost: 45000,
        salePrice: 70000,
        taxRate: 19,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const mockMovements: InventoryMovement[] = [
      {
        id: '1',
        productId: '1',
        productName: 'Proteína Whey 2kg',
        type: 'entry',
        quantity: 50,
        previousStock: 0,
        newStock: 50,
        unitCost: 120000,
        totalCost: 6000000,
        reason: 'purchase',
        reference: 'C-001',
        createdBy: 'admin',
        createdAt: new Date()
      }
    ];

    setProducts(mockProducts);
    setMovements(mockMovements);
    setLoading(false);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getStockStatus = (product: InventoryProduct) => {
    if (product.currentStock === 0) {
      return { label: 'Sin stock', color: 'text-red-600 bg-red-50' };
    }
    if (product.currentStock <= product.minStock) {
      return { label: 'Stock bajo', color: 'text-orange-600 bg-orange-50' };
    }
    return { label: 'Stock OK', color: 'text-emerald-600 bg-emerald-50' };
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Control de productos y movimientos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedProduct(null);
              setShowProductModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={20} />
            Movimiento
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <Package className="text-blue-500" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0))}
              </p>
            </div>
            <TrendingUp className="text-emerald-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length}
              </p>
            </div>
            <AlertTriangle className="text-orange-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sin Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.currentStock === 0).length}
              </p>
            </div>
            <TrendingDown className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setView('products')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              view === 'products'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setView('movements')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              view === 'movements'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Movimientos
          </button>
        </div>
      </div>

      {view === 'products' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, SKU o código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Todas las categorías' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU / Código Barras
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Costo Unit.
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Precio Venta
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-gray-500">{product.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{product.sku || '-'}</div>
                            {product.barcode && (
                              <div className="flex items-center gap-1 text-gray-500 mt-1">
                                <Barcode size={14} />
                                <span className="text-xs">{product.barcode}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {product.currentStock}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {product.minStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {formatCurrency(product.unitCost)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(product.salePrice)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowProductModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Movements View */
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Stock Anterior
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Stock Nuevo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Costo Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(movement.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {movement.productName}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {movement.type === 'entry' ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                          Entrada
                        </span>
                      ) : movement.type === 'exit' ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Salida
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Ajuste
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {movement.previousStock}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      {movement.newStock}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {movement.reason}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {movement.totalCost ? formatCurrency(movement.totalCost) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {showMovementModal && (
        <MovementModal onClose={() => setShowMovementModal(false)} products={products} />
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          products={products}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          onSave={(product) => {
            if (selectedProduct) {
              // Editar
              setProducts(products.map(p => p.id === product.id ? product : p));
            } else {
              // Crear
              setProducts([...products, { ...product, id: `${Date.now()}` }]);
            }
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Product Modal Component
function ProductModal({
  product,
  products,
  onClose,
  onSave
}: {
  product: InventoryProduct | null;
  products: InventoryProduct[];
  onClose: () => void;
  onSave: (product: InventoryProduct) => void;
}) {
  const [formData, setFormData] = useState<Partial<InventoryProduct>>({
    name: product?.name || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    category: product?.category || '',
    description: product?.description || '',
    currentStock: product?.currentStock || 0,
    minStock: product?.minStock || 5,
    maxStock: product?.maxStock || null,
    unitCost: product?.unitCost || 0,
    salePrice: product?.salePrice || 0,
    taxRate: product?.taxRate || 19,
    supplier: product?.supplier || '',
    status: product?.status || 'active',
  });

  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState<string | null>(null);

  const handleBarcodeChange = (value: string) => {
    setFormData({ ...formData, barcode: value });
    setBarcodeError('');
    setBarcodeFormat(null);
  };

  const handleBarcodeScan = (barcode: string) => {
    // Validar formato
    const validation = validateBarcodeFormat(barcode);
    
    if (!validation.isValid) {
      setBarcodeError(validation.message);
      return;
    }

    // Verificar si el código ya existe (excepto si es el mismo producto)
    const exists = products.some(
      p => p.barcode === barcode && p.id !== product?.id
    );

    if (exists) {
      setBarcodeError('Este código de barras ya está registrado');
      return;
    }

    setBarcodeFormat(validation.format);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar código de barras si existe
    if (formData.barcode) {
      const validation = validateBarcodeFormat(formData.barcode);
      if (!validation.isValid) {
        setBarcodeError(validation.message);
        return;
      }

      const exists = products.some(
        p => p.barcode === formData.barcode && p.id !== product?.id
      );
      if (exists) {
        setBarcodeError('Este código de barras ya está registrado');
        return;
      }
    }

    onSave({
      ...product,
      ...formData,
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date(),
    } as InventoryProduct);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package size={20} />
              Información Básica
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ej: Proteína Whey 2kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="PROT-WHE-2K"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Proteínas"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Descripción del producto..."
                />
              </div>
            </div>
          </div>

          {/* Código de Barras */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Scan size={20} className="text-blue-600" />
              Código de Barras
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escanea o ingresa el código de barras
              </label>
              <BarcodeInput
                value={formData.barcode || ''}
                onChange={handleBarcodeChange}
                onScan={handleBarcodeScan}
                placeholder="Escanea con el lector o ingresa manualmente"
              />
              
              {barcodeFormat && !barcodeError && (
                <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1">
                  <span className="font-medium">Formato detectado:</span> {barcodeFormat}
                </p>
              )}
              
              {barcodeError && (
                <p className="mt-2 text-sm text-red-600">{barcodeError}</p>
              )}
              
              <p className="mt-2 text-xs text-gray-500">
                Formatos soportados: EAN-13, UPC-A, EAN-8, Code128, o código personalizado
              </p>
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Stock</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Actual *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Mínimo *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Máximo
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxStock || ''}
                  onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Precios</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo Unitario *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Venta *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IVA (%) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Proveedor */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Proveedor</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Proveedor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="NutriSupply"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'discontinued' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="discontinued">Descontinuado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {product ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Movement Modal Component
function MovementModal({ onClose, products }: { onClose: () => void; products: InventoryProduct[] }) {
  const [type, setType] = useState<'entry' | 'exit' | 'adjustment'>('entry');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Nuevo Movimiento de Inventario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setType('entry')}
                className={`p-3 border-2 rounded-lg ${
                  type === 'entry' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                }`}
              >
                <TrendingUp className={type === 'entry' ? 'text-emerald-600' : 'text-gray-400'} size={24} />
                <div className="text-sm font-medium mt-1">Entrada</div>
              </button>
              <button
                onClick={() => setType('exit')}
                className={`p-3 border-2 rounded-lg ${
                  type === 'exit' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
              >
                <TrendingDown className={type === 'exit' ? 'text-red-600' : 'text-gray-400'} size={24} />
                <div className="text-sm font-medium mt-1">Salida</div>
              </button>
              <button
                onClick={() => setType('adjustment')}
                className={`p-3 border-2 rounded-lg ${
                  type === 'adjustment' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <Edit className={type === 'adjustment' ? 'text-blue-600' : 'text-gray-400'} size={24} />
                <div className="text-sm font-medium mt-1">Ajuste</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option value="">Seleccionar producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Unitario
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="$0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo / Referencia
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ej: Compra #001, Venta #123, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Guardar Movimiento
          </button>
        </div>
      </div>
    </div>
  );
}
