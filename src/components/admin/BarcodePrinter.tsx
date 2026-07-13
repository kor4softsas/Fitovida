'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Download, Eye, EyeOff } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import type { InventoryProduct } from '@/types/admin';

// --- Fixed thermal label format (57 mm adhesive roll) -------------------------
// landscape: browser sends 57.5×30 → printer prints as-is
// portrait:  browser sends 30×57.5 → printer rotates 90° → result is correct 57.5×30 label
const ORIENT = {
  landscape: { pageW: 57.5, pageH: 30,   contentW: 54, contentH: 30   },
  portrait:  { pageW: 30,   pageH: 57.5,  contentW: 28, contentH: 55   },
} as const;

type Orientation = keyof typeof ORIENT;

const PORTAL_ID = '__fv-thermal-labels__';
const STYLE_ID  = '__fv-thermal-print-style__';

// --- Types --------------------------------------------------------------------

interface BarcodePrinterProps {
  products: InventoryProduct[];
  onClose: () => void;
}

// --- Single label (landscape) -------------------------------------------------

function BarcodeLabelLandscape({ product }: { product: InventoryProduct }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const d = ORIENT.landscape;

  useEffect(() => {
    if (!svgRef.current || !product.barcode) return;
    try {
      JsBarcode(svgRef.current, product.barcode, {
        format: 'CODE128', width: 2, height: 26, displayValue: false, margin: 0,
      });
    } catch (err) { console.error('JsBarcode error:', err); }
  }, [product.barcode]);

  return (
    <div style={{ width: `${d.contentW}mm`, height: `${d.contentH}mm`, backgroundColor: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      padding: '0.5mm 0.8mm', overflow: 'hidden', fontFamily: 'Arial,sans-serif',
      color: '#111', boxSizing: 'border-box' }}>
      <div style={{ fontSize: '8px', fontWeight: 'bold', textAlign: 'center', width: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.3mm' }}>
        {product.name}
      </div>
      {product.sku && <div style={{ fontSize: '6.5px', marginBottom: '0.3mm' }}>SKU: {product.sku}</div>}
      <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
      <div style={{ fontSize: '6.8px', fontFamily: 'monospace' }}>{product.barcode}</div>
      <div style={{ fontSize: '7px', fontWeight: 'bold', marginTop: '0.3mm',
        borderTop: '1px solid #ccc', paddingTop: '0.2mm' }}>
        ${product.salePrice.toLocaleString('es-CO')}
      </div>
    </div>
  );
}

// --- Single label (portrait – for drivers that rotate 90°) -------------------

function BarcodeLabelPortrait({ product }: { product: InventoryProduct }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const d = ORIENT.portrait;

  useEffect(() => {
    if (!svgRef.current || !product.barcode) return;
    try {
      JsBarcode(svgRef.current, product.barcode, {
        format: 'CODE128', width: 1.5, height: 20, displayValue: false, margin: 0,
      });
    } catch (err) { console.error('JsBarcode error:', err); }
  }, [product.barcode]);

  return (
    <div style={{ width: `${d.contentW}mm`, height: `${d.contentH}mm`, backgroundColor: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '1mm', overflow: 'hidden', fontFamily: 'Arial,sans-serif',
      color: '#111', boxSizing: 'border-box', gap: '0.5mm' }}>
      <div style={{ fontSize: '7.5px', fontWeight: 'bold', textAlign: 'center', width: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {product.name}
      </div>
      {product.sku && <div style={{ fontSize: '6px' }}>SKU: {product.sku}</div>}
      <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto' }} />
      <div style={{ fontSize: '6px', fontFamily: 'monospace' }}>{product.barcode}</div>
      <div style={{ fontSize: '7px', fontWeight: 'bold', borderTop: '1px solid #ccc',
        paddingTop: '0.5mm', width: '100%', textAlign: 'center' }}>
        ${product.salePrice.toLocaleString('es-CO')}
      </div>
    </div>
  );
}

function BarcodeLabel({ product, orientation }: { product: InventoryProduct; orientation: Orientation }) {
  return orientation === 'portrait'
    ? <BarcodeLabelPortrait product={product} />
    : <BarcodeLabelLandscape product={product} />;
}

// --- Main component -----------------------------------------------------------

export default function BarcodePrinter({ products, onClose }: BarcodePrinterProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(products.map(p => p.id));
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, 1]))
  );
  const [showPreview, setShowPreview] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('portrait'); // portrait = fix for 90° driver rotation
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPortalReady(true); }, []);

  const toPrint = products.filter(p => selectedIds.includes(p.id) && p.barcode);
  const orient = ORIENT[orientation];

  const labelList = (keyPrefix: string) =>
    toPrint.flatMap((product, i) =>
      Array.from({ length: qty[product.id] || 1 }, (_, q) => (
        <BarcodeLabel key={`${keyPrefix}-${i}-${q}`} product={product} orientation={orientation} />
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
        @page { size: ${orient.pageW}mm ${orient.pageH}mm; margin: 0; }
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
            width: `${orient.pageW}mm`,
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
              <div className="flex-1">
                <p className="text-sm font-bold text-[#005236]">Impresora t&eacute;rmica &mdash; papel adhesivo 57 mm</p>
                <p className="text-xs text-[#414844]">Si el preview del navegador tarda, haz clic en <strong>Imprimir</strong> directamente sin esperar.</p>
              </div>
              {/* Orientation toggle */}
              <div className="ml-auto flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-[#414844]">Orientaci&oacute;n de impresi&oacute;n</span>
                <div className="flex rounded-full border border-[#cce6d0] bg-white p-0.5">
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                      orientation === 'landscape' ? 'bg-[#005236] text-white' : 'text-[#414844] hover:bg-[#f2f4f3]'
                    }`}
                  >
                    Horizontal
                  </button>
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                      orientation === 'portrait' ? 'bg-[#005236] text-white' : 'text-[#414844] hover:bg-[#f2f4f3]'
                    }`}
                  >
                    Vertical ✓
                  </button>
                </div>
                <span className="text-xs text-[#414844]">
                  {orientation === 'portrait' ? 'Corrige rotación del driver térmico' : 'Impresión directa sin rotación'}
                </span>
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
