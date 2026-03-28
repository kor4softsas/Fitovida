-- Migration: Agregar campos DIAN-Ready a admin_sales
-- Fecha: 2026-03-28
-- Descripción: Campos para preparar integración con DIAN/proveedor de facturación electrónica

-- Agregar columnas si no existen
ALTER TABLE `admin_sales` 
ADD COLUMN `dian_uuid` varchar(100) DEFAULT NULL COMMENT 'UUID retornado por proveedor/DIAN' AFTER `invoice_pdf_path`,
ADD COLUMN `dian_track_id` varchar(100) DEFAULT NULL COMMENT 'TrackID de respuesta DIAN' AFTER `dian_uuid`,
ADD COLUMN `qr_payload` longtext DEFAULT NULL COMMENT 'Payload para generar QR (formato DIAN)' AFTER `dian_track_id`,
ADD COLUMN `barcode_value` varchar(255) DEFAULT NULL COMMENT 'Código de barras 1D derivado de CUFE' AFTER `qr_payload`,
ADD INDEX `idx_dian_uuid` (`dian_uuid`),
ADD INDEX `idx_qr_payload` (`qr_payload`(50));

-- Actualizar campos existentes si es necesario
-- Establecer invoice_status por defecto a 'pending' en nuevas facturas
ALTER TABLE `admin_sales` 
MODIFY COLUMN `invoice_status` enum('pending','authorized','rejected') DEFAULT 'pending' COMMENT 'Estado factura DIAN';
