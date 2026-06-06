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
    const lotId = String(data.lotId || data.id || '').trim();
    const quantity = Number(data.quantity || 0);
    const reason = data.reason || 'sale';
    const reference = data.reference || null;
    const userId = data.userId || data.createdBy || 'system';

    if (!lotId || quantity <= 0) return bad('lotId y quantity son obligatorios');

    conn = await pool.getConnection();
    await conn.beginTransaction();
    tx = true;

    // Obtener lote
    const [lotRows] = await conn.query('SELECT * FROM inventory_lots WHERE id = ? FOR UPDATE', [lotId]);
    const lot = (lotRows as any[])[0];
    if (!lot) return bad('Lote no encontrado', 404);

    const available = (lot.quantity || 0) - (lot.reserved || 0);
    if (available < quantity) return bad('Stock insuficiente en el lote seleccionado', 400);

    // Restar cantidad del lote
    const newLotQty = (lot.quantity || 0) - quantity;
    const newStatus = newLotQty <= 0 ? 'consumed' : lot.status;
    await conn.query('UPDATE inventory_lots SET quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newLotQty, newStatus, lotId]);

    // Registrar movimiento en inventory_movements
    const [ipRows] = await conn.query('SELECT current_stock FROM inventory_products WHERE product_id = ? FOR UPDATE', [lot.product_id]);
    const ip = (ipRows as any[])[0];
    const prevStock = ip ? Number(ip.current_stock || 0) : 0;
    const newStock = prevStock - quantity;

    await conn.query(
      `INSERT INTO inventory_movements (id, product_id, product_name, type, quantity, previous_stock, new_stock, unit_cost, total_cost, reason, reference, notes, created_by)
       VALUES (UUID(), ?, ?, 'exit', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lot.product_id, lot.product_name || '', quantity, prevStock, newStock, lot.unit_cost || null, (lot.unit_cost || 0) * quantity, reason, reference, null, userId]
    );

    // Actualizar stock global
    await conn.query('UPDATE inventory_products SET current_stock = ? WHERE product_id = ?', [newStock, lot.product_id]);

    await conn.commit();
    tx = false;
    return NextResponse.json({ success: true, newLotQty, newStock });
  } catch (error) {
    if (conn && tx) {
      try { await conn.rollback(); } catch {}
    }
    console.error('Error consuming lot:', error);
    return bad('Error al descontar lote', 500);
  } finally {
    if (conn) conn.release();
  }
}
