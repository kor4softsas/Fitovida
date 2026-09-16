import pool, { query } from '@/lib/db';

// Inventario por local (ver mysql/07-locations.sql).
// - inventory_location_stock guarda el stock de cada producto en cada local.
// - inventory_products.current_stock y products.stock guardan el TOTAL (suma de locales).
// Si la migración aún no se ha ejecutado, todo funciona como antes (stock global):
// en ese caso los helpers reciben/retornan locationId = null.

export type DbConnection = Awaited<ReturnType<typeof pool.getConnection>>;

export type LocationRow = {
  id: number;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_default: number | boolean;
  status: 'active' | 'inactive';
};

export class InventoryLocationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'InventoryLocationError';
    this.status = status;
  }
}

export const LOCATIONS_MIGRATION_HINT =
  'Falta ejecutar la migración mysql/07-locations.sql en la base de datos para habilitar los locales.';

const READY_CACHE_TTL_MS = 5 * 60 * 1000;
const NOT_READY_CACHE_TTL_MS = 30 * 1000;
let schemaCache: { ready: boolean; expiresAt: number } | null = null;

export async function isLocationsSchemaReady(): Promise<boolean> {
  const now = Date.now();
  if (schemaCache && schemaCache.expiresAt > now) {
    return schemaCache.ready;
  }

  let ready = false;
  try {
    const rows = await query<{ tables: number | string; columns: number | string }>(
      `SELECT
         (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('locations', 'inventory_location_stock')) AS tables,
         (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'location_id'
             AND TABLE_NAME IN ('inventory_lots', 'inventory_movements', 'admin_sales')) AS columns`
    );
    ready = Number(rows[0]?.tables) === 2 && Number(rows[0]?.columns) === 3;
  } catch {
    ready = false;
  }

  schemaCache = { ready, expiresAt: now + (ready ? READY_CACHE_TTL_MS : NOT_READY_CACHE_TTL_MS) };
  return ready;
}

export type LocationListRow = LocationRow & {
  product_count: number;
  total_units: number;
  created_at: string | Date;
  updated_at: string | Date;
};

export async function listLocations(): Promise<LocationListRow[]> {
  const rows = await query<LocationListRow>(
    `SELECT l.id, l.name, l.code, l.address, l.city, l.phone, l.is_default, l.status, l.created_at, l.updated_at,
            COALESCE(s.product_count, 0) AS product_count,
            COALESCE(s.total_units, 0) AS total_units
     FROM locations l
     LEFT JOIN (
       SELECT location_id,
              SUM(CASE WHEN current_stock > 0 THEN 1 ELSE 0 END) AS product_count,
              SUM(current_stock) AS total_units
       FROM inventory_location_stock
       GROUP BY location_id
     ) s ON s.location_id = l.id
     ORDER BY l.is_default DESC, l.status ASC, l.name ASC`
  );

  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    product_count: Number(row.product_count || 0),
    total_units: Number(row.total_units || 0)
  }));
}

export type LocationInput = {
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  status: 'active' | 'inactive';
  isDefault: boolean;
};

function optionalText(value: unknown, maxLength: number, label: string): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;
  if (text.length > maxLength) {
    throw new InventoryLocationError(`${label} no puede tener más de ${maxLength} caracteres.`);
  }
  return text;
}

export function parseLocationInput(body: Record<string, unknown>): LocationInput {
  const name = optionalText(body.name, 150, 'El nombre');
  if (!name || name.length < 2) {
    throw new InventoryLocationError('El nombre del local es obligatorio (mínimo 2 caracteres).');
  }

  const rawCode = optionalText(body.code, 30, 'El código');
  const code = rawCode ? rawCode.toUpperCase().replace(/\s+/g, '-') : null;
  if (code && !/^[A-Z0-9_-]+$/.test(code)) {
    throw new InventoryLocationError('El código solo puede tener letras sin tilde, números, guiones o guion bajo.');
  }

  return {
    name,
    code,
    address: optionalText(body.address, 255, 'La dirección'),
    city: optionalText(body.city, 120, 'La ciudad'),
    phone: optionalText(body.phone, 50, 'El teléfono'),
    status: body.status === 'inactive' ? 'inactive' : 'active',
    isDefault: body.is_default === true || body.isDefault === true || body.is_default === 1
  };
}

export function mapLocationDbError(error: unknown): { status: number; message: string } {
  if (error instanceof InventoryLocationError) {
    return { status: error.status, message: error.message };
  }

  const dbError = (error || {}) as { code?: string; sqlMessage?: string; message?: string };
  if (dbError.code === 'ER_DUP_ENTRY') {
    if (/uq_locations_code/i.test(dbError.sqlMessage || '')) {
      return { status: 400, message: 'Ya existe un local con ese código.' };
    }
    return { status: 400, message: 'Ya existe un local con ese nombre.' };
  }
  if (dbError.code === 'ER_NO_SUCH_TABLE' || dbError.code === 'ER_BAD_FIELD_ERROR') {
    return { status: 409, message: LOCATIONS_MIGRATION_HINT };
  }

  return { status: 500, message: 'Error interno al guardar el local.' };
}

export async function getDefaultLocationId(conn: DbConnection): Promise<number> {
  const [rows] = await conn.query(
    `SELECT id FROM locations WHERE status = 'active' ORDER BY is_default DESC, id ASC LIMIT 1`
  );
  const id = Number((rows as Array<{ id: number }>)[0]?.id || 0);
  if (!id) {
    throw new InventoryLocationError('No hay locales activos. Crea o activa un local en Admin > Locales.', 409);
  }
  return id;
}

export async function getLocationById(id: number): Promise<LocationRow | null> {
  const rows = await query<LocationRow>('SELECT * FROM locations WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

/**
 * Convierte el local recibido del cliente en un id válido.
 * - Sin migración: retorna null (modo stock global).
 * - Vacío / 'all': retorna el local principal.
 * - Id inexistente o inactivo: error 400 (salvo allowInactive, p. ej. para devolver
 *   stock a un lote o venta de un local que ya se desactivó).
 */
export async function resolveLocationId(
  conn: DbConnection,
  raw: unknown,
  options: { allowInactive?: boolean } = {}
): Promise<number | null> {
  if (!(await isLocationsSchemaReady())) {
    return null;
  }

  if (raw === null || raw === undefined || raw === '' || raw === 'all') {
    return getDefaultLocationId(conn);
  }

  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new InventoryLocationError('El local seleccionado no es válido.');
  }

  const [rows] = await conn.query('SELECT id, status FROM locations WHERE id = ? LIMIT 1', [id]);
  const location = (rows as Array<{ id: number; status: string }>)[0];
  if (!location) {
    throw new InventoryLocationError('El local seleccionado no existe.');
  }
  if (location.status !== 'active' && !options.allowInactive) {
    throw new InventoryLocationError('El local seleccionado está inactivo.');
  }

  return id;
}

/** Lee ?locationId= de la URL. 'all', vacío o inválido = todos los locales (null). */
export function parseLocationParam(value: string | null): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Sufijo para nombres de archivo exportados, ej: "-san-miguel". */
export async function getLocationFileSuffix(locationId: number | null): Promise<string> {
  if (!locationId || !(await isLocationsSchemaReady())) return '';
  const location = await getLocationById(locationId);
  if (!location) return '';
  const slug = (location.code || location.name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug ? `-${slug}` : '';
}

/** Filtro SQL para lotes del local (vacío en modo stock global). */
export function lotLocationFilter(locationId: number | null, alias = ''): { sql: string; params: number[] } {
  if (locationId === null) {
    return { sql: '', params: [] };
  }
  return { sql: ` AND ${alias ? `${alias}.` : ''}location_id = ?`, params: [locationId] };
}

/** Bloquea y retorna el stock del producto en el local (o el global sin migración). */
export async function lockStock(conn: DbConnection, productId: number, locationId: number | null): Promise<number> {
  if (locationId === null) {
    const [rows] = await conn.query(
      'SELECT current_stock FROM inventory_products WHERE product_id = ? FOR UPDATE',
      [productId]
    );
    return Number((rows as Array<{ current_stock: number }>)[0]?.current_stock || 0);
  }

  await conn.query(
    `INSERT INTO inventory_location_stock (location_id, product_id, current_stock)
     VALUES (?, ?, 0)
     ON DUPLICATE KEY UPDATE current_stock = current_stock`,
    [locationId, productId]
  );
  const [rows] = await conn.query(
    'SELECT current_stock FROM inventory_location_stock WHERE location_id = ? AND product_id = ? FOR UPDATE',
    [locationId, productId]
  );
  return Number((rows as Array<{ current_stock: number }>)[0]?.current_stock || 0);
}

export type StockChangeInput = {
  productId: number;
  locationId: number | null;
  type: 'entry' | 'exit' | 'adjustment';
  /** Unidades que entran o salen (entry / exit). */
  quantity?: number;
  /** Stock final deseado en el local (adjustment). */
  targetStock?: number;
  reason: 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | 'transfer' | 'other';
  reference?: string | null;
  notes?: string | null;
  unitCost?: number | null;
  productName?: string | null;
  createdBy: string;
  /** Rechaza la operación si el stock del local quedaría negativo. */
  preventNegative?: boolean;
};

export type StockChangeResult = {
  previousStock: number;
  newStock: number;
  totalStock: number;
  changed: boolean;
};

/**
 * Única vía para cambiar stock: registra el movimiento (con su local), actualiza
 * el stock del local y recalcula el total en inventory_products / products.
 * Debe llamarse dentro de una transacción de `conn`.
 */
export async function applyStockChange(conn: DbConnection, input: StockChangeInput): Promise<StockChangeResult> {
  const { productId, locationId, type } = input;
  const previousStock = await lockStock(conn, productId, locationId);

  let newStock: number;
  if (type === 'adjustment') {
    newStock = Math.trunc(Number(input.targetStock ?? previousStock));
  } else {
    const quantity = Math.trunc(Number(input.quantity || 0));
    if (quantity <= 0) {
      throw new InventoryLocationError('La cantidad del movimiento debe ser mayor a cero.');
    }
    newStock = type === 'entry' ? previousStock + quantity : previousStock - quantity;
  }

  if (input.preventNegative && newStock < 0) {
    throw new InventoryLocationError(`Stock insuficiente: hay ${previousStock} unidad(es) disponibles.`);
  }

  if (newStock === previousStock) {
    return { previousStock, newStock, totalStock: await readTotalStock(conn, productId), changed: false };
  }

  let productName = input.productName || '';
  if (!productName) {
    const [nameRows] = await conn.query('SELECT name FROM products WHERE id = ? LIMIT 1', [productId]);
    productName = String((nameRows as Array<{ name: string }>)[0]?.name || '');
  }

  const movementQuantity = Math.abs(newStock - previousStock);
  const unitCost = input.unitCost === null || input.unitCost === undefined ? null : Number(input.unitCost) || 0;
  const totalCost = unitCost === null || type === 'adjustment' ? null : unitCost * movementQuantity;

  // El movimiento va primero: si la BD aún tiene el trigger antiguo (copia new_stock al
  // total), el recálculo de abajo deja el total correcto de todas formas.
  if (locationId === null) {
    await conn.query(
      `INSERT INTO inventory_movements
         (id, product_id, product_name, type, quantity, previous_stock, new_stock, unit_cost, total_cost, reason, reference, notes, created_by)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, productName, type, movementQuantity, previousStock, newStock, unitCost, totalCost,
        input.reason, input.reference || null, input.notes || null, input.createdBy]
    );
    await conn.query(
      'UPDATE inventory_products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
      [newStock, productId]
    );
    await conn.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);
    return { previousStock, newStock, totalStock: newStock, changed: true };
  }

  await conn.query(
    `INSERT INTO inventory_movements
       (id, product_id, location_id, product_name, type, quantity, previous_stock, new_stock, unit_cost, total_cost, reason, reference, notes, created_by)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [productId, locationId, productName, type, movementQuantity, previousStock, newStock, unitCost, totalCost,
      input.reason, input.reference || null, input.notes || null, input.createdBy]
  );
  await conn.query(
    'UPDATE inventory_location_stock SET current_stock = ? WHERE location_id = ? AND product_id = ?',
    [newStock, locationId, productId]
  );

  const totalStock = await syncTotalStock(conn, productId);
  return { previousStock, newStock, totalStock, changed: true };
}

async function readTotalStock(conn: DbConnection, productId: number): Promise<number> {
  const [rows] = await conn.query('SELECT current_stock FROM inventory_products WHERE product_id = ? LIMIT 1', [productId]);
  return Number((rows as Array<{ current_stock: number }>)[0]?.current_stock || 0);
}

/** Recalcula el total del producto como la suma de sus locales. */
export async function syncTotalStock(conn: DbConnection, productId: number): Promise<number> {
  const [sumRows] = await conn.query(
    'SELECT COALESCE(SUM(current_stock), 0) AS total FROM inventory_location_stock WHERE product_id = ?',
    [productId]
  );
  const total = Number((sumRows as Array<{ total: number | string }>)[0]?.total || 0);
  await conn.query(
    'UPDATE inventory_products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
    [total, productId]
  );
  await conn.query('UPDATE products SET stock = ? WHERE id = ?', [total, productId]);
  return total;
}
