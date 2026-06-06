'use client';

import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Pill, Leaf, Droplet, Dumbbell, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { cn, getCategoryName, getUniqueCategoryKeys, normalizeCategoryKey } from '@/lib/utils';

type CategoryProduct = { category: string };

const categoryIcons: Record<string, typeof LayoutGrid> = {
  vitaminas: Pill,
  suplementos: Sparkles,
  hierbas: Leaf,
  aceites: Droplet,
  proteinas: Dumbbell,
};

export default function Categories() {
  const { currentCategory, setCategory } = useCartStore();
  const [categoryKeys, setCategoryKeys] = useState<string[]>(['todos']);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({ todos: 0 });

  const categoryOptions = useMemo(() => {
    return categoryKeys.map((categoryId) => ({
      id: categoryId,
      label: getCategoryName(categoryId),
      count: categoryId === 'todos' ? categoryCounts.todos || 0 : categoryCounts[normalizeCategoryKey(categoryId)] || 0,
    }));
  }, [categoryKeys, categoryCounts]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/products?limit=1000', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Error loading categories');
        }

        const data = await response.json() as { products?: CategoryProduct[] };
        const products = data.products || [];
        const keys = getUniqueCategoryKeys(products);
        const counts = products.reduce<Record<string, number>>((acc, product) => {
          const key = normalizeCategoryKey(product.category);
          if (!key || key === 'todos') {
            return acc;
          }

          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        setCategoryKeys(['todos', ...keys]);
        setCategoryCounts({
          todos: products.length,
          ...counts
        });
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategoryKeys(['todos']);
        setCategoryCounts({ todos: 0 });
      }
    };

    void fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setCategory(categoryId);
    const element = document.getElementById('productos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="categorias" className="py-20 md:py-28 bg-[linear-gradient(180deg,rgba(198,235,190,0.18)_0%,rgba(255,255,255,0)_100%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border)] bg-white/85 p-6 sm:p-8 md:p-10 shadow-[0_24px_80px_rgba(26,46,26,0.08)] backdrop-blur">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[var(--accent)]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-[var(--steel-blue)]/10 blur-3xl" />

          <div className="text-center mb-8 md:mb-10 relative">
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--steel-blue)] shadow-sm">
              Explora el catálogo
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mt-4">
              Categorías
            </h2>
            <p className="mt-3 text-sm md:text-base text-[var(--muted)] max-w-2xl mx-auto">
              Desliza horizontalmente y entra directo a la categoría que necesitas.
            </p>
          </div>

          <div className="relative -mx-6 sm:-mx-8 md:-mx-10 px-6 sm:px-8 md:px-10">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white/95 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white/95 to-transparent" />

            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 scrollbar-hide">
              {categoryOptions.map((category) => {
                const normalizedId = normalizeCategoryKey(category.id);
                const Icon = categoryIcons[normalizedId] || LayoutGrid;
                const isActive = normalizeCategoryKey(currentCategory) === normalizedId;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={cn(
                      "group snap-start min-w-[190px] sm:min-w-[220px] flex-shrink-0 rounded-full border px-4 py-3 text-left transition-all duration-300",
                      isActive
                        ? "border-transparent bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-dark)_100%)] text-white shadow-[0_12px_28px_rgba(90,158,111,0.22)] -translate-y-0.5"
                        : "border-[var(--border)] bg-white hover:-translate-y-0.5 hover:border-[rgba(90,158,111,0.28)] hover:shadow-[0_10px_24px_rgba(26,46,26,0.07)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-[var(--accent-light)]/70 text-[var(--primary)] group-hover:bg-[var(--accent-light)]"
                      )}>
                        <Icon className="h-4.5 w-4.5 md:h-5 md:w-5" />
                      </div>

                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold",
                        isActive ? "bg-white/15 text-white" : "bg-[var(--background)] text-[var(--muted)]"
                      )}>
                        {category.count}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className={cn(
                        "text-sm sm:text-[0.95rem] font-semibold tracking-tight",
                        isActive ? "text-white" : "text-[var(--foreground)]"
                      )}>
                        {category.label}
                      </h3>
                      <p className={cn(
                        "mt-1 text-xs",
                        isActive ? "text-white/80" : "text-[var(--muted)]"
                      )}>
                        {normalizedId === 'todos' ? 'Ver todo el catálogo' : 'Desde inventario'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
