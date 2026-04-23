-- Agrega campos de control INVIMA para productos de vitrina/comerciales.
ALTER TABLE products
  ADD COLUMN has_invima TINYINT(1) NOT NULL DEFAULT 0 AFTER stock,
  ADD COLUMN invima_registry_number VARCHAR(120) NULL AFTER has_invima;

-- Indice para filtro rapido de productos visibles en tienda.
CREATE INDEX idx_products_has_invima ON products (has_invima);

-- Opcional: limpiar numero INVIMA cuando no aplique.
UPDATE products
SET invima_registry_number = NULL
WHERE has_invima = 0;
