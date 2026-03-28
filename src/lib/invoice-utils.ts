/**
 * Invoice Utils - Helpers para generación de factura DIAN-ready
 * Genera QR payload, código de barras, CUFE temporal, y prepara datos para DIAN
 */

import { createHash } from 'crypto';

/**
 * Genera un CUFE temporal (local) para testing
 * Formato: XXXXXX-YYYY-NNNNN-CCCC (simulado)
 * En producción, viendra de DIAN
 */
export function generateTemporaryCUFE(invoiceNumber: string, nit: string): string {
  const hash = createHash('sha256')
    .update(`${invoiceNumber}${nit}${Date.now()}`)
    .digest('hex')
    .substring(0, 32)
    .toUpperCase();
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 17)}-${hash.substring(17, 21)}`;
}

/**
 * Genera el payload QR según norma DIAN
 * Formato: NIT|NumFactura|Fecha|Total|HashCertificado|CUFE
 * Ref: Resolución DIAN 000042-2016
 */
export function generateQRPayload(data: {
  nit: string; // NIT empresa (sin puntuación)
  invoiceNumber: string; // Número factura (ej: 000001)
  issueDate: string; // YYYYMMDD
  total: number; // Monto total
  grandTotal: number; // Total con IVA
  cufe: string; // CUFE real o temporal
  certHash?: string; // Hash certificado (solo con firma DIAN real)
}): string {
  const { nit, invoiceNumber, issueDate, total, grandTotal, cufe, certHash } = data;

  // Formato DIAN: NIT|Número|Fecha|Monto|CUFE[|CertHash]
  const parts = [
    nit.replace(/\D/g, ''), // Solo dígitos
    invoiceNumber.padStart(10, '0'),
    issueDate, // YYYYMMDD
    grandTotal.toFixed(0), // Monto total (sin decimales para DIAN)
    cufe,
  ];

  // Si hay hash de certificado, agregarlo
  if (certHash) {
    parts.push(certHash);
  }

  return parts.join('|');
}

/**
 * Genera un código de barras 1D a partir del CUFE
 * Se puede renderizar con librerías como jsbarcode, qrcode, etc.
 * Aquí solo extraemos el dato que se pasará al componente
 */
export function generateBarcodeValue(cufe: string): string {
  // El barcode más simple: tomar los primeros 16 caracteres del CUFE
  // En producción podrías usar Code128 o el formato específico de tu proveedor
  return cufe.replace(/[-]/g, '').substring(0, 16).toUpperCase();
}

/**
 * Estructura lista para enviar a proveedor DIAN
 * Prepara todos los datos necesarios para firma digittal + envío
 */
export interface DIANInvoicePayload {
  // Identificación factura
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  invoiceType: string; // '01' = Factura
  documentType: string; // 'CC' | 'NIT' | 'CE' | 'PA'

  // Datos empresa
  companyNIT: string;
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyDepartment: string;
  companyPhone?: string;
  companyEmail?: string;

  // Datos cliente
  customerName: string;
  customerDocument: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;

  // Valores
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number; // 19, 5, 0 (%)

  // Items factura (si aplica desglose)
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxAmount: number;
    total: number;
  }>;

  // Pagos
  paymentMethod: string; // 'cash' | 'card' | 'transfer' | 'pse' | 'wompi'
  paymentTerms?: string;

  // DIAN specific
  resolutionNumber?: string; // Resolución DIAN (ej: 000123-2025)
  resolutionFrom?: number; // Rango desde
  resolutionTo?: number; // Rango hasta

  // Estado
  invoiceStatus: 'pending' | 'draft' | 'authorized' | 'rejected';
  dianUUID?: string;
  dianTrackId?: string;
}

/**
 * Construye la estructura de datos lista para enviar al proveedor DIAN
 */
export function buildDIANInvoicePayload(saleData: any, companySettings: any): DIANInvoicePayload {
  return {
    invoiceNumber: saleData.invoice_number || saleData.sale_number || '',
    issueDate: new Date(saleData.invoice_date || saleData.created_at).toISOString().split('T')[0],
    invoiceType: '01', // Factura
    documentType: saleData.customer_document?.includes('NIT') ? 'NIT' : 'CC',

    companyNIT: companySettings.nit || '',
    companyName: companySettings.company_name || 'Fitovida SAS',
    companyAddress: companySettings.address || '',
    companyCity: companySettings.city || '',
    companyDepartment: companySettings.department || '',
    companyPhone: companySettings.phone,
    companyEmail: companySettings.email,

    customerName: saleData.customer_name || '',
    customerDocument: saleData.customer_document || '222222222222',
    customerEmail: saleData.customer_email,
    customerAddress: saleData.customer_address,
    customerCity: saleData.customer_city,

    subtotal: Number(saleData.subtotal) || 0,
    taxAmount: Number(saleData.tax) || 0,
    totalAmount: Number(saleData.total) || 0,
    taxRate: companySettings.tax_rate || 19,

    paymentMethod: saleData.payment_method || 'cash',
    paymentTerms: '1', // Inmediato (1=Contado, 2=Crédito)

    resolutionNumber: companySettings.dian_resolution || '000123-2025',
    resolutionFrom: companySettings.dian_range_from,
    resolutionTo: companySettings.dian_range_to,

    invoiceStatus: saleData.invoice_status || 'pending',
    dianUUID: saleData.dian_uuid,
    dianTrackId: saleData.dian_track_id,
  };
}

/**
 * Valida que la estructura DIAN tenga todos los campos requeridos
 */
export function validateDIANPayload(payload: DIANInvoicePayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.invoiceNumber) errors.push('invoiceNumber requerido');
  if (!payload.companyNIT) errors.push('companyNIT requerido');
  if (!payload.customerDocument) errors.push('customerDocument requerido');
  if (payload.totalAmount < 0) errors.push('totalAmount debe ser positivo');

  return {
    valid: errors.length === 0,
    errors,
  };
}
