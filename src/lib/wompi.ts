// Configuración y utilidades para Wompi (PSE - Colombia)

// URLs de Wompi
export const WOMPI_URLS = {
  // Sandbox (pruebas)
  sandbox: {
    api: 'https://sandbox.wompi.co/v1',
    checkout: 'https://checkout.wompi.co/l/',
  },
  // Producción
  production: {
    api: 'https://production.wompi.co/v1',
    checkout: 'https://checkout.wompi.co/l/',
  },
};

// Determinar si estamos en modo sandbox
export const isWompiSandbox = () => {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';
  return publicKey.startsWith('pub_test_');
};

// Obtener URL base según ambiente
export const getWompiBaseUrl = () => {
  return isWompiSandbox() ? WOMPI_URLS.sandbox.api : WOMPI_URLS.production.api;
};

// Tipos de documento en Colombia
export const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PP', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
];

// Tipos de persona
export const PERSON_TYPES = [
  { value: '0', label: 'Persona Natural', code: 'natural' },
  { value: '1', label: 'Persona Jurídica', code: 'juridica' },
];

// Generar firma de integridad para transacciones Wompi
// La firma se genera con: referencia + monto en centavos + moneda + integrity_secret
export async function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string = 'COP'
): Promise<string> {
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  
  if (!integritySecret) {
    throw new Error('WOMPI_INTEGRITY_SECRET no está configurado');
  }
  
  // Concatenar: referencia + monto en centavos + moneda + secret
  const stringToHash = `${reference}${amountInCents}${currency}${integritySecret}`;
  
  // Generar hash SHA256
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// Verificar firma de eventos webhook de Wompi
export async function verifyWompiWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): Promise<boolean> {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  
  if (!eventsSecret) {
    console.error('WOMPI_EVENTS_SECRET no está configurado');
    return false;
  }
  
  try {
    // Wompi envía: timestamp + '.' + payload
    const stringToHash = `${timestamp}.${payload}${eventsSecret}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === signature;
  } catch {
    return false;
  }
}

// Convertir precio en COP a centavos (Wompi usa centavos)
export function copToCents(amount: number): number {
  return Math.round(amount * 100);
}

// Convertir centavos a COP
export function centsToCop(cents: number): number {
  return cents / 100;
}

// Generar referencia única para transacción
export function generateTransactionReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `FV-${timestamp}-${random}`.toUpperCase();
}

// Estados de transacción Wompi
export const WOMPI_TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  VOIDED: 'VOIDED',
  ERROR: 'ERROR',
} as const;

export type WompiTransactionStatus = typeof WOMPI_TRANSACTION_STATUS[keyof typeof WOMPI_TRANSACTION_STATUS];

// Mapear estado de Wompi a estado de orden
export function mapWompiStatusToOrderStatus(wompiStatus: WompiTransactionStatus): string {
  switch (wompiStatus) {
    case 'APPROVED':
      return 'paid';
    case 'DECLINED':
    case 'ERROR':
      return 'failed';
    case 'VOIDED':
      return 'cancelled';
    case 'PENDING':
    default:
      return 'processing';
  }
}
