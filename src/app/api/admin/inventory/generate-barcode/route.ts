import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

function isDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as { code?: string }).code;
  return [
    'ER_ACCESS_DENIED_ERROR',
    'ER_ACCESS_DENIED_NO_PASSWORD_ERROR',
    'ER_BAD_DB_ERROR',
    'ER_NO_SUCH_TABLE',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST'
  ].includes(String(code));
}

/**
 * Genera un código EAN-13 válido con dígito de verificación
 * Formato: 759 (prefijo Fitovida personalizado) + 9 dígitos + 1 dígito de verificación
 */
function generateEAN13(): string {
  const prefix = '759'; // Prefijo personalizado de Fitovida
  
  // Generar 9 dígitos aleatorios
  let code = prefix;
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10);
  }
  
  // Calcular dígito de verificación (algoritmo EAN-13)
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return code + checkDigit;
}

/**
 * Genera un código CODE128 personalizado
 * Formato: FIT-YYYYMMDD-XXXXX (más legible para interno)
 */
function generateCode128(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `FIT-${dateStr}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'EAN-13', productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'ID de producto requerido' },
        { status: 400 }
      );
    }

    let barcode: string;
    let attempts = 0;
    const maxAttempts = 10;
    let dbValidationSkipped = false;

    // Generar código único (reintentar si ya existe)
    do {
      if (format === 'CODE128') {
        barcode = generateCode128();
      } else {
        barcode = generateEAN13(); // Default EAN-13
      }

      // Verificar si el código ya existe en la BD
      let existing: unknown = null;
      try {
        existing = await queryOne(
          'SELECT id FROM inventory_products WHERE barcode = ?',
          [barcode]
        );
      } catch (dbError) {
        if (isDatabaseError(dbError)) {
          dbValidationSkipped = true;
          break;
        }
        throw dbError;
      }

      if (!existing) {
        break; // Código único encontrado
      }

      attempts++;
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'No se pudo generar un código de barras único después de 10 intentos' },
          { status: 500 }
        );
      }
    } while (true);

    return NextResponse.json({
      success: true,
      barcode,
      format: format === 'CODE128' ? 'Code128' : 'EAN-13',
      message: dbValidationSkipped
        ? `Código de barras ${format} generado (sin validación en BD por conexión)`
        : `Código de barras ${format} generado exitosamente`,
      dbValidationSkipped
    });
  } catch (error) {
    console.error('Error en POST /api/admin/inventory/generate-barcode:', error);
    return NextResponse.json(
      { error: 'Error al generar código de barras' },
      { status: 500 }
    );
  }
}

/**
 * GET - Regenerar código de barras si es duplicado
 * Query params:
 * - productId: ID del producto
 * - currentBarcode: Código actual (para evitar regenerar el mismo)
 * - format: EAN-13 o CODE128 (default EAN-13)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const currentBarcode = searchParams.get('currentBarcode');
    const format = searchParams.get('format') || 'EAN-13';

    if (!productId) {
      return NextResponse.json(
        { error: 'ID de producto requerido' },
        { status: 400 }
      );
    }

    let barcode: string;
    let attempts = 0;
    const maxAttempts = 10;
    let dbValidationSkipped = false;

    do {
      if (format === 'CODE128') {
        barcode = generateCode128();
      } else {
        barcode = generateEAN13();
      }

      // Si es el código actual, continuar generando
      if (barcode === currentBarcode) {
        attempts++;
        continue;
      }

      // Verificar unicidad en BD
      let existing: unknown = null;
      try {
        existing = await queryOne(
          'SELECT id FROM inventory_products WHERE barcode = ? AND id != ?',
          [barcode, productId]
        );
      } catch (dbError) {
        if (isDatabaseError(dbError)) {
          dbValidationSkipped = true;
          break;
        }
        throw dbError;
      }

      if (!existing) {
        break;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'No se pudo generar un código de barras único' },
          { status: 500 }
        );
      }
    } while (true);

    return NextResponse.json({
      success: true,
      barcode,
      format: format === 'CODE128' ? 'Code128' : 'EAN-13',
      message: dbValidationSkipped
        ? 'Código regenerado (sin validación en BD por conexión)'
        : 'Código regenerado exitosamente',
      dbValidationSkipped
    });
  } catch (error) {
    console.error('Error en GET /api/admin/inventory/generate-barcode:', error);
    return NextResponse.json(
      { error: 'Error al regenerar código de barras' },
      { status: 500 }
    );
  }
}
