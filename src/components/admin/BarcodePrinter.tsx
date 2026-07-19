'use client';

import { useState, useEffect, useCallback } from 'react';
import { Printer, X, Eye, EyeOff, FileDown, Loader2 } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { Document, Page, Image as PdfImage, pdf } from '@react-pdf/renderer';
import type { InventoryProduct } from '@/types/admin';

// ── Units ────────────────────────────────────────────────────────────────────
const MM = 2.8346;    // PDF points per millimetre
const PX_PER_MM = 12; // canvas render resolution (~305 dpi → crisp on 203dpi thermal)
const SCREEN_MM = 5;  // px per mm used only for the on-screen preview

// Default die-cut label size (Juxin P20A in JK-58PL label mode): 40mm × 30mm
const DEFAULT_W = 40;
const DEFAULT_H = 30;

// --- Types --------------------------------------------------------------------

interface BarcodePrinterProps {
  products: InventoryProduct[];
  onClose: () => void;
}

type LabelPng = { png: string; wMm: number; hMm: number };

// --- Single-label composition (canvas → PNG, WYSIWYG) ------------------------

// Truncate text with an ellipsis so it never overflows the label width.
function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

// Draw ONE label (name + barcode + number + price), centred, filling the label.
function composeLabel(product: InventoryProduct, wMm: number, hMm: number): HTMLCanvasElement {
  const S = PX_PER_MM;
  const W = Math.round(wMm * S);
  const H = Math.round(hMm * S);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const pad = Math.round(1 * S);
  const innerW = W - pad * 2;

  const nameSize  = Math.max(10, Math.round(0.078 * H));
  const numSize   = Math.max(9,  Math.round(0.065 * H));
  const priceSize = Math.max(11, Math.round(0.090 * H));

  // Name (top, bold)
  ctx.font = `bold ${nameSize}px Arial, sans-serif`;
  const nameBaseline = pad + nameSize;
  ctx.fillText(fitText(ctx, product.name, innerW), W / 2, nameBaseline);

  // Reserve space for number + price at the bottom.
  const gap = Math.round(0.3 * S);
  const bottomReserve = pad + priceSize + gap + numSize + gap;
  const barTop = nameBaseline + gap;
  const barH = Math.max(Math.round(0.3 * H), H - barTop - bottomReserve);

  // Barcode → temp canvas, stretched to fill the label width.
  try {
    const bc = document.createElement('canvas');
    JsBarcode(bc, product.barcode!, {
      format: 'CODE128', width: 2, height: 100, displayValue: false,
      margin: 0, background: '#ffffff', lineColor: '#000000',
    });
    ctx.drawImage(bc, pad, barTop, innerW, barH);
  } catch (err) {
    console.error('JsBarcode error:', err);
    ctx.font = `${numSize}px monospace`;
    ctx.fillText('código inválido', W / 2, barTop + barH / 2);
  }

  // Barcode number (mono, below the bars)
  ctx.font = `${numSize}px monospace`;
  ctx.fillText(fitText(ctx, product.barcode ?? '', innerW), W / 2, barTop + barH + numSize);

  // Price (bottom, bold)
  ctx.font = `bold ${priceSize}px Arial, sans-serif`;
  ctx.fillText(fitText(ctx, `$${product.salePrice.toLocaleString('es-CO')}`, innerW), W / 2, H - pad);

  return canvas;
}

function buildLabel(product: InventoryProduct, wMm: number, hMm: number): LabelPng {
  return { png: composeLabel(product, wMm, hMm).toDataURL('image/png'), wMm, hMm };
}

// --- PDF: one page per label, exactly the label size, image fills 100% -------

function LabelDoc({ pages }: { pages: LabelPng[] }) {
  return (
    <Document>
      {pages.map((p, i) => (
        <Page key={i} size={[p.wMm * MM, p.hMm * MM]} style={{ padding: 0 }}>
          <PdfImage src={p.png} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
        </Page>
      ))}
    </Document>
  );
}

// --- Main component -----------------------------------------------------------

export default function BarcodePrinter({ products, onClose }: BarcodePrinterProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(products.map(p => p.id));
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, 1]))
  );
  const [showPreview, setShowPreview] = useState(false);
  const [widthMm, setWidthMm] = useState(DEFAULT_W);
  const [heightMm, setHeightMm] = useState(DEFAULT_H);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [previews, setPreviews] = useState<{ id: string; png: string }[]>([]);

  const toPrint = products.filter(p => selectedIds.includes(p.id) && p.barcode);
  const totalLabels = toPrint.reduce((s, p) => s + (qty[p.id] || 1), 0);

  // Preview: one label per selected product.
  useEffect(() => {
    if (!showPreview) return;
    setPreviews(toPrint.map(p => ({ id: p.id, png: composeLabel(p, widthMm, heightMm).toDataURL('image/png') })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreview, selectedIds, widthMm, heightMm]);

  // -- Generate PDF (one page per label), open it, auto-trigger print dialog --
  const handleGeneratePDF = useCallback(async () => {
    if (toPrint.length === 0) return;
    setGeneratingPDF(true);
    try {
      const pages: LabelPng[] = [];
      for (const product of toPrint) {
        const count = qty[product.id] || 1;
        for (let i = 0; i < count; i++) pages.push(buildLabel(product, widthMm, heightMm));
      }

      const blob = await pdf(<LabelDoc pages={pages} />).toBlob();
      const url = URL.createObjectURL(blob);

      const win = window.open(url, '_blank');
      if (win) {
        setTimeout(() => {
          try { win.focus(); win.print(); } catch { /* user presses Ctrl+P */ }
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }, 1500);
      } else {
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
  }, [toPrint, qty, widthMm, heightMm]);

  const numInput =
    'w-24 rounded-lg border border-[#cce6d0] px-3 py-1.5 text-center text-sm font-bold text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]';

  return (
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

          {/* Size + driver info */}
          <div className="space-y-4 rounded-2xl border border-[#cce6d0] bg-[#e7f9ee] px-5 py-4">
            <p className="text-sm font-bold text-[#005236]">
              Driver de etiquetas JK-58PL — 1 etiqueta = 1 página. Usa el mismo tamaño aquí y en el driver.
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#005236]">Ancho etiqueta (mm)</label>
                <input type="number" min={10} max={48} value={widthMm}
                  onChange={e => setWidthMm(Math.min(48, Math.max(10, parseInt(e.target.value) || DEFAULT_W)))}
                  className={numInput} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#005236]">Alto etiqueta (mm)</label>
                <input type="number" min={10} max={120} value={heightMm}
                  onChange={e => setHeightMm(Math.min(120, Math.max(10, parseInt(e.target.value) || DEFAULT_H)))}
                  className={numInput} />
              </div>
            </div>

            <div className="rounded-xl bg-white/70 px-4 py-3 text-xs leading-relaxed text-[#414844]">
              <p className="font-bold text-[#005236]">En el driver JK-58PL (una sola vez):</p>
              <ol className="ml-4 mt-1 list-decimal space-y-0.5">
                <li>Preferencias → <strong>页面设置</strong> → <strong>新建纸张</strong>: crea un papel de <strong>{widthMm} × {heightMm} mm</strong> y selecciónalo.</li>
                <li><strong>半色调</strong> (medios tonos): déjalo en <strong>无 / Ninguno</strong> (código nítido).</li>
                <li>Si sale girado, usa <strong>旋转 (Rotación) 90°</strong>. Si sale desplazado, ajusta <strong>偏移 (Offset)</strong>.</li>
              </ol>
              <p className="mt-2 font-bold text-[#005236]">Al imprimir el PDF (Chrome):</p>
              <ol className="ml-4 mt-1 list-decimal space-y-0.5">
                <li>Destino: <strong>JK-58PL</strong>. Papel: tu <strong>{widthMm} × {heightMm}</strong>. <strong>Márgenes: Ninguno</strong>. <strong>Escala: 100 %</strong>.</li>
              </ol>
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
                          e.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id)
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
                        type="number" min="1" max="99" value={qty[product.id] || 1}
                        onChange={e =>
                          setQty(prev => ({ ...prev, [product.id]: Math.max(1, parseInt(e.target.value) || 1) }))
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
                {generatingPDF ? 'Generando...' : `Imprimir etiquetas PDF (${totalLabels} etiq.)`}
              </button>
              <p className="text-xs text-[#414844]">
                Se abre una pesta&ntilde;a con el PDF y el di&aacute;logo de impresi&oacute;n. Si no aparece, presiona <kbd className="rounded bg-[#e6e9e8] px-1 py-0.5 text-xs">Ctrl+P</kbd>
              </p>
            </div>
          </div>

          {/* Preview (matches exactly what gets printed) */}
          {showPreview && (
            <div className="border-t border-[#e6e9e8] pt-5">
              <h3 className="mb-4 font-bold text-[#012d1d]">
                Vista Previa <span className="text-sm font-normal text-[#414844]">({widthMm} × {heightMm} mm)</span>
              </h3>
              <div className="flex flex-wrap items-start gap-3 overflow-auto rounded-2xl bg-[#f2f4f3] p-4">
                {previews.length === 0 ? (
                  <p className="text-sm text-[#414844]">No hay productos seleccionados con c&oacute;digo de barras.</p>
                ) : (
                  previews.map(pv => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={pv.id}
                      src={pv.png}
                      alt="etiqueta"
                      style={{ width: `${widthMm * SCREEN_MM}px`, height: `${heightMm * SCREEN_MM}px` }}
                      className="rounded border border-dashed border-[#c7cdc9] bg-white shadow-sm"
                    />
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
