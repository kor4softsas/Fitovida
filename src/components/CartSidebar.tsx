'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice, cn } from '@/lib/utils';

export default function CartSidebar() {
  const { 
    cart, 
    isCartOpen, 
    toggleCart, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal,
    openCheckout 
  } = useCartStore();
  
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const checkoutButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isCartOpen]);

  const handleImageError = (id: number) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const handleCheckout = () => {
    if (cart.length > 0 && checkoutButtonRef.current) {
      const rect = checkoutButtonRef.current.getBoundingClientRect();
      const origin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      openCheckout(origin);
    }
  };

  return (
    <>
      {/* Overlay - z-[60] to cover navbar which is z-50 */}
      <div
        className={cn(
          "fixed inset-0 bg-[var(--foreground)]/30 backdrop-blur-sm z-[60] transition-opacity duration-300",
          isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleCart}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-[70] transition-transform duration-300 flex flex-col border-l border-[var(--border)]",
          isCartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Carrito</h3>
          <button
            onClick={toggleCart}
            className="p-2 hover:bg-[var(--background)] rounded-xl transition-colors"
          >
            <X className="h-4 w-4 text-[var(--muted)]" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--muted)]">
              <ShoppingBag className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border)]"
                >
                  {/* Image */}
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                    {imageErrors[item.id] ? (
                      <div className="w-full h-full bg-[var(--accent-light)]/30 flex items-center justify-center">
                        <span className="text-[var(--primary)] text-[10px] text-center px-1">
                          {item.name}
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={() => handleImageError(item.id)}
                        sizes="64px"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--foreground)] text-sm truncate">
                      {item.name}
                    </h4>
                    <p className="text-[var(--primary)] font-semibold text-sm">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--accent-light)]/30 transition-colors"
                      >
                        <Minus className="h-3 w-3 text-[var(--muted)]" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-[var(--foreground)]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 bg-white border border-[var(--border)] rounded-lg hover:bg-[var(--accent-light)]/30 transition-colors"
                      >
                        <Plus className="h-3 w-3 text-[var(--muted)]" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-[var(--border)] p-5 space-y-4 bg-[var(--background)]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Total:</span>
              <span className="text-xl font-bold text-[var(--primary)]">{formatPrice(getCartTotal())}</span>
            </div>
            <button
              ref={checkoutButtonRef}
              onClick={handleCheckout}
              className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium rounded-xl transition-all duration-200"
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}
