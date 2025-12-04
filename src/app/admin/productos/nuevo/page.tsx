'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw, Barcode, Package, DollarSign, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

// Generador de código de barras EAN-13
function generateEAN13(): string {
  const prefix = '770'; // Prefijo de Colombia
  const random = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  const code = prefix + random;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return code + checkDigit;
}

// Generador de SKU
function generateSKU(name: string, category: string): string {
  const catPrefix = category ? category.substring(0, 3).toUpperCase() : 'PRD';
  const namePrefix = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3) : 'XXX';
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${catPrefix}-${namePrefix}-${random}`;
}

const categories = [
  'Vitaminas',
  'Suplementos',
  'Proteínas',
  'Tés',
  'Aceites',
  'Hierbas',
  'Minerales',
  'Otros',
];

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    sku: '',
    barcode: generateEAN13(),
    price: '',
    cost: '',
    stock: '',
    minStock: '10',
    maxStock: '100',
    image: '',
    isActive: true,
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }
    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es requerido';
    }
    if (!formData.barcode.trim()) {
      newErrors.barcode = 'El código de barras es requerido';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      newErrors.cost = 'El costo debe ser mayor a 0';
    }
    if (parseFloat(formData.cost) >= parseFloat(formData.price)) {
      newErrors.cost = 'El costo debe ser menor al precio';
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock debe ser 0 o mayor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // TODO: Implementar guardado real en la base de datos
    console.log('Nuevo producto:', formData);
    
    router.push('/admin/productos');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGenerateSKU = () => {
    const newSKU = generateSKU(formData.name, formData.category);
    setFormData(prev => ({ ...prev, sku: newSKU }));
  };

  const handleGenerateBarcode = () => {
    const newBarcode = generateEAN13();
    setFormData(prev => ({ ...prev, barcode: newBarcode }));
  };

  const calculateMargin = () => {
    const price = parseFloat(formData.price) || 0;
    const cost = parseFloat(formData.cost) || 0;
    if (price > 0 && cost > 0) {
      const margin = ((price - cost) / price) * 100;
      return margin.toFixed(1);
    }
    return '0';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/productos"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
          <p className="text-gray-600 mt-1">Crea un nuevo producto con código de barras</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Información básica</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del producto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Vitamina C 1000mg"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Descripción del producto..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de imagen
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="/products/imagen.jpg"
                />
                <button
                  type="button"
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Codes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Barcode className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Códigos de identificación</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (Código interno) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono ${
                    errors.sku ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="VIT-C-001"
                />
                <button
                  type="button"
                  onClick={handleGenerateSKU}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Generar SKU automático"
                >
                  <RefreshCw className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Código único interno para identificar el producto
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de barras (EAN-13) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  maxLength={13}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono ${
                    errors.barcode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="7701234567890"
                />
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Generar código de barras"
                >
                  <RefreshCw className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Código EAN-13 para escaneo con lector de barras
              </p>
            </div>
          </div>

          {/* Barcode preview */}
          {formData.barcode && formData.barcode.length === 13 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Vista previa del código de barras:</p>
              <div className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex h-12 gap-px">
                  {formData.barcode.split('').map((digit, i) => (
                    <div
                      key={i}
                      className={`h-10 ${parseInt(digit) % 2 === 0 ? 'bg-black' : 'bg-gray-800'}`}
                      style={{ width: parseInt(digit) % 3 === 0 ? '2px' : '1px' }}
                    />
                  ))}
                </div>
                <p className="mt-2 font-mono text-sm tracking-widest">{formData.barcode}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Precios y costos</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de venta (COP) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="45000"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo (COP) *
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.cost ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="25000"
              />
              {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Margen de ganancia
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                <span className={`font-medium ${parseFloat(calculateMargin()) > 30 ? 'text-green-600' : parseFloat(calculateMargin()) > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {calculateMargin()}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Inventario</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock inicial *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="50"
              />
              {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock mínimo
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="10"
              />
              <p className="mt-1 text-xs text-gray-500">Alerta cuando el stock baje de este valor</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock máximo
              </label>
              <input
                type="number"
                name="maxStock"
                value={formData.maxStock}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="100"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Estado del producto</h3>
              <p className="text-sm text-gray-600">Los productos activos son visibles en la tienda</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {formData.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/productos"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Crear producto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
