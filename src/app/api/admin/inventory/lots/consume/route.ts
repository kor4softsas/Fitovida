import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { applyStockChange, InventoryLocationError, resolveLocationId, type StockChangeInput } from '@/lib/admin/locations';

const MOVEMENT_REASONS: StockChangeInput['reason'][] = ['purchase', 'sale', 'return', 'damage', 'adjustment', 'transfer', 'other'];

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
    const reason = MOVEMENT_REASONS.includes(data.reason) ? data.reason : 'sale';
    const reference = data.reference || null;
    const userId = data.userId || data.createdBy || 'system';

    if (!lotId || quantity <= 0) return bad('lotId y quantity son obligatorios');

    conn = await pool.getConnection();
    await conn.beginTransaction();
    tx = true;

    // Obtener lote
    const [lotRows] = await conn.query('SELECT * FROM inventory_lots WHERE id = ? FOR UPDATE', [lotId]);
    const lot = (lotRows as any[])[0];
    if (!lot) throw new InventoryLocationError('Lote no encontrado', 404);

    const available = (lot.quantity || 0) - (lot.reserved || 0);
    if (available < quantity) throw new InventoryLocationError('Stock insuficiente en el lote seleccionado');

    // Restar cantidad del lote
    const newLotQty = (lot.quantity || 0) - quantity;
    const newStatus = newLotQty <= 0 ? 'consumed' : lot.status;
    await conn.query('UPDATE inventory_lots SET quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newLotQty, newStatus, lotId]);

    // El stock sale del local donde está el lote
    const locationId = await resolveLocationId(conn, lot.location_id, { allowInactive: true });
    const result = await applyStockChange(conn, {
      productId: Number(lot.product_id),
      locationId,
      type: 'exit',
      quantity,
      reason,
      reference,
      notes: `lot:${lot.id} code:${lot.lot_code}`,
      unitCost: lot.unit_cost === null || lot.unit_cost === undefined ? null : Number(lot.unit_cost),
      createdBy: userId
    });

    await conn.commit();
    tx = false;
    return NextResponse.json({ success: true, newLotQty, newStock: result.newStock, totalStock: result.totalStock });
  } catch (error) {
    if (conn && tx) {
      try { await conn.rollback(); } catch {}
    }
    if (error instanceof InventoryLocationError) {
      return bad(error.message, error.status);
    }
    console.error('Error consuming lot:', error);
    return bad('Error al descontar lote', 500);
  } finally {
    if (conn) conn.release();
  }
}
