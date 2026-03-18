# 🚀 GUÍA DE CONFIGURACIÓN - MÓDULO DE INVENTARIO

## ⚠️ PASO 1: Verificar que MySQL está corriendo

### Opción A: XAMPP (Recomendado)
```
1. Abre XAMPP Control Panel
2. Verifica que MySQL esté en estado "Running" (verde)
3. Si no está corriendo:
   - Click en "Start" al lado de MySQL
   - Espera a que cambie a "Running"
```

### Opción B: Verificar desde terminal
```powershell
cd C:\xampp\mysql\bin
mysql -u root -e "SELECT 1"
# Si ves "1" en el resultado, MySQL está corriendo
```

---

## ⚙️ PASO 2: Ejecutar Migraciones de Base de Datos

### Opción A: Desde MySQL CLI (Más confiable)
```powershell
# Navega al directorio del proyecto
cd C:\xampp\htdocs\proyectos\Fitovida

# Ejecuta la migración para agregar el campo de imagen
C:\xampp\mysql\bin\mysql.exe -u root fitovida < mysql\migrate-to-image.sql

# Deberías ver: "Campo image agregado exitosamente"
```

### Opción B: Desde phpMyAdmin
```
1. Abre http://localhost/phpmyadmin
2. Selecciona base de datos "fitovida"
3. Tab "SQL"
4. Copia y pega el contenido de:  mysql/migrate-to-image.sql
5. Click "Ejecutar"
```

### Opción C: Desde MySQL Workbench (si tienes instalado)
```
1. Conecta a localhost
2. Abre la base de datos fitovida
3. File > Open SQL Script > mysql/migrate-to-image.sql
4. Ejecuta (Ctrl+Enter)
```

---

## ✅ PASO 3: Verificar que todo está correcto

### Opción A: Endpoint de Diagnóstico
```
Abre en el navegador:
http://localhost:3000/api/admin/inventory/diagnose

Deberías ver JSON con:
- image_column.exists: true
- inventory_columns: lista de campos incluyendo "image"
```

### Opción B: Verificar desde terminal
```powershell
# Conecta a MySQL
C:\xampp\mysql\bin\mysql.exe -u root fitovida

# En el prompt de MySQL, ejecuta:
DESC inventory_products;

# Deberías ver una columna "image" en la lista
```

---

## 🌐 PASO 4: Acceder al módulo de Inventario

```
1. Asegúrate que el servidor Next.js está corriendo:
   npm run dev

2. Abre en el navegador:
   http://localhost:3000/admin/inventario

3. Deberías ver:
   ✅ Tabla de productos cargada
   ✅ Botón "Nuevo Producto"
   ✅ Botón "Imprimir Etiquetas"
```

---

## 🎯 PRUEBA RÁPIDA

### Crear un producto de prueba:
1. Click en "Nuevo Producto"
2. Completa el formulario:
   - Nombre: "Producto Test"
   - Categoría: "Test"
   - Stock Actual: 10
   - Costo: 10000
   - Precio Venta: 20000
3. En la sección de Código de Barras:
   - Click en "Auto EAN-13"
   - Se generará automáticamente un código
4. En la sección de Imagen:
   - Drag-drop una imagen PNG/JPG
5. Click "Crear Producto"

✅ Si ves el producto en la tabla con imagen, ¡funciona!

---

## 🔧 TROUBLESHOOTING

### Error: "Failed to load resource: the server responded with a status of 500"
**Solución:**
```
1. Verifica que MySQL está corriendo (XAMPP)
2. Ejecuta la migración: mysql/migrate-to-image.sql
3. Abre http://localhost:3000/api/admin/inventory/diagnose
4. Revisa qué está faltando
```

### Error: "MySQL server on 'localhost' (10061)"
**Solución:**
```
1. Abre XAMPP Control Panel
2. Haz Click "Start" en MySQL
3. Espera 5 segundos a que esté Ready
4. Intenta nuevamente
```

### Las imágenes no se guardan
**Solución:**
```
1. Verifica que existe la carpeta: public/img/products/
   - Si no existe, créala manualmente
   
2. Verifica permisos de escritura:
   - Click derecho en carpeta > Propiedades > Seguridad
   - Asegúrate que tienes permisos de escritura
```

### Código de barras no se genera
**Solución:**
```
1. Verifica que jsbarcode está instalido:
   npm list jsbarcode
   
2. Si no está:
   npm install jsbarcode
   
3. Reinicia el servidor:
   Ctrl+C en terminal
   npm run dev
```

---

## 📚 COMANDOS ÚTILES

### Resetear BD (Nuclear option)
```powershell
# Elimina toda la BD
C:\xampp\mysql\bin\mysql.exe -u root -e "DROP DATABASE fitovida; CREATE DATABASE fitovida;"

# Recrea el esquema
C:\xampp\mysql\bin\mysql.exe -u root fitovida < mysql\admin-schema.sql

# Ejecuta la migración
C:\xampp\mysql\bin\mysql.exe -u root fitovida < mysql\migrate-to-image.sql
```

### Ver log del servidor
```powershell
# Terminal donde corre "npm run dev"
# Los errores aparecen allí en tiempo real
```

### Limpiar caché de Node
```powershell
cd C:\xampp\htdocs\proyectos\Fitovida
rm -r node_modules/.cache 2>$null
npm run build
npm run dev
```

---

## 📞 Soporte Rápido

| Problema | Solución |
|----------|----------|
| Tabla vacía | Ejecuta migración, reinicia servidor |
| Imágenes no cargan | Crea carpeta `public/img/products/` |
| Códigos no se generan | `npm install jsbarcode` |
| Error 500 genérico | Abre `/api/admin/inventory/diagnose` para diagnosticar |
| MySQL no conecta | Inicia MySQL desde XAMPP |

---

## ✨ Una vez todo está configurado

El módulo incluye:
- ✅ Carga de imágenes para produtos
- ✅ Generación automática de códigos de barras (EAN-13)
- ✅ Impresión de etiquetas con códigos
- ✅ Gestión completa de inventario
- ✅ Sincronización con órdenes de compra

**¡Listo para la Fase 2: Punto de Venta (POS)!**
