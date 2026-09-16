-- =============================================
-- Migración 07: Locales (sedes) e inventario por local
-- Fecha: 2026-09-14
--
-- Qué hace:
--   1. Crea la tabla `locations` (CRUD de locales en /admin/locales).
--   2. Crea el local principal (solo si no existe ninguno).
--   3. Crea `inventory_location_stock`: stock de cada producto en cada local.
--   4. Agrega `location_id` a inventory_lots, inventory_movements y admin_sales.
--   5. Reemplaza el trigger de movimientos para que el código/procedimientos
--      antiguos (movimientos sin local) sigan cuadrando: se asignan al local
--      principal y el total global se conserva.
--   6. Pasa TODO el stock, lotes, movimientos y ventas existentes al local principal.
--
-- Reglas:
--   * inventory_products.current_stock sigue siendo el TOTAL de todos los locales
--     (lo usan la tienda web y el dashboard). La app lo recalcula como la suma
--     de inventory_location_stock en cada movimiento.
--   * Los pedidos de la tienda web descuentan del local principal.
--
-- Compatible con MySQL 8.x y MariaDB 10.4+.
-- Idempotente: se puede ejecutar varias veces sin duplicar datos.
--
-- Cómo ejecutarlo en producción:
--   1. Haz un backup:   mysqldump -u root -p fitovida > backup_antes_locales.sql
--   2. (Opcional) Cambia abajo el nombre/código del local principal.
--   3. Ejecuta:          mysql -u root -p fitovida < mysql/07-locations.sql
--      (o pégalo en la pestaña SQL de phpMyAdmin; soporta DELIMITER)
--   4. Despliega el código nuevo.
--   Ejecútalo en un momento sin ventas en curso (p. ej. antes de abrir).
-- =============================================

-- Nombre y código del local que recibirá todo el stock actual.
-- Puedes renombrarlo después desde Admin > Locales.
SET @default_location_name := 'Local principal';
SET @default_location_code := 'PRINCIPAL';

-- ---------------------------------------------
-- 1. Tabla de locales
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(30) NULL COMMENT 'Código corto, ej: SM, CENTRO',
  address VARCHAR(255) NULL,
  city VARCHAR(120) NULL,
  phone VARCHAR(50) NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Local principal: recibe pedidos web y stock sin local',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_locations_name (name),
  UNIQUE KEY uq_locations_code (code),
  KEY idx_locations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- 2. Local principal (solo si la tabla está vacía) y garantizar que haya exactamente uno
-- ---------------------------------------------
INSERT INTO locations (name, code, is_default, status)
SELECT @default_location_name, @default_location_code, 1, 'active'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM locations);

SET @default_location_id := COALESCE(
  (SELECT id FROM locations WHERE is_default = 1 ORDER BY id LIMIT 1),
  (SELECT id FROM locations WHERE status = 'active' ORDER BY id LIMIT 1),
  (SELECT id FROM locations ORDER BY id LIMIT 1)
);

UPDATE locations
SET is_default = CASE WHEN id = @default_location_id THEN 1 ELSE 0 END,
    status = CASE WHEN id = @default_location_id THEN 'active' ELSE status END;

-- ---------------------------------------------
-- 3. Stock por local
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_location_stock (
  id INT NOT NULL AUTO_INCREMENT,
  location_id INT NOT NULL,
  product_id INT NOT NULL,
  current_stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_location_product (location_id, product_id),
  KEY idx_location_stock_product (product_id),
  CONSTRAINT fk_location_stock_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE RESTRICT,
  CONSTRAINT fk_location_stock_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La tabla de lotes normalmente ya existe (06-inventory-lots.sql). Si no, se crea ya con location_id.
CREATE TABLE IF NOT EXISTS inventory_lots (
  id CHAR(36) NOT NULL,
  product_id INT NOT NULL,
  location_id INT NULL,
  lot_code VARCHAR(150) NOT NULL,
  barcode VARCHAR(150) NULL COMMENT 'Código de barras asignado al lote',
  quantity INT NOT NULL DEFAULT 0,
  reserved INT NOT NULL DEFAULT 0 COMMENT 'Cantidad reservada para pedidos en proceso',
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price_override DECIMAL(12,2) NULL COMMENT 'Si se quiere actualizar precio de venta por lote',
  expiration_date DATE NULL,
  received_date DATE NULL,
  status ENUM('active','consumed','expired') DEFAULT 'active',
  created_by VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
  INDEX idx_inventory_lots_product_id (product_id),
  INDEX idx_inventory_lots_barcode (barcode),
  INDEX idx_inventory_lots_expiration (expiration_date),
  INDEX idx_inventory_lots_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- 4. Columnas location_id + índices + llaves foráneas (idempotente)
--    MySQL no soporta "ADD COLUMN IF NOT EXISTS", por eso se consulta INFORMATION_SCHEMA.
-- ---------------------------------------------

-- inventory_lots.location_id
SET @sql := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE inventory_lots ADD COLUMN location_id INT NULL AFTER product_id',
  'DO 0')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lots' AND COLUMN_NAME = 'location_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE inventory_lots ADD INDEX idx_inventory_lots_location_product (location_id, product_id)',
  'DO 0')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lots' AND INDEX_NAME = 'idx_inventory_lots_location_product');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- inventory_movements.location_id
SET @sql := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE inventory_movements ADD COLUMN location_id INT NULL AFTER product_id',
  'DO 0')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_movements' AND COLUMN_NAME = 'location_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE inventory_movements ADD INDEX idx_inventory_movements_location (location_id, created_at)',
  'DO 0')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_movements' AND INDEX_NAME = 'idx_inventory_movements_location');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- admin_sales.location_id (local donde se hizo la venta)
SET @sql := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE admin_sales ADD COLUMN location_id INT NULL AFTER sale_number',
  'DO 0')
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_sales' AND COLUMN_NAME = 'location_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE admin_sales ADD INDEX idx_admin_sales_location (location_id)',
  'DO 0')
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_sales' AND INDEX_NAME = 'idx_admin_sales_location');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------
-- 5. Triggers
--    El trigger anterior (after_inventory_movement_insert) copiaba new_stock al
--    stock global en CADA movimiento. Ahora los movimientos llevan el stock del
--    local, así que la app actualiza local + total. El trigger nuevo solo actúa
--    con movimientos SIN local (código antiguo, procedimientos almacenados o SQL
--    manual): los asigna al local principal y mantiene el total igual que antes.
-- ---------------------------------------------
DROP TRIGGER IF EXISTS after_inventory_movement_insert;
DROP TRIGGER IF EXISTS before_inventory_movement_insert;
DROP TRIGGER IF EXISTS before_inventory_lot_insert;

DELIMITER $$

CREATE TRIGGER before_inventory_movement_insert
BEFORE INSERT ON inventory_movements
FOR EACH ROW
BEGIN
  DECLARE v_default_location INT DEFAULT NULL;
  DECLARE v_other_locations INT DEFAULT 0;

  IF NEW.location_id IS NULL THEN
    SET v_default_location = (SELECT id FROM locations WHERE is_default = 1 ORDER BY id LIMIT 1);

    IF v_default_location IS NOT NULL THEN
      SET NEW.location_id = v_default_location;

      -- El local principal absorbe la diferencia para que la suma por locales = total global
      SET v_other_locations = (
        SELECT COALESCE(SUM(current_stock), 0)
        FROM inventory_location_stock
        WHERE product_id = NEW.product_id AND location_id <> v_default_location
      );

      INSERT INTO inventory_location_stock (location_id, product_id, current_stock)
      VALUES (v_default_location, NEW.product_id, NEW.new_stock - v_other_locations)
      ON DUPLICATE KEY UPDATE current_stock = NEW.new_stock - v_other_locations;
    END IF;

    -- Comportamiento anterior: el stock global queda en new_stock
    UPDATE inventory_products
    SET current_stock = NEW.new_stock, updated_at = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id;

    UPDATE products
    SET stock = NEW.new_stock, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
  END IF;
END$$

-- Lotes creados sin local (código antiguo / procedimiento register_lot_entry) van al local principal
CREATE TRIGGER before_inventory_lot_insert
BEFORE INSERT ON inventory_lots
FOR EACH ROW
BEGIN
  IF NEW.location_id IS NULL THEN
    SET NEW.location_id = (SELECT id FROM locations WHERE is_default = 1 ORDER BY id LIMIT 1);
  END IF;
END$$

DELIMITER ;

-- ---------------------------------------------
-- 6. Pasar los datos existentes al local principal
-- ---------------------------------------------
SET @default_location_id := (SELECT id FROM locations WHERE is_default = 1 ORDER BY id LIMIT 1);

-- Stock actual -> local principal (solo productos que aún no tienen stock por local)
INSERT INTO inventory_location_stock (location_id, product_id, current_stock)
SELECT @default_location_id, ip.product_id, ip.current_stock
FROM inventory_products ip
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_location_stock s WHERE s.product_id = ip.product_id
);

UPDATE inventory_lots SET location_id = @default_location_id WHERE location_id IS NULL;
UPDATE inventory_movements SET location_id = @default_location_id WHERE location_id IS NULL;
UPDATE admin_sales SET location_id = @default_location_id WHERE location_id IS NULL;

-- Llaves foráneas (después de rellenar los datos)
SET @sql := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE inventory_lots ADD CONSTRAINT fk_inventory_lots_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE RESTRICT',
  'DO 0')
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_lots'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_inventory_lots_location');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE RESTRICT',
  'DO 0')
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_movements'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_inventory_movements_location');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE admin_sales ADD CONSTRAINT fk_admin_sales_location FOREIGN KEY (location_id) REFERENCES locations (id) ON DELETE RESTRICT',
  'DO 0')
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_sales'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY' AND CONSTRAINT_NAME = 'fk_admin_sales_location');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------
-- Verificación: la suma por locales debe coincidir con el total global
-- (la consulta de diferencias debe devolver 0 filas)
-- ---------------------------------------------
SELECT l.id, l.name, l.is_default, COUNT(s.id) AS productos, COALESCE(SUM(s.current_stock), 0) AS unidades
FROM locations l
LEFT JOIN inventory_location_stock s ON s.location_id = l.id
GROUP BY l.id, l.name, l.is_default;

SELECT ip.product_id, ip.current_stock AS total_global, COALESCE(SUM(s.current_stock), 0) AS suma_locales
FROM inventory_products ip
LEFT JOIN inventory_location_stock s ON s.product_id = ip.product_id
GROUP BY ip.product_id, ip.current_stock
HAVING total_global <> suma_locales;

SELECT 'locations migration ready' AS message;
