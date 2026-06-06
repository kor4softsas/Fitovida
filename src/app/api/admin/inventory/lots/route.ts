import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(request: NextRequest) {
  let conn = null;
  let tx = false;
  try {
    const data = await request.json();
    const productId = Number(data.productId || data.product_id);
    const lotCode = String(data.lotCode || data.lote || '').trim();
    const barcode = data.barcode ? String(data.barcode).trim() : null;
    const quantity = Number(data.quantity || 0);
    const unitCost = Number(data.unitCost || data.unit_cost || 0);
    const salePriceOverride = data.salePriceOverride || data.sale_price_override || null;
    const expirationDate = data.expirationDate || data.fecha_vencimiento || null;
    const reference = data.reference || null;
    const notes = data.notes || null;
    const userId = data.userId || data.createdBy || 'system';

    if (!productId || !lotCode || quantity <= 0) {
      return bad('productId, lotCode y quantity son obligatorios');
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();
    tx = true;

    // Llamar al procedimiento almacenado definido en la migración
    await conn.query('CALL register_lot_entry(?,?,?,?,?,?,?,?,?,?)', [
      productId,
      lotCode,
      barcode,
      quantity,
      unitCost,
      salePriceOverride,
      expirationDate,
      reference,
      notes,
      userId
    ]);

    // Si se solicita, actualizar el código de barras del producto/inventory_products
    const updateProductBarcode = Boolean(data.updateProductBarcode);
    if (updateProductBarcode && barcode) {
      try {
        // Actualizar barcode en inventory_products
        await conn.query('UPDATE inventory_products SET barcode = ? WHERE product_id = ?', [barcode, productId]);
        // Intentar también actualizar en tabla products si existe la columna
        try {
          await conn.query('UPDATE products SET barcode = ? WHERE id = ?', [barcode, productId]);
        } catch (inner) {
          // Si no existe columna barcode en products, lo ignoramos
        }
      } catch (err) {
        console.error('Error updating product barcode:', err);
        // No abortamos por este fallo menor, pero lo registramos
      }
    }

    await conn.commit();
    tx = false;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (conn && tx) {
      try {
        await conn.rollback();
      } catch {}
    }
    console.error('Error creating lot:', error);
    return bad(error?.message || 'Error creando lote', 500);
  } finally {
    if (conn) conn.release();
  }
}

export async function GET(request: NextRequest) {
  let conn = null;
  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const barcode = url.searchParams.get('barcode');

    conn = await pool.getConnection();

    if (barcode) {
      const [rows] = await conn.query('SELECT * FROM inventory_lots WHERE barcode = ? LIMIT 1', [barcode]);
      return NextResponse.json({ lot: rows[0] || null });
    }

    if (productId) {
      const pid = Number(productId);
      const [rows] = await conn.query('SELECT * FROM inventory_lots WHERE product_id = ? ORDER BY expiration_date IS NULL, expiration_date ASC, created_at DESC', [pid]);
      return NextResponse.json({ lots: rows });
    }

    // Fallback: return recent lots
    const [rows] = await conn.query('SELECT * FROM inventory_lots ORDER BY created_at DESC LIMIT 100');
    return NextResponse.json({ lots: rows });
  } catch (error) {
    console.error('Error fetching lots:', error);
    return bad('Error al obtener lotes', 500);
  } finally {
    if (conn) conn.release();
  }
}
