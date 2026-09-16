import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  isLocationsSchemaReady,
  mapLocationDbError,
  parseLocationInput,
  InventoryLocationError,
  LOCATIONS_MIGRATION_HINT,
  type DbConnection,
  type LocationRow
} from '@/lib/admin/locations';

export const dynamic = 'force-dynamic';

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new InventoryLocationError('Id de local inválido.');
  }
  return id;
}

async function lockLocation(conn: DbConnection, id: number): Promise<LocationRow> {
  const [rows] = await conn.query('SELECT * FROM locations WHERE id = ? FOR UPDATE', [id]);
  const location = (rows as LocationRow[])[0];
  if (!location) {
    throw new InventoryLocationError('Local no encontrado.', 404);
  }
  return location;
}

async function withTransaction<T>(handler: (conn: DbConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await handler(conn);
    await conn.commit();
    return result;
  } catch (error) {
    try {
      await conn.rollback();
    } catch {
      // Ignorar errores de rollback.
    }
    throw error;
  } finally {
    conn.release();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isLocationsSchemaReady())) {
      return NextResponse.json({ error: LOCATIONS_MIGRATION_HINT }, { status: 409 });
    }

    const id = parseId((await params).id);
    const input = parseLocationInput(await request.json());

    await withTransaction(async (conn) => {
      const current = await lockLocation(conn, id);
      const wasDefault = Boolean(Number(current.is_default));

      if (wasDefault && !input.isDefault) {
        throw new InventoryLocationError('Este es el local principal. Para cambiarlo, marca otro local como principal.');
      }
      if ((wasDefault || input.isDefault) && input.status === 'inactive') {
        throw new InventoryLocationError('El local principal no se puede desactivar.');
      }
      if (input.isDefault && !wasDefault) {
        await conn.query('UPDATE locations SET is_default = 0 WHERE is_default = 1 AND id <> ?', [id]);
      }

      await conn.query(
        `UPDATE locations
         SET name = ?, code = ?, address = ?, city = ?, phone = ?, status = ?, is_default = ?
         WHERE id = ?`,
        [input.name, input.code, input.address, input.city, input.phone, input.status, input.isDefault ? 1 : 0, id]
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const mapped = mapLocationDbError(error);
    if (mapped.status >= 500) console.error('Error en PUT /api/admin/locations/[id]:', error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isLocationsSchemaReady())) {
      return NextResponse.json({ error: LOCATIONS_MIGRATION_HINT }, { status: 409 });
    }

    const id = parseId((await params).id);

    await withTransaction(async (conn) => {
      const location = await lockLocation(conn, id);
      if (Number(location.is_default)) {
        throw new InventoryLocationError('No puedes eliminar el local principal. Marca otro local como principal primero.');
      }

      const [usageRows] = await conn.query(
        `SELECT
           (SELECT COUNT(*) FROM inventory_location_stock WHERE location_id = ? AND current_stock <> 0) AS stock_rows,
           (SELECT COUNT(*) FROM inventory_lots WHERE location_id = ?) AS lots,
           (SELECT COUNT(*) FROM inventory_movements WHERE location_id = ?) AS movements,
           (SELECT COUNT(*) FROM admin_sales WHERE location_id = ?) AS sales`,
        [id, id, id, id]
      );
      const usage = (usageRows as Array<Record<string, number | string>>)[0] || {};
      const details = [
        [Number(usage.stock_rows), 'producto(s) con stock'],
        [Number(usage.lots), 'lote(s)'],
        [Number(usage.movements), 'movimiento(s)'],
        [Number(usage.sales), 'venta(s)']
      ]
        .filter(([count]) => Number(count) > 0)
        .map(([count, label]) => `${count} ${label}`);

      if (details.length > 0) {
        throw new InventoryLocationError(
          `No se puede eliminar "${location.name}" porque tiene ${details.join(', ')}. Desactívalo en su lugar para conservar el historial.`,
          409
        );
      }

      await conn.query('DELETE FROM inventory_location_stock WHERE location_id = ?', [id]);
      await conn.query('DELETE FROM locations WHERE id = ?', [id]);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const mapped = mapLocationDbError(error);
    if (mapped.status >= 500) console.error('Error en DELETE /api/admin/locations/[id]:', error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
