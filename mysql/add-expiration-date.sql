-- Agrega fecha de vencimiento para semaforo de inventario.
ALTER TABLE products
  ADD COLUMN fecha_vencimiento DATE NULL AFTER invima_registry_number;

-- Opcional: inicializar con una fecha futura segura para registros existentes sin fecha.
-- UPDATE products
-- SET fecha_vencimiento = DATE_ADD(CURDATE(), INTERVAL 12 MONTH)
-- WHERE fecha_vencimiento IS NULL;
