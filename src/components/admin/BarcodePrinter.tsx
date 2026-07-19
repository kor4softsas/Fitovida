'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Eye, EyeOff, FileDown, Loader2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { Document, Page, Text, Image, pdf, StyleSheet } from '@react-pdf/renderer';
import type { InventoryProduct } from '@/types/admin';

// ── Label PDF dimensions (points: 1mm = 2.8346pt) ────────────────────────────
const MM = 2.8346;
const LW = Math.round(58 * MM);  // 164pt  label width
const LH = Math.round(30 * MM);  // 85pt   label height

const pdfStyles = StyleSheet.create({
  page: { width: LW, height: LH, padding: 3, backgroundColor: '#ffffff',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' },
  name:   { fontSize: 7,   fontFamily: 'Helvetica-Bold', textAlign: 'center', width: '100%' },
  barcode:{ width: '100%', flexGrow: 1, flexShrink: 1, marginVertical: 1, objectFit: 'contain' },
  code:   { fontSize: 5.5, fontFamily: 'Courier',        textAlign: 'center' },
  price:  { fontSize: 7,   fontFamily: 'Helvetica-Bold', textAlign: 'center', width: '100%' },
});

type PdfItem = { name: string; barcodePng: string; barcodeNum: string; price: string };

function LabelDoc({ items }: { items: PdfItem[] }) {
  return (
    <Document>
      {items.map((item, i) => (
        <Page key={i} size={[LW, LH]} style={pdfStyles.page}>
          <Text style={pdfStyles.name}>{item.name}</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={item.barcodePng} style={pdfStyles.barcode} />
          <Text style={pdfStyles.code}>{item.barcodeNum}</Text>
          <Text style={pdfStyles.price}>{item.price}</Text>
        </Page>
      ))}
    </Document>
  );
}

// --- POS-58 thermal receipt printer (58mm continuous roll) -------------------
// landscape: send 58×30 mm  → driver (Landscape orientation) prints directly
//            width = full 58mm roll, height = 30mm per label
// portrait:  send 30×57.5mm → for drivers that rotate 90° before printing
const ORIENT = {
  landscape: { pageW: 58, pageH: 30   }, // POS-58 Landscape: full 58mm roll width
  portrait:  { pageW: 30, pageH: 57.5 }, // for drivers that rotate content
} as const;

type Orientation = keyof typeof ORIENT;

const PORTAL_ID = '__fv-thermal-labels__';

// --- Types --------------------------------------------------------------------

interface BarcodePrinterProps {
  products: InventoryProduct[];
  onClose: () => void;
}

// --- Single label (landscape) -------------------------------------------------

function BarcodeLabelLandscape({ product }: { product: InventoryProduct }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { pageW, pageH } = ORIENT.landscape;

  useEffect(() => {
    if (!svgRef.current || !product.barcode) return;
    try {
      JsBarcode(svgRef.current, product.barcode, {
        format: 'CODE128',
        width: 2,
        height: 55,           // tall bars to fill most of the 30mm label height
        displayValue: false,
        margin: 0,
      });
    } catch (err) { console.error('JsBarcode error:', err); }
  }, [product.barcode]);

  return (
    <div style={{
      width: `${pageW}mm`,
      height: `${pageH}mm`,
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1mm',
      overflow: 'hidden',
      fontFamily: 'Arial,sans-serif',
      color: '#111',
      boxSizing: 'border-box',
      gap: '0.5mm',
    }}>
      {/* Barcode fills most of the label */}
      <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block', flexShrink: 0 }} />
      {/* Name + price on one line below the barcode */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '2mm',
        overflow: 'hidden',
      }}>
        <div style={{
          fontSize: '7px',
          fontWeight: 'bold',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {product.name}
        </div>
        <div style={{ fontSize: '7px', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>
          ${product.salePrice.toLocaleString('es-CO')}
        </div>
      </div>
      {/* Barcode number */}
      <div style={{ fontSize: '6px', fontFamily: 'monospace', textAlign: 'center', width: '100%' }}>
        {product.barcode}
      </div>
    </div>
  );
}

// --- Single label (portrait – for drivers that rotate 90°) -------------------

function BarcodeLabelPortrait({ product }: { product: InventoryProduct }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { pageW, pageH } = ORIENT.portrait;

  useEffect(() => {
    if (!svgRef.current || !product.barcode) return;
    try {
      // height:280 → after scaling to 30mm width the barcode fills ~40mm of portrait height
      // → after 90° rotation fills ~40mm of the 57.5mm physical label width
      JsBarcode(svgRef.current, product.barcode, {
        format: 'CODE128', width: 2, height: 280, displayValue: false, margin: 0,
      });
    } catch (err) { console.error('JsBarcode error:', err); }
  }, [product.barcode]);

  return (
    <div style={{
      width: `${pageW}mm`,
      height: `${pageH}mm`,
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      // space-between: spreads content across full 57.5mm portrait height
      // → after rotation fills the full physical label width
      justifyContent: 'space-between',
      padding: '1mm 0.5mm',
      overflow: 'hidden',
      fontFamily: 'Arial,sans-serif',
      color: '#111',
      boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: '8px', fontWeight: 'bold', textAlign: 'center', width: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {product.name}
      </div>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      <div style={{ fontSize: '6.5px', fontFamily: 'monospace', textAlign: 'center' }}>
        {product.barcode}
      </div>
      <div style={{ fontSize: '7.5px', fontWeight: 'bold', textAlign: 'center', width: '100%' }}>
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
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Delay portal to client-side only
  useEffect(() => {
    const id = setTimeout(() => setPortalReady(true), 0);
    return () => clearTimeout(id);
  }, []);

  const toPrint = products.filter(p => selectedIds.includes(p.id) && p.barcode);

  const labelList = (keyPrefix: string) =>
    toPrint.flatMap((product, i) =>
      Array.from({ length: qty[product.id] || 1 }, (_, q) => (
        <BarcodeLabel key={`${keyPrefix}-${i}-${q}`} product={product} orientation={orientation} />
      ))
    );

  // -- Print via window.print() (fallback) -----------------------------------
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePrint = () => {
    if (toPrint.length === 0) return;

    const portal = document.getElementById(PORTAL_ID);
    if (!portal) return;

    const { pageW, pageH } = ORIENT[orientation];
    const PRINT_DIV = '__fv-print-area__';
    const PRINT_CSS  = '__fv-print-css__';

    // Remove stale elements
    document.getElementById(PRINT_DIV)?.remove();
    document.getElementById(PRINT_CSS)?.remove();

    // Create a normal (non-fixed) div in the body with the pre-rendered labels
    const div = document.createElement('div');
    div.id = PRINT_DIV;
    div.innerHTML = portal.innerHTML;
    document.body.appendChild(div);

    const style = document.createElement('style');
    style.id = PRINT_CSS;
    style.textContent = `
      /* Hide on screen */
      #${PRINT_DIV} { display: none; }
      @media print {
        /* Show only labels */
        body > *:not(#${PRINT_DIV}) { display: none !important; }
        #${PRINT_DIV} { display: block !important; margin: 0; padding: 0; }
        #${PRINT_DIV} > div {
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        #${PRINT_DIV} > div:last-child { page-break-after: auto; break-after: auto; }
        svg { display: block !important; width: 100% !important; height: auto !important; }
        /* Use exact label dimensions — Chrome will respect this with the POS-58 driver */
        @page { size: ${pageW}mm ${pageH}mm; margin: 0; }
      }
    `;
    document.head.appendChild(style);

    window.print();

    setTimeout(() => {
      document.getElementById(PRINT_DIV)?.remove();
      document.getElementById(PRINT_CSS)?.remove();
    }, 1000);
  };

  // -- Generate PDF, open in new tab, auto-trigger print dialog ---------------
  const handleGeneratePDF = async () => {
    if (toPrint.length === 0) return;
    setGeneratingPDF(true);
    try {
      const items: PdfItem[] = [];
      for (const product of toPrint) {
        const count = qty[product.id] || 1;
        for (let i = 0; i < count; i++) {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, product.barcode!, {
            format: 'CODE128', width: 3, height: 120,
            margin: 5, displayValue: false,
            background: '#ffffff', lineColor: '#000000',
          });
          items.push({
            name: product.name,
            barcodePng: canvas.toDataURL('image/png'),
            barcodeNum: product.barcode!,
            price: `$${product.salePrice.toLocaleString('es-CO')}`,
          });
        }
      }
      const blob = await pdf(<LabelDoc items={items} />).toBlob();
      const url  = URL.createObjectURL(blob);

      // Open PDF in new tab — sync from click handler, never blocked by popup blocker
      // Chrome's PDF viewer uses the embedded 58×30mm page dimensions automatically
      const win = window.open(url, '_blank');
      if (win) {
        // Auto-trigger print dialog after PDF viewer finishes loading
        setTimeout(() => {
          try { win.focus(); win.print(); } catch { /* user presses Ctrl+P manually */ }
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }, 1500);
      } else {
        // Fallback: download the PDF
        const a = document.createElement('a');
        a.href = url;
        a.download = `etiquetas-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setGeneratingPDF(false);
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
            width: `${ORIENT[orientation].pageW}mm`,
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
                <p className="text-sm font-bold text-[#005236]">POS-58 &mdash; rollo continuo 58 mm</p>
                <p className="text-xs text-[#414844]">Usar modo <strong>Horizontal</strong>. Si el contenido sale girado, cambia a Vertical.</p>
              </div>
              {/* Orientation toggle */}
              <div className="ml-auto flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-[#414844]">Modo de impresi&oacute;n</span>
                <div className="flex rounded-full border border-[#cce6d0] bg-white p-0.5">
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                      orientation === 'landscape' ? 'bg-[#005236] text-white' : 'text-[#414844] hover:bg-[#f2f4f3]'
                    }`}
                  >
                    Horizontal ✓
                  </button>
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                      orientation === 'portrait' ? 'bg-[#005236] text-white' : 'text-[#414844] hover:bg-[#f2f4f3]'
                    }`}
                  >
                    Vertical
                  </button>
                </div>
                <span className="text-xs text-[#414844]">
                  {orientation === 'landscape' ? 'POS-58: impresión directa sin rotación' : 'Para drivers que rotan 90°'}
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
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => void handleGeneratePDF()}
                  disabled={generatingPDF || toPrint.length === 0}
                  className="flex items-center gap-2 rounded-full bg-[#012d1d] px-5 py-2 font-bold text-white transition-colors hover:bg-[#005236] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generatingPDF ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                  {generatingPDF ? 'Generando...' : `Imprimir etiquetas PDF (${toPrint.reduce((s, p) => s + (qty[p.id] || 1), 0)} etiq.)`}
                </button>
                <p className="text-xs text-[#414844]">
                  Se abre una pesta&ntilde;a con el PDF y el di&aacute;logo de impresi&oacute;n. Si no aparece autom&aacute;ticamente, presiona <kbd className="rounded bg-[#e6e9e8] px-1 py-0.5 text-xs">Ctrl+P</kbd>
                </p>
              </div>
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
