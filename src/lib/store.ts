'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, Category, Order, CustomerInfo, PaymentMethod, PendingOrder, OrderStatus, PROMO_CODES, ORDER_CANCELLATION_WINDOW_MS } from '@/types';
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
  
  // Pending order (para guardar datos antes de redirigir a pasarela de pago)
  pendingOrder: PendingOrder | null;
  
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
  
  // Pending order actions
  setPendingOrder: (order: PendingOrder) => void;
  clearPendingOrder: () => void;
  
  // Filter actions
  setCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'default' | 'price-low' | 'price-high' | 'name') => void;
  
  // Order actions
  createOrder: (customer: CustomerInfo, paymentMethod: PaymentMethod, notes: string, userId?: string) => Order;
  createOrderFromPending: (paymentId?: string, paymentProvider?: 'stripe' | 'wompi' | 'none', userId?: string) => Order | null;
  updateOrderStatus: (orderNumber: string, status: OrderStatus, paymentId?: string) => void;
  getOrderByNumber: (orderNumber: string) => Order | undefined;
  getOrdersByUserId: (userId: string) => Order[];
  cancelOrder: (orderNumber: string, reason?: string) => { success: boolean; error?: string };
  canCancelOrder: (order: Order) => boolean;
  
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
      pendingOrder: null,
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
      
      // Pending order actions
      setPendingOrder: (order) => set({ pendingOrder: order }),
      
      clearPendingOrder: () => set({ pendingOrder: null }),
      
      // Filter actions
      setCategory: (category) => set({ currentCategory: category }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setSortBy: (sort) => set({ sortBy: sort }),
      
      // Order actions
      createOrder: (customer, paymentMethod, notes, userId) => {
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
          status: 'pending',
          paymentProvider: 'none',
          userId,
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
      
      // Crear orden desde pendingOrder (después del pago)
      createOrderFromPending: (paymentId, paymentProvider = 'none', userId) => {
        const state = get();
        const pending = state.pendingOrder;
        
        if (!pending) return null;
        
        const order: Order = {
          orderNumber: generateOrderNumber(),
          customer: pending.customer,
          paymentMethod: pending.paymentMethod,
          notes: pending.notes,
          items: [...pending.items],
          subtotal: pending.subtotal,
          shipping: pending.shipping,
          discount: pending.discount,
          discountCode: pending.discountCode,
          total: pending.total,
          date: new Date().toISOString(),
          status: paymentProvider !== 'none' ? 'paid' : 'pending',
          paymentId,
          paymentProvider,
          userId,
        };
        
        set((state) => ({
          orders: [...state.orders, order],
          cart: [],
          pendingOrder: null,
          discountCode: '',
          discountAmount: 0,
          isCheckoutOpen: false
        }));
        
        return order;
      },
      
      // Actualizar estado de una orden
      updateOrderStatus: (orderNumber, status, paymentId) => {
        set((state) => ({
          orders: state.orders.map(order => 
            order.orderNumber === orderNumber
              ? { ...order, status, ...(paymentId && { paymentId }) }
              : order
          )
        }));
      },
      
      // Buscar orden por número
      getOrderByNumber: (orderNumber) => {
        return get().orders.find(order => order.orderNumber === orderNumber);
      },
      
      // Obtener pedidos de un usuario específico
      getOrdersByUserId: (userId) => {
        return get().orders
          .filter(order => order.userId === userId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      
      // Verificar si un pedido puede ser cancelado
      canCancelOrder: (order) => {
        // No se puede cancelar si ya está enviado, entregado o cancelado
        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
          return false;
        }
        
        // Verificar si está dentro del tiempo límite de cancelación
        const orderDate = new Date(order.date).getTime();
        const now = Date.now();
        const timeSinceOrder = now - orderDate;
        
        return timeSinceOrder <= ORDER_CANCELLATION_WINDOW_MS;
      },
      
      // Cancelar un pedido
      cancelOrder: (orderNumber, reason) => {
        const state = get();
        const order = state.orders.find(o => o.orderNumber === orderNumber);
        
        if (!order) {
          return { success: false, error: 'Pedido no encontrado' };
        }
        
        if (!state.canCancelOrder(order)) {
          if (['shipped', 'delivered'].includes(order.status)) {
            return { success: false, error: 'No se puede cancelar un pedido que ya fue enviado o entregado' };
          }
          if (order.status === 'cancelled') {
            return { success: false, error: 'Este pedido ya fue cancelado' };
          }
          return { success: false, error: 'El tiempo límite para cancelar este pedido ha expirado (24 horas)' };
        }
        
        set((state) => ({
          orders: state.orders.map(o => 
            o.orderNumber === orderNumber
              ? { 
                  ...o, 
                  status: 'cancelled' as OrderStatus,
                  cancelledAt: new Date().toISOString(),
                  cancellationReason: reason || 'Cancelado por el usuario'
                }
              : o
          )
        }));
        
        return { success: true };
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
        orders: state.orders,
        pendingOrder: state.pendingOrder,
      })
    }
  )
);
