"use client";

import { useState, useMemo, useRef } from 'react';
import BarcodeInput from './BarcodeInput';
import { X } from 'lucide-react';

type ProductOption = { id: string; name: string; sku?: string | null };

export default function ReceiveStockModal({
  open,
  onClose,
  products,
  onSuccess
}: {
  open: boolean;
  onClose: () => void;
  products: ProductOption[];
  onSuccess: () => void;
}) {
  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [lotCode, setLotCode] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [salePriceOverride, setSalePriceOverride] = useState<number | null>(null);
  const [updateSalePrice, setUpdateSalePrice] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateProductBarcode, setUpdateProductBarcode] = useState<boolean>(false);

  const [query, setQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      ((p as any).barcode || '').toLowerCase().includes(q)
    );
  }, [products, query]);

  const handleSelectProduct = (id: string) => {
    setProductId(id);
    const found = products.find(p => p.id === id);
    setQuery(found?.name || '');
    setShowDropdown(false);
  };

  const handleScan = (code: string) => {
    const normalized = code.trim().toLowerCase();
    const found = products.find(p => (p.sku || '').toLowerCase() === normalized || ((p as any).barcode || '').toLowerCase() === normalized || (p.name || '').toLowerCase().includes(normalized));
    if (found) {
      setProductId(found.id);
      setQuery(found.name);
      setShowDropdown(false);
    } else {
      setQuery(code);
      setShowDropdown(true);
    }
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!productId || quantity <= 0 || !lotCode) {
      setError('Selecciona producto, lote y cantidad válida');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productId,
        lotCode,
        barcode: barcode || null,
        quantity,
        unitCost,
        salePriceOverride: updateSalePrice ? salePriceOverride : null,
        expirationDate: expirationDate || null,
        reference: null,
        notes: notes || null,
        userId: 'admin'
      };

      const res = await fetch('/api/admin/inventory/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error registrando ingreso');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error registrando ingreso');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Ingreso de Mercancía</h3>
          <button onClick={onClose} className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Buscar o Escanear Producto</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Buscar por nombre, SKU o pegar código..."
                  className="mt-1 w-full rounded-md border p-2"
                />
                {showDropdown && (
                  <div ref={dropdownRef} className="absolute z-30 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white">
                    {filtered.length === 0 ? (
                      <div className="p-2 text-sm text-gray-600">No se encontraron productos</div>
                    ) : (
                      filtered.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p.id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100"
                        >
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.sku || (p as any).barcode || ''}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="w-48">
                <BarcodeInput value="" onChange={() => {}} onScan={handleScan} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cantidad</label>
            <input type="number" min={1} className="mt-1 w-full rounded-md border p-2" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lote</label>
            <input className="mt-1 w-full rounded-md border p-2" value={lotCode} onChange={(e) => setLotCode(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Código de Barras (lote)</label>
            <div className="mt-1">
              <BarcodeInput
                value={barcode}
                onChange={(val) => setBarcode(val)}
                onScan={(val) => {
                  setBarcode(val);
                  // al escanear, por defecto proponemos actualizar el barcode del producto
                  setUpdateProductBarcode(true);
                }}
                placeholder="Escanea o ingresa el código de barras del lote"
              />
            </div>
            <label className="inline-flex items-center gap-2 mt-2">
              <input type="checkbox" checked={updateProductBarcode} onChange={(e) => setUpdateProductBarcode(e.target.checked)} />
              <span className="text-sm">Actualizar código de barras del producto</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
            <input type="date" className="mt-1 w-full rounded-md border p-2" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Costo de Compra (unit.)</label>
            <input type="number" step="0.01" className="mt-1 w-full rounded-md border p-2" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} />
          </div>

          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={updateSalePrice} onChange={(e) => setUpdateSalePrice(e.target.checked)} />
              <span className="text-sm">Actualizar precio de venta</span>
            </label>
            {updateSalePrice && (
              <div className="mt-2">
                <input type="number" step="0.01" className="w-full rounded-md border p-2" value={salePriceOverride ?? ''} onChange={(e) => setSalePriceOverride(e.target.value ? Number(e.target.value) : null)} placeholder="Nuevo precio de venta" />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea className="mt-1 w-full rounded-md border p-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error && <div className="md:col-span-2 text-sm text-red-600">{error}</div>}

          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full border px-4 py-2">Cerrar</button>
            <button type="submit" disabled={submitting} className="rounded-full bg-emerald-600 px-4 py-2 text-white">{submitting ? 'Guardando...' : 'Registrar Ingreso'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
