-- =============================================
-- ESQUEMA DE BASE DE DATOS FITOVIDA - MYSQL
-- =============================================
-- Ejecutar este SQL en MySQL
--
-- IMPORTANTE: Este esquema está diseñado para trabajar con:
-- - Clerk para autenticación de usuarios (user_id como VARCHAR)
-- - MySQL como base de datos
-- - Sistema de órdenes con múltiples métodos de pago
-- - Direcciones de envío múltiples por usuario
--
-- =============================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS fitovida CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitovida;

-- Eliminar tablas si existen (para recrear schema limpio)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS products;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- TABLA: products
-- =============================================
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  original_price DECIMAL(12, 2) DEFAULT NULL,
  image VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INT DEFAULT 100,
  featured BOOLEAN DEFAULT FALSE,
  discount INT DEFAULT NULL,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  reviews INT DEFAULT 0,
  benefits JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_products_category (category),
  INDEX idx_products_featured (featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: orders
-- =============================================
CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(100) DEFAULT NULL COMMENT 'ID de Clerk (puede ser NULL para invitados)',
  
  -- Datos del cliente
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  
  -- Dirección de envío (Solo Cali)
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL DEFAULT 'Cali',
  shipping_department VARCHAR(100) NOT NULL DEFAULT 'Valle del Cauca',
  shipping_zip VARCHAR(20) NOT NULL,
  
  -- Pago
  payment_method VARCHAR(30) NOT NULL,
  payment_id VARCHAR(255) DEFAULT NULL,
  payment_provider VARCHAR(20) DEFAULT NULL,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'pending',
  
  -- Notas
  notes TEXT DEFAULT NULL,
  
  -- Montos (en COP)
  subtotal DECIMAL(12, 2) NOT NULL,
  shipping DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  discount_code VARCHAR(50) DEFAULT NULL,
  total DECIMAL(12, 2) NOT NULL,
  
  -- Cancelación
  cancelled_at TIMESTAMP NULL DEFAULT NULL,
  cancellation_reason TEXT DEFAULT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_shipping_city CHECK (shipping_city = 'Cali'),
  CONSTRAINT chk_shipping_department CHECK (shipping_department = 'Valle del Cauca'),
  CONSTRAINT chk_payment_method CHECK (payment_method IN ('card', 'pse', 'transfer', 'cash_on_delivery')),
  CONSTRAINT chk_payment_provider CHECK (payment_provider IS NULL OR payment_provider IN ('stripe', 'wompi', 'none')),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'failed')),
  CONSTRAINT chk_positive_amounts CHECK (subtotal >= 0 AND shipping >= 0 AND discount >= 0 AND total >= 0),
  CONSTRAINT chk_valid_email CHECK (customer_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at DESC),
  INDEX idx_orders_order_number (order_number),
  INDEX idx_orders_customer_email (customer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: order_items
-- =============================================
CREATE TABLE order_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_id CHAR(36) NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLA: user_addresses
-- =============================================
CREATE TABLE user_addresses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(100) NOT NULL COMMENT 'ID de Clerk',
  
  -- Información de la dirección (Solo Cali)
  label VARCHAR(100) NOT NULL COMMENT 'Ej: Casa, Oficina, Trabajo',
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Cali',
  department VARCHAR(100) NOT NULL DEFAULT 'Valle del Cauca',
  zip_code VARCHAR(20) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  instructions TEXT DEFAULT NULL COMMENT 'Instrucciones de entrega opcionales',
  
  -- Control
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_city CHECK (city = 'Cali'),
  CONSTRAINT chk_department CHECK (department = 'Valle del Cauca'),
  CONSTRAINT chk_valid_phone CHECK (phone REGEXP '^[0-9]{7,}$'),
  UNIQUE KEY unique_user_label (user_id, label),
  
  INDEX idx_user_addresses_user_id (user_id),
  INDEX idx_user_addresses_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TRIGGER: Garantizar solo una dirección predeterminada
-- =============================================
DELIMITER $$

CREATE TRIGGER before_user_address_insert
BEFORE INSERT ON user_addresses
FOR EACH ROW
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE user_addresses
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND is_default = TRUE;
  END IF;
END$$

CREATE TRIGGER before_user_address_update
BEFORE UPDATE ON user_addresses
FOR EACH ROW
BEGIN
  IF NEW.is_default = TRUE AND (OLD.is_default = FALSE OR OLD.is_default IS NULL) THEN
    UPDATE user_addresses
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = TRUE;
  END IF;
END$$

DELIMITER ;

-- =============================================
-- DATOS INICIALES: Productos
-- =============================================
INSERT INTO products (name, description, price, original_price, image, category, featured, discount, rating, reviews, benefits) VALUES
-- Vitaminas
('Vitamina C 1000mg', 'Suplemento de Vitamina C de alta potencia para fortalecer el sistema inmunológico. Fórmula de liberación prolongada.', 45000, 55000, '/img/productos/vitamina-c.jpg', 'vitaminas', TRUE, 18, 4.8, 234, JSON_ARRAY('Fortalece el sistema inmune', 'Antioxidante potente', 'Mejora absorción de hierro', 'Promueve piel saludable')),
('Complejo B Premium', 'Fórmula completa con todas las vitaminas del complejo B para energía y bienestar mental.', 52000, NULL, '/img/productos/complejo-b.jpg', 'vitaminas', TRUE, NULL, 4.7, 189, JSON_ARRAY('Aumenta niveles de energía', 'Mejora función cognitiva', 'Reduce estrés y fatiga', 'Apoya metabolismo')),
('Vitamina D3 5000 UI', 'Vitamina D3 de alta absorción para huesos fuertes y sistema inmune saludable.', 38000, 45000, '/img/productos/vitamina-d.jpg', 'vitaminas', FALSE, 15, 4.9, 312, JSON_ARRAY('Fortalece huesos y dientes', 'Mejora absorción de calcio', 'Apoya sistema inmune', 'Mejora estado de ánimo')),
('Multivitamínico Completo', 'Fórmula multivitamínica con minerales esenciales para toda la familia.', 68000, NULL, '/img/productos/multivitaminico.jpg', 'vitaminas', TRUE, NULL, 4.6, 156, JSON_ARRAY('Nutrición completa', 'Energía durante el día', 'Fortalece defensas', 'Incluye minerales esenciales')),

-- Suplementos
('Omega 3 Fish Oil', 'Aceite de pescado purificado con EPA y DHA para salud cardiovascular y cerebral.', 75000, 89000, '/img/productos/omega3.jpg', 'suplementos', TRUE, 16, 4.8, 278, JSON_ARRAY('Salud cardiovascular', 'Función cerebral', 'Reduce inflamación', 'Mejora visión')),
('Colágeno Hidrolizado', 'Colágeno tipo I y III hidrolizado para piel, cabello, uñas y articulaciones.', 82000, NULL, '/img/productos/colageno.jpg', 'suplementos', TRUE, NULL, 4.9, 423, JSON_ARRAY('Piel más firme', 'Cabello más fuerte', 'Uñas saludables', 'Articulaciones flexibles')),
('Probióticos 50 Billones', 'Mezcla de 10 cepas probióticas para salud digestiva e inmunológica.', 65000, 75000, '/img/productos/probioticos.jpg', 'suplementos', FALSE, 13, 4.7, 198, JSON_ARRAY('Mejora digestión', 'Flora intestinal saludable', 'Fortalece inmunidad', 'Reduce hinchazón')),
('Magnesio Citrato', 'Magnesio de alta absorción para músculos, nervios y sueño reparador.', 42000, NULL, '/img/productos/magnesio.jpg', 'suplementos', FALSE, NULL, 4.6, 167, JSON_ARRAY('Relajación muscular', 'Mejora calidad del sueño', 'Reduce calambres', 'Apoya sistema nervioso')),

-- Naturales
('Cúrcuma con Pimienta Negra', 'Extracto de cúrcuma potenciado con piperina para máxima absorción antiinflamatoria.', 48000, 58000, '/img/productos/curcuma.jpg', 'naturales', TRUE, 17, 4.8, 289, JSON_ARRAY('Antiinflamatorio natural', 'Antioxidante potente', 'Mejora digestión', 'Apoya articulaciones')),
('Ashwagandha Orgánica', 'Adaptógeno ayurvédico para reducir estrés, ansiedad y mejorar energía.', 55000, NULL, '/img/productos/ashwagandha.jpg', 'naturales', TRUE, NULL, 4.7, 234, JSON_ARRAY('Reduce estrés', 'Mejora energía', 'Equilibrio hormonal', 'Mejor concentración')),
('Moringa en Polvo', 'Superalimento orgánico rico en nutrientes, vitaminas y antioxidantes.', 35000, 42000, '/img/productos/moringa.jpg', 'naturales', FALSE, 17, 4.5, 145, JSON_ARRAY('Nutrientes esenciales', 'Energía natural', 'Desintoxicante', 'Antiinflamatorio')),
('Espirulina Premium', 'Alga azul-verde orgánica, fuente completa de proteínas y nutrientes.', 58000, NULL, '/img/productos/espirulina.jpg', 'naturales', FALSE, NULL, 4.6, 178, JSON_ARRAY('Proteína completa', 'Hierro natural', 'Desintoxicante', 'Energía sostenida')),

-- Proteínas
('Proteína Whey Isolate', 'Proteína de suero aislada de alta pureza, baja en carbohidratos y grasas.', 185000, 210000, '/img/productos/whey-protein.jpg', 'proteinas', TRUE, 12, 4.9, 456, JSON_ARRAY('Rápida absorción', '25g proteína por porción', 'Bajo en grasa', 'Ideal post-entrenamiento')),
('Proteína Vegana Orgánica', 'Mezcla de proteínas vegetales (guisante, arroz, cáñamo) para dietas veganas.', 165000, NULL, '/img/productos/proteina-vegana.jpg', 'proteinas', TRUE, NULL, 4.7, 234, JSON_ARRAY('100% vegetal', '22g proteína', 'Sin lácteos', 'Fácil digestión')),
('Caseína Micelar', 'Proteína de liberación lenta ideal para consumir antes de dormir.', 175000, 195000, '/img/productos/caseina.jpg', 'proteinas', FALSE, 10, 4.6, 167, JSON_ARRAY('Liberación lenta', 'Recuperación nocturna', 'Alto en BCAA', 'Saciante')),

-- Energía
('Pre-Workout Extreme', 'Fórmula pre-entrenamiento con cafeína, beta-alanina y creatina para máximo rendimiento.', 95000, 115000, '/img/productos/preworkout.jpg', 'energia', TRUE, 17, 4.8, 312, JSON_ARRAY('Explosión de energía', 'Mayor enfoque mental', 'Mejor rendimiento', 'Retrasa fatiga')),
('BCAA 2:1:1', 'Aminoácidos de cadena ramificada para recuperación muscular y resistencia.', 78000, NULL, '/img/productos/bcaa.jpg', 'energia', FALSE, NULL, 4.7, 198, JSON_ARRAY('Recuperación muscular', 'Reduce fatiga', 'Preserva músculo', 'Hidratación mejorada')),
('Creatina Monohidrato', 'Creatina pura micronizada para fuerza, potencia y masa muscular.', 68000, 78000, '/img/productos/creatina.jpg', 'energia', TRUE, 13, 4.9, 389, JSON_ARRAY('Mayor fuerza', 'Más potencia', 'Recuperación rápida', 'Masa muscular'));

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista: Resumen de órdenes con totales
CREATE OR REPLACE VIEW orders_summary AS
SELECT 
  o.id,
  o.order_number,
  o.user_id,
  o.customer_name,
  o.customer_email,
  o.status,
  o.payment_method,
  o.total,
  o.created_at,
  COUNT(oi.id) as total_items,
  SUM(oi.quantity) as total_products
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.user_id, o.customer_name, o.customer_email, 
         o.status, o.payment_method, o.total, o.created_at;

-- Vista: Productos más vendidos
CREATE OR REPLACE VIEW top_products AS
SELECT 
  oi.product_id,
  oi.product_name,
  COUNT(DISTINCT oi.order_id) as total_orders,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.quantity * oi.price) as total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status NOT IN ('cancelled', 'failed')
GROUP BY oi.product_id, oi.product_name
ORDER BY total_quantity DESC;

-- =============================================
-- ESTADÍSTICAS Y VERIFICACIÓN
-- =============================================

-- Verificar datos insertados
SELECT COUNT(*) as total_productos FROM products;
SELECT 'Base de datos Fitovida creada exitosamente!' as mensaje;
