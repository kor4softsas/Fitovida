USE fitovida;

-- Actualizar usuario admin con password hash válido
-- Password: demo123 (bcrypt hash)
UPDATE users 
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lGGSKfs2G3Km'
WHERE email = 'admin@fitovida.com';

-- Verificar
SELECT id, email, first_name, password_hash FROM users WHERE email = 'admin@fitovida.com';
