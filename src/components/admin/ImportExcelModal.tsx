'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedProduct {
  name: string;
  description: string;
  category: string;
  salePrice: number;
  unitCost: number;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  sku: string;
  barcode: string;
  supplier: string;
  taxRate: number;
  status: 'active' | 'inactive' | 'discontinued';
  hasInvima: boolean;
  invimaRegistryNumber: string;
  expirationDate: string;
  // row index in Excel for error reporting
  _rowIndex: number;
  _errors: string[];
  _warnings: string[];
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: { row: number; name: string; error: string }[];
}

interface ImportExcelModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Column mapping (Spanish and English headers) ────────────────────────────

const COLUMN_MAP: Record<string, keyof Omit<ParsedProduct, '_rowIndex' | '_errors' | '_warnings'>> = {
  nombre: 'name',
  name: 'name',
  descripcion: 'description',
  description: 'description',
  categoria: 'category',
  category: 'category',
  precio_venta: 'salePrice',
  precio: 'salePrice',
  price: 'salePrice',
  sale_price: 'salePrice',
  costo_unidad: 'unitCost',
  costo: 'unitCost',
  unit_cost: 'unitCost',
  stock_actual: 'currentStock',
  stock: 'currentStock',
  current_stock: 'currentStock',
  stock_minimo: 'minStock',
  min_stock: 'minStock',
  stock_maximo: 'maxStock',
  max_stock: 'maxStock',
  sku: 'sku',
  codigo_barras: 'barcode',
  barcode: 'barcode',
  proveedor: 'supplier',
  supplier: 'supplier',
  tasa_iva: 'taxRate',
  iva: 'taxRate',
  tax_rate: 'taxRate',
  estado: 'status',
  status: 'status',
  tiene_invima: 'hasInvima',
  has_invima: 'hasInvima',
  invima: 'hasInvima',
  numero_invima: 'invimaRegistryNumber',
  invima_registry: 'invimaRegistryNumber',
  invima_registry_number: 'invimaRegistryNumber',
  fecha_vencimiento: 'expirationDate',
  expiration_date: 'expirationDate',
  vencimiento: 'expirationDate',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const str = String(value ?? '').toLowerCase().trim();
  return ['si', 'sí', 'yes', 'true', '1', 'x'].includes(str);
}

function toStatus(value: unknown): 'active' | 'inactive' | 'discontinued' {
  const str = String(value ?? '').toLowerCase().trim();
  if (['inactive', 'inactivo', 'inactiva'].includes(str)) return 'inactive';
  if (['discontinued', 'descontinuado', 'descontinuada'].includes(str)) return 'discontinued';
  return 'active';
}

function toExcelDateString(value: unknown): string {
  if (!value && value !== 0) return '';

  // Excel serial date number
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return '';
    const y = date.y;
    const m = String(date.m).padStart(2, '0');
    const d = String(date.d).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(value).trim();

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Try native parsing as last resort
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return '';
}

// ─── Parse sheet ─────────────────────────────────────────────────────────────

function parseSheet(worksheet: XLSX.WorkSheet): ParsedProduct[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: true,
  });

  if (raw.length === 0) return [];

  // Build header index
  const firstRow = raw[0];
  const headerMapping: Record<string, keyof Omit<ParsedProduct, '_rowIndex' | '_errors' | '_warnings'>> = {};
  for (const key of Object.keys(firstRow)) {
    const normalized = normalizeHeader(key);
    const mapped = COLUMN_MAP[normalized];
    if (mapped) {
      headerMapping[key] = mapped;
    }
  }

  return raw.map((row, idx): ParsedProduct => {
    const product: Partial<ParsedProduct> & { _rowIndex: number; _errors: string[]; _warnings: string[] } = {
      _rowIndex: idx + 2, // row 1 = headers, so first data row = 2
      _errors: [],
      _warnings: [],
    };

    for (const [excelKey, fieldName] of Object.entries(headerMapping)) {
      const rawValue = row[excelKey];
      switch (fieldName) {
        case 'name':
          product.name = String(rawValue ?? '').trim();
          break;
        case 'description':
          product.description = String(rawValue ?? '').trim();
          break;
        case 'category':
          product.category = String(rawValue ?? '').trim();
          break;
        case 'salePrice':
          product.salePrice = toNumber(rawValue, 0);
          break;
        case 'unitCost':
          product.unitCost = toNumber(rawValue, 0);
          break;
        case 'currentStock':
          product.currentStock = Math.max(0, Math.round(toNumber(rawValue, 0)));
          break;
        case 'minStock':
          product.minStock = Math.max(0, Math.round(toNumber(rawValue, 5)));
          break;
        case 'maxStock': {
          const v = toNumber(rawValue, -1);
          product.maxStock = v > 0 ? v : null;
          break;
        }
        case 'sku':
          product.sku = String(rawValue ?? '').trim();
          break;
        case 'barcode':
          product.barcode = String(rawValue ?? '').trim();
          break;
        case 'supplier':
          product.supplier = String(rawValue ?? '').trim();
          break;
        case 'taxRate': {
          const validRates = [0, 5, 19];
          const rate = toNumber(rawValue, 19);
          product.taxRate = validRates.includes(rate) ? rate : 19;
          if (!validRates.includes(rate)) {
            product._warnings.push(`Tasa IVA "${rawValue}" no es válida (0, 5 ó 19). Se usará 19%.`);
          }
          break;
        }
        case 'status':
          product.status = toStatus(rawValue);
          break;
        case 'hasInvima':
          product.hasInvima = toBoolean(rawValue);
          break;
        case 'invimaRegistryNumber':
          product.invimaRegistryNumber = String(rawValue ?? '').trim();
          break;
        case 'expirationDate':
          product.expirationDate = toExcelDateString(rawValue);
          break;
      }
    }

    // Defaults for missing fields
    if (!product.name) product._errors.push('El nombre del producto es obligatorio.');
    if (!product.category) product._errors.push('La categoría es obligatoria.');
    if (!product.expirationDate) product._errors.push('La fecha de vencimiento es obligatoria y debe tener formato YYYY-MM-DD, DD/MM/YYYY o ser una fecha de Excel válida.');

    return {
      name: product.name ?? '',
      description: product.description ?? '',
      category: product.category ?? '',
      salePrice: product.salePrice ?? 0,
      unitCost: product.unitCost ?? 0,
      currentStock: product.currentStock ?? 0,
      minStock: product.minStock ?? 5,
      maxStock: product.maxStock ?? null,
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      supplier: product.supplier ?? '',
      taxRate: product.taxRate ?? 19,
      status: product.status ?? 'active',
      hasInvima: product.hasInvima ?? false,
      invimaRegistryNumber: product.invimaRegistryNumber ?? '',
      expirationDate: product.expirationDate ?? '',
      _rowIndex: product._rowIndex,
      _errors: product._errors,
      _warnings: product._warnings,
    };
  });
}

// ─── Template generator ───────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = [
    'nombre',
    'descripcion',
    'categoria',
    'precio_venta',
    'costo_unidad',
    'stock_actual',
    'stock_minimo',
    'stock_maximo',
    'sku',
    'codigo_barras',
    'proveedor',
    'tasa_iva',
    'estado',
    'tiene_invima',
    'numero_invima',
    'fecha_vencimiento',
  ];

  const example = [
    'Producto Ejemplo',
    'Descripción del producto',
    'Suplementos',
    25000,
    15000,
    100,
    10,
    500,
    'SKU-001',
    '7702001234567',
    'Proveedor SA',
    19,
    'active',
    'SI',
    'INVIMA2023M-001',
    '2026-12-31',
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  // Column widths
  ws['!cols'] = headers.map(() => ({ wch: 20 }));

  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  XLSX.writeFile(wb, 'plantilla_inventario.xlsx');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportExcelModal({ onClose, onSuccess }: ImportExcelModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const validProducts = parsedProducts.filter(p => p._errors.length === 0);
  const invalidProducts = parsedProducts.filter(p => p._errors.length > 0);

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError('Solo se aceptan archivos .xlsx, .xls o .csv');
      return;
    }

    setParseError('');
    setImportResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: false });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const products = parseSheet(worksheet);

        if (products.length === 0) {
          setParseError('El archivo no contiene filas de datos.');
          setParsedProducts([]);
          return;
        }

        setParsedProducts(products);
      } catch (err) {
        console.error(err);
        setParseError('No se pudo leer el archivo. Asegúrate de que sea un Excel válido.');
        setParsedProducts([]);
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (validProducts.length === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      const payload = validProducts.map(p => ({
        name: p.name,
        description: p.description,
        category: p.category,
        salePrice: p.salePrice,
        unitCost: p.unitCost,
        currentStock: p.currentStock,
        minStock: p.minStock,
        maxStock: p.maxStock,
        sku: p.sku || null,
        barcode: p.barcode || null,
        supplier: p.supplier || null,
        taxRate: p.taxRate,
        status: p.status,
        hasInvima: p.hasInvima,
        invimaRegistryNumber: p.invimaRegistryNumber || null,
        expirationDate: p.expirationDate,
        image: '',
      }));

      const res = await fetch('/api/admin/inventory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: payload }),
      });

      const result = await res.json() as ImportResult & { error?: string };

      if (!res.ok) {
        setParseError(result.error ?? 'Error al importar productos');
        return;
      }

      setImportResult(result);

      if (result.imported > 0) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      setParseError('Error de red al intentar importar.');
    } finally {
      setImporting(false);
    }
  };

  const toggleRow = (idx: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6e9e8] px-8 py-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={28} className="text-[#005236]" />
            <div>
              <h2 className="text-xl font-extrabold text-[#012d1d]">Importar Inventario desde Excel</h2>
              <p className="text-sm text-[#414844]">Sube un archivo .xlsx, .xls o .csv con los productos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#414844] transition-colors hover:text-[#012d1d]">
            <X size={24} />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 space-y-6 overflow-y-auto px-8 py-6">

          {/* Template download */}
          <div className="flex items-center justify-between rounded-3xl bg-[#f2f4f3] px-6 py-4">
            <div>
              <p className="font-bold text-[#012d1d]">¿No tienes plantilla?</p>
              <p className="text-sm text-[#414844]">Descarga la plantilla con los campos requeridos</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 rounded-full border border-[#cce6d0] bg-[#e7f9ee] px-4 py-2 text-sm font-bold text-[#005236] transition-colors hover:bg-[#d6f2df]"
            >
              <Download size={16} />
              Plantilla Excel
            </button>
          </div>

          {/* Drop zone */}
          {parsedProducts.length === 0 && !importResult && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-4xl border-2 border-dashed py-16 transition-colors ${
                dragOver
                  ? 'border-[#005236] bg-[#e7f9ee]'
                  : 'border-[#cce6d0] bg-[#f2f4f3] hover:border-[#005236] hover:bg-[#e7f9ee]'
              }`}
            >
              <Upload size={48} className="text-[#005236]" />
              <div className="text-center">
                <p className="font-bold text-[#012d1d]">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                <p className="text-sm text-[#414844]">Formatos aceptados: .xlsx, .xls, .csv</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Change file button when already loaded */}
          {parsedProducts.length > 0 && !importResult && (
            <div className="flex items-center justify-between rounded-3xl border border-[#cce6d0] bg-[#e7f9ee] px-6 py-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={24} className="text-[#005236]" />
                <div>
                  <p className="font-bold text-[#012d1d]">{fileName}</p>
                  <p className="text-sm text-[#414844]">
                    {parsedProducts.length} fila(s) detectada(s) — {validProducts.length} válida(s), {invalidProducts.length} con errores
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setParsedProducts([]); setFileName(''); setParseError(''); fileInputRef.current?.click(); }}
                className="rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-sm font-bold text-[#414844] transition-colors hover:bg-[#f2f4f3]"
              >
                Cambiar archivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-3 rounded-3xl bg-[#ffdad6] px-6 py-4">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#93000a]" />
              <p className="text-sm font-semibold text-[#93000a]">{parseError}</p>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className={`rounded-3xl px-6 py-5 ${importResult.failed === 0 ? 'bg-[#a0f4c8]' : 'bg-amber-50'}`}>
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-[#005236]" />
                <div>
                  <p className="font-extrabold text-[#012d1d]">
                    Importación completada — {importResult.imported} producto(s) importado(s)
                    {importResult.failed > 0 && `, ${importResult.failed} fallido(s)`}
                  </p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <ul className="mt-4 space-y-1">
                  {importResult.errors.map((e, i) => (
                    <li key={i} className="text-sm text-amber-900">
                      Fila {e.row} — {e.name || 'Sin nombre'}: {e.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Preview table */}
          {parsedProducts.length > 0 && !importResult && (
            <div>
              <h3 className="mb-3 font-extrabold text-[#012d1d]">
                Vista previa ({parsedProducts.length} producto{parsedProducts.length !== 1 ? 's' : ''})
              </h3>
              <div className="overflow-hidden rounded-3xl border border-[#e6e9e8]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[#e6e9e8] bg-[#f2f4f3]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">Fila</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">Categoría</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#414844]">Precio</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">Stock</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">Vencimiento</th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e9e8] bg-white">
                      {parsedProducts.map((p) => (
                        <>
                          <tr
                            key={p._rowIndex}
                            onClick={() => (p._errors.length > 0 || p._warnings.length > 0) && toggleRow(p._rowIndex)}
                            className={`transition-colors ${
                              p._errors.length > 0
                                ? 'cursor-pointer bg-[#fff4f4] hover:bg-[#ffdad6]'
                                : p._warnings.length > 0
                                  ? 'cursor-pointer bg-amber-50 hover:bg-amber-100'
                                  : 'hover:bg-[#f8faf9]'
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold text-[#414844]">
                              <div className="flex items-center gap-2">
                                {p._errors.length > 0 ? (
                                  <AlertTriangle size={14} className="shrink-0 text-[#ba1a1a]" />
                                ) : p._warnings.length > 0 ? (
                                  <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                                ) : (
                                  <CheckCircle size={14} className="shrink-0 text-[#005236]" />
                                )}
                                {p._rowIndex}
                                {(p._errors.length > 0 || p._warnings.length > 0) && (
                                  expandedRows.has(p._rowIndex) ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-[#012d1d]">{p.name || <span className="italic text-[#ba1a1a]">Sin nombre</span>}</td>
                            <td className="px-4 py-3 text-[#414844]">{p.category || <span className="italic text-[#ba1a1a]">Sin categoría</span>}</td>
                            <td className="px-4 py-3 text-right text-[#012d1d]">
                              {p.salePrice > 0
                                ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p.salePrice)
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-center text-[#012d1d]">{p.currentStock}</td>
                            <td className="px-4 py-3 text-center text-[#414844]">{p.expirationDate || <span className="italic text-[#ba1a1a]">Sin fecha</span>}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                p.status === 'active' ? 'bg-[#a0f4c8] text-[#005236]' :
                                p.status === 'inactive' ? 'bg-[#e6e9e8] text-[#414844]' :
                                'bg-[#ffdad6] text-[#93000a]'
                              }`}>
                                {p.status === 'active' ? 'Activo' : p.status === 'inactive' ? 'Inactivo' : 'Descontinuado'}
                              </span>
                            </td>
                          </tr>
                          {expandedRows.has(p._rowIndex) && (p._errors.length > 0 || p._warnings.length > 0) && (
                            <tr key={`${p._rowIndex}-detail`} className="bg-[#fffbf4]">
                              <td colSpan={7} className="px-6 py-3">
                                {p._errors.map((err, i) => (
                                  <p key={`e${i}`} className="text-xs font-semibold text-[#ba1a1a]">✗ {err}</p>
                                ))}
                                {p._warnings.map((warn, i) => (
                                  <p key={`w${i}`} className="text-xs font-semibold text-amber-700">⚠ {warn}</p>
                                ))}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidProducts.length > 0 && (
                <p className="mt-2 text-xs text-[#414844]">
                  Las filas con errores <span className="font-bold text-[#ba1a1a]">({invalidProducts.length})</span> serán omitidas.
                  Haz clic en una fila para ver los detalles.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#e6e9e8] px-8 py-5">
          {importResult ? (
            <button
              onClick={onClose}
              className="rounded-full bg-[#012d1d] px-6 py-2 font-bold text-white transition-colors hover:bg-[#005236]"
            >
              Cerrar
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={importing}
                className="rounded-full border border-[#e6e9e8] bg-white px-6 py-2 font-bold text-[#414844] transition-colors hover:bg-[#f2f4f3] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleImport()}
                disabled={importing || validProducts.length === 0}
                className="flex items-center gap-2 rounded-full bg-[#012d1d] px-6 py-2 font-bold text-white transition-colors hover:bg-[#005236] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Importar {validProducts.length} producto{validProducts.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
