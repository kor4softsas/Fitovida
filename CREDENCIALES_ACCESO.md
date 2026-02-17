# 🔐 Credenciales de Acceso - Fitovida

## 👤 Usuario Administrador (Desarrollo)

**Email**: `admin@fitovida.com`  
**Contraseña**: `demo123`

### ⚙️ Acceso al Panel Admin
URL: `http://localhost:3000/admin`

### 🔑 Opciones de Autenticación

Tu aplicación soporta dos modos:

#### 1. **Modo Normal** (Actual - Activo)
- Base de datos: MySQL (`fitovida`)
- Usuarios: Registrados en tabla `users`
- Contraseñas: Hasheadas con bcrypt

#### 2. **Modo Demo** (Deshabilitado)
- Variable: `DEMO_MODE=false` en `.env.local`
- Para habilitarlo: cambiar a `DEMO_MODE=true`
- Usa usuarios hardcodeados en código

## 🚀 Procesos de Prueba

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@fitovida.com",
  "password": "demo123"
}
```

### Registro (Crear nuevo usuario)
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "segura123",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

### Logout
```bash
GET /api/auth/logout
```

## ⚡ Cambios Realizados

✅ Migración a MySQL completada  
✅ Usuario admin con password válido (bcrypt)  
✅ DEMO_MODE deshabilitado  
✅ Todas las tablas creadas y verificadas  

## 🔄 Próxima Vez

El error 401 debería desaparecer. Si persiste:

1. Abre DevTools → Console
2. Verifica que se envía email/password correcto
3. Revisa response en Network tab
4. Confirma que MySQL está corriendo

---

**Estado**: ✅ Listo para login
