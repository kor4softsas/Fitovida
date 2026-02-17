-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 30-01-2026 a las 03:35:37
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `fitovida`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `register_inventory_entry` (IN `p_product_id` INT, IN `p_quantity` INT, IN `p_unit_cost` DECIMAL(12,2), IN `p_reference` VARCHAR(100), IN `p_notes` TEXT, IN `p_user_id` VARCHAR(255))   BEGIN
  DECLARE v_current_stock INT;
  DECLARE v_new_stock INT;
  DECLARE v_product_name VARCHAR(255);
  
  
  SELECT current_stock INTO v_current_stock 
  FROM inventory_products 
  WHERE product_id = p_product_id;
  
  SELECT name INTO v_product_name 
  FROM products 
  WHERE id = p_product_id;
  
  
  SET v_new_stock = v_current_stock + p_quantity;
  
  
  INSERT INTO inventory_movements (
    id, product_id, product_name, type, quantity,
    previous_stock, new_stock, unit_cost, total_cost,
    reason, reference, notes, created_by
  ) VALUES (
    UUID(), p_product_id, v_product_name, 'entry', p_quantity,
    v_current_stock, v_new_stock, p_unit_cost, p_quantity * p_unit_cost,
    'purchase', p_reference, p_notes, p_user_id
  );
  
  
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `register_inventory_exit` (IN `p_product_id` INT, IN `p_quantity` INT, IN `p_reason` VARCHAR(50), IN `p_reference` VARCHAR(100), IN `p_notes` TEXT, IN `p_user_id` VARCHAR(255))   BEGIN
  DECLARE v_current_stock INT;
  DECLARE v_new_stock INT;
  DECLARE v_product_name VARCHAR(255);
  DECLARE v_unit_cost DECIMAL(12,2);
  
  
  SELECT ip.current_stock, ip.unit_cost, p.name
  INTO v_current_stock, v_unit_cost, v_product_name
  FROM inventory_products ip
  JOIN products p ON ip.product_id = p.id
  WHERE ip.product_id = p_product_id;
  
  
  IF v_current_stock < p_quantity THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Stock insuficiente para realizar la salida';
  END IF;
  
  
  SET v_new_stock = v_current_stock - p_quantity;
  
  
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

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `admin_daily_sales`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `admin_daily_sales` (
`sale_date` date
,`total_sales` bigint(21)
,`total_amount` decimal(34,2)
,`average_sale` decimal(16,6)
,`completed_amount` decimal(34,2)
,`pending_amount` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admin_sales`
--

CREATE TABLE `admin_sales` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `sale_number` varchar(50) NOT NULL COMMENT 'N·mero consecutivo: V-2026-001',
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `customer_document` varchar(50) DEFAULT NULL COMMENT 'NIT o CC para facturaci¾n DIAN',
  `subtotal` decimal(12,2) NOT NULL,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'IVA',
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','card','transfer','pse','wompi') NOT NULL,
  `payment_status` enum('completed','pending','cancelled') DEFAULT 'completed',
  `invoice_number` varchar(100) DEFAULT NULL COMMENT 'N·mero de factura electr¾nica',
  `invoice_cufe` varchar(255) DEFAULT NULL COMMENT 'C¾digo ┌nico de Facturaci¾n Electr¾nica',
  `invoice_date` timestamp NULL DEFAULT NULL COMMENT 'Fecha de emisi¾n de factura',
  `invoice_status` enum('pending','authorized','rejected') DEFAULT NULL COMMENT 'Estado factura DIAN',
  `invoice_xml_path` varchar(500) DEFAULT NULL COMMENT 'Ruta al XML de la factura',
  `invoice_pdf_path` varchar(500) DEFAULT NULL COMMENT 'Ruta al PDF de la factura',
  `notes` text DEFAULT NULL,
  `created_by` varchar(255) NOT NULL COMMENT 'ID del usuario admin que registr¾',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Disparadores `admin_sales`
--
DELIMITER $$
CREATE TRIGGER `after_admin_sale_insert` AFTER INSERT ON `admin_sales` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admin_sale_items`
--

CREATE TABLE `admin_sale_items` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `sale_id` char(36) NOT NULL,
  `product_id` int(11) NOT NULL COMMENT 'Referencia al producto en tabla products',
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'IVA por item',
  `subtotal` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `admin_top_selling_products`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `admin_top_selling_products` (
`id` int(11)
,`name` varchar(255)
,`category` varchar(100)
,`times_sold` bigint(21)
,`total_quantity` decimal(32,0)
,`total_revenue` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `expenses`
--

CREATE TABLE `expenses` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `category` enum('inventory','services','salaries','rent','utilities','marketing','other') NOT NULL,
  `description` varchar(500) NOT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `reference` varchar(100) DEFAULT NULL COMMENT 'N·mero de factura',
  `payment_method` enum('cash','card','transfer') NOT NULL,
  `status` enum('paid','pending') DEFAULT 'paid',
  `notes` text DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incomes`
--

CREATE TABLE `incomes` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `category` enum('sales','services','other') NOT NULL,
  `description` varchar(500) NOT NULL,
  `reference` varchar(100) DEFAULT NULL COMMENT 'N·mero de venta, factura, etc.',
  `payment_method` enum('cash','card','transfer','pse','wompi') NOT NULL,
  `status` enum('received','pending') DEFAULT 'received',
  `notes` text DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `type` enum('entry','exit','adjustment') NOT NULL,
  `quantity` int(11) NOT NULL,
  `previous_stock` int(11) NOT NULL,
  `new_stock` int(11) NOT NULL,
  `unit_cost` decimal(12,2) DEFAULT NULL,
  `total_cost` decimal(12,2) DEFAULT NULL,
  `reason` enum('purchase','sale','return','damage','adjustment','transfer','other') NOT NULL,
  `reference` varchar(100) DEFAULT NULL COMMENT 'N·mero de compra, venta, etc.',
  `notes` text DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Disparadores `inventory_movements`
--
DELIMITER $$
CREATE TRIGGER `after_inventory_movement_insert` AFTER INSERT ON `inventory_movements` FOR EACH ROW BEGIN
  UPDATE inventory_products
  SET current_stock = NEW.new_stock,
      updated_at = CURRENT_TIMESTAMP
  WHERE product_id = NEW.product_id;
  
  
  UPDATE products
  SET stock = NEW.new_stock,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.product_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventory_products`
--

CREATE TABLE `inventory_products` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL COMMENT 'FK a tabla products',
  `sku` varchar(100) DEFAULT NULL COMMENT 'C¾digo de producto',
  `current_stock` int(11) NOT NULL DEFAULT 0,
  `min_stock` int(11) NOT NULL DEFAULT 5 COMMENT 'Alerta de stock mÝnimo',
  `max_stock` int(11) DEFAULT NULL COMMENT 'Stock mßximo recomendado',
  `unit_cost` decimal(12,2) NOT NULL COMMENT 'Costo de compra unitario',
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 19.00 COMMENT 'Tasa de IVA (%)',
  `supplier` varchar(255) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive','discontinued') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `inventory_products`
--

INSERT INTO `inventory_products` (`id`, `product_id`, `sku`, `current_stock`, `min_stock`, `max_stock`, `unit_cost`, `tax_rate`, `supplier`, `barcode`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'SKU-00001', 100, 10, NULL, 27000.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(2, 2, 'SKU-00002', 100, 10, NULL, 31200.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(3, 3, 'SKU-00003', 100, 10, NULL, 22800.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(4, 4, 'SKU-00004', 100, 10, NULL, 40800.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(5, 5, 'SKU-00005', 100, 10, NULL, 45000.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(6, 6, 'SKU-00006', 100, 10, NULL, 49200.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(7, 7, 'SKU-00007', 100, 10, NULL, 39000.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(8, 8, 'SKU-00008', 100, 10, NULL, 25200.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(9, 9, 'SKU-00009', 100, 10, NULL, 28800.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(10, 10, 'SKU-00010', 100, 10, NULL, 33000.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(11, 11, 'SKU-00011', 100, 10, NULL, 21000.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(12, 12, 'SKU-00012', 100, 10, NULL, 34800.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(13, 13, 'SKU-00013', 100, 10, NULL, 111000.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(14, 14, 'SKU-00014', 100, 10, NULL, 99000.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(15, 15, 'SKU-00015', 100, 10, NULL, 105000.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(16, 16, 'SKU-00016', 100, 10, NULL, 57000.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(17, 17, 'SKU-00017', 100, 10, NULL, 46800.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48'),
(18, 18, 'SKU-00018', 100, 10, NULL, 40800.00, 19.00, 'Proveedor General', NULL, 'active', '2026-01-29 03:37:48', '2026-01-29 03:37:48');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `low_stock_products`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `low_stock_products` (
`id` int(11)
,`product_name` varchar(255)
,`sku` varchar(100)
,`current_stock` int(11)
,`min_stock` int(11)
,`supplier` varchar(255)
,`category` varchar(100)
,`stock_status` varchar(10)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `monthly_financial_summary`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `monthly_financial_summary` (
`month` varchar(7)
,`total_income` decimal(34,2)
,`total_expenses` decimal(34,2)
,`balance` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `orders`
--

CREATE TABLE `orders` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_number` varchar(50) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(50) NOT NULL,
  `shipping_address` text NOT NULL,
  `shipping_city` varchar(100) NOT NULL DEFAULT 'Cali',
  `shipping_department` varchar(100) NOT NULL DEFAULT 'Valle del Cauca',
  `shipping_zip` varchar(20) NOT NULL,
  `payment_method` varchar(30) NOT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `payment_provider` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `shipping` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) DEFAULT 0.00,
  `discount_code` varchar(50) DEFAULT NULL,
  `total` decimal(12,2) NOT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `orders_summary`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `orders_summary` (
`id` char(36)
,`order_number` varchar(50)
,`user_id` varchar(255)
,`customer_name` varchar(255)
,`customer_email` varchar(255)
,`status` varchar(20)
,`payment_method` varchar(30)
,`total` decimal(12,2)
,`created_at` timestamp
,`total_items` bigint(21)
,`total_products` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `order_items`
--

CREATE TABLE `order_items` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `order_id` char(36) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_image` varchar(500) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `original_price` decimal(12,2) DEFAULT NULL,
  `image` varchar(500) NOT NULL,
  `category` varchar(100) NOT NULL,
  `stock` int(11) DEFAULT 100,
  `featured` tinyint(1) DEFAULT 0,
  `discount` int(11) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT 4.5,
  `reviews` int(11) DEFAULT 0,
  `benefits` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`benefits`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `original_price`, `image`, `category`, `stock`, `featured`, `discount`, `rating`, `reviews`, `benefits`, `created_at`, `updated_at`) VALUES
(1, 'Vitamina C 1000mg', 'Suplemento de Vitamina C de alta potencia para fortalecer el sistema inmunol¾gico. F¾rmula de liberaci¾n prolongada.', 45000.00, 55000.00, '/img/productos/vitamina-c.jpg', 'vitaminas', 100, 1, 18, 4.8, 234, '[\"Fortalece el sistema inmune\", \"Antioxidante potente\", \"Mejora absorci¾n de hierro\", \"Promueve piel saludable\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(2, 'Complejo B Premium', 'F¾rmula completa con todas las vitaminas del complejo B para energÝa y bienestar mental.', 52000.00, NULL, '/img/productos/complejo-b.jpg', 'vitaminas', 100, 1, NULL, 4.7, 189, '[\"Aumenta niveles de energÝa\", \"Mejora funci¾n cognitiva\", \"Reduce estrÚs y fatiga\", \"Apoya metabolismo\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(3, 'Vitamina D3 5000 UI', 'Vitamina D3 de alta absorci¾n para huesos fuertes y sistema inmune saludable.', 38000.00, 45000.00, '/img/productos/vitamina-d.jpg', 'vitaminas', 100, 0, 15, 4.9, 312, '[\"Fortalece huesos y dientes\", \"Mejora absorci¾n de calcio\", \"Apoya sistema inmune\", \"Mejora estado de ßnimo\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(4, 'MultivitamÝnico Completo', 'F¾rmula multivitamÝnica con minerales esenciales para toda la familia.', 68000.00, NULL, '/img/productos/multivitaminico.jpg', 'vitaminas', 100, 1, NULL, 4.6, 156, '[\"Nutrici¾n completa\", \"EnergÝa durante el dÝa\", \"Fortalece defensas\", \"Incluye minerales esenciales\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(5, 'Omega 3 Fish Oil', 'Aceite de pescado purificado con EPA y DHA para salud cardiovascular y cerebral.', 75000.00, 89000.00, '/img/productos/omega3.jpg', 'suplementos', 100, 1, 16, 4.8, 278, '[\"Salud cardiovascular\", \"Funci¾n cerebral\", \"Reduce inflamaci¾n\", \"Mejora visi¾n\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(6, 'Colßgeno Hidrolizado', 'Colßgeno tipo I y III hidrolizado para piel, cabello, u±as y articulaciones.', 82000.00, NULL, '/img/productos/colageno.jpg', 'suplementos', 100, 1, NULL, 4.9, 423, '[\"Piel mßs firme\", \"Cabello mßs fuerte\", \"U±as saludables\", \"Articulaciones flexibles\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(7, 'Probi¾ticos 50 Billones', 'Mezcla de 10 cepas probi¾ticas para salud digestiva e inmunol¾gica.', 65000.00, 75000.00, '/img/productos/probioticos.jpg', 'suplementos', 100, 0, 13, 4.7, 198, '[\"Mejora digesti¾n\", \"Flora intestinal saludable\", \"Fortalece inmunidad\", \"Reduce hinchaz¾n\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(8, 'Magnesio Citrato', 'Magnesio de alta absorci¾n para m·sculos, nervios y sue±o reparador.', 42000.00, NULL, '/img/productos/magnesio.jpg', 'suplementos', 100, 0, NULL, 4.6, 167, '[\"Relajaci¾n muscular\", \"Mejora calidad del sue±o\", \"Reduce calambres\", \"Apoya sistema nervioso\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(9, 'C·rcuma con Pimienta Negra', 'Extracto de c·rcuma potenciado con piperina para mßxima absorci¾n antiinflamatoria.', 48000.00, 58000.00, '/img/productos/curcuma.jpg', 'naturales', 100, 1, 17, 4.8, 289, '[\"Antiinflamatorio natural\", \"Antioxidante potente\", \"Mejora digesti¾n\", \"Apoya articulaciones\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(10, 'Ashwagandha Orgßnica', 'Adapt¾geno ayurvÚdico para reducir estrÚs, ansiedad y mejorar energÝa.', 55000.00, NULL, '/img/productos/ashwagandha.jpg', 'naturales', 100, 1, NULL, 4.7, 234, '[\"Reduce estrÚs\", \"Mejora energÝa\", \"Equilibrio hormonal\", \"Mejor concentraci¾n\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(11, 'Moringa en Polvo', 'Superalimento orgßnico rico en nutrientes, vitaminas y antioxidantes.', 35000.00, 42000.00, '/img/productos/moringa.jpg', 'naturales', 100, 0, 17, 4.5, 145, '[\"Nutrientes esenciales\", \"EnergÝa natural\", \"Desintoxicante\", \"Antiinflamatorio\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(12, 'Espirulina Premium', 'Alga azul-verde orgßnica, fuente completa de proteÝnas y nutrientes.', 58000.00, NULL, '/img/productos/espirulina.jpg', 'naturales', 100, 0, NULL, 4.6, 178, '[\"ProteÝna completa\", \"Hierro natural\", \"Desintoxicante\", \"EnergÝa sostenida\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(13, 'ProteÝna Whey Isolate', 'ProteÝna de suero aislada de alta pureza, baja en carbohidratos y grasas.', 185000.00, 210000.00, '/img/productos/whey-protein.jpg', 'proteinas', 100, 1, 12, 4.9, 456, '[\"Rßpida absorci¾n\", \"25g proteÝna por porci¾n\", \"Bajo en grasa\", \"Ideal post-entrenamiento\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(14, 'ProteÝna Vegana Orgßnica', 'Mezcla de proteÝnas vegetales (guisante, arroz, cß±amo) para dietas veganas.', 165000.00, NULL, '/img/productos/proteina-vegana.jpg', 'proteinas', 100, 1, NULL, 4.7, 234, '[\"100% vegetal\", \"22g proteÝna\", \"Sin lßcteos\", \"Fßcil digesti¾n\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(15, 'CaseÝna Micelar', 'ProteÝna de liberaci¾n lenta ideal para consumir antes de dormir.', 175000.00, 195000.00, '/img/productos/caseina.jpg', 'proteinas', 100, 0, 10, 4.6, 167, '[\"Liberaci¾n lenta\", \"Recuperaci¾n nocturna\", \"Alto en BCAA\", \"Saciante\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(16, 'Pre-Workout Extreme', 'F¾rmula pre-entrenamiento con cafeÝna, beta-alanina y creatina para mßximo rendimiento.', 95000.00, 115000.00, '/img/productos/preworkout.jpg', 'energia', 100, 1, 17, 4.8, 312, '[\"Explosi¾n de energÝa\", \"Mayor enfoque mental\", \"Mejor rendimiento\", \"Retrasa fatiga\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(17, 'BCAA 2:1:1', 'Aminoßcidos de cadena ramificada para recuperaci¾n muscular y resistencia.', 78000.00, NULL, '/img/productos/bcaa.jpg', 'energia', 100, 0, NULL, 4.7, 198, '[\"Recuperaci¾n muscular\", \"Reduce fatiga\", \"Preserva m·sculo\", \"Hidrataci¾n mejorada\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25'),
(18, 'Creatina Monohidrato', 'Creatina pura micronizada para fuerza, potencia y masa muscular.', 68000.00, 78000.00, '/img/productos/creatina.jpg', 'energia', 100, 1, 13, 4.9, 389, '[\"Mayor fuerza\", \"Mßs potencia\", \"Recuperaci¾n rßpida\", \"Masa muscular\"]', '2026-01-29 03:37:25', '2026-01-29 03:37:25');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `user_id` varchar(255) NOT NULL,
  `token` text NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `token`, `expires_at`, `created_at`) VALUES
('3269bbb6-fcc7-11f0-9b53-00d861522c9f', 'demo-admin-1', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJkZW1vLWFkbWluLTEiLCJlbWFpbCI6ImFkbWluQGZpdG92aWRhLmNvbSIsImlhdCI6MTc2OTY1OTI5MiwiZXhwIjoxNzcwMjY0MDkyfQ.viUfvEqHTGoet9-QfF-gGvf2TmKEcsxJV6fCEYPC6X8', '2026-02-05 04:01:32', '2026-01-29 04:01:32');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `top_products`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `top_products` (
`product_id` int(11)
,`product_name` varchar(255)
,`total_orders` bigint(21)
,`total_quantity` decimal(32,0)
,`total_revenue` decimal(44,2)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `clerk_id` varchar(255) DEFAULT NULL COMMENT 'ID de Clerk (NULL si es usuario local)',
  `email` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `password_hash` varchar(255) DEFAULT NULL COMMENT 'Hash de contrase±a para usuarios locales',
  `phone` varchar(50) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `is_admin` tinyint(1) DEFAULT 0 COMMENT 'Usuario administrador'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `clerk_id`, `email`, `first_name`, `last_name`, `created_at`, `updated_at`, `password_hash`, `phone`, `is_verified`, `is_admin`) VALUES
('demo-admin-1', NULL, 'admin@fitovida.com', 'Admin', 'Fitovida', '2026-01-29 03:37:45', '2026-01-29 03:59:57', '$2b$12$aHQYGOVUA4pIZ0aIwJIjQ.WgGvQRzS1XGDcChpHMvupzCI36IrMhC', '+57 310 987 6543', 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_addresses`
--

CREATE TABLE `user_addresses` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `user_id` varchar(255) DEFAULT NULL,
  `label` varchar(100) NOT NULL COMMENT 'Ej: Casa, Oficina, Trabajo',
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL DEFAULT 'Cali',
  `department` varchar(100) NOT NULL DEFAULT 'Valle del Cauca',
  `zip_code` varchar(20) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `instructions` text DEFAULT NULL COMMENT 'Instrucciones de entrega opcionales',
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Disparadores `user_addresses`
--
DELIMITER $$
CREATE TRIGGER `before_user_address_insert` BEFORE INSERT ON `user_addresses` FOR EACH ROW BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE user_addresses
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND is_default = TRUE;
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_user_address_update` BEFORE UPDATE ON `user_addresses` FOR EACH ROW BEGIN
  IF NEW.is_default = TRUE AND (OLD.is_default = FALSE OR OLD.is_default IS NULL) THEN
    UPDATE user_addresses
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = TRUE;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura para la vista `admin_daily_sales`
--
DROP TABLE IF EXISTS `admin_daily_sales`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `admin_daily_sales`  AS SELECT cast(`admin_sales`.`created_at` as date) AS `sale_date`, count(0) AS `total_sales`, sum(`admin_sales`.`total`) AS `total_amount`, avg(`admin_sales`.`total`) AS `average_sale`, sum(case when `admin_sales`.`payment_status` = 'completed' then `admin_sales`.`total` else 0 end) AS `completed_amount`, sum(case when `admin_sales`.`payment_status` = 'pending' then `admin_sales`.`total` else 0 end) AS `pending_amount` FROM `admin_sales` GROUP BY cast(`admin_sales`.`created_at` as date) ORDER BY cast(`admin_sales`.`created_at` as date) DESC ;

-- --------------------------------------------------------

--
-- Estructura para la vista `admin_top_selling_products`
--
DROP TABLE IF EXISTS `admin_top_selling_products`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `admin_top_selling_products`  AS SELECT `p`.`id` AS `id`, `p`.`name` AS `name`, `p`.`category` AS `category`, count(distinct `asi`.`sale_id`) AS `times_sold`, sum(`asi`.`quantity`) AS `total_quantity`, sum(`asi`.`total`) AS `total_revenue` FROM ((`admin_sale_items` `asi` join `products` `p` on(`asi`.`product_id` = `p`.`id`)) join `admin_sales` `s` on(`asi`.`sale_id` = `s`.`id`)) WHERE `s`.`payment_status` = 'completed' GROUP BY `p`.`id`, `p`.`name`, `p`.`category` ORDER BY sum(`asi`.`quantity`) DESC LIMIT 0, 20 ;

-- --------------------------------------------------------

--
-- Estructura para la vista `low_stock_products`
--
DROP TABLE IF EXISTS `low_stock_products`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `low_stock_products`  AS SELECT `ip`.`id` AS `id`, `p`.`name` AS `product_name`, `ip`.`sku` AS `sku`, `ip`.`current_stock` AS `current_stock`, `ip`.`min_stock` AS `min_stock`, `ip`.`supplier` AS `supplier`, `p`.`category` AS `category`, CASE WHEN `ip`.`current_stock` = 0 THEN 'Sin stock' WHEN `ip`.`current_stock` <= `ip`.`min_stock` THEN 'Stock bajo' ELSE 'OK' END AS `stock_status` FROM (`inventory_products` `ip` join `products` `p` on(`ip`.`product_id` = `p`.`id`)) WHERE `ip`.`current_stock` <= `ip`.`min_stock` AND `ip`.`status` = 'active' ORDER BY `ip`.`current_stock` ASC ;

-- --------------------------------------------------------

--
-- Estructura para la vista `monthly_financial_summary`
--
DROP TABLE IF EXISTS `monthly_financial_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `monthly_financial_summary`  AS SELECT date_format(`combined`.`date`,'%Y-%m') AS `month`, sum(case when `combined`.`table_name` = 'income' then `combined`.`amount` else 0 end) AS `total_income`, sum(case when `combined`.`table_name` = 'expense' then `combined`.`amount` else 0 end) AS `total_expenses`, sum(case when `combined`.`table_name` = 'income' then `combined`.`amount` else -`combined`.`amount` end) AS `balance` FROM (select `incomes`.`date` AS `date`,`incomes`.`amount` AS `amount`,'income' AS `table_name` from `incomes` where `incomes`.`status` = 'received' union all select `expenses`.`date` AS `date`,`expenses`.`amount` AS `amount`,'expense' AS `table_name` from `expenses` where `expenses`.`status` = 'paid') AS `combined` GROUP BY date_format(`combined`.`date`,'%Y-%m') ORDER BY date_format(`combined`.`date`,'%Y-%m') DESC ;

-- --------------------------------------------------------

--
-- Estructura para la vista `orders_summary`
--
DROP TABLE IF EXISTS `orders_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `orders_summary`  AS SELECT `o`.`id` AS `id`, `o`.`order_number` AS `order_number`, `o`.`user_id` AS `user_id`, `o`.`customer_name` AS `customer_name`, `o`.`customer_email` AS `customer_email`, `o`.`status` AS `status`, `o`.`payment_method` AS `payment_method`, `o`.`total` AS `total`, `o`.`created_at` AS `created_at`, count(`oi`.`id`) AS `total_items`, sum(`oi`.`quantity`) AS `total_products` FROM (`orders` `o` left join `order_items` `oi` on(`o`.`id` = `oi`.`order_id`)) GROUP BY `o`.`id`, `o`.`order_number`, `o`.`user_id`, `o`.`customer_name`, `o`.`customer_email`, `o`.`status`, `o`.`payment_method`, `o`.`total`, `o`.`created_at` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `top_products`
--
DROP TABLE IF EXISTS `top_products`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `top_products`  AS SELECT `oi`.`product_id` AS `product_id`, `oi`.`product_name` AS `product_name`, count(distinct `oi`.`order_id`) AS `total_orders`, sum(`oi`.`quantity`) AS `total_quantity`, sum(`oi`.`quantity` * `oi`.`price`) AS `total_revenue` FROM (`order_items` `oi` join `orders` `o` on(`oi`.`order_id` = `o`.`id`)) WHERE `o`.`status` not in ('cancelled','failed') GROUP BY `oi`.`product_id`, `oi`.`product_name` ORDER BY sum(`oi`.`quantity`) DESC ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `admin_sales`
--
ALTER TABLE `admin_sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sale_number` (`sale_number`),
  ADD KEY `idx_sale_number` (`sale_number`),
  ADD KEY `idx_customer_document` (`customer_document`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_invoice_status` (`invoice_status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indices de la tabla `admin_sale_items`
--
ALTER TABLE `admin_sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indices de la tabla `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_supplier` (`supplier`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indices de la tabla `incomes`
--
ALTER TABLE `incomes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indices de la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_reason` (`reason`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indices de la tabla `inventory_products`
--
ALTER TABLE `inventory_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_id` (`product_id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `idx_sku` (`sku`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_current_stock` (`current_stock`);

--
-- Indices de la tabla `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_user_id` (`user_id`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_created_at` (`created_at`),
  ADD KEY `idx_orders_order_number` (`order_number`),
  ADD KEY `idx_orders_customer_email` (`customer_email`);

--
-- Indices de la tabla `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order_id` (`order_id`),
  ADD KEY `idx_order_items_product_id` (`product_id`);

--
-- Indices de la tabla `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_products_category` (`category`),
  ADD KEY `idx_products_featured` (`featured`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`email`),
  ADD UNIQUE KEY `clerk_id` (`clerk_id`),
  ADD KEY `idx_clerk_id` (`clerk_id`),
  ADD KEY `idx_email` (`email`);

--
-- Indices de la tabla `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_label` (`user_id`,`label`),
  ADD KEY `idx_user_addresses_user_id` (`user_id`),
  ADD KEY `idx_user_addresses_is_default` (`is_default`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `inventory_products`
--
ALTER TABLE `inventory_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `admin_sale_items`
--
ALTER TABLE `admin_sale_items`
  ADD CONSTRAINT `admin_sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `admin_sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `admin_sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Filtros para la tabla `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `inventory_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Filtros para la tabla `inventory_products`
--
ALTER TABLE `inventory_products`
  ADD CONSTRAINT `inventory_products_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `fk_user_addresses_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Eventos
--
CREATE DEFINER=`root`@`localhost` EVENT `clean_expired_sessions` ON SCHEDULE EVERY 1 HOUR STARTS '2026-01-28 22:37:45' ON COMPLETION NOT PRESERVE ENABLE DO DELETE FROM sessions WHERE expires_at < NOW()$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
