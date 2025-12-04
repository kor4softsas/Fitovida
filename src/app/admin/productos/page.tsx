'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MoreVertical,
  Barcode,
  Package,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Printer
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
}

// Datos de ejemplo
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Vitamina C 1000mg',
    sku: 'VIT-C-1000',
    barcode: '7701234567890',
    category: 'Vitaminas',
    price: 45000,
    cost: 25000,
    stock: 50,
    description: 'Vitamina C de alta potencia para fortalecer el sistema inmune',
    image: '/products/vitamina-c.jpg',
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: 2,
    name: 'Omega 3 Fish Oil',
    sku: 'OMG-3-FO',
    barcode: '7701234567891',
    category: 'Suplementos',
    price: 65000,
    cost: 35000,
    stock: 30,
    description: 'Aceite de pescado rico en Omega 3 EPA y DHA',
    image: '/products/omega3.jpg',
    isActive: true,
    createdAt: '2024-01-05',
  },
  {
    id: 3,
    name: 'Proteína Vegana',
    sku: 'PRO-VEG-01',
    barcode: '7701234567892',
    category: 'Proteínas',
    price: 89500,
    cost: 55000,
    stock: 25,
    description: 'Proteína vegetal de alta calidad con aminoácidos esenciales',
    image: '/products/proteina.jpg',
    isActive: true,
    createdAt: '2024-01-10',
  },
  {
    id: 4,
    name: 'Colágeno Hidrolizado',
    sku: 'COL-HID-01',
    barcode: '7701234567893',
    category: 'Suplementos',
    price: 78000,
    cost: 42000,
    stock: 45,
    description: 'Colágeno hidrolizado para piel, cabello y articulaciones',
    image: '/products/colageno.jpg',
    isActive: true,
    createdAt: '2024-01-12',
  },
  {
    id: 5,
    name: 'Té Verde Orgánico',
    sku: 'TE-VER-ORG',
    barcode: '7701234567894',
    category: 'Tés',
    price: 33900,
    cost: 18000,
    stock: 100,
    description: 'Té verde orgánico con alto contenido de antioxidantes',
    image: '/products/te-verde.jpg',
    isActive: false,
    createdAt: '2024-01-15',
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

// Generador de código de barras EAN-13
function generateEAN13(): string {
  // Prefijo de Colombia (770)
  const prefix = '770';
  // Generar 9 dígitos aleatorios
  const random = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  const code = prefix + random;
  
  // Calcular dígito de verificación
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return code + checkDigit;
}

// Generador de SKU
function generateSKU(name: string, category: string): string {
  const catPrefix = category.substring(0, 3).toUpperCase();
  const namePrefix = name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${catPrefix}-${namePrefix}-${random}`;
}

// Componente de código de barras visual
function BarcodeDisplay({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex h-12 gap-px">
        {code.split('').map((digit, i) => (
          <div
            key={i}
            className="flex flex-col items-center"
          >
            <div 
              className={`w-1 h-10 ${
                parseInt(digit) % 2 === 0 ? 'bg-black' : 'bg-gray-800'
              }`}
              style={{ width: parseInt(digit) % 3 === 0 ? '2px' : '1px' }}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-sm tracking-widest">{code}</p>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

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

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm);
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteProduct = () => {
    if (productToDelete) {
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const handleToggleStatus = (product: Product) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === product.id ? { ...p, isActive: !p.isActive } : p
      )
    );
    setOpenMenuId(null);
  };

  const handlePrintBarcode = () => {
    if (selectedProduct) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Código de barras - ${selectedProduct.name}</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .barcode { margin: 20px auto; }
                .code { font-family: monospace; font-size: 18px; letter-spacing: 3px; margin-top: 10px; }
                .name { font-size: 14px; color: #666; margin-top: 5px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              <div class="barcode">
                <svg width="200" height="80">
                  ${selectedProduct.barcode.split('').map((d, i) => 
                    `<rect x="${i * 15 + 10}" y="0" width="${parseInt(d) % 2 === 0 ? 2 : 1}" height="60" fill="black"/>`
                  ).join('')}
                </svg>
              </div>
              <div class="code">${selectedProduct.barcode}</div>
              <div class="name">${selectedProduct.name}</div>
              <script>window.print(); window.close();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">Gestiona productos y genera códigos de barras</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo producto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              <p className="text-sm text-gray-600">Total productos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{products.filter(p => p.isActive).length}</p>
              <p className="text-sm text-gray-600">Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Barcode className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{products.filter(p => p.barcode).length}</p>
              <p className="text-sm text-gray-600">Con código</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              <p className="text-sm text-gray-600">Categorías</p>
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
              placeholder="Buscar por nombre, SKU o código de barras..."
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

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          {/* Export */}
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            Exportar
          </button>
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
                  SKU / Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-mono text-sm text-gray-900">{product.sku}</p>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowBarcodeModal(true);
                        }}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1"
                      >
                        <Barcode className="w-3 h-3" />
                        {product.barcode}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-gray-500">Costo: {formatCurrency(product.cost)}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                      
                      {openMenuId === product.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                            <div className="py-1">
                              <Link
                                href={`/admin/productos/${product.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setOpenMenuId(null)}
                              >
                                <Edit2 className="w-4 h-4" />
                                Editar
                              </Link>
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setShowBarcodeModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Barcode className="w-4 h-4" />
                                Ver código de barras
                              </button>
                              <button
                                onClick={() => handleToggleStatus(product)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                {product.isActive ? 'Desactivar' : 'Activar'}
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  setProductToDelete(product);
                                  setShowDeleteModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
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

      {/* Barcode Modal */}
      {showBarcodeModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowBarcodeModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Código de barras
            </h3>
            <p className="text-gray-600 mb-6">{selectedProduct.name}</p>

            <BarcodeDisplay code={selectedProduct.barcode} />

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">SKU</p>
                  <p className="font-mono font-medium">{selectedProduct.sku}</p>
                </div>
                <button
                  onClick={() => handleCopyCode(selectedProduct.sku)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {copiedCode === selectedProduct.sku ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Código EAN-13</p>
                  <p className="font-mono font-medium">{selectedProduct.barcode}</p>
                </div>
                <button
                  onClick={() => handleCopyCode(selectedProduct.barcode)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {copiedCode === selectedProduct.barcode ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrintBarcode}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Printer className="w-5 h-5" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900">Eliminar producto</h3>
            <p className="mt-2 text-gray-600">
              ¿Estás seguro de que deseas eliminar <strong>{productToDelete.name}</strong>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
