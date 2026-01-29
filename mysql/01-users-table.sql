USE fitovida;

-- Tabla de usuarios (sincronizada con Clerk)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_clerk_id (clerk_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modificar tabla user_addresses para usar ID de usuario de la BD
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

ALTER TABLE user_addresses 
  MODIFY COLUMN user_id VARCHAR(255);

-- Modificar tabla orders para usar ID de usuario de la BD
ALTER TABLE orders 
  MODIFY COLUMN user_id VARCHAR(255) NULL;

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;

-- Agregar foreign keys nuevas
ALTER TABLE user_addresses
  ADD CONSTRAINT fk_user_addresses_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

SELECT 'Tabla de usuarios creada exitosamente!' as mensaje;
