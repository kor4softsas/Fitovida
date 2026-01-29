# 🔧 Guía de Troubleshooting - Login

## ✅ Checklist de Verificación

### 1. Servidor Node.js Corriendo
```bash
# Ver procesos Node
Get-Process node

# Si no está corriendo, iniciar:
npm run dev
```

### 2. MySQL Corriendo
```bash
# Verificar conexión
mysql -u root -e "SELECT VERSION();"

# Verificar usuario admin existe
mysql -u root -e "USE fitovida; SELECT id, email FROM users WHERE email='admin@fitovida.com';"
```

### 3. Variables de Entorno
Archivo: `.env.local`
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fitovida
DEMO_MODE=false
```

### 4. Credenciales Admin
- **Email**: admin@fitovida.com
- **Contraseña**: demo123

## 🐛 Debugging

### Ver logs del servidor
Los logs aparecen en la terminal donde corre `npm run dev`. Busca:
```
[LOGIN] Intento de login con email: admin@fitovida.com
[LOGIN] Usuario encontrado: SÍ
[LOGIN] Contraseña válida: true
[LOGIN] Login exitoso para: admin@fitovida.com
```

### Pruebas desde la consola

**Test 1: Verificar BD está accesible**
```bash
mysql -u root fitovida -e "SELECT COUNT(*) FROM users;"
```

**Test 2: Crear usuario de prueba**
```sql
INSERT INTO users (id, email, first_name, last_name, password_hash, is_verified, clerk_id)
VALUES ('user-1', 'test@example.com', 'Test', 'User', 
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lGGSKfs2G3Km', 
        true, NULL);
```
(Este usuario también tiene contraseña: demo123)

**Test 3: Ver sesiones creadas**
```bash
mysql -u root fitovida -e "SELECT id, user_id, expires_at FROM sessions;"
```

## 🔄 Soluciones Comunes

### Error 401 persiste
1. Detener servidor: `Ctrl+C`
2. Detener Node: `Get-Process node | Stop-Process -Force`
3. Reiniciar: `npm run dev`
4. Esperar a que compile

### MySQL error
- Verificar que XAMPP está corriendo
- Revisar que MySQL service está activo
- Intentar reconectar

### Password incorrecto
- Verificar que el hash en BD es válido:
```bash
mysql -u root fitovida -e "SELECT password_hash FROM users WHERE email='admin@fitovida.com';"
```
- Si está vacío o corrupto, actualizar:
```bash
mysql -u root fitovida -e "UPDATE users SET password_hash='\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lGGSKfs2G3Km' WHERE email='admin@fitovida.com';"
```

## 📋 Flujo de Login

1. Frontend envía email/password a `/api/auth/login`
2. Servidor valida que email y password no estén vacíos
3. Llama a `loginUser()` en auth-server.ts
4. Busca usuario en BD por email
5. Compara password con hash usando bcrypt
6. Si es válido:
   - Crea JWT token
   - Guarda sesión en BD
   - Devuelve usuario y token
7. Frontend guarda token en cookie
8. Usuario redirigido a `/`

---

**Status**: Servidor listo para testing
