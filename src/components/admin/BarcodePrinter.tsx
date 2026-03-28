'use client';

import { useState, useRef, useEffect } from 'react';
import { Printer, X, Download, Eye } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import type { InventoryProduct } from '@/types/admin';

interface BarcodePrinterProps {
  products: InventoryProduct[];
  onClose: () => void;
}

interface LabelFormat {
  width: number; // en mm
  height: number; // en mm
  columns: number;
  rows: number;
  marginTop: number;
  marginLeft: number;
  spacingX: number;
  spacingY: number;
}

// Formatos predefinidos
const FORMATS: Record<string, LabelFormat> = {
  '4x6': {
    width: 101.6, // 4 pulgadas en mm
    height: 152.4, // 6 pulgadas en mm
    columns: 1,
    rows: 1,
    marginTop: 5,
    marginLeft: 5,
    spacingX: 0,
    spacingY: 0
  },
  'A4-4x2': {
    width: 50,
    height: 76.2,
    columns: 4,
    rows: 2,
    marginTop: 10,
    marginLeft: 5,
    spacingX: 3,
    spacingY: 3
  },
  'A4-3x3': {
    width: 65,
    height: 60,
    columns: 3,
    rows: 3,
    marginTop: 10,
    marginLeft: 10,
    spacingX: 3,
    spacingY: 5
  }
};

function BarcodeLabel({
  product,
  format
}: {
  product: InventoryProduct;
  format: LabelFormat;
}) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && product.barcode) {
      try {
        JsBarcode(barcodeRef.current, product.barcode, {
          format: 'CODE128',
          width: 2,
          height: 40,
          displayValue: true,
          margin: 5
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [product.barcode]);

  const widthCm = (format.width / 10).toFixed(1);
  const heightCm = (format.height / 10).toFixed(1);

  return (
    <div
      style={{
        width: `${format.width}mm`,
        height: `${format.height}mm`,
        pageBreakInside: 'avoid',
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2mm',
        overflow: 'hidden',
        color: '#111827',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Nombre del producto */}
      <div style={{ textAlign: 'center', marginBottom: '2px', fontSize: '8px', fontWeight: 'bold', lineHeight: '1', width: '100%' }}>
        <p
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}
        >
          {product.name}
        </p>
      </div>

      {/* SKU */}
      {product.sku && (
        <div style={{ fontSize: '7px', marginBottom: '2px' }}>
          <span>SKU: {product.sku}</span>
        </div>
      )}

      {/* Código de barras */}
      <svg
        ref={barcodeRef}
        style={{
          maxWidth: '100%',
          height: 'auto',
          margin: '2px 0'
        }}
      />

      {/* Código visible debajo */}
      <div style={{ fontSize: '7px', fontFamily: 'monospace', marginTop: '1px' }}>
        {product.barcode}
      </div>

      {/* Precio */}
      <div
        style={{
          fontSize: '8px',
          fontWeight: 'bold',
          marginTop: '2px',
          borderTop: '1px solid #ccc',
          paddingTop: '2px'
        }}
      >
        ${product.salePrice.toLocaleString('es-CO')}
      </div>
    </div>
  );
}

export default function BarcodePrinter({ products, onClose }: BarcodePrinterProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    products.map(p => p.id)
  );
  const [selectedFormat, setSelectedFormat] = useState<keyof typeof FORMATS>('4x6');
  const [printQty, setPrintQty] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, 1]))
  );
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const format = FORMATS[selectedFormat];
  const productsToprint = products.filter(
    p => selectedProducts.includes(p.id) && p.barcode
  );

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handlePrint = async () => {
    if (!printRef.current) {
      setShowPreview(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!printRef.current) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert('No se pudo abrir la ventana de impresión');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Imprimir Etiquetas de Código de Barras</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            padding: 0;
            font-family: Arial, sans-serif;
          }
          @page {
            size: ${selectedFormat === '4x6' ? 'label-4x6' : 'A4'};
            margin: 0;
          }
          .print-container {
            display: grid;
            grid-template-columns: repeat(${format.columns}, ${format.width}mm);
            gap: ${format.spacingX}mm ${format.spacingY}mm;
            padding: ${format.marginTop}mm ${format.marginLeft}mm;
            width: ${(format.columns * format.width) + (format.marginLeft * 2)}mm;
          }
          .label {
            width: ${format.width}mm;
            height: ${format.height}mm;
            border: 1px solid #ccc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2mm;
            font-family: Arial, sans-serif;
            page-break-inside: avoid;
          }
          .label-title {
            font-size: 8px;
            font-weight: bold;
            text-align: center;
            line-height: 1;
            margin-bottom: 2px;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .label-sku {
            font-size: 7px;
            margin-bottom: 2px;
          }
          .label-barcode {
            margin: 2px 0;
          }
          .label-barcode svg {
            max-width: 100%;
            height: auto;
          }
          .label-code {
            font-size: 7px;
            font-family: monospace;
            margin-top: 1px;
          }
          .label-price {
            font-size: 8px;
            font-weight: bold;
            margin-top: 2px;
            border-top: 1px solid #ccc;
            padding-top: 2px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${printRef.current.innerHTML}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) {
      setShowPreview(true);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!printRef.current) return;

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `etiquetas-codigos-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Error al descargar la imagen');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-8 border-b border-[#e6e9e8] flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-[#012d1d] flex items-center gap-2">
            <Printer size={24} />
            Imprimir Etiquetas de Código de Barras
          </h2>
          <button onClick={onClose} className="text-[#414844] hover:text-[#012d1d]">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Opciones de impresión */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Selección de productos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#012d1d]">Productos</h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-[#005236] hover:text-[#003d2d] font-bold"
                >
                  {selectedProducts.length === products.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {products.map(product => (
                  <label key={product.id} className="flex items-center gap-2 cursor-pointer hover:bg-[#f2f4f3] p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        }
                      }}
                      className="rounded border-[#414844] text-[#005236] focus:ring-[#005236]"
                    />
                    <span className="text-sm text-[#012d1d]">
                      {product.name}
                      {!product.barcode && (
                        <span className="text-[#ba1a1a] font-bold"> (sin código)</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Formato de etiqueta */}
            <div className="space-y-3">
              <h3 className="font-bold text-[#012d1d]">Formato</h3>
              <div className="space-y-2">
                {Object.entries(FORMATS).map(([key, fmt]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-[#f2f4f3] p-2 rounded">
                    <input
                      type="radio"
                      name="format"
                      value={key}
                      checked={selectedFormat === key}
                      onChange={(e) => setSelectedFormat(e.target.value as keyof typeof FORMATS)}
                      className="border-[#414844] text-[#005236] focus:ring-[#005236]"
                    />
                    <span className="text-sm text-[#012d1d]">
                      {key}
                      <span className="text-[#414844] text-xs block">
                        {fmt.width}mm × {fmt.height}mm ({fmt.columns}×{fmt.rows})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div className="space-y-3">
              <h3 className="font-bold text-[#012d1d]">Cantidad por Producto</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedProducts.map(productId => {
                  const product = products.find(p => p.id === productId);
                  if (!product || !product.barcode) return null;
                  return (
                    <div key={productId} className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate text-[#012d1d]">{product.name}</span>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={printQty[productId] || 1}
                        onChange={(e) => setPrintQty({
                          ...printQty,
                          [productId]: parseInt(e.target.value) || 1
                        })}
                        className="w-12 px-2 py-1 border border-[#e6e9e8] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#005236]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 border-t border-[#e6e9e8] pt-6">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-[#e6e9e8] rounded-full hover:bg-[#f2f4f3] transition-colors text-[#414844] font-bold"
            >
              <Eye size={20} />
              {showPreview ? 'Ocultar' : 'Vista previa'}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleDownloadPDF}
              disabled={productsToprint.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#cce6d0] text-[#506856] rounded-full hover:bg-[#b3d4ba] transition-colors disabled:bg-[#a0a8a2] disabled:text-white font-bold"
            >
              <Download size={20} />
              Descargar PNG
            </button>
            <button
              onClick={handlePrint}
              disabled={productsToprint.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#a0f4c8] text-[#005236] rounded-full hover:bg-[#85e0b1] transition-colors disabled:bg-[#a0a8a2] disabled:text-white font-bold"
            >
              <Printer size={20} />
              Imprimir
            </button>
          </div>

          {/* Vista previa */}
          {showPreview && (
            <div className="border-t border-[#e6e9e8] pt-6">
              <h3 className="font-bold text-[#012d1d] mb-4">Vista Previa</h3>
              <div
                ref={printRef}
                style={{
                  overflow: 'auto',
                  backgroundColor: '#f2f4f3',
                  padding: '1rem',
                  borderRadius: '1.5rem',
                  color: '#012d1d',
                  fontFamily: 'Arial, sans-serif',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${format.columns}, ${format.width}mm)`,
                  gap: `${format.spacingX}mm ${format.spacingY}mm`
                }}
              >
                {productsToprint.map((product, idx) =>
                  Array.from({ length: printQty[product.id] || 1 }).map((_, qty) => (
                    <BarcodeLabel
                      key={`${idx}-${qty}`}
                      product={product}
                      format={format}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Información */}
          {!showPreview && (
            <div className="bg-[#f0fdf9] border border-[#a0f4c8] rounded-[1.5rem] p-4 text-sm text-[#005236]">
              <p className="font-bold mb-2">ℹ️ Información:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Selecciona los productos que deseas imprimir</li>
                <li>Elige el formato de etiqueta (4x6 para impresoras térmicas)</li>
                <li>Especifica la cantidad de etiquetas por producto</li>
                <li>Haz clic en Vista previa para ver cómo se vería antes de imprimir</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
