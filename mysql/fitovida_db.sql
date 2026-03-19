-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 19-03-2026 a las 01:55:50
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
-- Volcado de datos para la tabla `admin_sales`
--

INSERT INTO `admin_sales` (`id`, `sale_number`, `customer_name`, `customer_email`, `customer_phone`, `customer_document`, `subtotal`, `tax`, `discount`, `total`, `payment_method`, `payment_status`, `invoice_number`, `invoice_cufe`, `invoice_date`, `invoice_status`, `invoice_xml_path`, `invoice_pdf_path`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
('83d29631-6e36-4601-9a81-ad322214eb5e', 'V-2026-001', 'jhan duarte', 'jhanleyder@hotmail.com', '3166075801', '1006179179', 75000.00, 4750.00, 0.00, 79750.00, 'transfer', 'completed', 'FAC-1001', NULL, NULL, 'authorized', NULL, NULL, NULL, 'admin', '2026-03-19 00:50:30', '2026-03-19 00:50:30');

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

--
-- Volcado de datos para la tabla `admin_sale_items`
--

INSERT INTO `admin_sale_items` (`id`, `sale_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `discount`, `tax`, `subtotal`, `total`, `created_at`) VALUES
('a0d321c8-232d-11f1-b428-00d861522c9f', '83d29631-6e36-4601-9a81-ad322214eb5e', 69, 'fIBRA fECAQUIN', 3, 25000.00, 0.00, 4750.00, 75000.00, 89250.00, '2026-03-19 00:50:30');

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
-- Estructura de tabla para la tabla `company_settings`
--

CREATE TABLE `company_settings` (
  `id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL DEFAULT 'Fitovida SAS',
  `nit` varchar(50) NOT NULL DEFAULT '900.123.456-7',
  `email` varchar(255) DEFAULT 'admin@fitovida.co',
  `phone` varchar(50) DEFAULT '+57 300 123 4567',
  `address` varchar(500) DEFAULT 'Cra 50 #25-20',
  `city` varchar(100) DEFAULT 'Medell├¡n',
  `department` varchar(100) DEFAULT 'Antioquia',
  `website` varchar(255) DEFAULT 'www.fitovida.co',
  `invoice_prefix` varchar(20) DEFAULT 'FAC',
  `invoice_next_number` int(11) DEFAULT 1001,
  `tax_rate` decimal(5,2) DEFAULT 19.00,
  `currency` varchar(10) DEFAULT 'COP',
  `terms_and_conditions` text DEFAULT NULL,
  `invoice_footer` text DEFAULT NULL,
  `dian_resolution` varchar(255) DEFAULT 'Resoluci├│n 000123-2025',
  `dian_range_from` int(11) DEFAULT 1,
  `dian_range_to` int(11) DEFAULT 999999,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `company_settings`
--

INSERT INTO `company_settings` (`id`, `company_name`, `nit`, `email`, `phone`, `address`, `city`, `department`, `website`, `invoice_prefix`, `invoice_next_number`, `tax_rate`, `currency`, `terms_and_conditions`, `invoice_footer`, `dian_resolution`, `dian_range_from`, `dian_range_to`, `updated_at`) VALUES
(1, 'Fitovida ', '1105876', 'admin@fitovida.co', '+57 318 4024199', 'Carrera 5 Norte # 42 n -33 Barrio Popular ', 'Cali', 'Valle del cauca ', 'https://fitovida.k4soft.com/', 'FAC', 1001, 19.00, 'COP', 'Los terminos y condiciones aplican segun lo establecido en la normativa vigente.', 'Gracias por su compra. Para  mas informacion: https://fitovida.k4soft.com/', 'ResoluciOn 000123-2025', 1, 999999, '2026-03-19 00:44:31');

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

--
-- Volcado de datos para la tabla `incomes`
--

INSERT INTO `incomes` (`id`, `date`, `amount`, `category`, `description`, `reference`, `payment_method`, `status`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
('78c201a5-232d-11f1-b428-00d861522c9f', '2026-03-19', 200000.00, 'sales', 'GGGGGG', NULL, 'cash', 'received', NULL, 'admin', '2026-03-19 00:49:23', '2026-03-19 00:49:23'),
('a0d1d5c3-232d-11f1-b428-00d861522c9f', '2026-03-18', 79750.00, 'sales', 'Venta V-2026-001 - jhan duarte', 'V-2026-001', 'transfer', 'received', NULL, 'admin', '2026-03-19 00:50:30', '2026-03-19 00:50:30'),
('a0d3a3b9-232d-11f1-b428-00d861522c9f', '2026-03-18', 79750.00, 'sales', 'Venta: V-2026-001', 'V-2026-001', 'transfer', 'received', NULL, 'admin', '2026-03-19 00:50:30', '2026-03-19 00:50:30');

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
-- Volcado de datos para la tabla `inventory_movements`
--

INSERT INTO `inventory_movements` (`id`, `product_id`, `product_name`, `type`, `quantity`, `previous_stock`, `new_stock`, `unit_cost`, `total_cost`, `reason`, `reference`, `notes`, `created_by`, `created_at`) VALUES
('a0d214fe-232d-11f1-b428-00d861522c9f', 69, 'fIBRA fECAQUIN', 'exit', 3, 10, 7, NULL, NULL, 'sale', 'V-2026-001', NULL, 'admin', '2026-03-19 00:50:30'),
('c312b8d4-22fb-11f1-907a-00d861522c9f', 67, 'EN GENERAL ', 'exit', 1, 10, 9, NULL, NULL, 'sale', 'V-2026-002', NULL, 'admin', '2026-03-18 18:53:33');

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
(23, 67, '7597550748719', 35, 5, 1000, 100000.00, 19.00, 'TUYT', '7597550748719', 'active', '2026-03-18 18:44:27', '2026-03-19 00:42:54'),
(25, 69, 'EAN-13', 4, 5, 225, 10000.00, 19.00, 'TRIACA ', '7590336796072', 'active', '2026-03-19 00:48:05', '2026-03-19 00:50:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `invoices`
--

CREATE TABLE `invoices` (
  `id` char(36) NOT NULL DEFAULT uuid(),
  `number` varchar(100) NOT NULL COMMENT 'Consecutivo DIAN ej: FAC-1002',
  `dian_resolution` varchar(255) DEFAULT NULL,
  `sale_id` varchar(100) NOT NULL COMMENT 'ID de admin_sales o orders',
  `sale_type` enum('admin','client') NOT NULL DEFAULT 'admin',
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_document` varchar(50) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `tax` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total` decimal(12,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `status` enum('draft','issued','paid','cancelled') DEFAULT 'issued',
  `issued_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `due_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `invoices`
--

INSERT INTO `invoices` (`id`, `number`, `dian_resolution`, `sale_id`, `sale_type`, `customer_name`, `customer_email`, `customer_document`, `subtotal`, `tax`, `total`, `payment_method`, `status`, `issued_date`, `due_date`, `created_at`, `updated_at`) VALUES
('a0d4ab33-232d-11f1-b428-00d861522c9f', 'FAC-1001', 'Resolución 000123-2025', '83d29631-6e36-4601-9a81-ad322214eb5e', 'admin', 'jhan duarte', 'jhanleyder@hotmail.com', '1006179179', 75000.00, 4750.00, 79750.00, 'transfer', 'issued', '2026-03-19 00:50:30', NULL, '2026-03-19 00:50:30', '2026-03-19 00:50:30');

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
(67, 'EN GENERAL ', '', 200000.00, NULL, '', 'PROTEINAS', 35, 0, NULL, 4.5, 0, NULL, '2026-03-18 18:44:27', '2026-03-19 00:42:54'),
(69, 'fIBRA fECAQUIN', 'FIBRA PARA EL COLON ', 25000.00, NULL, '/img/products/product-new-1773881191867-sc49ln.jpeg', 'FIBRA', 7, 0, NULL, 4.5, 0, NULL, '2026-03-19 00:48:05', '2026-03-19 00:50:30');

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
('', NULL, 'jhanleyder71@gmail.com', 'Jhan', 'Duarte', '2026-02-19 22:18:16', '2026-02-19 22:18:16', '$2b$12$g6896cZYoWDwPcZ2fj3C1eD76JG/6j05yrv1CP839obdefursmyZS', NULL, 1, 0),
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
-- Indices de la tabla `company_settings`
--
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`id`);

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
-- Indices de la tabla `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `number` (`number`),
  ADD KEY `idx_invoices_number` (`number`),
  ADD KEY `idx_invoices_sale_id` (`sale_id`),
  ADD KEY `idx_invoices_status` (`status`),
  ADD KEY `idx_invoices_issued_date` (`issued_date`);

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
-- AUTO_INCREMENT de la tabla `company_settings`
--
ALTER TABLE `company_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `inventory_products`
--
ALTER TABLE `inventory_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
