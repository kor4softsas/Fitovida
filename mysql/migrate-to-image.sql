-- Migración: Agregar campo de imagen a inventory_products
-- Este script es seguro - solo crea el campo si no existe

USE fitovida;

-- Agregar columna image solo si no existe
ALTER TABLE inventory_products 
ADD COLUMN IF NOT EXISTS image VARCHAR(500) NULL COMMENT 'Ruta de imagen del producto';

-- Crear índice solo si no existe
ALTER TABLE inventory_products 
ADD INDEX IF NOT EXISTS idx_image (image);

-- Mensaje de confirmación
SELECT 'Campo image agregado exitosamente' as resultado;
