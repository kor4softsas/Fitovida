# Configurar Clerk para Producción

## Paso 1: Obtener API Keys de Producción

1. Ve a tu [Clerk Dashboard](https://dashboard.clerk.com/)
2. Selecciona tu proyecto **Fitovida**
3. En el menú lateral, ve a **API Keys**
4. Cambia de **Development** a **Production** (toggle en la parte superior)
5. Copia las nuevas keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (empieza con `pk_live_...`)
   - `CLERK_SECRET_KEY` (empieza con `sk_live_...`)

## Paso 2: Configurar Dominio de Producción

1. En Clerk Dashboard, ve a **Domains**
2. Agrega tu dominio de producción:
   - Ejemplo: `fitovida.tudominio.com`
3. Sigue las instrucciones para verificar el dominio (DNS records)

## Paso 3: Configurar Variables de Entorno en el Servidor

En tu servidor VPS (72.61.69.172), crea un archivo `.env.production`:

```bash
# Clerk Production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_TU_KEY_AQUI
CLERK_SECRET_KEY=sk_live_TU_KEY_AQUI

# Clerk URLs (ajusta según tu dominio)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database MySQL
DATABASE_URL="mysql://root@localhost:3306/fitovida"
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="fitovida"
DB_PORT="3306"

# Stripe Production (cuando estés listo)
STRIPE_SECRET_KEY=sk_live_TU_STRIPE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_TU_STRIPE_KEY
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET

# Wompi Production (opcional)
# NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_prod_tu_llave
# WOMPI_PRIVATE_KEY=prv_prod_tu_llave
# WOMPI_EVENTS_SECRET=tu_secret_prod
```

## Paso 4: Desplegar en Producción

```bash
# En tu VPS
cd /ruta/a/fitovida

# Instalar dependencias
npm install

# Build de producción
npm run build

# Iniciar con PM2 o similar
pm2 start npm --name "fitovida" -- start
# O con variable de entorno:
pm2 start "npm start" --name fitovida --env production
```

## ⚠️ IMPORTANTE

### Development vs Production:

**Development (lo que tienes ahora):**
- `pk_test_...` / `sk_test_...`
- Usuarios de prueba
- Datos no reales
- Ideal para desarrollo local

**Production:**
- `pk_live_...` / `sk_live_...`
- Usuarios reales
- Datos en producción
- **Requiere dominio verificado**

### Dominios permitidos:

Clerk solo permite autenticación desde los dominios que configures:
- En **Development**: `localhost`, `*.clerk.accounts.dev`
- En **Production**: Tu dominio real (ejemplo: `fitovida.com`, `app.fitovida.com`)

## Verificación

Una vez configurado, cuando abras tu app en el dominio de producción:
- ✅ NO verás "Development Mode"
- ✅ Los usuarios se registran en producción
- ✅ Clerk funciona con tu dominio custom

## Notas Adicionales

1. **No mezcles keys:** Nunca uses `pk_test_` con `sk_live_` o viceversa
2. **Dominio verificado:** Clerk requiere verificar tu dominio antes de funcionar en producción
3. **Stripe también:** Eventualmente necesitarás cambiar las keys de Stripe a producción
4. **Base de datos:** En producción, usa `localhost` en vez de `72.61.69.172` (más rápido y seguro)
