import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  isLocationsSchemaReady,
  listLocations,
  mapLocationDbError,
  parseLocationInput,
  InventoryLocationError,
  LOCATIONS_MIGRATION_HINT,
  type DbConnection
} from '@/lib/admin/locations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    if (!(await isLocationsSchemaReady())) {
      return NextResponse.json({ schemaReady: false, locations: [], message: LOCATIONS_MIGRATION_HINT });
    }

    const locations = await listLocations();
    return NextResponse.json({ schemaReady: true, locations });
  } catch (error) {
    console.error('Error en GET /api/admin/locations:', error);
    return NextResponse.json({ error: 'Error al obtener los locales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let conn: DbConnection | null = null;
  let transactionStarted = false;

  try {
    if (!(await isLocationsSchemaReady())) {
      return NextResponse.json({ error: LOCATIONS_MIGRATION_HINT }, { status: 409 });
    }

    const input = parseLocationInput(await request.json());

    conn = await pool.getConnection();
    await conn.beginTransaction();
    transactionStarted = true;

    const [defaultRows] = await conn.query('SELECT COUNT(*) AS total FROM locations WHERE is_default = 1');
    const hasDefault = Number((defaultRows as Array<{ total: number }>)[0]?.total || 0) > 0;
    // El primer local siempre queda como principal
    const makeDefault = input.isDefault || !hasDefault;

    if (makeDefault && input.status === 'inactive') {
      throw new InventoryLocationError('El local principal no puede quedar inactivo.');
    }
    if (makeDefault) {
      await conn.query('UPDATE locations SET is_default = 0 WHERE is_default = 1');
    }

    const [result] = await conn.query(
      `INSERT INTO locations (name, code, address, city, phone, is_default, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.name, input.code, input.address, input.city, input.phone, makeDefault ? 1 : 0, input.status]
    );

    await conn.commit();
    transactionStarted = false;

    return NextResponse.json({ success: true, id: (result as { insertId: number }).insertId });
  } catch (error) {
    if (conn && transactionStarted) {
      try {
        await conn.rollback();
      } catch {
        // Ignorar errores de rollback.
      }
    }

    const mapped = mapLocationDbError(error);
    if (mapped.status >= 500) console.error('Error en POST /api/admin/locations:', error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  } finally {
    conn?.release();
  }
}
