-- =============================================
-- ACTUALIZACIÓN DE TABLAS DE AUTENTICACIÓN
-- =============================================
-- Modifica las tablas existentes para soportar autenticación local
-- (sin dependencia de Clerk)
-- =============================================

USE fitovida;

-- =============================================
-- Modificar tabla users para autenticación local
-- =============================================

-- Agregar columnas necesarias para autenticación local
ALTER TABLE users 
  MODIFY COLUMN clerk_id VARCHAR(255) NULL COMMENT 'ID de Clerk (NULL si es usuario local)',
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL COMMENT 'Hash de contraseña para usuarios locales',
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE COMMENT 'Usuario administrador';

-- Hacer que email sea único
ALTER TABLE users
  ADD UNIQUE KEY IF NOT EXISTS unique_email (email);

-- =============================================
-- TABLA: sessions (Sesiones de usuario)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Limpiar sesiones expiradas automáticamente
-- =============================================
CREATE EVENT IF NOT EXISTS clean_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO
  DELETE FROM sessions WHERE expires_at < NOW();

-- =============================================
-- Datos de ejemplo: Usuario administrador demo
-- =============================================
-- NOTA: Solo usar en desarrollo/demo. En producción usar passwords seguros.
-- Password: 'demo123' (hashed con bcrypt)
INSERT INTO users (id, clerk_id, email, first_name, last_name, phone, password_hash, is_verified, is_admin)
VALUES 
  ('demo-admin-1', NULL, 'admin@fitovida.com', 'Admin', 'Fitovida', '+57 310 987 6543', 
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lGGSKfs2G3Km', TRUE, TRUE)
ON DUPLICATE KEY UPDATE email = email;

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Tablas de autenticación actualizadas!' as mensaje;
SELECT id, email, first_name, last_name, is_admin FROM users WHERE is_admin = TRUE;

