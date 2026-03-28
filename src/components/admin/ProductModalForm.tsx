'use client';

import { useState } from 'react';
import {
  X,
  Package,
  Upload,
  Scan,
  Barcode,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import BarcodeInput, { validateBarcodeFormat } from './BarcodeInput';
import type { InventoryProduct } from '@/types/admin';

interface ProductModalFormProps {
  product?: InventoryProduct | null;
  products: InventoryProduct[];
  onClose: () => void;
  onSave: (product: InventoryProduct) => void;
}

export default function ProductModalForm({
  product,
  products,
  onClose,
  onSave
}: ProductModalFormProps) {
  const [formData, setFormData] = useState<Partial<InventoryProduct>>({
    name: product?.name || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    category: product?.category || '',
    description: product?.description || '',
    currentStock: product?.currentStock || 0,
    minStock: product?.minStock || 5,
    maxStock: product?.maxStock || undefined,
    unitCost: product?.unitCost || 0,
    salePrice: product?.salePrice || 0,
    taxRate: product?.taxRate || 19,
    supplier: product?.supplier || '',
    status: product?.status || 'active',
    image: product?.image || ''
  });

  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.image || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [barcodeMessage, setBarcodeMessage] = useState('');

  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(!!product?.sku);

  // Generar SKU automático
  const generateSKUFromName = (name: string) => {
    if (!name) return '';
    const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const words = normalized.trim().split(/\s+/);
    const significantWords = words.filter(word => word.length > 2 || /^\d+/.test(word));
    const targetWords = significantWords.length > 0 ? significantWords : words;
    
    return targetWords.map(word => {
      const cleanWord = word.replace(/[^A-Za-z0-9]/g, '');
      if (!cleanWord) return '';
      if (/^\d/.test(cleanWord)) {
        return cleanWord.toUpperCase().substring(0, 4);
      }
      return cleanWord.substring(0, 3).toUpperCase();
    }).filter(part => part.length > 0).join('-').substring(0, 20);
  };

  // Manejo de carga de imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageError('');

    try {
      const formDataImg = new FormData();
      formDataImg.append('file', file);
      formDataImg.append('productId', product?.id || 'new');

      const response = await fetch('/api/admin/inventory/upload-image', {
        method: 'POST',
        body: formDataImg
      });

      if (!response.ok) {
        const error = await response.json();
        setImageError(error.error || 'Error al subir la imagen');
        return;
      }

      const data = await response.json();
      setFormData({ ...formData, image: data.imagePath });
      setImagePreview(data.imagePath);
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageError('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  // Generar código de barras automático
  const handleGenerateBarcode = async (format: 'EAN-13' | 'CODE128' = 'EAN-13') => {
    setGeneratingBarcode(true);
    setBarcodeMessage('');
    setBarcodeError('');

    try {
      const response = await fetch('/api/admin/inventory/generate-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id || 'new',
          format
        })
      });

      if (!response.ok) {
        const error = await response.json();
        setBarcodeError(error.error || 'Error al generar código');
        return;
      }

      const data = await response.json();
      setFormData({ ...formData, barcode: data.barcode });
      setBarcodeFormat(data.format);
      setBarcodeMessage(`✓ ${data.format} generado: ${data.barcode}`);

      setTimeout(() => setBarcodeMessage(''), 3000);
    } catch (error) {
      console.error('Error generating barcode:', error);
      setBarcodeError('Error al generar código de barras');
    } finally {
      setGeneratingBarcode(false);
    }
  };

  // Regenerar código si es duplicado
  const handleRegenerateBarcode = async () => {
    setGeneratingBarcode(true);
    setBarcodeMessage('');
    setBarcodeError('');

    try {
      const response = await fetch(
        `/api/admin/inventory/generate-barcode?productId=${product?.id || 'new'}&currentBarcode=${formData.barcode}&format=${barcodeFormat === 'Code128' ? 'CODE128' : 'EAN-13'}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error = await response.json();
        setBarcodeError(error.error || 'Error al regenerar código');
        return;
      }

      const data = await response.json();
      setFormData({ ...formData, barcode: data.barcode });
      setBarcodeFormat(data.format);
      setBarcodeMessage(`✓ Código regenerado: ${data.barcode}`);

      setTimeout(() => setBarcodeMessage(''), 3000);
    } catch (error) {
      console.error('Error regenerating barcode:', error);
      setBarcodeError('Error al regenerar código de barras');
    } finally {
      setGeneratingBarcode(false);
    }
  };

  const handleBarcodeChange = (value: string) => {
    setFormData({ ...formData, barcode: value });
    setBarcodeError('');
    setBarcodeMessage('');
    setBarcodeFormat(null);
  };

  const handleBarcodeScan = (barcode: string) => {
    const validation = validateBarcodeFormat(barcode);

    if (!validation.isValid) {
      setBarcodeError(validation.message);
      return;
    }

    const exists = products.some(
      p => p.barcode === barcode && p.id !== product?.id
    );

    if (exists) {
      setBarcodeError('Este código de barras ya está registrado');
      return;
    }

    setBarcodeFormat(validation.format);
    setBarcodeMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda - Imagen */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Upload size={20} />
                  Imagen del Producto
                </h3>

                <div className="relative">
                  {imagePreview ? (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData({ ...formData, image: '' });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 text-center">
                        Sube una imagen
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {uploadingImage && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Subiendo...</span>
                  </div>
                )}

                {imageError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                    <AlertCircle size={16} />
                    {imageError}
                  </div>
                )}

                {imagePreview && !uploadingImage && (
                  <label className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 text-sm font-medium text-center">
                    Cambiar imagen
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Columna Central y Derecha - Formulario */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={20} />
                  Información Básica
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const updates: Partial<InventoryProduct> = { name: newName };
                        
                        // Generar SKU automáticamente si es un producto nuevo y no se ha editado a mano
                        if (!isSkuManuallyEdited && !product) {
                          updates.sku = generateSKUFromName(newName);
                        }
                        
                        setFormData({ ...formData, ...updates });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      placeholder="Ej: Proteína Whey 2kg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => {
                          setFormData({ ...formData, sku: e.target.value });
                          setIsSkuManuallyEdited(e.target.value.trim() !== '');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        placeholder="PROT-WHE-2K"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        placeholder="Proteínas"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      placeholder="Descripción del producto..."
                    />
                  </div>
                </div>
              </div>

              {/* Código de Barras */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Barcode size={20} className="text-blue-600" />
                    Código de Barras
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleGenerateBarcode('EAN-13')}
                      disabled={generatingBarcode}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {generatingBarcode ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Barcode size={14} />
                      )}
                      Auto EAN-13
                    </button>
                    {formData.barcode && (
                      <button
                        type="button"
                        onClick={handleRegenerateBarcode}
                        disabled={generatingBarcode}
                        className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:bg-gray-400"
                      >
                        {generatingBarcode ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Regenerar
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Escanea o ingresa el código
                  </label>
                  <BarcodeInput
                    value={formData.barcode || ''}
                    onChange={handleBarcodeChange}
                    onScan={handleBarcodeScan}
                    placeholder="Escanea con el lector o ingresa manualmente"
                  />
                </div>

                {barcodeFormat && !barcodeError && !barcodeMessage && (
                  <p className="text-sm text-emerald-600 flex items-center gap-1">
                    <Check size={16} />
                    <span className="font-medium">Formato detectado:</span> {barcodeFormat}
                  </p>
                )}

                {barcodeMessage && (
                  <p className="text-sm text-blue-600 flex items-center gap-1 bg-blue-100 p-2 rounded">
                    <Check size={16} />
                    {barcodeMessage}
                  </p>
                )}

                {barcodeError && (
                  <p className="text-sm text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded">
                    <AlertCircle size={16} />
                    {barcodeError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stock y Precios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Stock</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mínimo *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxStock || ''}
                    onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Precios</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venta *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Proveedor y Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                placeholder="NutriSupply"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'discontinued' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="discontinued">Descontinuado</option>
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              {product ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
