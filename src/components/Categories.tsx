'use client';

import { LayoutGrid, Pill, Leaf, Droplet, Dumbbell, Sparkles } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'todos' as Category, name: 'Todos', icon: LayoutGrid },
  { id: 'vitaminas' as Category, name: 'Vitaminas', icon: Pill },
  { id: 'suplementos' as Category, name: 'Suplementos', icon: Sparkles },
  { id: 'hierbas' as Category, name: 'Hierbas', icon: Leaf },
  { id: 'aceites' as Category, name: 'Aceites', icon: Droplet },
  { id: 'proteinas' as Category, name: 'Proteínas', icon: Dumbbell },
];

export default function Categories() {
  const { currentCategory, setCategory } = useCartStore();

  const handleCategoryClick = (categoryId: Category) => {
    setCategory(categoryId);
    const element = document.getElementById('productos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="categorias" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-[var(--steel-blue)] uppercase tracking-wider">Explora</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mt-2">
            Categorías
          </h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = currentCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  "group flex flex-col items-center justify-center p-5 md:p-6 rounded-2xl transition-all duration-300",
                  isActive 
                    ? "bg-[var(--primary)] shadow-lg shadow-[var(--primary)]/20" 
                    : "bg-[var(--background)] hover:bg-[var(--accent-light)]/40 border border-[var(--border)]"
                )}
              >
                <div className={cn(
                  "p-3 rounded-xl mb-3 transition-all duration-300",
                  isActive 
                    ? "bg-white/20" 
                    : "bg-[var(--accent-light)]/50 group-hover:bg-[var(--accent)]/50"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 md:h-6 md:w-6 transition-colors",
                    isActive ? "text-white" : "text-[var(--primary)]"
                  )} />
                </div>
                <h3 className={cn(
                  "font-medium text-sm",
                  isActive ? "text-white" : "text-[var(--foreground)]"
                )}>
                  {category.name}
                </h3>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
