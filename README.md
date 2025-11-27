<div align="center">

# Fitovida

**Tienda online de productos naturales y suplementos para el bienestar**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![GSAP](https://img.shields.io/badge/GSAP-Animations-88CE02?style=for-the-badge)](https://greensock.com/gsap/)

---

*Desarrollado por* **[Kor4Soft SAS](https://kor4soft.com)**

</div>

## Descripcion

**Fitovida** es una aplicacion web de comercio electronico especializada en productos naturales, suplementos alimenticios y articulos para el bienestar. La plataforma ofrece una experiencia de compra moderna, intuitiva y completamente responsive.

### Caracteristicas principales

- **Catalogo de productos** con filtrado por categorias y busqueda en tiempo real
- **Carrito de compras** interactivo con gestion de cantidades
- **Proceso de checkout** completo con validacion de formularios
- **Animaciones fluidas** con GSAP para una experiencia premium
- **Diseno responsive** optimizado para movil, tablet y desktop
- **Sistema de codigos promocionales** para descuentos
- **Gestion de pedidos** con generacion de numero de orden

## Stack tecnologico

| Tecnologia | Uso |
|------------|-----|
| **Next.js 15** | Framework React con App Router |
| **TypeScript** | Tipado estatico |
| **Tailwind CSS** | Estilos y diseno responsive |
| **Zustand** | Gestion de estado global |
| **GSAP** | Animaciones profesionales |
| **Lucide React** | Iconografia |

## Instalacion

### Prerrequisitos

- Node.js 18+ 
- npm, yarn o pnpm

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/kor4softsas/Fitovida.git
   cd Fitovida
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   # o
   pnpm install
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## Estructura del proyecto

```
fitovida-next/
├── src/
│   ├── app/                 # Rutas y paginas (App Router)
│   │   ├── page.tsx         # Pagina principal
│   │   ├── login/           # Autenticacion
│   │   └── layout.tsx       # Layout global
│   ├── components/          # Componentes reutilizables
│   │   ├── Header.tsx       # Navegacion
│   │   ├── ProductCard.tsx  # Tarjeta de producto
│   │   ├── CartSidebar.tsx  # Carrito lateral
│   │   └── CheckoutModal.tsx# Modal de checkout
│   ├── lib/                 # Utilidades y configuracion
│   │   ├── store.ts         # Estado global (Zustand)
│   │   ├── products.ts      # Datos de productos
│   │   └── utils.ts         # Funciones auxiliares
│   └── types/               # Definiciones TypeScript
└── public/                  # Archivos estaticos
    └── img/                 # Imagenes de productos
```

## Categorias de productos

- **Suplementos** - Vitaminas, colageno, omega-3
- **Herbolaria** - Tes, extractos naturales
- **Proteinas** - Whey, veganas, caseina
- **Vitaminas** - Complejos vitaminicos
- **Energizantes** - Pre-entrenos, cafeina natural

## Scripts disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para produccion |
| `npm run start` | Iniciar servidor de produccion |
| `npm run lint` | Ejecutar linter |

## Licencia

Este proyecto es propiedad de **Kor4Soft SAS**. Todos los derechos reservados.

---

<div align="center">

**Kor4Soft SAS** - Soluciones de software a la medida

© 2025

</div>
