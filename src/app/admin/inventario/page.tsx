'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
  X,
  Barcode,
  Printer
} from 'lucide-react';
import type { InventoryProduct, InventoryMovement } from '@/types/admin';
import { useBarcodeScanner, validateBarcodeFormat } from '@/components/admin/BarcodeInput';
import ProductModalForm from '@/components/admin/ProductModalForm';
import BarcodePrinter from '@/components/admin/BarcodePrinter';
import { useAdminFeedback } from '@/components/admin/AdminFeedback';

type InventoryApiRow = {
  product_id: string | number;
  name: string;
  sku?: string | null;
  category: string;
  description?: string | null;
  has_invima?: number | boolean;
  invima_registry_number?: string | null;
  fecha_vencimiento?: string | null;
  expiration_status?: 'red' | 'yellow' | 'green' | 'expired' | 'unknown' | null;
  current_stock: number;
  min_stock: number;
  max_stock?: number | null;
  unit_cost: number;
  price: number;
  tax_rate: number;
  status: 'active' | 'inactive' | 'discontinued';
  supplier?: string | null;
  barcode?: string | null;
  image?: string | null;
};

type MovementApiRow = {
  id: string;
  product_id: string | number;
  product_name: string;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  total_cost?: number;
  reason: string;
  reference?: string;
  created_by: string;
  created_at: string;
};

function mapInventoryRowToProduct(p: InventoryApiRow): InventoryProduct {
  return {
    id: String(p.product_id),
    name: p.name,
    sku: p.sku || undefined,
    category: p.category,
    description: p.description || undefined,
    hasInvima: Boolean(p.has_invima),
    invimaRegistryNumber: p.invima_registry_number || undefined,
    expirationDate: p.fecha_vencimiento ? String(p.fecha_vencimiento).split('T')[0] : '',
    expirationStatus: p.expiration_status || 'unknown',
    currentStock: p.current_stock,
    minStock: p.min_stock,
    maxStock: p.max_stock || undefined,
    unitCost: p.unit_cost,
    salePrice: p.price,
    taxRate: p.tax_rate,
    status: p.status,
    supplier: p.supplier || undefined,
    barcode: p.barcode || undefined,
    image: p.image || undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

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
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const scanFeedbackTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const productRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const { pushMessage, pushConfirm } = useAdminFeedback();

  const handleBarcodeScanned = useCallback((barcode: string) => {
    const cleanedBarcode = barcode.trim();
    if (!cleanedBarcode) return;

    const validation = validateBarcodeFormat(cleanedBarcode);
    if (!validation.isValid) {
      setScanFeedback({
        type: 'error',
        message: 'El código escaneado no es válido.'
      });
      return;
    }

    setSearchTerm(cleanedBarcode);
    setFilterCategory('all');

    const normalized = cleanedBarcode.toLowerCase();
    const exactMatches = products.filter((product) =>
      product.barcode?.toLowerCase() === normalized ||
      product.sku?.toLowerCase() === normalized
    );

    const foundProduct = products.find((product) =>
      product.barcode?.toLowerCase() === normalized ||
      product.sku?.toLowerCase() === normalized ||
      product.name.toLowerCase().includes(normalized)
    );

    if (exactMatches.length === 1) {
      setHighlightedProductId(exactMatches[0].id);
    } else {
      setHighlightedProductId(null);
    }

    setScanFeedback(
      foundProduct
        ? { type: 'success', message: `Escaneo detectado: ${foundProduct.name}` }
        : { type: 'error', message: `No se encontró un producto con el código: ${cleanedBarcode}` }
    );

    if (scanFeedbackTimeoutRef.current) {
      window.clearTimeout(scanFeedbackTimeoutRef.current);
    }

    scanFeedbackTimeoutRef.current = window.setTimeout(() => {
      setScanFeedback(null);
      scanFeedbackTimeoutRef.current = null;
    }, 3000);
  }, [products]);

  const { setIsListening } = useBarcodeScanner(handleBarcodeScanned);

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
      const mappedMovements = ((movementsData.movements || []) as MovementApiRow[]).map((m) => ({
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
    pushConfirm(
      `¿Estás seguro de que quieres eliminar ${ids.length} producto(s)?`,
      async () => {
        setIsDeleting(true);
        try {
          const res = await fetch(`/api/admin/inventory/product?ids=${ids.join(',')}`, {
            method: 'DELETE'
          });
          
          if (!res.ok) {
            const message = await readErrorMessage(res, 'Error al eliminar');
            throw new Error(message);
          }
          
          setProducts(prevProducts => prevProducts.filter(p => !ids.includes(p.id)));
          setSelectedIds([]);
          pushMessage('Producto(s) eliminado(s) correctamente', 'success');
        } catch (error: unknown) {
          console.error(error);
          pushMessage(error instanceof Error ? error.message : 'Error al eliminar', 'error');
        } finally {
          setIsDeleting(false);
        }
      },
      'Eliminar productos'
    );
  }, [pushConfirm, pushMessage, readErrorMessage]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar productos
        const productsRes = await fetch('/api/admin/inventory');
        if (!productsRes.ok) throw new Error('Error cargando productos');
        const productsData = await productsRes.json();
        
        // Mapear datos a formato esperado
        const mappedProducts = ((productsData.products || []) as InventoryApiRow[]).map(mapInventoryRowToProduct);
        
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

  useEffect(() => {
    setIsListening(view === 'products');

    return () => {
      setIsListening(false);
    };
  }, [view, setIsListening]);

  useEffect(() => {
    if (!highlightedProductId) return;

    const targetRow = productRowRefs.current[highlightedProductId];
    if (!targetRow) return;

    targetRow.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedProductId(null);
      highlightTimeoutRef.current = null;
    }, 2600);
  }, [highlightedProductId, products, searchTerm, filterCategory]);

  useEffect(() => {
    return () => {
      if (scanFeedbackTimeoutRef.current) {
        window.clearTimeout(scanFeedbackTimeoutRef.current);
      }
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
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
      return { label: 'Sin stock', color: 'text-[#93000a] bg-[#ffdad6]' };
    }
    if (product.currentStock <= product.minStock) {
      return { label: 'Stock bajo', color: 'text-amber-900 bg-amber-50' };
    }
    return { label: 'Stock OK', color: 'text-[#005236] bg-[#a0f4c8]' };
  };

  const getExpirationStatus = (product: InventoryProduct) => {
    if (!product.expirationDate) {
      return { label: 'Sin fecha', color: 'text-[#414844] bg-[#e6e9e8]' };
    }

    switch (product.expirationStatus) {
      case 'expired':
        return { label: 'Vencido', color: 'text-[#93000a] bg-[#ffdad6]' };
      case 'red':
        return { label: 'Vence pronto', color: 'text-[#93000a] bg-[#ffdad6]' };
      case 'yellow':
        return { label: 'Proximo a vencer', color: 'text-amber-900 bg-amber-50' };
      case 'green':
        return { label: 'Vigente', color: 'text-[#005236] bg-[#a0f4c8]' };
      default:
        return { label: 'Sin clasificar', color: 'text-[#414844] bg-[#e6e9e8]' };
    }
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#012d1d]">Inventario</h2>
          <p className="mt-1 font-medium text-[#414844]">Control de productos y movimientos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => handleDelete(selectedIds)}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-full border border-[#ffdad6] bg-[#ba1a1a] px-4 py-2 font-bold text-white transition-colors hover:bg-[#93000a] disabled:cursor-not-allowed disabled:bg-[#d98686]"
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
            className="flex items-center gap-2 rounded-full bg-[#012d1d] px-4 py-2 font-bold text-white transition-colors hover:bg-[#005236]"
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className="flex items-center gap-2 rounded-full bg-[#005236] px-4 py-2 font-bold text-white transition-colors hover:bg-[#003d2d]"
          >
            <Plus size={20} />
            Movimiento
          </button>
          <button
            onClick={() => setShowBarcodePrinter(true)}
            disabled={products.filter(p => p.barcode).length === 0}
            className="flex items-center gap-2 rounded-full border border-[#e6e9e8] bg-[#f2f4f3] px-4 py-2 font-bold text-[#414844] transition-colors hover:bg-[#e6e9e8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Printer size={20} />
            Imprimir Etiquetas
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="group rounded-[2rem] bg-[#f2f4f3] p-6 transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Total Productos</p>
              <p className="text-3xl font-extrabold text-[#012d1d]">{products.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#cce6d0] text-[#506856]">
              <Package size={26} />
            </div>
          </div>
        </div>
        
        <div className="group rounded-[2rem] bg-[#f2f4f3] p-6 transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Valor Total</p>
              <p className="text-3xl font-extrabold text-[#012d1d]">
                {formatCurrency(products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0))}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#a0f4c8] text-[#002113]">
              <TrendingUp size={26} />
            </div>
          </div>
        </div>

        <div className="group rounded-[2rem] bg-[#f2f4f3] p-6 transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Stock Bajo</p>
              <p className="text-3xl font-extrabold text-[#012d1d]">
                {products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900">
              <AlertTriangle size={26} />
            </div>
          </div>
        </div>

        <div className="group rounded-[2rem] bg-[#f2f4f3] p-6 transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Sin Stock</p>
              <p className="text-3xl font-extrabold text-[#012d1d]">
                {products.filter(p => p.currentStock === 0).length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffdad6] text-[#93000a]">
              <TrendingDown size={26} />
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="rounded-full border border-[#e6e9e8] bg-[#f2f4f3] p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setView('products')}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              view === 'products'
                ? 'bg-[#012d1d] text-white'
                : 'text-[#414844] hover:bg-[#e6e9e8]'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setView('movements')}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              view === 'movements'
                ? 'bg-[#012d1d] text-white'
                : 'text-[#414844] hover:bg-[#e6e9e8]'
            }`}
          >
            Movimientos
          </button>
        </div>
      </div>

      {view === 'products' ? (
        <>
          {/* Filters */}
          <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, SKU o código de barras (lector activo)..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (scanFeedback) {
                      setScanFeedback(null);
                    }
                  }}
                  className="w-full rounded-full border border-[#e6e9e8] bg-white py-2 pl-10 pr-4 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Todas las categorías' : cat}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-[#414844]">
              Puedes buscar por nombre, SKU o escanear directamente con el lector de código de barras.
            </p>

            {scanFeedback && (
              <div
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  scanFeedback.type === 'success'
                    ? 'bg-[#a0f4c8] text-[#005236]'
                    : 'bg-[#ffdad6] text-[#93000a]'
                }`}
              >
                {scanFeedback.message}
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="overflow-hidden rounded-[2.5rem] bg-[#f2f4f3]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#d9ddd9] bg-[#e6e9e8]">
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
                        className="cursor-pointer rounded border-[#c7cdc9] text-[#005236] focus:ring-[#005236]"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                      Imagen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                      SKU / Código Barras
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#414844]">
                      Costo Unit.
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#414844]">
                      Precio Venta
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#414844]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e9e8] bg-white">
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    const expiration = getExpirationStatus(product);
                    return (
                      <tr
                        key={product.id}
                        ref={(el) => {
                          productRowRefs.current[product.id] = el;
                        }}
                        className={`transition-colors duration-500 ${
                          highlightedProductId === product.id
                            ? 'bg-[#e7f9ee] ring-1 ring-inset ring-[#6fc29a]'
                            : 'hover:bg-[#f8faf9]'
                        }`}
                      >
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
                            className="cursor-pointer rounded border-[#c7cdc9] text-[#005236] focus:ring-[#005236]"
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
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#e6e9e8]">
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
                            <div className="font-bold text-[#012d1d]">{product.sku || '-'}</div>
                            {product.barcode && (
                              <div className="mt-1 flex items-center gap-1 text-[#414844]">
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
                          <div className="space-y-1">
                            <div className="text-xs text-[#414844]">
                              {product.expirationDate || '-'}
                            </div>
                            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${expiration.color}`}>
                              {expiration.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-bold text-[#012d1d]">
                            {product.currentStock}
                          </div>
                          <div className="text-xs text-[#414844]">
                            Min: {product.minStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-[#012d1d]">
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
                              className="text-[#005236] transition-colors hover:text-[#003d2d]"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete([product.id])}
                              disabled={isDeleting}
                              className="text-[#ba1a1a] transition-colors hover:text-[#93000a] disabled:opacity-50"
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
        <div className="overflow-hidden rounded-[2.5rem] bg-[#f2f4f3]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#d9ddd9] bg-[#e6e9e8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">
                    Stock Anterior
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">
                    Stock Nuevo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#414844]">
                    Costo Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e9e8] bg-white">
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
                  <tr key={movement.id} className="hover:bg-[#f8faf9]">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#414844]">
                      {new Date(movement.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[#012d1d]">
                      {movement.productName}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {movement.type === 'entry' ? (
                        <span className="rounded-full bg-[#a0f4c8] px-3 py-1 text-xs font-bold text-[#005236]">
                          Entrada
                        </span>
                      ) : movement.type === 'exit' ? (
                        <span className="rounded-full bg-[#ffdad6] px-3 py-1 text-xs font-bold text-[#93000a]">
                          Salida
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#cce6d0] px-3 py-1 text-xs font-bold text-[#506856]">
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
                    <td className="px-6 py-4 text-right text-sm font-bold text-[#012d1d]">
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
              const mappedProducts = ((productsData.products || []) as InventoryApiRow[]).map(mapInventoryRowToProduct);
              
              setProducts(mappedProducts);
              setShowProductModal(false);
              setSelectedProduct(null);
              pushMessage(selectedProduct ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 'success');
            } catch (error) {
              console.error(error);
              pushMessage(error instanceof Error ? error.message : 'Error al guardar el producto', 'error');
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
      <div className="w-full max-w-2xl rounded-[2.5rem] bg-white">
        <div className="flex items-center justify-between border-b border-[#e6e9e8] p-8">
          <h2 className="text-xl font-bold text-[#012d1d]">Nuevo Movimiento de Inventario</h2>
          <button onClick={onClose} className="text-[#414844] hover:text-[#012d1d]">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4 p-8">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setType('entry')}
                className={`rounded-[1.25rem] border-2 p-3 ${
                  type === 'entry' ? 'border-[#005236] bg-[#a0f4c8]' : 'border-[#e6e9e8] bg-white'
                }`}
              >
                <TrendingUp className={type === 'entry' ? 'text-[#005236]' : 'text-[#414844]'} size={24} />
                <div className="mt-1 text-sm font-bold text-[#012d1d]">Entrada</div>
              </button>
              <button
                onClick={() => setType('exit')}
                className={`rounded-[1.25rem] border-2 p-3 ${
                  type === 'exit' ? 'border-[#ba1a1a] bg-[#ffdad6]' : 'border-[#e6e9e8] bg-white'
                }`}
              >
                <TrendingDown className={type === 'exit' ? 'text-[#93000a]' : 'text-[#414844]'} size={24} />
                <div className="mt-1 text-sm font-bold text-[#012d1d]">Salida</div>
              </button>
              <button
                onClick={() => setType('adjustment')}
                className={`rounded-[1.25rem] border-2 p-3 ${
                  type === 'adjustment' ? 'border-[#506856] bg-[#cce6d0]' : 'border-[#e6e9e8] bg-white'
                }`}
              >
                <Edit className={type === 'adjustment' ? 'text-[#506856]' : 'text-[#414844]'} size={24} />
                <div className="mt-1 text-sm font-bold text-[#012d1d]">Ajuste</div>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">
              Producto
            </label>
            <select className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]">
              <option value="">Seleccionar producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#414844]">
                Cantidad
              </label>
              <input
                type="number"
                className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#414844]">
                Costo Unitario
              </label>
              <input
                type="number"
                className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                placeholder="$0"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">
              Motivo / Referencia
            </label>
            <input
              type="text"
              className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
              placeholder="Ej: Compra #001, Venta #123, etc."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">
              Notas (opcional)
            </label>
            <textarea
              className="w-full rounded-[1.25rem] border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#e6e9e8] p-8">
          <button
            onClick={onClose}
            className="rounded-full border border-[#e6e9e8] px-4 py-2 font-bold text-[#414844] transition-colors hover:bg-[#f2f4f3]"
          >
            Cancelar
          </button>
          <button className="rounded-full bg-[#005236] px-4 py-2 font-bold text-white transition-colors hover:bg-[#003d2d]">
            Guardar Movimiento
          </button>
        </div>
      </div>
    </div>
  );
}
