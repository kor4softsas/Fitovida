# Integración Clerk + Supabase

## Paso 1: Configurar JWT Template en Clerk

1. Ve a [Clerk Dashboard](https://dashboard.clerk.com)
2. Selecciona tu aplicación **Fitovida**
3. Ve a: **Configure** → **JWT Templates**
4. Click en **New template**
5. Selecciona **Supabase** (tiene configuración pre-hecha)
6. O crea uno **Blank** con este contenido:

```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "user_metadata": {
    "first_name": "{{user.first_name}}",
    "last_name": "{{user.last_name}}"
  }
}
```

7. **Guarda** el template y copia el **Issuer URL** (lo necesitarás)

---

## Paso 2: Configurar Supabase para aceptar JWT de Clerk

1. Ve a tu [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **Fitovida**
3. Ve a: **Settings** → **API**
4. Busca la sección **JWT Settings**

### Obtener el JWKS de Clerk:

El JWKS endpoint de Clerk es:
```
https://[TU_CLERK_DOMAIN]/.well-known/jwks.json
```

Ejemplo: `https://epic-mantis-12.clerk.accounts.dev/.well-known/jwks.json`

### Configurar en Supabase:

En **Supabase Settings → API → Additional Settings**:

1. Habilita **Use custom JWT signing key**
2. Pega el contenido del JWKS de Clerk

**O mejor:** Usa el método de Issuer URL:

1. En Supabase, ve a **Authentication** → **Providers**
2. Habilita **Custom Provider**
3. Configura:
   - **Name**: Clerk
   - **Issuer URL**: El que copiaste de Clerk (ej: `https://epic-mantis-12.clerk.accounts.dev`)

---

## Paso 3: Actualizar el código para enviar JWT a Supabase

Crea el archivo `/src/lib/supabase/client.ts` actualizado:

```typescript
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente base de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Hook para cliente autenticado con Clerk
export function useSupabaseClient() {
  const { getToken } = useAuth();

  const supabaseAccessToken = async () => {
    const token = await getToken({ template: 'supabase' });
    return token;
  };

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: async () => {
        const token = await supabaseAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    },
  });

  return client;
}
```

---

## Paso 4: Variables de entorno

Asegúrate de tener en tu `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Solo para server-side

# URLs de Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

---

## Paso 5: Actualizar políticas RLS en Supabase

Una vez configurado el JWT, actualiza las políticas en Supabase SQL Editor:

```sql
-- Ejemplo: Órdenes - usuarios solo ven sus propias órdenes
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (
    user_id = auth.jwt() ->> 'sub' 
    OR user_id IS NULL  -- Permitir órdenes de invitados
  );

-- Direcciones - usuarios solo ven sus propias direcciones  
DROP POLICY IF EXISTS "user_addresses_select_own" ON user_addresses;
CREATE POLICY "user_addresses_select_own"
  ON user_addresses FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "user_addresses_insert_own" ON user_addresses;
CREATE POLICY "user_addresses_insert_own"
  ON user_addresses FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "user_addresses_update_own" ON user_addresses;
CREATE POLICY "user_addresses_update_own"
  ON user_addresses FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "user_addresses_delete_own" ON user_addresses;
CREATE POLICY "user_addresses_delete_own"
  ON user_addresses FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');
```

---

## Paso 6: Probar la integración

### Test 1: Verificar JWT en Clerk
1. Inicia sesión en tu app
2. En DevTools Console ejecuta:
```javascript
const { getToken } = useAuth();
const token = await getToken({ template: 'supabase' });
console.log(token);
```

### Test 2: Verificar en Supabase
1. Copia el token de arriba
2. Ve a [jwt.io](https://jwt.io)
3. Pega el token y verifica que tenga:
   - `sub`: ID del usuario de Clerk
   - `iss`: Tu dominio de Clerk

### Test 3: Consulta autenticada
```typescript
const supabase = useSupabaseClient();
const { data, error } = await supabase
  .from('user_addresses')
  .select('*');
// Debe traer solo las direcciones del usuario autenticado
```

---

## Troubleshooting

### Error: "JWT verification failed"
- Verifica que el Issuer URL en Supabase coincida con el de Clerk
- Verifica que el template JWT en Clerk tenga el claim `sub`

### Error: "Row level security policy violated"
- Las políticas RLS están bloqueando el acceso
- Verifica que `auth.jwt() ->> 'sub'` retorne el user_id correcto

### Error: "Invalid token"
- El token expiró (default: 1 hora)
- Clerk no está enviando el token correcto
- Verifica que uses `getToken({ template: 'supabase' })`

---

## Estado actual

✅ Tablas creadas en Supabase  
⏳ Configurar JWT Template en Clerk  
⏳ Configurar Supabase para aceptar JWT de Clerk  
⏳ Actualizar código para usar JWT  
⏳ Actualizar políticas RLS  

Una vez completes estos pasos, tu app tendrá autenticación segura con Clerk y base de datos protegida con RLS en Supabase.
