'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { LayoutGrid, Pill, Leaf, Droplet, Dumbbell, Sparkles, ChevronDown, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import gsap from 'gsap';
import ProductCard from './ProductCard';
import { Product } from '@/types';
import { cn, getCategoryName, getUniqueCategoryKeys, normalizeCategoryKey } from '@/lib/utils';

const PRODUCTS_PER_PAGE = 12;

const categoryIcons: Record<string, typeof LayoutGrid> = {
  vitaminas: Pill,
  suplementos: Sparkles,
  hierbas: Leaf,
  aceites: Droplet,
  proteinas: Dumbbell,
};

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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryIndicator, setCategoryIndicator] = useState({ left: 0, width: 0 });
  const [categoryScroll, setCategoryScroll] = useState({ canScrollLeft: false, canScrollRight: false });
  const sortRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const productsGridRef = useRef<HTMLDivElement>(null);
  const categoryRailRef = useRef<HTMLDivElement>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // Fetch products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Agregar un parámetro de tiempo para evitar el caché del navegador
        const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setAllProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);


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

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of allProducts) {
      const key = normalizeCategoryKey(product.category);
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return [
      { id: 'todos', label: 'Todos', count: allProducts.length },
      ...getUniqueCategoryKeys(allProducts).map((categoryId) => ({
        id: categoryId,
        label: getCategoryName(categoryId),
        count: counts.get(categoryId) || 0,
      })),
    ];
  }, [allProducts]);

  useEffect(() => {
    const updateIndicator = () => {
      const rail = categoryRailRef.current;
      const activeButton = categoryButtonRefs.current[normalizeCategoryKey(currentCategory) === 'todos' ? 'todos' : normalizeCategoryKey(currentCategory)];

      if (!rail || !activeButton) {
        setCategoryIndicator({ left: 0, width: 0 });
        return;
      }

      const railRect = rail.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setCategoryIndicator({
        left: buttonRect.left - railRect.left + rail.scrollLeft,
        width: buttonRect.width,
      });

      const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
      setCategoryScroll({
        canScrollLeft: rail.scrollLeft > 4,
        canScrollRight: rail.scrollLeft < maxScrollLeft - 4,
      });
    };

    const frame = window.requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    const rail = categoryRailRef.current;
    rail?.addEventListener('scroll', updateIndicator, { passive: true });

    const observer = rail ? new ResizeObserver(updateIndicator) : null;
    if (rail && observer) {
      observer.observe(rail);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateIndicator);
      rail?.removeEventListener('scroll', updateIndicator);
      observer?.disconnect();
    };
  }, [currentCategory, categoryOptions.length, allProducts.length]);

  const scrollCategoryRail = (direction: 'left' | 'right') => {
    const rail = categoryRailRef.current;
    if (!rail) return;

    const distance = Math.max(220, Math.floor(rail.clientWidth * 0.7));
    rail.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Filter by Category
    const selectedCategory = normalizeCategoryKey(currentCategory);
    if (selectedCategory !== 'todos') {
      result = result.filter((p) => normalizeCategoryKey(p.category) === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(lowerQuery) ||
        (product.description && product.description.toLowerCase().includes(lowerQuery)) ||
        product.category.toLowerCase().includes(lowerQuery)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [allProducts, currentCategory, searchQuery, sortBy]);

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
    if (page === currentPage || isPageTransitioning) return;
    
    setIsPageTransitioning(true);
    
    // Animate out current products
    if (productsGridRef.current) {
      gsap.to(productsGridRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentPage(page);
          
          // Scroll to products section
          const element = document.getElementById('productos');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          
          // Animate in new products
          gsap.fromTo(productsGridRef.current,
            { opacity: 0, y: -20 },
            { 
              opacity: 1, 
              y: 0, 
              duration: 0.35, 
              ease: 'power2.out',
              onComplete: () => setIsPageTransitioning(false)
            }
          );
        }
      });
    } else {
      setCurrentPage(page);
      setIsPageTransitioning(false);
    }
  };

  const handleCategoryChange = (category: string) => {
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

        {/* Categories Filter - Horizontal rail */}
        <nav className="mb-8 md:mb-10 rounded-[1.5rem] border border-[var(--border)] bg-white/90 px-2 py-2 shadow-[0_10px_28px_rgba(26,46,26,0.05)] backdrop-blur" aria-label="Categorías de productos">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategoryRail('left')}
              disabled={!categoryScroll.canScrollLeft}
              className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Ver categorías anteriores"
            >
              <ChevronLeft size={18} />
            </button>

            <div ref={categoryRailRef} className="relative flex flex-nowrap items-center gap-1 overflow-x-auto scrollbar-hide px-1 pb-1 flex-1">
            <span
              className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-dark)_100%)] transition-all duration-300 ease-out"
              style={{
                left: `${categoryIndicator.left}px`,
                width: `${categoryIndicator.width}px`,
                opacity: categoryIndicator.width > 0 ? 1 : 0,
              }}
            />
            {categoryOptions.map((category) => {
              const normalizedId = normalizeCategoryKey(category.id);
              const Icon = categoryIcons[normalizedId] || LayoutGrid;
              const isActive = normalizeCategoryKey(currentCategory) === normalizedId;

              return (
                <button
                  key={category.id}
                  ref={(el) => {
                    categoryButtonRefs.current[normalizedId] = el;
                  }}
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-300",
                    isActive
                      ? "bg-[var(--background)] text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--primary)]"
                  )}
                >
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 shrink-0",
                    isActive ? "bg-white text-[var(--primary)]" : "bg-[var(--accent-light)]/60 text-[var(--primary)] group-hover:bg-[var(--accent-light)]"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span>{category.label}</span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors",
                    isActive ? "bg-white text-[var(--primary)]" : "bg-[var(--background)] text-[var(--muted)]"
                  )}>
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => scrollCategoryRail('right')}
            disabled={!categoryScroll.canScrollRight}
            className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Ver más categorías"
          >
            <ChevronRight size={18} />
          </button>
          </div>
        </nav>

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
        {isLoading ? (
          <div className="flex justify-center items-center py-16 md:py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 md:py-20">
            <p className="text-[var(--muted)] text-base md:text-lg">No se encontraron productos.</p>
          </div>
        ) : (
          <>
            <div 
              ref={productsGridRef}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
            >
              {paginatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 8} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav 
                className="flex flex-col items-center gap-3 mt-10 md:mt-14"
                aria-label="Paginación de productos"
              >
                {/* Pagination buttons - centered */}
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

                  {/* Page numbers */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {getPageNumbers().map((page, index) => (
                      typeof page === 'number' ? (
                        <button
                          key={index}
                          onClick={() => handlePageChange(page)}
                          className={cn(
                            "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-sm font-medium transition-all duration-300",
                            currentPage === page
                              ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 scale-110"
                              : "bg-white border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:shadow-md hover:scale-105"
                          )}
                          aria-label={`Ir a la página ${page}`}
                          aria-current={currentPage === page ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      ) : (
                        <span 
                          key={index} 
                          className="flex items-center justify-center w-6 h-8 sm:w-8 sm:h-10 text-[var(--muted)] text-sm"
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

                {/* Page info - below buttons */}
                <p className="text-sm text-[var(--muted)]">
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
