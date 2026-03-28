'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Barcode,
  Printer
} from 'lucide-react';
import type { InventoryProduct, InventoryMovement } from '@/types/admin';
import BarcodeInput, { validateBarcodeFormat } from '@/components/admin/BarcodeInput';
import ProductModalForm from '@/components/admin/ProductModalForm';
import BarcodePrinter from '@/components/admin/BarcodePrinter';

export default function InventarioPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [view, setView] = useState<'products' | 'movements'>('products');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBarcodePrinter, setShowBarcodePrinter] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const readErrorMessage = useCallback(async (response: Response, fallback: string) => {
    try {
      const raw = await response.text();
      if (!raw) {
        return fallback;
      }

      try {
        const parsed = JSON.parse(raw) as { error?: string; message?: string };
        if (typeof parsed.error === 'string' && parsed.error.trim()) {
          return parsed.error;
        }
        if (typeof parsed.message === 'string' && parsed.message.trim()) {
          return parsed.message;
        }
      } catch {
        // Non-JSON response body.
      }

      return raw.length <= 180 ? raw : fallback;
    } catch {
      return fallback;
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    setMovementsLoading(true);
    try {
      const movementsRes = await fetch('/api/admin/inventory/movements?limit=50');
      if (!movementsRes.ok) {
        throw new Error('Error cargando movimientos');
      }

      const movementsData = await movementsRes.json();
      const mappedMovements = (movementsData.movements || []).map((m: any) => ({
        id: m.id,
        productId: String(m.product_id),
        productName: m.product_name,
        type: m.type,
        quantity: m.quantity,
        previousStock: m.previous_stock,
        newStock: m.new_stock,
        unitCost: m.unit_cost,
        totalCost: m.total_cost,
        reason: m.reason,
        reference: m.reference,
        createdBy: m.created_by,
        createdAt: new Date(m.created_at)
      }));

      setMovements(mappedMovements);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    } finally {
      setMovementsLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (ids: string[]) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar ${ids.length} producto(s)?`)) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/inventory/product?ids=${ids.join(',')}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const message = await readErrorMessage(res, 'Error al eliminar');
        throw new Error(message);
      }
      
      // Update local state by filtering out deleted products
      setProducts(prevProducts => prevProducts.filter(p => !ids.includes(p.id)));
      setSelectedIds([]);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsDeleting(false);
    }
  }, [readErrorMessage]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar productos
        const productsRes = await fetch('/api/admin/inventory');
        if (!productsRes.ok) throw new Error('Error cargando productos');
        const productsData = await productsRes.json();
        
        // Mapear datos a formato esperado
        const mappedProducts = productsData.products.map((p: any) => ({
          id: String(p.product_id),
          name: p.name,
          sku: p.sku,
          category: p.category,
          currentStock: p.current_stock,
          minStock: p.min_stock,
          maxStock: p.max_stock,
          unitCost: p.unit_cost,
          salePrice: p.price,
          taxRate: p.tax_rate,
          status: p.status,
          supplier: p.supplier,
          barcode: p.barcode,
          image: p.image,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }

      // Movimientos se cargan en segundo plano para no bloquear la vista inicial.
      void fetchMovements();
    };

    void fetchData();
  }, [fetchMovements]);

  useEffect(() => {
    if (view === 'movements' && movements.length === 0 && !movementsLoading) {
      void fetchMovements();
    }
  }, [view, movements.length, movementsLoading, fetchMovements]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getStockStatus = (product: InventoryProduct) => {
    if (product.currentStock === 0) {
      return { label: 'Sin stock', color: 'text-[#93000a] bg-[#ffdad6]' };
    }
    if (product.currentStock <= product.minStock) {
      return { label: 'Stock bajo', color: 'text-amber-900 bg-amber-100' };
    }
    return { label: 'Stock OK', color: 'text-[#005236] bg-[#a0f4c8]' };
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-4xl font-extrabold tracking-tight text-[#012d1d]">Inventario</h2>
        <p className="text-[#414844] font-medium">
          Control de productos y movimientos
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2">
        {selectedIds.length > 0 && (
          <button
            onClick={() => handleDelete(selectedIds)}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-[#ba1a1a] text-white rounded-full text-sm font-bold hover:bg-[#a01818] transition-colors disabled:bg-[#d9595d]"
          >
            <Trash2 size={20} />
            Eliminar ({selectedIds.length})
          </button>
        )}
        <button
          onClick={() => {
            setSelectedProduct(null);
            setShowProductModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#c1ecd4] text-[#012d1d] rounded-full text-sm font-bold hover:bg-[#a5d0b9] transition-colors"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
        <button
          onClick={() => setShowMovementModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#a0f4c8] text-[#002113] rounded-full text-sm font-bold hover:bg-[#85e0b1] transition-colors"
        >
          <Plus size={20} />
          Movimiento
        </button>
        <button
          onClick={() => setShowBarcodePrinter(true)}
          disabled={products.filter(p => p.barcode).length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#cce6d0] text-[#506856] rounded-full text-sm font-bold hover:bg-[#b3d4ba] transition-colors disabled:bg-[#a0a8a2]"
        >
          <Printer size={20} />
          Imprimir Etiquetas
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#f2f4f3] p-8 rounded-[3rem] hover:scale-[1.02] transition-transform duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#c1ecd4] flex items-center justify-center text-[#002114]">
              <Package size={24} />
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-[#f2f4f3] bg-[#a0f4c8] text-[#005236] text-[10px] flex items-center justify-center font-bold">
              {products.length}
            </div>
          </div>
          <p className="text-[#414844] text-sm font-semibold tracking-wider uppercase">Total Productos</p>
          <h3 className="text-3xl font-extrabold text-[#012d1d] mt-1">
            {products.length}
          </h3>
        </div>
        
        <div className="bg-[#f2f4f3] p-8 rounded-[3rem] hover:scale-[1.02] transition-transform duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#cee9d3] flex items-center justify-center text-[#092012]">
              <TrendingUp size={24} />
            </div>
            <span className="text-[#005236] font-bold text-sm bg-[#a0f4c8] px-3 py-1 rounded-full">Disponible</span>
          </div>
          <p className="text-[#414844] text-sm font-semibold tracking-wider uppercase">Valor Total</p>
          <h3 className="text-3xl font-extrabold text-[#012d1d] mt-1">
            {formatCurrency(products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0))}
          </h3>
        </div>

        <div className="bg-[#f2f4f3] p-8 rounded-[3rem] hover:scale-[1.02] transition-transform duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-900">
              <AlertTriangle size={24} />
            </div>
            <span className="text-amber-900 font-bold text-sm bg-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
              <TrendingDown size={14} /> {products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length}
            </span>
          </div>
          <p className="text-[#414844] text-sm font-semibold tracking-wider uppercase">Stock Bajo</p>
          <h3 className="text-3xl font-extrabold text-[#012d1d] mt-1">
            {products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length}
          </h3>
        </div>

        <div className="bg-[#f2f4f3] p-8 rounded-[3rem] hover:scale-[1.02] transition-transform duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#93000a]">
              <TrendingDown size={24} />
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#f2f4f3] bg-[#ba1a1a] text-[10px] text-white flex items-center justify-center font-bold">
                {products.filter(p => p.currentStock === 0).length}
              </div>
            </div>
          </div>
          <p className="text-[#414844] text-sm font-semibold tracking-wider uppercase">Sin Stock</p>
          <h3 className="text-3xl font-extrabold text-[#012d1d] mt-1">
            {products.filter(p => p.currentStock === 0).length}
          </h3>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b border-[#e6e9e8]">
        <div className="flex gap-4">
          <button
            onClick={() => setView('products')}
            className={`pb-3 px-1 border-b-2 font-bold transition-colors ${
              view === 'products'
                ? 'border-[#005236] text-[#005236]'
                : 'border-transparent text-[#414844] hover:text-[#012d1d]'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setView('movements')}
            className={`pb-3 px-1 border-b-2 font-bold transition-colors ${
              view === 'movements'
                ? 'border-[#005236] text-[#005236]'
                : 'border-transparent text-[#414844] hover:text-[#012d1d]'
            }`}
          >
            Movimientos
          </button>
        </div>
      </div>

      {view === 'products' ? (
        <>
          {/* Filters */}
          <div className="bg-[#f2f4f3] rounded-[3rem] p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#414844]" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, SKU o código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-[#e6e9e8] rounded-full text-[#012d1d] placeholder-[#414844] focus:outline-none focus:ring-2 focus:ring-[#005236] focus:border-transparent"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-3 bg-white border border-[#e6e9e8] rounded-full text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236] focus:border-transparent"
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
          <div className="bg-[#f2f4f3] rounded-[3rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#e6e9e8] border-b border-[#d9ddd9]">
                  <tr>
                    <th className="px-6 py-3 text-left w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(filteredProducts.map(p => p.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                        className="rounded border-[#414844] text-[#005236] focus:ring-[#005236] cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">
                      Imagen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">
                      SKU / Código Barras
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-[#414844] uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-[#414844] uppercase">
                      Costo Unit.
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-[#414844] uppercase">
                      Precio Venta
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-[#414844] uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-[#414844] uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#e6e9e8]">
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-[#e6e9e8] border-[#e6e9e8]">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, product.id]);
                              } else {
                                setSelectedIds(selectedIds.filter(id => id !== product.id));
                              }
                            }}
                            className="rounded border-[#414844] text-[#005236] focus:ring-[#005236] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-[#d9ddd9] rounded flex items-center justify-center">
                              <Package size={20} className="text-[#414844]" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-[#012d1d]">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-[#414844]">{product.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-[#012d1d]">{product.sku || '-'}</div>
                            {product.barcode && (
                              <div className="flex items-center gap-1 text-[#414844] mt-1">
                                <Barcode size={14} />
                                <span className="text-xs">{product.barcode}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#414844]">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-bold text-[#012d1d]">
                            {product.currentStock}
                          </div>
                          <div className="text-xs text-[#414844]">
                            Min: {product.minStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-[#012d1d]">
                          {formatCurrency(product.unitCost)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-[#012d1d]">
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
                              className="text-[#005236] hover:text-[#003d2d]"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete([product.id])}
                              disabled={isDeleting}
                              className="text-[#ba1a1a] hover:text-[#8b1515] disabled:opacity-50"
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
        <div className="bg-[#f2f4f3] rounded-[3rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#e6e9e8] border-b border-[#d9ddd9]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-[#414844] uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-[#414844] uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-[#414844] uppercase">
                    Stock Anterior
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-[#414844] uppercase">
                    Stock Nuevo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-[#414844] uppercase">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-[#414844] uppercase">
                    Costo Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e6e9e8]">
                {movementsLoading && movements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-[#414844]">
                      Cargando movimientos...
                    </td>
                  </tr>
                )}
                {!movementsLoading && movements.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-[#414844]">
                      No hay movimientos para mostrar.
                    </td>
                  </tr>
                )}
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-[#e6e9e8]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#414844]">
                      {new Date(movement.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#012d1d]">
                      {movement.productName}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {movement.type === 'entry' ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#a0f4c8] text-[#005236]">
                          Entrada
                        </span>
                      ) : movement.type === 'exit' ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#ffdad6] text-[#93000a]">
                          Salida
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#cce6d0] text-[#506856]">
                          Ajuste
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-[#012d1d]">
                      {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-[#414844]">
                      {movement.previousStock}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-[#012d1d]">
                      {movement.newStock}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#414844]">
                      {movement.reason}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-[#012d1d]">
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
        <ProductModalForm
          product={selectedProduct}
          products={products}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
          onSave={async (product) => {
            try {
              const method = selectedProduct ? 'PUT' : 'POST';
              const res = await fetch('/api/admin/inventory/product', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
              });
              
              if (!res.ok) {
                const message = await readErrorMessage(res, 'Error al guardar el producto');
                throw new Error(message);
              }
              
              // Recargar productos desde el servidor para tener los IDs reales
              const productsRes = await fetch('/api/admin/inventory');
              if (!productsRes.ok) {
                throw new Error('Producto guardado, pero no se pudo recargar el listado de inventario');
              }

              const productsData = await productsRes.json();
              const mappedProducts = productsData.products.map((p: any) => ({
                id: String(p.product_id),
                name: p.name,
                sku: p.sku,
                category: p.category,
                currentStock: p.current_stock,
                minStock: p.min_stock,
                maxStock: p.max_stock,
                unitCost: p.unit_cost,
                salePrice: p.price,
                taxRate: p.tax_rate,
                status: p.status,
                supplier: p.supplier,
                barcode: p.barcode,
                image: p.image,
                createdAt: new Date(),
                updatedAt: new Date()
              }));
              
              setProducts(mappedProducts);
              setShowProductModal(false);
              setSelectedProduct(null);
            } catch (error) {
              console.error(error);
              alert(error instanceof Error ? error.message : 'Error al guardar el producto');
            }
          }}
        />
      )}

      {/* Barcode Printer Modal */}
      {showBarcodePrinter && (
        <BarcodePrinter
          products={products}
          onClose={() => setShowBarcodePrinter(false)}
        />
      )}
    </div>
  );
}


// Movement Modal Component
function MovementModal({ onClose, products }: { onClose: () => void; products: InventoryProduct[] }) {
  const [type, setType] = useState<'entry' | 'exit' | 'adjustment'>('entry');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full">
        <div className="p-8 border-b border-[#e6e9e8] flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#012d1d]">Nuevo Movimiento de Inventario</h2>
          <button onClick={onClose} className="text-[#414844] hover:text-[#012d1d]">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#012d1d] mb-3">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setType('entry')}
                className={`p-4 border-2 rounded-[1.5rem] ${
                  type === 'entry' ? 'border-[#a0f4c8] bg-[#f0fdf9]' : 'border-[#e6e9e8]'
                }`}
              >
                <TrendingUp className={type === 'entry' ? 'text-[#005236]' : 'text-[#414844]'} size={24} />
                <div className="text-sm font-bold mt-1 text-[#012d1d]">Entrada</div>
              </button>
              <button
                onClick={() => setType('exit')}
                className={`p-4 border-2 rounded-[1.5rem] ${
                  type === 'exit' ? 'border-[#ffdad6] bg-[#fffbfa]' : 'border-[#e6e9e8]'
                }`}
              >
                <TrendingDown className={type === 'exit' ? 'text-[#93000a]' : 'text-[#414844]'} size={24} />
                <div className="text-sm font-bold mt-1 text-[#012d1d]">Salida</div>
              </button>
              <button
                onClick={() => setType('adjustment')}
                className={`p-4 border-2 rounded-[1.5rem] ${
                  type === 'adjustment' ? 'border-[#cce6d0] bg-[#f8faf9]' : 'border-[#e6e9e8]'
                }`}
              >
                <Edit className={type === 'adjustment' ? 'text-[#506856]' : 'text-[#414844]'} size={24} />
                <div className="text-sm font-bold mt-1 text-[#012d1d]">Ajuste</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#012d1d] mb-2">
              Producto
            </label>
            <select className="w-full px-4 py-3 border border-[#e6e9e8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#005236] focus:border-transparent text-[#012d1d]">
              <option value="">Seleccionar producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#012d1d] mb-2">
                Cantidad
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 border border-[#e6e9e8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#005236] focus:border-transparent text-[#012d1d]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#012d1d] mb-2">
                Costo Unitario
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 border border-[#e6e9e8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#005236] focus:border-transparent text-[#012d1d]"
                placeholder="$0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#012d1d] mb-2">
              Motivo / Referencia
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-[#e6e9e8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#005236] focus:border-transparent text-[#012d1d]"
              placeholder="Ej: Compra #001, Venta #123, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#012d1d] mb-2">
              Notas (opcional)
            </label>
            <textarea
              className="w-full px-4 py-3 border border-[#e6e9e8] rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-[#005236] focus:border-transparent text-[#012d1d]"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="p-8 border-t border-[#e6e9e8] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#e6e9e8] rounded-full hover:bg-[#f2f4f3] transition-colors text-[#414844] font-bold"
          >
            Cancelar
          </button>
          <button className="px-6 py-2 bg-[#a0f4c8] text-[#005236] rounded-full hover:bg-[#85e0b1] transition-colors font-bold">
            Guardar Movimiento
          </button>
        </div>
      </div>
    </div>
  );
}
