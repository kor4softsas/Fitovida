CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL DEFAULT 'Fitovida SAS',
  `nit` varchar(50) NOT NULL DEFAULT '900.123.456-7',
  `email` varchar(255) DEFAULT 'admin@fitovida.co',
  `phone` varchar(50) DEFAULT '+57 300 123 4567',
  `address` varchar(500) DEFAULT 'Cra 50 #25-20',
  `city` varchar(100) DEFAULT 'Medellín',
  `department` varchar(100) DEFAULT 'Antioquia',
  `website` varchar(255) DEFAULT 'www.fitovida.co',
  `invoice_prefix` varchar(20) DEFAULT 'FAC',
  `invoice_next_number` int(11) DEFAULT 1001,
  `tax_rate` decimal(5,2) DEFAULT 19.00,
  `currency` varchar(10) DEFAULT 'COP',
  `terms_and_conditions` text DEFAULT NULL,
  `invoice_footer` text DEFAULT NULL,
  `dian_resolution` varchar(255) DEFAULT 'Resolución 000123-2025',
  `dian_range_from` int(11) DEFAULT 1,
  `dian_range_to` int(11) DEFAULT 999999,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar fila inicial con valores por defecto si no existe
INSERT IGNORE INTO `company_settings` (`id`, `company_name`, `nit`, `email`, `phone`, `address`, `city`, `department`, `website`, `invoice_prefix`, `invoice_next_number`, `tax_rate`, `currency`, `terms_and_conditions`, `invoice_footer`, `dian_resolution`, `dian_range_from`, `dian_range_to`)
VALUES (1, 'Fitovida SAS', '900.123.456-7', 'admin@fitovida.co', '+57 300 123 4567', 'Cra 50 #25-20', 'Medellín', 'Antioquia', 'www.fitovida.co', 'FAC', 1001, 19.00, 'COP', 'Los términos y condiciones aplican según lo establecido en la normativa vigente.', 'Gracias por su compra. Para más información: www.fitovida.co', 'Resolución 000123-2025', 1, 999999);
