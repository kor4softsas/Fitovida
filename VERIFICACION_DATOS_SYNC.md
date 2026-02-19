// Documento de diagnóstico: Verificación de relación entre vistas y BD
// Generado: 2026-02-19

# ✅ VERIFICACIÓN COMPLETADA - Relación Vistas & Base de Datos

## 📍 CONFIGURACIÓN ACTUAL

### Base de Datos: MySQL
- Host: localhost:3306
- Base de datos: fitovida
- Usuario: root

### Vistas a verificar:
1. http://localhost:3000/ (Página principal)
2. http://localhost:3000/#productos (Sección productos)
3. http://localhost:3000/admin (Panel administrativo)

---

## 🔴 PROBLEMAS DETECTADOS

### 1. INCONSISTENCIA EN FUENTE DE DATOS (CRÍTICO)

**Problema:**
- ✅ API `/api/products` → Lee de BD MySQL correctamente
- ❌ Página Principal (`/`) → Lee de archivo `src/lib/products.ts` (hardcodeado)
- ⚠️  Admin Dashboard → Intenta leer de BD pero usa datos estáticos de prueba

**Impacto:**
- Los productos que ve el usuario en la web pueden ser diferentes a los de la BD
- Cambios en la BD no se reflejan en la web (y viceversa)
- Inventory de admin puede no coincidir con disponibilidad en una compra

### 2. Tabla products puede no estar inicializada

**Verificación necesaria:**
```sql
USE fitovida;
SELECT COUNT(*) as total_productos FROM products;
```

Si el resultado es 0, la tabla está vacía.

---

## 🔧 ACCIONES NECESARIAS PARA SINCRONIZAR

### Paso 1: Ejecutar Script de Sincronización

```bash
# Instalar dotenv si no está instalado
npm install dotenv-cli

# Ejecutar script de verificación
npx ts-node verify-data-sync.ts
```

Este script:
- ✓ Verifica conexión a MySQL
- ✓ Crea tabla `products` si no existe
- ✓ Sincroniza 48 productos desde archivo .ts a BD
- ✓ Verifica consistencia por categoría

### Paso 2: Actualizar ProductsGrid.tsx

Cambiar de datos estáticos a datos dinámicos desde API:

**Cambio necesario en:**
- [src/components/ProductsGrid.tsx](src/components/ProductsGrid.tsx#L1)

**Aunque ProductsGrid.tsx usa `searchProducts()` y `getProductsByCategory()` que leen de `src/lib/products.ts`, debería obtener datos de la API de la BD**

### Paso 3: Crear API Client para sincronizar frontend

Necesario crear `src/lib/api.ts` con funciones que:
- Obtengan productos de `/api/products`
- Cacheen los datos
- Actualicen cuando haya cambios

---

## 📡 FLUJO DE DATOS CORRECTO (A implementar)

```
┌─────────────────────────────────────────────────────────────┐
│                    PÁGINA PRINCIPAL                         │
│                (http://localhost:3000/)                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─→ ProductsGrid.tsx usa datos
                 │   Actualmente: src/lib/products.ts (INCORRECTO)
                 │   Debería: /api/products (CORRECTO)
                 │
                 └─→ ProductCard.tsx muestra cada producto
                 
┌─────────────────────────────────────────────────────────────┐
│                       API REST                              │
│                  /api/products (GET)                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 └─→ Conecta a BD MySQL
                     SELECT * FROM products
                 
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                            │
│                    MySQL - fitovida.products                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                PANEL ADMINISTRATIVO                         │
│              (http://localhost:3000/admin)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─→ Dashboard obtiene estadísticas
                 ├─→ Ventas obtiene órdenes
                 ├─→ Inventario obtiene productos
                 │
                 └─→ Todas deben conectar a BD
```

---

## ✅ VERIFICACIÓN LISTA DE CHEQUEO

### Antes de considerar sincronizado:

- [ ] Script `verify-data-sync.ts` ejecutado sin errores
- [ ] BD contiene 48 productos (o más si se agregaron)
- [ ] Puede conectar a MySQL sin errores
- [ ] ProductsGrid.tsx actualizado para usar API
- [ ] Probó http://localhost:3000/#productos y vio productos
- [ ] Probó http://localhost:3000/admin/inventario y vio datos coincidentes
- [ ] Los precios en web coinciden con BD
- [ ] Las categorías en web coinciden con BD
- [ ] El stock mostrado en admin coincide con BD

---

## 🚀 PRÓXIMOS PASOS

1. **Ejecutar sincronización:**
   ```
   npm run sync-data
   ```

2. **Actualizar ProductsGrid para obtener de API (NO del archivo .ts)**

3. **Crear hook personalizado `useProducts.ts`:**
   - Obtiene datos de `/api/products`
   - Cachea localmente
   - Se actualiza cuando hay cambios

4. **Actualizar Admin Dashboard:**
   - Asegurar que GET /admin/inventario usen datos reales
   - Mostrar inventario desde BD

5. **Crear API para inventario si no existe:**
   ```
   /api/inventory (GET)
   /api/inventory/[category] (GET)
   ```

---

## 📝 NOTAS IMPORTANTES

- El archivo `src/lib/products.ts` está bien para datos de PRUEBA/DEMO
- Pero la producción DEBE leer SIEMPRE de la BD
- Implementar variable de entorno `DEMO_MODE` para decidir entre estáticos/BD
- Necesario sincronizar imágenes en `/public/img/`

---

## 🔗 ARCHIVOS RELACIONADOS

- Configuración: [.env.local](.env.local)
- Conexión DB: [src/lib/db.ts](src/lib/db.ts)
- Productos (datos estáticos): [src/lib/products.ts](src/lib/products.ts)
- API Productos: [src/app/api/products/route.ts](src/app/api/products/route.ts)
- Componente Grid: [src/components/ProductsGrid.tsx](src/components/ProductsGrid.tsx)
- Admin Layout: [src/app/admin/layout.tsx](src/app/admin/layout.tsx)
- Admin Dashboard: [src/app/admin/page.tsx](src/app/admin/page.tsx)

---

Documento generado por sistema de verificación de sincronización.
