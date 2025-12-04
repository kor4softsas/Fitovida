# Configuración de Clerk - Campos Personalizados

## 🎯 Objetivo
Agregar campo de teléfono al formulario de registro y reducir validaciones de seguridad.

## 📝 Pasos en Clerk Dashboard

### 1. Acceder a la Configuración
1. Ve a [Clerk Dashboard](https://dashboard.clerk.com/)
2. Selecciona tu proyecto **Fitovida**
3. En el menú lateral, ve a **User & Authentication** → **Email, Phone, Username**

### 2. Configurar Campo de Teléfono
1. En la sección **Phone number**:
   - ✅ Activa "Enable phone number"
   - ✅ Marca "Required" (obligatorio)
   - ✅ Activa "Used for sign-up"
   - ❌ Desactiva "Verify at sign-up" (para quitar validación de SMS)

### 3. Configurar Campos de Nombre
1. Ve a **User & Authentication** → **Personal information**
2. Para **First name**:
   - ✅ Marca "Required"
   - ✅ Activa "Collect at sign-up"
3. Para **Last name**:
   - ✅ Marca "Required"
   - ✅ Activa "Collect at sign-up"

### 4. Reducir Validaciones de Contraseña
1. Ve a **User & Authentication** → **Email, Phone, Username**
2. Scroll hasta **Password settings**
3. Configuración mínima recomendada:
   - Minimum length: **6 caracteres** (en vez de 8)
   - ❌ Desactiva "Require uppercase"
   - ❌ Desactiva "Require lowercase"
   - ❌ Desactiva "Require number"
   - ❌ Desactiva "Require special character"
   - ❌ Desactiva "Validate against common passwords"

### 5. Desactivar Verificación de Email (Opcional)
Si quieres quitar la validación por email:
1. Ve a **User & Authentication** → **Email, Phone, Username**
2. En **Email address**:
   - ❌ Desactiva "Verify at sign-up"
   
⚠️ **Nota**: No recomendado para producción, pero útil para desarrollo.

### 6. Desactivar Autenticación Social
Ya está hecho en el código con `socialButtonsBlockButton: "hidden"`.

## ✅ Resultado Final

El formulario de registro mostrará:
- ✅ **Nombre** (obligatorio)
- ✅ **Apellido** (obligatorio)
- ✅ **Email** (obligatorio, sin verificación)
- ✅ **Teléfono** (obligatorio, sin verificación SMS)
- ✅ **Contraseña** (mínimo 6 caracteres, sin requisitos especiales)

## 🔄 Aplicar Cambios

Después de configurar en el Dashboard:
1. Guarda todos los cambios
2. Recarga la página de login: `http://localhost:3000/login`
3. Los campos aparecerán automáticamente

## 📱 Formato de Teléfono

Clerk acepta formatos internacionales:
- `+57 300 1234567` (Colombia)
- `300 1234567`
- `3001234567`

## 🎨 Campos Ya Configurados en el Código

En `/src/app/login/[[...rest]]/page.tsx`:
- ✅ Botones de Google/OAuth ocultos
- ✅ Localización en español
- ✅ Diseño personalizado Fitovida
- ✅ Sin verificación por SMS/Email desde código
