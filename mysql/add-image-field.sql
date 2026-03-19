-- Migración: Agregar campo de imagen a inventory_products
-- Ejecutar si la tabla ya existe

USE fitovida;

-- Agregar columna image si no existe
ALTER TABLE inventory_products ADD COLUMN IF NOT EXISTS image VARCHAR(500) NULL COMMENT 'Ruta de imagen del producto';

-- Crear índice para búsquedas si no existe
ALTER TABLE inventory_products ADD INDEX IF NOT EXISTS idx_image (image);
