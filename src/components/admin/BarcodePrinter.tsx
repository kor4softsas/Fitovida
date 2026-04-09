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
  title: string;
  description: string;
  width: number; // en mm
  height: number; // en mm
  paperWidth?: number; // ancho real del papel en mm
  contentWidth?: number; // ancho imprimible en mm
  columns: number;
  rows: number;
  marginTop: number;
  marginLeft: number;
  spacingX: number;
  spacingY: number;
  kind: 'sheet' | 'thermal';
}

// Formatos predefinidos
const FORMATS: Record<string, LabelFormat> = {
  '4x6': {
    title: '4 x 6 pulgadas',
    description: 'Etiqueta grande para impresión estándar',
    width: 101.6, // 4 pulgadas en mm
    height: 152.4, // 6 pulgadas en mm
    columns: 1,
    rows: 1,
    marginTop: 5,
    marginLeft: 5,
    spacingX: 0,
    spacingY: 0,
    kind: 'sheet'
  },
  'A4-4x2': {
    title: 'A4 - 4 x 2',
    description: '4 columnas por 2 filas',
    width: 50,
    height: 76.2,
    columns: 4,
    rows: 2,
    marginTop: 10,
    marginLeft: 5,
    spacingX: 3,
    spacingY: 3,
    kind: 'sheet'
  },
  'A4-3x3': {
    title: 'A4 - 3 x 3',
    description: '3 columnas por 3 filas',
    width: 65,
    height: 60,
    columns: 3,
    rows: 3,
    marginTop: 10,
    marginLeft: 10,
    spacingX: 3,
    spacingY: 5,
    kind: 'sheet'
  },
  '58x32.76': {
    title: '58 x 32.76 mm',
    description: 'Rollo térmico compacto',
    width: 58,
    height: 32.76,
    paperWidth: 57.5,
    contentWidth: 48,
    columns: 1,
    rows: 1,
    marginTop: 0,
    marginLeft: 0,
    spacingX: 0,
    spacingY: 0,
    kind: 'thermal'
  },
  '58x29.7': {
    title: '58 x 29.7 mm',
    description: 'Rollo térmico corto',
    width: 58,
    height: 29.7,
    paperWidth: 57.5,
    contentWidth: 48,
    columns: 1,
    rows: 1,
    marginTop: 0,
    marginLeft: 0,
    spacingX: 0,
    spacingY: 0,
    kind: 'thermal'
  },
  '58x42': {
    title: '58 x 42 mm',
    description: 'Rollo térmico amplio',
    width: 58,
    height: 42,
    paperWidth: 57.5,
    contentWidth: 48,
    columns: 1,
    rows: 1,
    marginTop: 0,
    marginLeft: 0,
    spacingX: 0,
    spacingY: 0,
    kind: 'thermal'
  },
  'JK-58PL-50x30': {
    title: 'JK-58PL 50 x 30 mm',
    description: 'Rollo incluido, optimizado para 48 mm de impresión',
    width: 50,
    height: 30,
    paperWidth: 57.5,
    contentWidth: 48,
    columns: 1,
    rows: 1,
    marginTop: 0,
    marginLeft: 0,
    spacingX: 0,
    spacingY: 0,
    kind: 'thermal'
  }
};

const THERMAL_FORMATS = new Set<keyof typeof FORMATS>(['58x32.76', '58x29.7', '58x42', 'JK-58PL-50x30']);

function BarcodeLabel({
  product,
  format
}: {
  product: InventoryProduct;
  format: LabelFormat;
}) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const isThermal = format.kind === 'thermal';
  const contentWidth = format.contentWidth ?? format.width;

  useEffect(() => {
    if (barcodeRef.current && product.barcode) {
      try {
        const isCompactThermal = format.height <= 30;
        const barcodeHeight = isCompactThermal ? 14 : 20;
        JsBarcode(barcodeRef.current, product.barcode, {
          format: 'CODE128',
          width: isThermal ? (isCompactThermal ? 1.15 : 1.3) : 2,
          height: isThermal ? barcodeHeight : 40,
          displayValue: !isThermal,
          margin: isThermal ? 0 : 5,
          fontSize: isThermal ? 9 : 12,
          textMargin: isThermal ? 0 : 5
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [product.barcode, format, isThermal]);

  return (
    <div
      style={{
        width: `${contentWidth}mm`,
        height: `${format.height}mm`,
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        backgroundColor: '#ffffff',
        border: isThermal ? 'none' : '1px solid #d1d5db',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isThermal ? '1mm' : '2mm',
        overflow: 'hidden',
        color: '#111827',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Nombre del producto */}
      <div style={{ textAlign: 'center', marginBottom: '1px', fontSize: isThermal ? '6px' : '8px', fontWeight: 'bold', lineHeight: '1', width: '100%' }}>
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
            <div style={{ fontSize: isThermal ? '5.5px' : '7px', marginBottom: '1px' }}>

      {/* SKU */}
      {product.sku && (
        <div style={{ fontSize: isThermal ? '6px' : '7px', marginBottom: '2px' }}>
          <span>SKU: {product.sku}</span>
        </div>
      )}

      {/* Código de barras */}
      <svg
        ref={barcodeRef}
        style={{
          maxWidth: '100%',
          height: 'auto',
          margin: isThermal ? '0.5px 0' : '2px 0'
        }}
      />

      {/* Código visible debajo */}
      <div style={{ fontSize: isThermal ? '5.5px' : '7px', fontFamily: 'monospace', marginTop: '0px' }}>
        {product.barcode}
      </div>

      {/* Precio */}
      <div
        style={{
          fontSize: isThermal ? '6px' : '8px',
          fontWeight: 'bold',
          marginTop: '1px',
          borderTop: '1px solid #ccc',
          paddingTop: '1px'
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
  const [selectedFormat, setSelectedFormat] = useState<keyof typeof FORMATS>('JK-58PL-50x30');
  const [printQty, setPrintQty] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, 1]))
  );
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const format = FORMATS[selectedFormat];
  const isThermalFormat = THERMAL_FORMATS.has(selectedFormat);
  const paperWidth = format.paperWidth ?? format.width;
  const contentWidth = format.contentWidth ?? format.width;
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
            size: ${isThermalFormat ? `${paperWidth}mm ${format.height}mm` : 'A4'};
            margin: 0;
          }
          .print-container {
            display: ${isThermalFormat ? 'flex' : 'grid'};
            flex-direction: ${isThermalFormat ? 'column' : 'initial'};
            grid-template-columns: repeat(${format.columns}, ${format.width}mm);
            gap: ${format.spacingX}mm ${format.spacingY}mm;
            padding: ${format.marginTop}mm ${format.marginLeft}mm;
            width: ${isThermalFormat ? `${paperWidth}mm` : `${(format.columns * format.width) + (format.marginLeft * 2)}mm`};
            ${isThermalFormat ? 'align-items: center;' : ''}
          }
          .print-container > div {
            page-break-inside: avoid;
            break-inside: avoid;
            ${isThermalFormat ? 'page-break-after: always; break-after: page;' : ''}
          }
          .print-container > div:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          ${isThermalFormat ? `
          .print-container > div {
            border: none !important;
            margin: 0 auto;
          }
          ` : ''}
          .print-container svg {
            max-width: 100%;
            height: auto;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2.5rem] bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e6e9e8] bg-white p-8">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-[#012d1d]">
            <Printer size={24} />
            Imprimir Etiquetas de Código de Barras
          </h2>
          <button onClick={onClose} className="text-[#414844] transition-colors hover:text-[#012d1d]">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 p-8">
          {/* Opciones de impresión */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Selección de productos */}
            <div className="space-y-3 rounded-[1.5rem] bg-[#f2f4f3] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#012d1d]">Productos</h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-bold text-[#005236] transition-colors hover:text-[#003d2d]"
                >
                  {selectedProducts.length === products.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {products.map(product => (
                  <label key={product.id} className="flex cursor-pointer items-center gap-2 rounded-xl bg-white p-2 transition-colors hover:bg-[#e6e9e8]">
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
                      className="h-4 w-4 rounded border-[#c7cdc9] text-[#005236] focus:ring-[#005236]"
                    />
                    <span className="text-sm text-[#012d1d]">
                      {product.name}
                      {!product.barcode && (
                        <span className="text-[#ba1a1a]"> (sin código)</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Formato de etiqueta */}
            <div className="space-y-3 rounded-[1.5rem] bg-[#f2f4f3] p-5">
              <h3 className="font-bold text-[#012d1d]">Formato</h3>
              <div className="space-y-2">
                {Object.entries(FORMATS).map(([key, fmt]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl bg-white p-2 transition-colors hover:bg-[#e6e9e8]">
                    <input
                      type="radio"
                      name="format"
                      value={key}
                      checked={selectedFormat === key}
                      onChange={(e) => setSelectedFormat(e.target.value as keyof typeof FORMATS)}
                      className="h-4 w-4 border-[#c7cdc9] text-[#012d1d] focus:ring-[#005236]"
                    />
                    <span className="text-sm text-[#012d1d]">
                      {fmt.title}
                      <span className="block text-xs text-[#414844]">
                        {fmt.description} · {fmt.width}mm × {fmt.height}mm ({fmt.columns}×{fmt.rows})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div className="space-y-3 rounded-[1.5rem] bg-[#f2f4f3] p-5">
              <h3 className="font-bold text-[#012d1d]">Cantidad por Producto</h3>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {selectedProducts.map(productId => {
                  const product = products.find(p => p.id === productId);
                  if (!product || !product.barcode) return null;
                  return (
                    <div key={productId} className="flex items-center gap-2 rounded-xl bg-white p-2">
                      <span className="flex-1 truncate text-sm text-[#012d1d]">{product.name}</span>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={printQty[productId] || 1}
                        onChange={(e) => setPrintQty({
                          ...printQty,
                          [productId]: parseInt(e.target.value) || 1
                        })}
                        className="w-14 rounded-lg border border-[#e6e9e8] px-2 py-1 text-sm text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3 border-t border-[#e6e9e8] pt-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 rounded-full border border-[#e6e9e8] bg-[#f2f4f3] px-4 py-2 font-bold text-[#414844] transition-colors hover:bg-[#e6e9e8]"
            >
              <Eye size={20} />
              {showPreview ? 'Ocultar' : 'Vista previa'}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleDownloadPDF}
              disabled={productsToprint.length === 0}
              className="flex items-center gap-2 rounded-full bg-[#3f51d7] px-5 py-2 font-bold text-white transition-colors hover:bg-[#3140b1] disabled:cursor-not-allowed disabled:bg-[#9da6e4]"
            >
              <Download size={20} />
              Descargar PNG
            </button>
            <button
              onClick={handlePrint}
              disabled={productsToprint.length === 0}
              className="flex items-center gap-2 rounded-full bg-[#009a63] px-5 py-2 font-bold text-white transition-colors hover:bg-[#007f52] disabled:cursor-not-allowed disabled:bg-[#9fd3bf]"
            >
              <Printer size={20} />
              Imprimir
            </button>
          </div>

          {/* Vista previa */}
          {showPreview && (
            <div className="space-y-4 border-t border-[#e6e9e8] pt-4">
              <h3 className="mb-1 font-bold text-[#012d1d]">Vista Previa</h3>
              <div
                ref={printRef}
                style={{
                  overflow: 'auto',
                  backgroundColor: '#f2f4f3',
                  padding: '1rem',
                  borderRadius: '1.25rem',
                  color: '#111827',
                  fontFamily: 'Arial, sans-serif',
                  display: isThermalFormat ? 'flex' : 'grid',
                  flexDirection: isThermalFormat ? 'column' : 'initial',
                  alignItems: isThermalFormat ? 'center' : 'stretch',
                  gridTemplateColumns: isThermalFormat ? undefined : `repeat(${format.columns}, ${contentWidth}mm)`,
                  gap: `${format.spacingX}mm ${format.spacingY}mm`,
                  width: isThermalFormat ? `${paperWidth}mm` : 'auto'
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
            <div className="rounded-[1rem] border border-[#b9c9e8] bg-[#e9effb] p-4 text-sm text-[#2d3da5]">
              <p className="mb-2 font-bold">Informacion:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Selecciona los productos que deseas imprimir</li>
                <li>Elige el formato de etiqueta según tu papel o rollo térmico</li>
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
