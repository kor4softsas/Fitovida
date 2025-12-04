'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { LayoutGrid, Pill, Leaf, Droplet, Dumbbell, Sparkles, ChevronDown, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import gsap from 'gsap';
import { searchProducts, getProductsByCategory } from '@/lib/products';
import ProductCard from './ProductCard';
import { Product, Category } from '@/types';
import { cn } from '@/lib/utils';

const PRODUCTS_PER_PAGE = 12;

const categories = [
  { id: 'todos' as Category, name: 'Todos', icon: LayoutGrid },
  { id: 'vitaminas' as Category, name: 'Vitaminas', icon: Pill },
  { id: 'suplementos' as Category, name: 'Suplementos', icon: Sparkles },
  { id: 'hierbas' as Category, name: 'Hierbas', icon: Leaf },
  { id: 'aceites' as Category, name: 'Aceites', icon: Droplet },
  { id: 'proteinas' as Category, name: 'Proteínas', icon: Dumbbell },
];

const sortOptions = [
  { value: 'default', label: 'Ordenar' },
  { value: 'price-low', label: 'Menor precio' },
  { value: 'price-high', label: 'Mayor precio' },
  { value: 'name', label: 'Nombre A-Z' },
];

export default function ProductsGrid() {
  const { currentCategory, setCategory, searchQuery, sortBy, setSortBy } = useCartStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Close dropdown with animation (inverse of opening)
  const closeDropdown = useCallback(() => {
    if (!dropdownRef.current || isAnimating || !isSortOpen) return;
    
    setIsAnimating(true);
    
    // First animate options out in reverse stagger
    const tl = gsap.timeline({
      onComplete: () => {
        setIsSortOpen(false);
        setIsAnimating(false);
        if (dropdownRef.current) {
          gsap.set(dropdownRef.current, { display: 'none' });
        }
      }
    });
    
    // Options slide out to the left in reverse order
    tl.to([...optionsRef.current].reverse(), {
      opacity: 0,
      x: -10,
      duration: 0.12,
      stagger: 0.02,
      ease: 'power2.in'
    });
    
    // Then animate the container
    tl.to(dropdownRef.current, {
      opacity: 0,
      y: -10,
      scale: 0.95,
      duration: 0.18,
      ease: 'power2.in'
    }, '-=0.08');
    
  }, [isAnimating, isSortOpen]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    if (isAnimating) return;
    if (isSortOpen) {
      closeDropdown();
    } else {
      setIsSortOpen(true);
    }
  }, [isAnimating, isSortOpen, closeDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeDropdown]);

  // GSAP animation for dropdown opening
  useEffect(() => {
    if (!dropdownRef.current) return;

    if (isSortOpen) {
      // Opening animation
      gsap.set(dropdownRef.current, { display: 'block' });
      gsap.fromTo(dropdownRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' }
      );
      
      // Stagger animate options
      gsap.fromTo(optionsRef.current,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.2, stagger: 0.03, ease: 'power2.out', delay: 0.05 }
      );
    }
  }, [isSortOpen]);

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Ordenar';

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  
  // Ensure current page is valid (clamp to valid range)
  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  
  const startIndex = (validCurrentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to products section
    const element = document.getElementById('productos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCategoryChange = (category: Category) => {
    setCategory(category);
    setCurrentPage(1); // Reset to first page when category changes
  };

  const handleSortChange = (sort: typeof sortBy) => {
    setSortBy(sort);
    setCurrentPage(1); // Reset to first page when sort changes
  };

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
                  onClick={() => handleCategoryChange(category.id)}
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
          
{/* Custom Sort Dropdown */}
          <div ref={sortRef} className="relative">
            <button
              onClick={toggleDropdown}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border rounded-xl bg-white text-xs sm:text-sm font-medium transition-all duration-200",
                isSortOpen 
                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50"
              )}
            >
              <span>{currentSortLabel}</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                isSortOpen && "rotate-180"
              )} />
            </button>

            {/* Dropdown Menu - Always in DOM for GSAP animation */}
            <div 
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-44 bg-white border border-[var(--border)] rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50 origin-top-right"
              style={{ display: 'none' }}
            >
              {sortOptions.map((option, index) => (
                <button
                  key={option.value}
                  ref={(el) => { optionsRef.current[index] = el; }}
                  onClick={() => {
                    handleSortChange(option.value as typeof sortBy);
                    closeDropdown();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                    sortBy === option.value
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                      : "text-[var(--foreground)] hover:bg-[var(--background)]"
                  )}
                >
                  <span>{option.label}</span>
                  {sortBy === option.value && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid - 2 cols mobile, scales up */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 md:py-20">
            <p className="text-[var(--muted)] text-base md:text-lg">No se encontraron productos.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {paginatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 8} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav 
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 md:mt-14"
                aria-label="Paginación de productos"
              >
                {/* Page info for mobile */}
                <p className="text-sm text-[var(--muted)] sm:hidden">
                  Página <span className="font-semibold text-[var(--foreground)]">{currentPage}</span> de <span className="font-semibold text-[var(--foreground)]">{totalPages}</span>
                </p>

                <div className="flex items-center gap-1 sm:gap-2">
                  {/* First page button */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all duration-200",
                      currentPage === 1
                        ? "bg-[var(--background)] text-[var(--muted)] cursor-not-allowed opacity-50"
                        : "bg-white border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-md"
                    )}
                    aria-label="Ir a la primera página"
                    title="Primera página"
                  >
                    <ChevronsLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* Previous page button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all duration-200",
                      currentPage === 1
                        ? "bg-[var(--background)] text-[var(--muted)] cursor-not-allowed opacity-50"
                        : "bg-white border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-md"
                    )}
                    aria-label="Ir a la página anterior"
                    title="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* Page numbers - hidden on very small screens */}
                  <div className="hidden xs:flex items-center gap-1 sm:gap-2">
                    {getPageNumbers().map((page, index) => (
                      typeof page === 'number' ? (
                        <button
                          key={index}
                          onClick={() => handlePageChange(page)}
                          className={cn(
                            "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-sm font-medium transition-all duration-200",
                            currentPage === page
                              ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                              : "bg-white border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-md"
                          )}
                          aria-label={`Ir a la página ${page}`}
                          aria-current={currentPage === page ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      ) : (
                        <span 
                          key={index} 
                          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-[var(--muted)]"
                          aria-hidden="true"
                        >
                          ⋯
                        </span>
                      )
                    ))}
                  </div>

                  {/* Next page button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all duration-200",
                      currentPage === totalPages
                        ? "bg-[var(--background)] text-[var(--muted)] cursor-not-allowed opacity-50"
                        : "bg-white border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-md"
                    )}
                    aria-label="Ir a la página siguiente"
                    title="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* Last page button */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl transition-all duration-200",
                      currentPage === totalPages
                        ? "bg-[var(--background)] text-[var(--muted)] cursor-not-allowed opacity-50"
                        : "bg-white border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-md"
                    )}
                    aria-label="Ir a la última página"
                    title="Última página"
                  >
                    <ChevronsRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>

                {/* Page info for desktop */}
                <p className="hidden sm:block text-sm text-[var(--muted)]">
                  Mostrando <span className="font-semibold text-[var(--foreground)]">{startIndex + 1}</span>-<span className="font-semibold text-[var(--foreground)]">{Math.min(endIndex, filteredProducts.length)}</span> de <span className="font-semibold text-[var(--foreground)]">{filteredProducts.length}</span> productos
                </p>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
