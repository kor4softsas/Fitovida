'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, Category, Order, CustomerInfo, PaymentMethod, PROMO_CODES } from '@/types';
import { generateOrderNumber } from './utils';

interface CartStore {
  // Cart state
  cart: CartItem[];
  isCartOpen: boolean;
  
  // Checkout state
  isCheckoutOpen: boolean;
  checkoutOrigin: { x: number; y: number } | null;
  discountCode: string;
  discountAmount: number;
  shippingCost: number;
  
  // Filter state
  currentCategory: Category;
  searchQuery: string;
  sortBy: 'default' | 'price-low' | 'price-high' | 'name';
  
  // Orders
  orders: Order[];
  
  // Cart actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, change: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  
  // Checkout actions
  openCheckout: (origin?: { x: number; y: number }) => void;
  closeCheckout: () => void;
  applyPromoCode: (code: string) => boolean;
  resetDiscount: () => void;
  
  // Filter actions
  setCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'default' | 'price-low' | 'price-high' | 'name') => void;
  
  // Order actions
  createOrder: (customer: CustomerInfo, paymentMethod: PaymentMethod, notes: string) => Order;
  
  // Computed
  getCartTotal: () => number;
  getCartCount: () => number;
  getSubtotal: () => number;
  getFinalTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: [],
      isCartOpen: false,
      isCheckoutOpen: false,
      checkoutOrigin: null,
      discountCode: '',
      discountAmount: 0,
      shippingCost: 15000, // COP
      currentCategory: 'todos',
      searchQuery: '',
      sortBy: 'default',
      orders: [],
      
      // Cart actions
      addToCart: (product) => set((state) => {
        const existingItem = state.cart.find(item => item.id === product.id);
        
        if (existingItem) {
          return {
            cart: state.cart.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          };
        }
        
        return {
          cart: [...state.cart, { ...product, quantity: 1 }]
        };
      }),
      
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== productId)
      })),
      
      updateQuantity: (productId, change) => set((state) => {
        const item = state.cart.find(item => item.id === productId);
        if (!item) return state;
        
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
          return {
            cart: state.cart.filter(item => item.id !== productId)
          };
        }
        
        return {
          cart: state.cart.map(item =>
            item.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        };
      }),
      
      clearCart: () => set({ cart: [], discountCode: '', discountAmount: 0 }),
      
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      
      // Checkout actions
      openCheckout: (origin) => set({ 
        isCheckoutOpen: true, 
        isCartOpen: false,
        checkoutOrigin: origin || null
      }),
      
      closeCheckout: () => set({ isCheckoutOpen: false, checkoutOrigin: null }),
      
      applyPromoCode: (code) => {
        const upperCode = code.toUpperCase();
        const discount = PROMO_CODES[upperCode];
        
        if (discount) {
          set({ discountCode: upperCode, discountAmount: discount });
          return true;
        }
        return false;
      },
      
      resetDiscount: () => set({ discountCode: '', discountAmount: 0 }),
      
      // Filter actions
      setCategory: (category) => set({ currentCategory: category }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setSortBy: (sort) => set({ sortBy: sort }),
      
      // Order actions
      createOrder: (customer, paymentMethod, notes) => {
        const state = get();
        const subtotal = state.getSubtotal();
        const discount = state.discountAmount > 100 
          ? state.discountAmount 
          : (subtotal * state.discountAmount) / 100;
        
        const order: Order = {
          orderNumber: generateOrderNumber(),
          customer,
          paymentMethod,
          notes,
          items: [...state.cart],
          subtotal,
          shipping: state.shippingCost,
          discount,
          discountCode: state.discountCode,
          total: subtotal + state.shippingCost - discount,
          date: new Date().toISOString(),
          status: 'pending'
        };
        
        set((state) => ({
          orders: [...state.orders, order],
          cart: [],
          discountCode: '',
          discountAmount: 0,
          isCheckoutOpen: false
        }));
        
        return order;
      },
      
      // Computed values
      getCartTotal: () => {
        const state = get();
        return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
      
      getCartCount: () => {
        const state = get();
        return state.cart.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getSubtotal: () => {
        const state = get();
        return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
      
      getFinalTotal: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        const discount = state.discountAmount > 100 
          ? state.discountAmount 
          : (subtotal * state.discountAmount) / 100;
        return subtotal + state.shippingCost - discount;
      }
    }),
    {
      name: 'fitovida-cart',
      partialize: (state) => ({ 
        cart: state.cart,
        orders: state.orders 
      })
    }
  )
);
