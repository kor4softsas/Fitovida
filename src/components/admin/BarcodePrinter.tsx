'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Download, Eye, EyeOff } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import type { InventoryProduct } from '@/types/admin';

// --- Fixed thermal label format (57 mm adhesive roll) -------------------------
const LABEL = {
  paperWidth: 57.5, // mm — real paper width
  printWidth: 54,   // mm — printable content width (leaves ~1.5 mm margin each side)
  height: 30,       // mm — label height (feed direction)
} as const;

const PORTAL_ID = '__fv-thermal-labels__';
const STYLE_ID  = '__fv-thermal-print-style__';

// --- Types --------------------------------------------------------------------

interface BarcodePrinterProps {
  products: InventoryProduct[];
  onClose: () => void;
}

// --- Single label -------------------------------------------------------------

function BarcodeLabel({ product }: { product: InventoryProduct }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !product.barcode) return;
    try {
      JsBarcode(svgRef.current, product.barcode, {
        format: 'CODE128',
        width: 2,
        height: 26,
        displayValue: false,
        margin: 0,
      });
    } catch (err) {
      console.error('JsBarcode error:', err);
    }
  }, [product.barcode]);

  return (
    <div
      style={{
        width: `${LABEL.printWidth}mm`,
        height: `${LABEL.height}mm`,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0.4mm 0.7mm',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif',
        color: '#111827',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: '8px', fontWeight: 'bold', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.2mm' }}>
        {product.name}
      </div>
      {product.sku && (
        <div style={{ fontSize: '6.5px', marginBottom: '0.2mm' }}>SKU: {product.sku}</div>
      )}
      <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto', margin: '0.1mm 0' }} />
      <div style={{ fontSize: '6.8px', fontFamily: 'monospace' }}>{product.barcode}</div>
      <div style={{ fontSize: '7px', fontWeight: 'bold', marginTop: '0.2mm', borderTop: '1px solid #ccc', paddingTop: '0.2mm' }}>
        ${product.salePrice.toLocaleString('es-CO')}
      </div>
    </div>
  );
}

// --- Main component -----------------------------------------------------------

export default function BarcodePrinter({ products, onClose }: BarcodePrinterProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(products.map(p => p.id));
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, 1]))
  );
  const [showPreview, setShowPreview] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPortalReady(true); }, []);

  const toPrint = products.filter(p => selectedIds.includes(p.id) && p.barcode);

  const labelList = (keyPrefix: string) =>
    toPrint.flatMap((product, i) =>
      Array.from({ length: qty[product.id] || 1 }, (_, q) => (
        <BarcodeLabel key={`${keyPrefix}-${i}-${q}`} product={product} />
      ))
    );

  // -- Print using window.print() + @media print CSS ------------------------
  const handlePrint = () => {
    if (toPrint.length === 0) return;

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    style.textContent = `
      @media print {
        body > *:not(#${PORTAL_ID}) { display: none !important; }
        #${PORTAL_ID} {
          position: static !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        #${PORTAL_ID} > div {
          page-break-after: always !important;
          break-after: page !important;
        }
        #${PORTAL_ID} > div:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        /* size MUST be set so the browser doesn't default to A4 and rotate content */
        @page { size: ${LABEL.paperWidth}mm ${LABEL.height}mm; margin: 0; }
      }
    `;

    window.print();
    setTimeout(() => { document.getElementById(STYLE_ID)?.remove(); }, 1000);
  };

  // -- Download preview as PNG -----------------------------------------------
  const handleDownloadPNG = async () => {
    if (!previewRef.current) {
      setShowPreview(true);
      await new Promise(r => setTimeout(r, 250));
    }
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `etiquetas-${new Date().toISOString().split('T')[0]}.png`;
      a.click();
    } catch (err) {
      console.error('Error al descargar PNG:', err);
    }
  };

  return (
    <>
      {/* Portal: labels always rendered off-screen so JsBarcode is ready before print */}
      {portalReady && createPortal(
        <div
          id={PORTAL_ID}
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {labelList('portal')}
        </div>,
        document.body
      )}

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2.5rem] bg-white">

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e6e9e8] bg-white px-8 py-6">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#012d1d]">
              <Printer size={22} />
              Imprimir Etiquetas
            </h2>
            <button onClick={onClose} className="text-[#414844] transition-colors hover:text-[#012d1d]">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 p-8">

            {/* Thermal info badge */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#cce6d0] bg-[#e7f9ee] px-5 py-3">
              <Printer size={18} className="shrink-0 text-[#005236]" />
              <div>
                <p className="text-sm font-bold text-[#005236]">Impresora t&eacute;rmica &mdash; papel adhesivo 57 mm</p>
                <p className="text-xs text-[#414844]">Etiquetas de {LABEL.printWidth}&nbsp;mm &times; {LABEL.height}&nbsp;mm &mdash; Si el preview del navegador tarda, haz clic en <strong>Imprimir</strong> directamente sin esperar.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Product selection */}
              <div className="space-y-3 rounded-3xl bg-[#f2f4f3] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#012d1d]">Productos</h3>
                  <button
                    onClick={() =>
                      setSelectedIds(selectedIds.length === products.length ? [] : products.map(p => p.id))
                    }
                    className="text-sm font-bold text-[#005236] transition-colors hover:text-[#003d2d]"
                  >
                    {selectedIds.length === products.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </button>
                </div>
                <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                  {products.map(product => (
                    <label
                      key={product.id}
                      className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 transition-colors hover:bg-[#e6e9e8]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={e =>
                          setSelectedIds(prev =>
                            e.target.checked
                              ? [...prev, product.id]
                              : prev.filter(id => id !== product.id)
                          )
                        }
                        className="h-4 w-4 rounded border-[#c7cdc9] text-[#005236] focus:ring-[#005236]"
                      />
                      <span className="text-sm text-[#012d1d]">
                        {product.name}
                        {!product.barcode && (
                          <span className="ml-1 text-xs text-[#ba1a1a]">(sin c&oacute;digo)</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantities */}
              <div className="space-y-3 rounded-3xl bg-[#f2f4f3] p-5">
                <h3 className="font-bold text-[#012d1d]">Cantidad por Producto</h3>
                {toPrint.length === 0 ? (
                  <p className="py-2 text-sm text-[#414844]">Selecciona productos con c&oacute;digo de barras.</p>
                ) : (
                  <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                    {toPrint.map(product => (
                      <div key={product.id} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2">
                        <span className="flex-1 truncate text-sm text-[#012d1d]">{product.name}</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={qty[product.id] || 1}
                          onChange={e =>
                            setQty(prev => ({
                              ...prev,
                              [product.id]: Math.max(1, parseInt(e.target.value) || 1),
                            }))
                          }
                          className="w-14 rounded-lg border border-[#e6e9e8] px-2 py-1 text-center text-sm text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                        />
                        <span className="text-xs text-[#414844]">etiq.</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[#e6e9e8] pt-5">
              <button
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-2 rounded-full border border-[#e6e9e8] bg-[#f2f4f3] px-4 py-2 font-bold text-[#414844] transition-colors hover:bg-[#e6e9e8]"
              >
                {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
              </button>
              <div className="flex-1" />
              <button
                onClick={() => void handleDownloadPNG()}
                disabled={toPrint.length === 0}
                className="flex items-center gap-2 rounded-full bg-[#3f51d7] px-5 py-2 font-bold text-white transition-colors hover:bg-[#3140b1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={18} />
                Descargar PNG
              </button>
              <button
                onClick={handlePrint}
                disabled={toPrint.length === 0}
                className="flex items-center gap-2 rounded-full bg-[#009a63] px-5 py-2 font-bold text-white transition-colors hover:bg-[#007f52] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer size={18} />
                Imprimir ({toPrint.reduce((s, p) => s + (qty[p.id] || 1), 0)} etiq.)
              </button>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="border-t border-[#e6e9e8] pt-5">
                <h3 className="mb-4 font-bold text-[#012d1d]">Vista Previa</h3>
                <div
                  ref={previewRef}
                  className="flex flex-col items-center gap-2 overflow-auto rounded-2xl bg-[#f2f4f3] p-4"
                >
                  {toPrint.length === 0 ? (
                    <p className="text-sm text-[#414844]">No hay productos seleccionados con c&oacute;digo de barras.</p>
                  ) : (
                    labelList('preview')
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
