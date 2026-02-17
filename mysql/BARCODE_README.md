# Sistema de Códigos de Barras - Fitovida

## 📋 Resumen

Sistema completo de gestión de códigos de barras para productos integrado en el panel administrativo de Fitovida.

## 🗄️ Estructura de Base de Datos

### Campo Agregado: `barcode`

**Tabla:** `inventory_products`  
**Tipo:** `VARCHAR(100)`  
**Restricción:** `UNIQUE` (no se permiten códigos duplicados)  
**Índice:** `idx_barcode` para búsquedas rápidas

```sql
barcode VARCHAR(100) UNIQUE NULL COMMENT 'Código de barras (EAN-13, UPC-A, EAN-8, Code128, personalizado)'
```

### Formatos Soportados

- **EAN-13**: 13 dígitos (formato europeo estándar)
- **UPC-A**: 12 dígitos (formato norteamericano)
- **EAN-8**: 8 dígitos (productos pequeños)
- **Code128**: Alfanumérico (flexible)
- **Personalizado**: Códigos internos de la empresa (min 6 caracteres)

## 🚀 Instalación

### Opción 1: Base de datos nueva

```bash
# Ejecutar el esquema completo que ya incluye el campo barcode
mysql -u root -p fitovida < mysql/admin-schema.sql
```

### Opción 2: Base de datos existente

```bash
# Solo agregar el campo barcode a instalaciones previas
mysql -u root -p fitovida < mysql/add-barcode-field.sql
```

## 💻 Funcionalidades del Panel Admin

### 1. Input de Código de Barras

**Componente:** `BarcodeInput.tsx`

**Características:**
- ✅ Entrada manual de códigos
- ✅ Botón "Escanear" con estados visuales
  - 📷 Estado inicial: "Escanear"
  - ⏳ Escaneando: "Escaneando..." (animado)
  - ✅ Éxito: "Escaneado" (2 segundos)
  - ⚠️ Error: "Reintentar"
- ✅ Detección automática de lectores físicos USB
- ✅ Validación de formato en tiempo real
- ✅ Feedback visual con colores y iconos

### 2. CRUD de Productos

**Ubicación:** `/admin/inventario`

**Funcionalidades:**
- ✅ Crear productos con código de barras
- ✅ Editar código de barras existente
- ✅ Búsqueda por código de barras
- ✅ Visualización de formato detectado
- ✅ Validación de códigos únicos
- ✅ Columna dedicada en tabla de productos

### 3. Búsqueda Avanzada

La búsqueda en inventario acepta:
- Nombre del producto
- SKU
- **Código de barras**

```typescript
const matchesSearch = 
  product.name.toLowerCase().includes(searchTerm) ||
  product.barcode?.toLowerCase().includes(searchTerm) ||
  product.sku?.toLowerCase().includes(searchTerm);
```

## 🔌 Integración con Lector Físico

### Conexión del Dispositivo

1. **Conectar** el lector USB al PC
2. El sistema operativo lo reconocerá automáticamente como teclado
3. **No requiere drivers** adicionales (plug-and-play)
4. El componente detectará la entrada rápida automáticamente

### Cómo Funciona

El lector de código de barras USB funciona como un teclado que:
1. Escribe los caracteres del código muy rápido (< 50ms entre caracteres)
2. Presiona Enter automáticamente al finalizar
3. El componente detecta esta velocidad y activa el modo escaneo

```typescript
const SCAN_SPEED_THRESHOLD = 50; // ms entre caracteres
const DEBOUNCE_TIME = 300; // ms para evitar duplicados
```

### Configuración del Lector (si aplica)

Algunos lectores permiten configurar:
- ✅ **Sufijo automático**: Enter (recomendado)
- ✅ **Prefijo**: Ninguno
- ✅ **Modo**: Teclado USB HID
- ✅ **Velocidad**: Alta

## 📊 Validaciones Implementadas

### Frontend (TypeScript)

```typescript
export function validateBarcodeFormat(barcode: string) {
  // EAN-13: 13 dígitos
  if (/^\d{13}$/.test(barcode)) {
    return { isValid: true, format: 'EAN-13' };
  }
  
  // UPC-A: 12 dígitos
  if (/^\d{12}$/.test(barcode)) {
    return { isValid: true, format: 'UPC-A' };
  }
  
  // EAN-8: 8 dígitos
  if (/^\d{8}$/.test(barcode)) {
    return { isValid: true, format: 'EAN-8' };
  }
  
  // Code128: Alfanumérico 6-100 caracteres
  if (/^[A-Z0-9]{6,100}$/i.test(barcode)) {
    return { isValid: true, format: 'Code128' };
  }
  
  // Código personalizado: mínimo 6 caracteres
  if (barcode.length >= 6) {
    return { isValid: true, format: 'Personalizado' };
  }
  
  return { 
    isValid: false, 
    message: 'Código inválido. Debe tener al menos 6 caracteres.' 
  };
}
```

### Base de Datos (SQL)

- ✅ **UNIQUE constraint**: Previene códigos duplicados
- ✅ **Índice**: Búsquedas rápidas por barcode
- ✅ **NULL permitido**: No todos los productos requieren código de barras

## 🧪 Modo de Prueba Actual

**Estado actual:** Sistema funcional en modo local sin lector físico

**Comportamiento:**
1. Click en "Escanear" activa el modo
2. Input recibe focus automáticamente
3. Al ingresar ≥8 caracteres, marca como exitoso
4. Si no se ingresa nada en 5 segundos, muestra error
5. "Reintentar" reinicia el proceso

**Próximos pasos:**
- Conectar lector físico USB
- El sistema funcionará automáticamente sin cambios de código

## 📝 Ejemplos de Uso

### Crear Producto con Código de Barras

```typescript
// En el modal de producto
const [formData, setFormData] = useState({
  name: 'Proteína Whey 2kg',
  sku: 'PROT-WHE-2K',
  barcode: '7891234567890', // EAN-13
  category: 'Proteínas',
  // ... otros campos
});
```

### Buscar Producto por Código

```typescript
// En el campo de búsqueda
searchTerm = "7891234567890"

// Encuentra el producto automáticamente
const product = products.find(p => p.barcode === searchTerm);
```

### Validar Antes de Guardar

```typescript
const validation = validateBarcodeFormat(formData.barcode);

if (!validation.isValid) {
  setBarcodeError(validation.message);
  return;
}

// Verificar duplicados
const exists = products.some(
  p => p.barcode === formData.barcode && p.id !== currentProduct?.id
);

if (exists) {
  setBarcodeError('Este código de barras ya está registrado');
  return;
}
```

## 🔧 Mantenimiento

### Limpiar Códigos Duplicados

```sql
-- Encontrar códigos duplicados
SELECT barcode, COUNT(*) as count
FROM inventory_products
WHERE barcode IS NOT NULL
GROUP BY barcode
HAVING count > 1;

-- Limpiar duplicados dejando solo uno
DELETE t1 FROM inventory_products t1
INNER JOIN inventory_products t2 
WHERE t1.id > t2.id 
AND t1.barcode = t2.barcode;
```

### Regenerar Índices

```sql
-- Si el índice tiene problemas
ALTER TABLE inventory_products DROP INDEX idx_barcode;
ALTER TABLE inventory_products ADD INDEX idx_barcode (barcode);
```

## 📚 Archivos Relacionados

### Frontend
- `src/components/admin/BarcodeInput.tsx` - Componente principal
- `src/app/admin/inventario/page.tsx` - Integración en inventario
- `src/types/admin.ts` - Tipos TypeScript

### Backend/Database
- `mysql/admin-schema.sql` - Esquema completo (incluye barcode)
- `mysql/add-barcode-field.sql` - Migración para instalaciones existentes
- `mysql/BARCODE_README.md` - Esta documentación

## 🎯 Roadmap Futuro

- [ ] Generación automática de códigos EAN-13
- [ ] Impresión de etiquetas con código de barras
- [ ] Escaneo desde cámara web (QR/Barcode)
- [ ] Importación masiva de códigos desde CSV/Excel
- [ ] Integración con API de facturación DIAN
- [ ] Historial de escaneos por producto
- [ ] Reportes de productos sin código de barras

## ✅ Estado Actual

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Campo en BD | ✅ Completo | Con índice único |
| Componente Input | ✅ Completo | 4 estados visuales |
| CRUD Productos | ✅ Completo | Crear/Editar/Buscar |
| Validación Frontend | ✅ Completo | 5 formatos soportados |
| Lector Físico | ⏳ Listo | Requiere conectar dispositivo |
| Modo Local | ✅ Funcional | 100% operativo sin BD |
| Documentación | ✅ Completo | Este archivo |

---

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Proyecto:** Fitovida E-commerce Admin Panel
