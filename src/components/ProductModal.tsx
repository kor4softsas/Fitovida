'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/lib/store';
import { formatPrice, getCategoryName } from '@/lib/utils';
import gsap from 'gsap';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ProductModal({ product, isOpen, onClose, triggerRef }: ProductModalProps) {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCartStore();
  
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current && backdropRef.current && contentRef.current) {
      document.body.style.overflow = 'hidden';
      
      // Get trigger position for animation origin
      const triggerRect = triggerRef?.current?.getBoundingClientRect();
      
      // Animate backdrop
      gsap.fromTo(backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      
      // Animate modal from card position
      if (triggerRect) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const startX = triggerRect.left + triggerRect.width / 2 - centerX;
        const startY = triggerRect.top + triggerRect.height / 2 - centerY;
        
        gsap.fromTo(contentRef.current,
          { 
            opacity: 0,
            scale: 0.3,
            x: startX,
            y: startY,
            borderRadius: '24px'
          },
          { 
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            borderRadius: '24px',
            duration: 0.5,
            ease: 'power3.out'
          }
        );
      } else {
        gsap.fromTo(contentRef.current,
          { opacity: 0, scale: 0.9, y: 30 },
          { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
        );
      }
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, triggerRef]);

  const handleClose = () => {
    if (backdropRef.current && contentRef.current) {
      const triggerRect = triggerRef?.current?.getBoundingClientRect();
      
      // Animate out
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in'
      });
      
      if (triggerRect) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const endX = triggerRect.left + triggerRect.width / 2 - centerX;
        const endY = triggerRect.top + triggerRect.height / 2 - centerY;
        
        gsap.to(contentRef.current, {
          opacity: 0,
          scale: 0.3,
          x: endX,
          y: endY,
          duration: 0.35,
          ease: 'power3.in',
          onComplete: onClose
        });
      } else {
        gsap.to(contentRef.current, {
          opacity: 0,
          scale: 0.9,
          y: 20,
          duration: 0.25,
          ease: 'power3.in',
          onComplete: onClose
        });
      }
    } else {
      onClose();
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setQuantity(1);
      handleClose();
    }, 800);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
      />
      
      {/* Modal */}
      <div 
        ref={contentRef}
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2.5 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        >
          <X className="h-5 w-5 text-[var(--foreground)]" />
        </button>

        <div className="flex flex-col md:flex-row max-h-[85vh]">
          {/* Image */}
          <div className="relative w-full md:w-1/2 aspect-square bg-gradient-to-br from-[var(--background)] to-[var(--accent-light)]/30 flex-shrink-0">
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                <span className="text-[var(--primary)] text-center font-semibold text-xl">
                  {product.name}
                </span>
              </div>
            ) : (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-6"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </div>

          {/* Content */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
            <span className="inline-block px-3 py-1.5 text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 rounded-full mb-4 w-fit">
              {getCategoryName(product.category)}
            </span>
            
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
              {product.name}
            </h2>
            
            <p className="text-3xl font-bold text-[var(--primary)] mb-6">
              {formatPrice(product.price)}
            </p>
            
            <p className="text-[var(--muted)] leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-[var(--foreground)]">Cantidad:</span>
              <div className="flex items-center gap-2 bg-[var(--background)] rounded-full p-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                >
                  <Minus className="h-4 w-4 text-[var(--foreground)]" />
                </button>
                <span className="w-8 text-center font-semibold text-[var(--foreground)]">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                >
                  <Plus className="h-4 w-4 text-[var(--foreground)]" />
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-4 border-t border-[var(--border)] mb-6">
              <span className="text-[var(--muted)]">Total:</span>
              <span className="text-2xl font-bold text-[var(--foreground)]">
                {formatPrice(product.price * quantity)}
              </span>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={added}
              className={`flex items-center justify-center gap-2 w-full py-4 font-medium rounded-full transition-all duration-300 ${
                added 
                  ? 'bg-green-500 text-white' 
                  : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white hover:shadow-lg hover:shadow-[var(--primary)]/25'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" />
                  ¡Agregado!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Agregar al carrito
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}
