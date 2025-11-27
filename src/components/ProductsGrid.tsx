'use client';

import { useMemo } from 'react';
import { LayoutGrid, Pill, Leaf, Droplet, Dumbbell, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { products, searchProducts, getProductsByCategory } from '@/lib/products';
import ProductCard from './ProductCard';
import { Product, Category } from '@/types';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'todos' as Category, name: 'Todos', icon: LayoutGrid },
  { id: 'vitaminas' as Category, name: 'Vitaminas', icon: Pill },
  { id: 'suplementos' as Category, name: 'Suplementos', icon: Sparkles },
  { id: 'hierbas' as Category, name: 'Hierbas', icon: Leaf },
  { id: 'aceites' as Category, name: 'Aceites', icon: Droplet },
  { id: 'proteinas' as Category, name: 'Proteínas', icon: Dumbbell },
];

export default function ProductsGrid() {
  const { currentCategory, setCategory, searchQuery, sortBy, setSortBy } = useCartStore();

  const filteredProducts = useMemo(() => {
    let result: Product[] = [];

    if (searchQuery) {
      result = searchProducts(searchQuery);
    } else {
      result = getProductsByCategory(currentCategory);
    }

    switch (sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [currentCategory, searchQuery, sortBy]);

  return (
    <section id="productos" className="py-12 md:py-20 lg:py-24 bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            Nuestros productos
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] mt-2 md:mt-3 max-w-lg mx-auto">
            Explora nuestra selección de productos naturales de alta calidad
          </p>
        </div>

        {/* Categories Filter - Horizontal scroll on mobile */}
        <div className="relative mb-8 md:mb-10">
          <div className="flex md:flex-wrap md:justify-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = currentCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setCategory(category.id)}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                    isActive 
                      ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20" 
                      : "bg-white text-[var(--muted)] border border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Bar - Rearranges on mobile */}
        <div className="flex justify-between items-center gap-4 mb-6 md:mb-8 pb-4 md:pb-6 border-b border-[var(--border)]">
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">{filteredProducts.length}</span> productos
          </p>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-[var(--border)] rounded-lg sm:rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-xs sm:text-sm text-[var(--foreground)] cursor-pointer transition-all"
          >
            <option value="default">Ordenar</option>
            <option value="price-low">Menor precio</option>
            <option value="price-high">Mayor precio</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>

        {/* Products Grid - 2 cols mobile, scales up */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 md:py-20">
            <p className="text-[var(--muted)] text-base md:text-lg">No se encontraron productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
