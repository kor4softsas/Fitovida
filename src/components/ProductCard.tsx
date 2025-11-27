'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/lib/store';
import { formatPrice, truncateText, getCategoryName } from '@/lib/utils';
import ProductModal from './ProductModal';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div 
        ref={cardRef}
        className="group bg-white rounded-xl sm:rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all duration-300 overflow-hidden"
      >
        {/* Image */}
        <div 
          className="relative aspect-square overflow-hidden cursor-pointer bg-[var(--background)]"
          onClick={handleOpenModal}
        >
          {imageError ? (
            <div className="w-full h-full bg-[var(--accent-light)]/30 flex items-center justify-center p-2">
              <span className="text-[var(--primary)] text-center font-medium text-xs sm:text-sm">
                {product.name}
              </span>
            </div>
          ) : (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
          
          {/* Overlay on hover - Hidden on mobile for better touch */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 hidden sm:flex items-end justify-center pb-3">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium text-[var(--foreground)] flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              Ver detalles
            </span>
          </div>
        </div>

        {/* Content - Compact on mobile */}
        <div className="p-3 sm:p-4">
          <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 rounded-full mb-1.5 sm:mb-2">
            {getCategoryName(product.category)}
          </span>
          
          <h3 className="font-semibold text-sm sm:text-base text-[var(--foreground)] mb-1 line-clamp-1">
            {product.name}
          </h3>
          
          {/* Description hidden on mobile for cleaner look */}
          <p className="hidden sm:block text-[var(--muted)] text-sm mb-3 line-clamp-2 leading-relaxed">
            {truncateText(product.description, 60)}
          </p>

          {/* Price and button - Stack on very small screens */}
          <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-[var(--border)] gap-2">
            <span className="text-base sm:text-lg font-bold text-[var(--primary)]">
              {formatPrice(product.price)}
            </span>
            
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center p-2 sm:px-3 sm:py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-full transition-all duration-200"
              aria-label="Agregar al carrito"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden md:inline ml-1.5">Agregar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Modal with GSAP animation */}
      <ProductModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        triggerRef={cardRef}
      />
    </>
  );
}
