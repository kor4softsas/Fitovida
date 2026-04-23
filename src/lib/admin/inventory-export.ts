import { query } from '@/lib/db';

type ColumnRow = { column_name: string };

const SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000;
const columnCache = new Map<string, { expiresAt: number; columns: Set<string> }>();

export type InventoryQueryFilters = {
  category?: string | null;
  status?: string | null;
  searchTerm?: string | null;
  lowStock?: boolean;
};

export type InventoryDatabaseRow = {
  product_id: number | string;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  image: string | null;
  has_invima: number | boolean | string | null;
  invima_registry_number: string | null;
  fecha_vencimiento: string | null;
  expiration_status: string | null;
  estado_vencimiento: string | null;
  sku: string | null;
  barcode: string | null;
  current_stock: number | string | null;
  min_stock: number | string | null;
  max_stock: number | string | null;
  unit_cost: number | string | null;
  tax_rate: number | string | null;
  supplier: string | null;
  status: string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

export type InventoryExportRow = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  fechaVencimiento: string;
  estadoVencimiento: 'rojo' | 'amarillo' | 'verde' | 'vencido' | 'sin_fecha';
  tieneInvima: boolean;
  numeroInvima: string;
  fechaCreacion: string;
  categoria: string;
  sku: string;
  barcode: string;
  costoUnitario: number;
  stockMinimo: number;
  stockMaximo: number | null;
  tasaIva: number;
  proveedor: string;
  estado: string;
  imagen: string;
};

export type InventoryExportData = {
  rows: InventoryDatabaseRow[];
  exportRows: InventoryExportRow[];
  productColumns: Set<string>;
  inventoryColumns: Set<string>;
};

function has(columns: Set<string>, columnName: string): boolean {
  return columns.has(columnName.toLowerCase());
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateOnly(value: unknown): string {
  const parsed = toDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : '';
}

function formatDateTime(value: unknown): string {
  const parsed = toDate(value);
  return parsed ? parsed.toISOString().replace('T', ' ').slice(0, 19) : '';
}

function normalizeExpirationStatus(status: unknown, expirationDate: string): InventoryExportRow['estadoVencimiento'] {
  const normalized = toText(status).toLowerCase();

  if (normalized === 'rojo' || normalized === 'red') return 'rojo';
  if (normalized === 'amarillo' || normalized === 'yellow') return 'amarillo';
  if (normalized === 'verde' || normalized === 'green') return 'verde';
  if (normalized === 'expired' || normalized === 'vencido') return 'vencido';

  if (!expirationDate) return 'sin_fecha';

  const parsed = new Date(`${expirationDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'sin_fecha';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsed < today) return 'vencido';

  const threeMonths = new Date(today);
  threeMonths.setMonth(threeMonths.getMonth() + 3);
  if (parsed <= threeMonths) return 'rojo';

  const sixMonths = new Date(today);
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  if (parsed <= sixMonths) return 'amarillo';

  return 'verde';
}

async function getColumnSet(tableName: string): Promise<Set<string>> {
  const now = Date.now();
  const cached = columnCache.get(tableName);
  if (cached && cached.expiresAt > now) {
    return cached.columns;
  }

  try {
    const rows = await query<ColumnRow>(
      `SELECT LOWER(COLUMN_NAME) as column_name
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [tableName]
    );

    const columns = new Set(rows.map((row) => row.column_name));
    columnCache.set(tableName, { expiresAt: now + SCHEMA_CACHE_TTL_MS, columns });
    return columns;
  } catch {
    return new Set<string>();
  }
}

function buildSelectFields(productColumns: Set<string>, inventoryColumns: Set<string>): string[] {
  return [
    'ip.product_id',
    has(productColumns, 'name') ? 'p.name' : "'' as name",
    has(productColumns, 'description') ? 'p.description' : "'' as description",
    has(productColumns, 'price') ? 'p.price' : '0 as price',
    has(productColumns, 'category') ? 'p.category' : "'' as category",
    has(productColumns, 'image') ? 'p.image' : 'NULL as image',
    has(productColumns, 'has_invima') ? 'p.has_invima' : '0 as has_invima',
    has(productColumns, 'invima_registry_number') ? 'p.invima_registry_number' : 'NULL as invima_registry_number',
    has(productColumns, 'fecha_vencimiento') ? 'p.fecha_vencimiento' : 'NULL as fecha_vencimiento',
    has(productColumns, 'fecha_vencimiento')
      ? `CASE
           WHEN p.fecha_vencimiento IS NULL THEN 'unknown'
           WHEN p.fecha_vencimiento < CURDATE() THEN 'expired'
           WHEN p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH) THEN 'red'
           WHEN p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH) THEN 'yellow'
           ELSE 'green'
         END as expiration_status`
      : "'unknown' as expiration_status",
    has(productColumns, 'fecha_vencimiento')
      ? `CASE
           WHEN p.fecha_vencimiento IS NULL THEN 'sin_fecha'
           WHEN p.fecha_vencimiento < CURDATE() THEN 'vencido'
           WHEN p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH) THEN 'rojo'
           WHEN p.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH) THEN 'amarillo'
           ELSE 'verde'
         END as estado_vencimiento`
      : "'sin_fecha' as estado_vencimiento",
    has(inventoryColumns, 'sku') ? 'ip.sku' : 'NULL as sku',
    has(inventoryColumns, 'barcode') ? 'ip.barcode' : 'NULL as barcode',
    has(inventoryColumns, 'current_stock') ? 'ip.current_stock' : '0 as current_stock',
    has(inventoryColumns, 'min_stock') ? 'ip.min_stock' : '0 as min_stock',
    has(inventoryColumns, 'max_stock') ? 'ip.max_stock' : 'NULL as max_stock',
    has(inventoryColumns, 'unit_cost') ? 'ip.unit_cost' : '0 as unit_cost',
    has(inventoryColumns, 'tax_rate') ? 'ip.tax_rate' : '19 as tax_rate',
    has(inventoryColumns, 'supplier') ? 'ip.supplier' : 'NULL as supplier',
    has(inventoryColumns, 'status') ? 'ip.status' : "'active' as status",
    has(productColumns, 'created_at')
      ? 'p.created_at'
      : has(inventoryColumns, 'created_at')
        ? 'ip.created_at'
        : 'CURRENT_TIMESTAMP as created_at',
    has(productColumns, 'updated_at')
      ? 'p.updated_at'
      : has(inventoryColumns, 'updated_at')
        ? 'ip.updated_at'
        : 'CURRENT_TIMESTAMP as updated_at'
  ];
}

function buildWhereClause(filters: InventoryQueryFilters, productColumns: Set<string>, inventoryColumns: Set<string>): { sql: string; params: Array<string> } {
  let sql = ' WHERE 1=1';
  const params: Array<string> = [];

  if (filters.status && filters.status !== 'all' && has(inventoryColumns, 'status')) {
    sql += ' AND ip.status = ?';
    params.push(filters.status);
  }

  if (filters.category && filters.category !== 'all' && has(productColumns, 'category')) {
    sql += ' AND p.category = ?';
    params.push(filters.category);
  }

  if (filters.lowStock && has(inventoryColumns, 'current_stock') && has(inventoryColumns, 'min_stock')) {
    sql += ' AND ip.current_stock <= ip.min_stock';
  }

  if (filters.searchTerm) {
    const searchPattern = `%${filters.searchTerm}%`;
    const searchConditions = ['p.name LIKE ?'];

    params.push(searchPattern);
    if (has(inventoryColumns, 'barcode')) {
      searchConditions.push('ip.barcode LIKE ?');
      params.push(searchPattern);
    }
    if (has(inventoryColumns, 'sku')) {
      searchConditions.push('ip.sku LIKE ?');
      params.push(searchPattern);
    }

    sql += ` AND (${searchConditions.join(' OR ')})`;
  }

  return { sql, params };
}

export async function getInventoryData(filters: InventoryQueryFilters = {}): Promise<InventoryExportData> {
  const productColumns = await getColumnSet('products');
  const inventoryColumns = await getColumnSet('inventory_products');

  const selectFields = buildSelectFields(productColumns, inventoryColumns);
  const whereClause = buildWhereClause(filters, productColumns, inventoryColumns);

  const sql = `
    SELECT
      ${selectFields.join(',\n      ')}
    FROM inventory_products ip
    JOIN products p ON ip.product_id = p.id
    ${whereClause.sql}
    ORDER BY p.name ASC
  `;

  const rows = await query<InventoryDatabaseRow>(sql, whereClause.params);
  const exportRows = rows.map(normalizeInventoryRow);

  return { rows, exportRows, productColumns, inventoryColumns };
}

export function normalizeInventoryRow(row: InventoryDatabaseRow): InventoryExportRow {
  const fechaVencimiento = formatDateOnly(row.fecha_vencimiento);

  return {
    id: String(row.product_id),
    nombre: toText(row.name),
    descripcion: toText(row.description),
    precio: toNumber(row.price),
    stock: toNumber(row.current_stock),
    fechaVencimiento,
    estadoVencimiento: normalizeExpirationStatus(row.estado_vencimiento || row.expiration_status, fechaVencimiento),
    tieneInvima: Boolean(row.has_invima),
    numeroInvima: toText(row.invima_registry_number),
    fechaCreacion: formatDateTime(row.created_at),
    categoria: toText(row.category),
    sku: toText(row.sku),
    barcode: toText(row.barcode),
    costoUnitario: toNumber(row.unit_cost),
    stockMinimo: toNumber(row.min_stock),
    stockMaximo: row.max_stock === null || row.max_stock === undefined ? null : toNumber(row.max_stock),
    tasaIva: toNumber(row.tax_rate, 19),
    proveedor: toText(row.supplier),
    estado: toText(row.status) || 'active',
    imagen: toText(row.image)
  };
}

function escapeSqlIdentifier(value: string): string {
  return `\`${value.replace(/`/g, '``')}\``;
}

function escapeSqlValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  const parsed = value instanceof Date ? value : toDate(value);
  if (parsed) {
    return `'${parsed.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }

  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function buildInsertStatement(tableName: string, columns: string[], values: string[][]): string {
  if (columns.length === 0 || values.length === 0) {
    return '';
  }

  const columnSql = columns.map(escapeSqlIdentifier).join(', ');
  const valueSql = values.map((row) => `(${row.join(', ')})`).join(',\n');
  return `INSERT INTO ${escapeSqlIdentifier(tableName)} (${columnSql}) VALUES\n${valueSql};`;
}

function getProductInsertColumns(productColumns: Set<string>): string[] {
  const columns = ['id', 'name', 'description', 'price', 'category', 'stock', 'image'];

  if (has(productColumns, 'has_invima')) {
    columns.push('has_invima');
  }
  if (has(productColumns, 'invima_registry_number')) {
    columns.push('invima_registry_number');
  }
  if (has(productColumns, 'fecha_vencimiento')) {
    columns.push('fecha_vencimiento');
  }
  if (has(productColumns, 'created_at')) {
    columns.push('created_at');
  }
  if (has(productColumns, 'updated_at')) {
    columns.push('updated_at');
  }

  return columns;
}

function getInventoryInsertColumns(inventoryColumns: Set<string>): string[] {
  const columns = ['product_id'];

  if (has(inventoryColumns, 'sku')) {
    columns.push('sku');
  }
  if (has(inventoryColumns, 'barcode')) {
    columns.push('barcode');
  }
  if (has(inventoryColumns, 'current_stock')) {
    columns.push('current_stock');
  }
  if (has(inventoryColumns, 'min_stock')) {
    columns.push('min_stock');
  }
  if (has(inventoryColumns, 'max_stock')) {
    columns.push('max_stock');
  }
  if (has(inventoryColumns, 'unit_cost')) {
    columns.push('unit_cost');
  }
  if (has(inventoryColumns, 'tax_rate')) {
    columns.push('tax_rate');
  }
  if (has(inventoryColumns, 'supplier')) {
    columns.push('supplier');
  }
  if (has(inventoryColumns, 'status')) {
    columns.push('status');
  }
  if (has(inventoryColumns, 'created_at')) {
    columns.push('created_at');
  }
  if (has(inventoryColumns, 'updated_at')) {
    columns.push('updated_at');
  }

  return columns;
}

export function buildInventorySqlExport(data: InventoryExportData): string {
  const productColumns = getProductInsertColumns(data.productColumns);
  const inventoryColumns = getInventoryInsertColumns(data.inventoryColumns);

  const productValues = data.rows.map((row) => {
    const productCreatedAt = formatDateTime(row.created_at || row.updated_at || new Date());
    const productUpdatedAt = formatDateTime(row.updated_at || row.created_at || new Date());

    const values: Record<string, unknown> = {
      id: row.product_id,
      name: row.name,
      description: row.description ?? '',
      price: row.price,
      category: row.category ?? '',
      stock: row.current_stock,
      image: row.image ?? ''
    };

    if (has(data.productColumns, 'has_invima')) {
      values.has_invima = row.has_invima ? 1 : 0;
    }
    if (has(data.productColumns, 'invima_registry_number')) {
      values.invima_registry_number = row.invima_registry_number;
    }
    if (has(data.productColumns, 'fecha_vencimiento')) {
      values.fecha_vencimiento = row.fecha_vencimiento;
    }
    if (has(data.productColumns, 'created_at')) {
      values.created_at = productCreatedAt;
    }
    if (has(data.productColumns, 'updated_at')) {
      values.updated_at = productUpdatedAt;
    }

    return productColumns.map((column) => escapeSqlValue(values[column]));
  });

  const inventoryValues = data.rows.map((row) => {
    const inventoryCreatedAt = formatDateTime(row.created_at || row.updated_at || new Date());
    const inventoryUpdatedAt = formatDateTime(row.updated_at || row.created_at || new Date());

    const values: Record<string, unknown> = {
      product_id: row.product_id,
      sku: row.sku,
      barcode: row.barcode,
      current_stock: row.current_stock,
      min_stock: row.min_stock,
      max_stock: row.max_stock,
      unit_cost: row.unit_cost,
      tax_rate: row.tax_rate,
      supplier: row.supplier,
      status: row.status,
      created_at: inventoryCreatedAt,
      updated_at: inventoryUpdatedAt
    };

    return inventoryColumns.map((column) => escapeSqlValue(values[column]));
  });

  const sections = [
    '-- Exportacion de inventario Fitovida',
    `-- Generado: ${new Date().toISOString()}`,
    'SET NAMES utf8mb4;',
    'START TRANSACTION;',
    buildInsertStatement('products', productColumns, productValues),
    buildInsertStatement('inventory_products', inventoryColumns, inventoryValues),
    'COMMIT;'
  ].filter(Boolean);

  return sections.join('\n\n');
}
