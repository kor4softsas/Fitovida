-- =============================================
-- MIGRACIÓN: Agregar campo de código de barras
-- =============================================
-- Script para agregar el campo barcode a instalaciones existentes
-- Ejecutar si ya tienes la base de datos creada anteriormente
-- =============================================

USE fitovida;

-- Verificar si el campo ya existe antes de agregarlo
SET @dbname = DATABASE();
SET @tablename = 'inventory_products';
SET @columnname = 'barcode';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE 
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 'El campo barcode ya existe' AS resultado;",
  "ALTER TABLE inventory_products 
   ADD COLUMN barcode VARCHAR(100) UNIQUE NULL 
   COMMENT 'Código de barras (EAN-13, UPC-A, EAN-8, Code128, personalizado)' 
   AFTER sku,
   ADD INDEX idx_barcode (barcode);"
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE 
  TABLE_SCHEMA = 'fitovida'
  AND TABLE_NAME = 'inventory_products'
  AND COLUMN_NAME = 'barcode';

-- =============================================
-- DATOS DE EJEMPLO (opcional)
-- =============================================
-- Agregar códigos de barras de ejemplo a productos existentes
-- Descomenta las siguientes líneas si quieres datos de prueba

/*
UPDATE inventory_products 
SET barcode = '7891234567890' 
WHERE product_id = 1 AND barcode IS NULL;

UPDATE inventory_products 
SET barcode = '7891234567891' 
WHERE product_id = 2 AND barcode IS NULL;

UPDATE inventory_products 
SET barcode = '7891234567892' 
WHERE product_id = 3 AND barcode IS NULL;
*/

SELECT 'Campo barcode agregado exitosamente!' AS mensaje;
