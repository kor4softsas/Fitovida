-- =============================================
-- ESQUEMA PANEL DE ADMINISTRACIÓN FITOVIDA
-- =============================================
-- Tablas adicionales para el panel administrativo
-- Ejecutar DESPUÉS de schema-mysql.sql
-- =============================================

USE fitovida;

-- =============================================
-- TABLA: admin_sales (Ventas internas registradas manualmente)
-- =============================================
CREATE TABLE IF NOT EXISTS admin_sales (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sale_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número consecutivo: V-2026-001',
  
  -- Información del cliente
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NULL,
  customer_phone VARCHAR(50) NULL,
  customer_document VARCHAR(50) NULL COMMENT 'NIT o CC para facturación DIAN',
  
  -- Montos
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT 'IVA',
  discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  
  -- Pago
  payment_method ENUM('cash', 'card', 'transfer', 'pse', 'wompi') NOT NULL,
  payment_status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
  
  -- Facturación DIAN (campos preparados para futura integración)
  invoice_number VARCHAR(100) NULL COMMENT 'Número de factura electrónica',
  invoice_cufe VARCHAR(255) NULL COMMENT 'Código Único de Facturación Electrónica',
  invoice_date TIMESTAMP NULL COMMENT 'Fecha de emisión de factura',
  invoice_status ENUM('pending', 'authorized', 'rejected') NULL COMMENT 'Estado factura DIAN',
  invoice_xml_path VARCHAR(500) NULL COMMENT 'Ruta al XML de la factura',
  invoice_pdf_path VARCHAR(500) NULL COMMENT 'Ruta al PDF de la factura',
  
  -- Notas
  notes TEXT NULL,
  
  -- Auditoría
  created_by VARCHAR(255) NOT NULL COMMENT 'ID del usuario admin que registró',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_sale_number (sale_number),
  INDEX idx_customer_document (customer_document),
  INDEX idx_payment_status (payment_status),
  INDEX idx_invoice_status (invoice_status),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: admin_sale_items (Items de ventas internas)
-- =============================================
CREATE TABLE IF NOT EXISTS admin_sale_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sale_id CHAR(36) NOT NULL,
  product_id INT NOT NULL COMMENT 'Referencia al producto en tabla products',
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT 'IVA por item',
  subtotal DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (sale_id) REFERENCES admin_sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_sale_id (sale_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: inventory_products (Productos en inventario)
-- =============================================
-- Nota: Esta tabla extiende la tabla 'products' para control de inventario
CREATE TABLE IF NOT EXISTS inventory_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT UNIQUE NOT NULL COMMENT 'FK a tabla products',
  sku VARCHAR(100) UNIQUE NULL COMMENT 'Código de producto',
  barcode VARCHAR(100) UNIQUE NULL COMMENT 'Código de barras (EAN-13, UPC-A, EAN-8, Code128, personalizado)',
  
  -- Stock
  current_stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5 COMMENT 'Alerta de stock mínimo',
  max_stock INT NULL COMMENT 'Stock máximo recomendado',
  
  -- Costos
  unit_cost DECIMAL(12, 2) NOT NULL COMMENT 'Costo de compra unitario',
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 19.00 COMMENT 'Tasa de IVA (%)',
  
  -- Proveedor
  supplier VARCHAR(255) NULL,
  
  -- Estado
  status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_sku (sku),
  INDEX idx_barcode (barcode),
  INDEX idx_status (status),
  INDEX idx_current_stock (current_stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla de inventario con soporte para códigos de barras únicos';

-- =============================================
-- TABLA: inventory_movements (Movimientos de inventario)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  
  -- Tipo de movimiento
  type ENUM('entry', 'exit', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  
  -- Stock antes/después
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  
  -- Costos
  unit_cost DECIMAL(12, 2) NULL,
  total_cost DECIMAL(12, 2) NULL,
  
  -- Razón del movimiento
  reason ENUM('purchase', 'sale', 'return', 'damage', 'adjustment', 'transfer', 'other') NOT NULL,
  reference VARCHAR(100) NULL COMMENT 'Número de compra, venta, etc.',
  notes TEXT NULL,
  
  -- Auditoría
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_product_id (product_id),
  INDEX idx_type (type),
  INDEX idx_reason (reason),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: incomes (Ingresos)
-- =============================================
CREATE TABLE IF NOT EXISTS incomes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  
  category ENUM('sales', 'services', 'other') NOT NULL,
  description VARCHAR(500) NOT NULL,
  reference VARCHAR(100) NULL COMMENT 'Número de venta, factura, etc.',
  
  payment_method ENUM('cash', 'card', 'transfer', 'pse', 'wompi') NOT NULL,
  status ENUM('received', 'pending') DEFAULT 'received',
  
  notes TEXT NULL,
  
  -- Auditoría
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_date (date DESC),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: expenses (Gastos)
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  
  category ENUM('inventory', 'services', 'salaries', 'rent', 'utilities', 'marketing', 'other') NOT NULL,
  description VARCHAR(500) NOT NULL,
  supplier VARCHAR(255) NULL,
  reference VARCHAR(100) NULL COMMENT 'Número de factura',
  
  payment_method ENUM('cash', 'card', 'transfer') NOT NULL,
  status ENUM('paid', 'pending') DEFAULT 'paid',
  
  notes TEXT NULL,
  
  -- Auditoría
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_date (date DESC),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_supplier (supplier),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TRIGGERS: Actualizar stock automáticamente
-- =============================================

DELIMITER $$

-- Trigger: Al crear un movimiento de inventario, actualizar stock
CREATE TRIGGER after_inventory_movement_insert
AFTER INSERT ON inventory_movements
FOR EACH ROW
BEGIN
  UPDATE inventory_products
  SET current_stock = NEW.new_stock,
      updated_at = CURRENT_TIMESTAMP
  WHERE product_id = NEW.product_id;
  
  -- También actualizar stock en tabla products
  UPDATE products
  SET stock = NEW.new_stock,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;
END$$

-- Trigger: Al crear una venta interna, registrar ingreso automáticamente
CREATE TRIGGER after_admin_sale_insert
AFTER INSERT ON admin_sales
FOR EACH ROW
BEGIN
  IF NEW.payment_status = 'completed' THEN
    INSERT INTO incomes (
      id, date, amount, category, description, reference, 
      payment_method, status, created_by, created_at
    ) VALUES (
      UUID(),
      DATE(NEW.created_at),
      NEW.total,
      'sales',
      CONCAT('Venta ', NEW.sale_number, ' - ', NEW.customer_name),
      NEW.sale_number,
      NEW.payment_method,
      'received',
      NEW.created_by,
      CURRENT_TIMESTAMP
    );
  END IF;
END$$

DELIMITER ;

-- =============================================
-- VISTAS ÚTILES PARA ADMIN
-- =============================================

-- Vista: Resumen de ventas por día
CREATE OR REPLACE VIEW admin_daily_sales AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as total_sales,
  SUM(total) as total_amount,
  AVG(total) as average_sale,
  SUM(CASE WHEN payment_status = 'completed' THEN total ELSE 0 END) as completed_amount,
  SUM(CASE WHEN payment_status = 'pending' THEN total ELSE 0 END) as pending_amount
FROM admin_sales
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Vista: Productos con stock bajo
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  ip.id,
  p.name as product_name,
  ip.sku,
  ip.current_stock,
  ip.min_stock,
  ip.supplier,
  p.category,
  CASE 
    WHEN ip.current_stock = 0 THEN 'Sin stock'
    WHEN ip.current_stock <= ip.min_stock THEN 'Stock bajo'
    ELSE 'OK'
  END as stock_status
FROM inventory_products ip
JOIN products p ON ip.product_id = p.id
WHERE ip.current_stock <= ip.min_stock
  AND ip.status = 'active'
ORDER BY ip.current_stock ASC;

-- Vista: Balance financiero mensual
CREATE OR REPLACE VIEW monthly_financial_summary AS
SELECT 
  DATE_FORMAT(date, '%Y-%m') as month,
  SUM(CASE WHEN table_name = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN table_name = 'expense' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN table_name = 'income' THEN amount ELSE -amount END) as balance
FROM (
  SELECT date, amount, 'income' as table_name FROM incomes WHERE status = 'received'
  UNION ALL
  SELECT date, amount, 'expense' as table_name FROM expenses WHERE status = 'paid'
) combined
GROUP BY DATE_FORMAT(date, '%Y-%m')
ORDER BY month DESC;

-- Vista: Productos más vendidos (admin)
CREATE OR REPLACE VIEW admin_top_selling_products AS
SELECT 
  p.id,
  p.name,
  p.category,
  COUNT(DISTINCT asi.sale_id) as times_sold,
  SUM(asi.quantity) as total_quantity,
  SUM(asi.total) as total_revenue
FROM admin_sale_items asi
JOIN products p ON asi.product_id = p.id
JOIN admin_sales s ON asi.sale_id = s.id
WHERE s.payment_status = 'completed'
GROUP BY p.id, p.name, p.category
ORDER BY total_quantity DESC
LIMIT 20;

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =============================================

DELIMITER $$

-- Procedimiento: Registrar entrada de inventario
CREATE PROCEDURE register_inventory_entry(
  IN p_product_id INT,
  IN p_quantity INT,
  IN p_unit_cost DECIMAL(12,2),
  IN p_reference VARCHAR(100),
  IN p_notes TEXT,
  IN p_user_id VARCHAR(255)
)
BEGIN
  DECLARE v_current_stock INT;
  DECLARE v_new_stock INT;
  DECLARE v_product_name VARCHAR(255);
  
  -- Obtener stock actual y nombre del producto
  SELECT current_stock INTO v_current_stock 
  FROM inventory_products 
  WHERE product_id = p_product_id;
  
  SELECT name INTO v_product_name 
  FROM products 
  WHERE id = p_product_id;
  
  -- Calcular nuevo stock
  SET v_new_stock = v_current_stock + p_quantity;
  
  -- Registrar movimiento
  INSERT INTO inventory_movements (
    id, product_id, product_name, type, quantity,
    previous_stock, new_stock, unit_cost, total_cost,
    reason, reference, notes, created_by
  ) VALUES (
    UUID(), p_product_id, v_product_name, 'entry', p_quantity,
    v_current_stock, v_new_stock, p_unit_cost, p_quantity * p_unit_cost,
    'purchase', p_reference, p_notes, p_user_id
  );
  
  -- El trigger actualizará el stock automáticamente
END$$

-- Procedimiento: Registrar salida de inventario
CREATE PROCEDURE register_inventory_exit(
  IN p_product_id INT,
  IN p_quantity INT,
  IN p_reason VARCHAR(50),
  IN p_reference VARCHAR(100),
  IN p_notes TEXT,
  IN p_user_id VARCHAR(255)
)
BEGIN
  DECLARE v_current_stock INT;
  DECLARE v_new_stock INT;
  DECLARE v_product_name VARCHAR(255);
  DECLARE v_unit_cost DECIMAL(12,2);
  
  -- Obtener datos del producto
  SELECT ip.current_stock, ip.unit_cost, p.name
  INTO v_current_stock, v_unit_cost, v_product_name
  FROM inventory_products ip
  JOIN products p ON ip.product_id = p.id
  WHERE ip.product_id = p_product_id;
  
  -- Validar que hay suficiente stock
  IF v_current_stock < p_quantity THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Stock insuficiente para realizar la salida';
  END IF;
  
  -- Calcular nuevo stock
  SET v_new_stock = v_current_stock - p_quantity;
  
  -- Registrar movimiento
  INSERT INTO inventory_movements (
    id, product_id, product_name, type, quantity,
    previous_stock, new_stock, unit_cost, total_cost,
    reason, reference, notes, created_by
  ) VALUES (
    UUID(), p_product_id, v_product_name, 'exit', p_quantity,
    v_current_stock, v_new_stock, v_unit_cost, p_quantity * v_unit_cost,
    p_reason, p_reference, p_notes, p_user_id
  );
END$$

DELIMITER ;

-- =============================================
-- DATOS INICIALES DE EJEMPLO
-- =============================================

-- Inicializar inventario para productos existentes
INSERT INTO inventory_products (product_id, sku, current_stock, min_stock, unit_cost, supplier)
SELECT 
  id,
  CONCAT('SKU-', LPAD(id, 5, '0')),
  stock,
  10,
  price * 0.6, -- Estimación: costo es 60% del precio de venta
  'Proveedor General'
FROM products
ON DUPLICATE KEY UPDATE product_id = product_id;

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Tablas del panel de administración creadas exitosamente!' as mensaje;
SELECT COUNT(*) as productos_en_inventario FROM inventory_products;

