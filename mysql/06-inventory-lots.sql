-- =============================================
-- Migración: Tabla para lotes de inventario y procedimiento para registrar lotes
-- Fecha: 2026-06-06
-- =============================================

USE fitovida;

-- Tabla: inventory_lots
CREATE TABLE IF NOT EXISTS inventory_lots (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id INT NOT NULL,
  lot_code VARCHAR(150) NOT NULL,
  barcode VARCHAR(150) NULL COMMENT 'Código de barras asignado al lote',
  quantity INT NOT NULL DEFAULT 0,
  reserved INT NOT NULL DEFAULT 0 COMMENT 'Cantidad reservada para pedidos en proceso',
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price_override DECIMAL(12,2) NULL COMMENT 'Si se quiere actualizar precio de venta por lote',
  expiration_date DATE NULL,
  received_date DATE DEFAULT CURRENT_DATE,
  status ENUM('active','consumed','expired') DEFAULT 'active',
  created_by VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_inventory_lots_product_id (product_id),
  INDEX idx_inventory_lots_barcode (barcode),
  INDEX idx_inventory_lots_expiration (expiration_date),
  INDEX idx_inventory_lots_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

-- Procedimiento: Registrar lote y actualizar stock global
CREATE PROCEDURE register_lot_entry(
  IN p_product_id INT,
  IN p_lot_code VARCHAR(150),
  IN p_barcode VARCHAR(150),
  IN p_quantity INT,
  IN p_unit_cost DECIMAL(12,2),
  IN p_sale_price_override DECIMAL(12,2),
  IN p_expiration_date DATE,
  IN p_reference VARCHAR(100),
  IN p_notes TEXT,
  IN p_user_id VARCHAR(255)
)
BEGIN
  DECLARE v_product_name VARCHAR(255);
  DECLARE v_current_stock INT DEFAULT 0;
  DECLARE v_new_stock INT DEFAULT 0;

  SELECT name INTO v_product_name FROM products WHERE id = p_product_id;
  IF v_product_name IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Producto no existe';
  END IF;

  -- Insertar lote
  INSERT INTO inventory_lots (
    id, product_id, lot_code, barcode, quantity, unit_cost, sale_price_override, expiration_date, received_date, status, created_by
  ) VALUES (
    UUID(), p_product_id, p_lot_code, p_barcode, p_quantity, p_unit_cost, p_sale_price_override, p_expiration_date, CURRENT_DATE, 'active', p_user_id
  );

  -- Actualizar stock global
  SELECT current_stock INTO v_current_stock FROM inventory_products WHERE product_id = p_product_id;
  IF v_current_stock IS NULL THEN
    SET v_current_stock = 0;
  END IF;
  SET v_new_stock = v_current_stock + p_quantity;

  -- Registrar movimiento referenciando producto (no todos los sistemas quieren almacenar lot_id en movements)
  INSERT INTO inventory_movements (
    id, product_id, product_name, type, quantity, previous_stock, new_stock, unit_cost, total_cost, reason, reference, notes, created_by
  ) VALUES (
    UUID(), p_product_id, v_product_name, 'entry', p_quantity, v_current_stock, v_new_stock, p_unit_cost, p_quantity * p_unit_cost, 'purchase', p_reference, p_notes, p_user_id
  );

  -- Actualizar tabla inventory_products (trigger after_inventory_movement_insert también lo hará, pero garantizamos coherencia)
  UPDATE inventory_products SET current_stock = v_new_stock, unit_cost = p_unit_cost, updated_at = CURRENT_TIMESTAMP WHERE product_id = p_product_id;
END$$

DELIMITER ;

-- Nota: No se crean triggers adicionales que alteren el comportamiento existente. El procedimiento puede invocarse desde el backend en una transacción.

SELECT 'inventory_lots migration ready' as message;
