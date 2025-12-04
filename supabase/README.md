# Base de Datos Fitovida - Supabase

## 📋 Descripción

Esquema completo de base de datos para la aplicación Fitovida, diseñado para trabajar con:
- **Supabase** como base de datos PostgreSQL
- **Clerk** para autenticación de usuarios
- Sistema de órdenes con múltiples métodos de pago
- Gestión de direcciones de envío

## 🗂️ Estructura de Tablas

### 1. `products`
Catálogo de productos naturales y suplementos.
- Información del producto (nombre, descripción, precio)
- Categorización y featured
- Stock y ratings
- Beneficios del producto

### 2. `orders`
Órdenes de compra con información completa.
- Información del cliente
- Dirección de envío (con departamento de Colombia)
- Método de pago: `card`, `pse`, `transfer`, `cash_on_delivery`
- Estados: `pending`, `processing`, `paid`, `shipped`, `delivered`, `cancelled`, `failed`
- Montos (subtotal, envío, descuento, total)
- Soporte para cancelación

### 3. `order_items`
Items individuales de cada orden.
- Referencia al producto
- Cantidad y precio al momento de la compra
- Snapshot de información del producto

### 4. `user_addresses`
Direcciones de envío guardadas por usuarios.
- Múltiples direcciones por usuario
- Dirección predeterminada (solo una por usuario)
- Departamentos y ciudades de Colombia
- Instrucciones de entrega opcionales

## 🚀 Instalación

### Opción 1: Nueva Base de Datos (Recomendado)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a **SQL Editor**
3. Crea un nuevo query
4. Copia y pega el contenido de `schema.sql`
5. Ejecuta el script completo (Run)

### Opción 2: Migración (Base de Datos Existente)

Si ya tienes la base de datos creada y solo necesitas agregar direcciones:

1. Ve a **SQL Editor** en Supabase
2. Copia y pega el contenido de `migration_addresses.sql`
3. Ejecuta el script (Run)

## 🔐 Configuración de Seguridad (RLS)

### Estado Actual
Las políticas RLS están configuradas de forma **permisiva** para desarrollo (`USING (true)`).

### Para Producción

#### 1. Configurar Clerk JWT en Supabase

```sql
-- Ejemplo de política segura para órdenes
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub' OR user_id IS NULL);

-- Ejemplo para direcciones
DROP POLICY IF EXISTS "user_addresses_select_own" ON user_addresses;
CREATE POLICY "user_addresses_select_own"
  ON user_addresses FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');
```

#### 2. Pasos de Integración Clerk + Supabase

1. **En Clerk Dashboard:**
   - Ve a: `JWT Templates` → `New Template`
   - Nombre: `supabase`
   - Agrega el claim: `sub` (ID del usuario)
   - Opcional: Agrega `role` para RBAC

2. **Obtén la clave pública JWKS:**
   - Copia la URL de JWKS de Clerk
   - Formato: `https://[clerk-instance].clerk.accounts.dev/.well-known/jwks.json`

3. **En Supabase Dashboard:**
   - Ve a: `Settings` → `API` → `JWT Settings`
   - Pega la URL de JWKS de Clerk
   - O configura el `JWT Secret` manualmente

4. **Actualiza las políticas RLS** reemplazando `true` por verificación de usuario.

## 📊 Vistas Útiles

El schema incluye vistas predefinidas para análisis:

### `orders_summary`
Resumen de órdenes con totales e items.

```sql
SELECT * FROM orders_summary 
WHERE customer_email = 'cliente@ejemplo.com'
ORDER BY created_at DESC;
```

### `top_products`
Productos más vendidos.

```sql
SELECT * FROM top_products LIMIT 10;
```

## 🔍 Queries Útiles

### Ver órdenes de un usuario
```sql
SELECT * FROM orders 
WHERE user_id = 'clerk_user_id'
ORDER BY created_at DESC;
```

### Ver direcciones de un usuario
```sql
SELECT * FROM user_addresses 
WHERE user_id = 'clerk_user_id'
ORDER BY is_default DESC, created_at DESC;
```

### Obtener dirección predeterminada
```sql
SELECT * FROM user_addresses 
WHERE user_id = 'clerk_user_id' AND is_default = true
LIMIT 1;
```

### Estadísticas de ventas
```sql
SELECT 
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as average_order_value
FROM orders
WHERE status NOT IN ('cancelled', 'failed');
```

## 🛠️ Características Avanzadas

### Triggers Automáticos
- ✅ `updated_at` se actualiza automáticamente
- ✅ Solo una dirección puede ser predeterminada por usuario
- ✅ Validación de email en órdenes
- ✅ Validación de teléfono en direcciones

### Constraints
- Montos positivos (subtotal, shipping, discount, total)
- Emails válidos (regex)
- Teléfonos válidos (mínimo 7 dígitos)
- Etiquetas únicas de direcciones por usuario

### Índices Optimizados
- Búsqueda por usuario (`user_id`)
- Búsqueda por estado de orden
- Búsqueda por email de cliente
- Búsqueda por número de orden
- Direcciones predeterminadas

## 📝 Notas Importantes

1. **user_id como VARCHAR(100)**: Diseñado para IDs de Clerk que son strings
2. **Soporte para invitados**: `user_id` puede ser NULL en órdenes
3. **Departamentos de Colombia**: El campo `shipping_department` y `department` en direcciones
4. **Métodos de pago**: Incluye `cash_on_delivery` para pago contra entrega
5. **RLS Permisivo**: Por defecto permite todo - **CAMBIAR EN PRODUCCIÓN**

## 🔄 Actualizaciones Futuras

- [ ] Integrar Clerk JWT para RLS estricto
- [ ] Agregar tabla de cupones/descuentos
- [ ] Sistema de reviews de productos
- [ ] Historial de cambios de estado de órdenes
- [ ] Notificaciones de envío

## 📧 Soporte

Para problemas o preguntas sobre el esquema:
1. Revisa la documentación de Supabase: https://supabase.com/docs
2. Revisa la documentación de Clerk: https://clerk.com/docs
3. Consulta los comentarios en el código SQL

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2025
