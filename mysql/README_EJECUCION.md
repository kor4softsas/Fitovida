# Guía de Ejecución de Scripts SQL - Fitovida

## 📋 Orden de Ejecución

Ejecuta los scripts SQL en el siguiente orden:

### 1. Schema Principal
```sql
SOURCE C:/Users/camil/OneDrive/Escritorio/Fitovida/mysql/schema-mysql.sql
```
Crea la base de datos, tablas principales (products, orders, order_items, user_addresses)

### 2. Actualización de Autenticación
```sql
SOURCE C:/Users/camil/OneDrive/Escritorio/Fitovida/mysql/auth-update.sql
```
Modifica tabla users para soportar autenticación local y crea tabla sessions

### 3. Schema del Panel Admin
```sql
SOURCE C:/Users/camil/OneDrive/Escritorio/Fitovida/mysql/admin-schema.sql
```
Crea tablas para panel administrativo:
- admin_sales
- admin_sale_items
- inventory_products
- inventory_movements
- incomes
- expenses

## 🗂️ Resumen de Tablas Creadas

### Tablas Principales (schema-mysql.sql)
- ✅ `products` - Catálogo de productos
- ✅ `orders` - Órdenes de clientes (tienda online)
- ✅ `order_items` - Items de órdenes
- ✅ `user_addresses` - Direcciones de usuarios

### Tablas de Autenticación (auth-update.sql)
- ✅ `users` - Usuarios del sistema
- ✅ `sessions` - Sesiones activas

### Tablas Administrativas (admin-schema.sql)
- ✅ `admin_sales` - Ventas internas registradas manualmente
- ✅ `admin_sale_items` - Items de ventas internas
- ✅ `inventory_products` - Control de inventario
- ✅ `inventory_movements` - Movimientos de inventario (entradas/salidas)
- ✅ `incomes` - Registro de ingresos
- ✅ `expenses` - Registro de gastos

## 🔍 Vistas Creadas

### Panel Admin
- `admin_daily_sales` - Ventas por día
- `low_stock_products` - Productos con stock bajo
- `monthly_financial_summary` - Resumen financiero mensual
- `admin_top_selling_products` - Productos más vendidos

### Tienda Online
- `orders_summary` - Resumen de órdenes
- `top_products` - Productos más vendidos en tienda online

## ⚙️ Procedimientos Almacenados

- `register_inventory_entry()` - Registrar entrada de inventario
- `register_inventory_exit()` - Registrar salida de inventario

## 🔔 Triggers Automáticos

- `after_inventory_movement_insert` - Actualiza stock automáticamente
- `after_admin_sale_insert` - Registra ingreso al completar venta
- `before_user_address_insert` - Garantiza solo una dirección predeterminada
- `before_user_address_update` - Mantiene dirección predeterminada única

## 🚀 Ejecutar Todo de Una Vez

En MySQL Workbench o cliente MySQL:

```sql
-- Opción 1: Desde MySQL CLI
mysql -u root -p fitovida < C:/Users/camil/OneDrive/Escritorio/Fitovida/mysql/schema-mysql.sql
mysql -u root -p fitovida < C:/Users/camil/OneDrive/Escritorio/Fitovida/mysql/auth-update.sql
mysql -u root -p fitovida < C:/Users/camil/OneDrive/Escritorio/Fitovida/mysql/admin-schema.sql

-- Opción 2: Desde consola MySQL
USE fitovida;
SOURCE C:/Users/camil/OneDrive/Escritorio/Fitovida/mysql/schema-mysql.sql;
SOURCE C:/Users/camil/OneDrive/Escritorio/Fitovida/mysql/auth-update.sql;
SOURCE C:/Users/camil/OneDrive/Escritorio/Fitovida/mysql/admin-schema.sql;
```

## ✅ Verificación

Después de ejecutar los scripts, verifica:

```sql
-- Ver todas las tablas
SHOW TABLES;

-- Contar registros de productos
SELECT COUNT(*) as total_productos FROM products;

-- Verificar inventario inicializado
SELECT COUNT(*) as productos_en_inventario FROM inventory_products;

-- Ver usuario admin demo
SELECT id, email, first_name, last_name, is_admin FROM users WHERE is_admin = TRUE;

-- Ver vistas disponibles
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

## 📊 Estructura de Datos para DIAN

Las tablas están preparadas para futura integración con facturación electrónica DIAN:

**En tabla `admin_sales`:**
- `customer_document` - NIT o CC del cliente
- `invoice_number` - Número de factura electrónica
- `invoice_cufe` - Código Único de Facturación Electrónica
- `invoice_date` - Fecha de emisión
- `invoice_status` - Estado (pending/authorized/rejected)
- `invoice_xml_path` - Ruta al XML
- `invoice_pdf_path` - Ruta al PDF

## 🔐 Usuario Demo Creado

**Email:** admin@fitovida.com  
**Password:** demo123  
**Rol:** Administrador  

## 📝 Notas Importantes

1. Los scripts incluyen datos de ejemplo para productos
2. El inventario se inicializa automáticamente con los productos existentes
3. Las sesiones expiradas se limpian automáticamente cada hora
4. Los precios están en COP (Pesos Colombianos)
5. El stock de productos se actualiza automáticamente con los movimientos
6. Las ventas completadas generan ingresos automáticamente

## 🛠️ Mantenimiento

```sql
-- Limpiar sesiones expiradas manualmente
DELETE FROM sessions WHERE expires_at < NOW();

-- Ver productos con stock bajo
SELECT * FROM low_stock_products;

-- Balance del mes actual
SELECT * FROM monthly_financial_summary 
WHERE month = DATE_FORMAT(CURDATE(), '%Y-%m');
```
