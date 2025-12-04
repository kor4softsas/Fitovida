// Tipos para el e-commerce Fitovida

export interface Product {
  id: number;
  name: string;
  category: Category;
  price: number;
  image: string;
  description: string;
}

export type Category = 
  | 'todos'
  | 'vitaminas' 
  | 'suplementos' 
  | 'hierbas' 
  | 'aceites' 
  | 'proteinas';

export interface CartItem extends Product {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
}

// Métodos de pago disponibles
export type PaymentMethod = 'card' | 'pse' | 'transfer' | 'cash_on_delivery';

export type OrderStatus = 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'failed';

// Tiempo máximo para cancelar un pedido (en milisegundos) - 24 horas
export const ORDER_CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface Order {
  orderNumber: string;
  customer: CustomerInfo;
  paymentMethod: PaymentMethod;
  notes: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode: string;
  total: number;
  date: string;
  status: OrderStatus;
  // Campos adicionales para pagos
  paymentId?: string; // Stripe PaymentIntent ID o Wompi Transaction ID
  paymentProvider?: 'stripe' | 'wompi' | 'none';
  // Campo para vincular con usuario autenticado
  userId?: string; // Clerk user ID
  // Fecha de cancelación (si aplica)
  cancelledAt?: string;
  cancellationReason?: string;
}

// Para guardar datos del pedido antes de redirigir al checkout
export interface PendingOrder {
  customer: CustomerInfo;
  paymentMethod: PaymentMethod;
  notes: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode: string;
  total: number;
}

// Tipos para Wompi PSE
export interface WompiBank {
  financial_institution_code: string;
  financial_institution_name: string;
}

export type PersonType = 'natural' | 'juridica';

export interface PSEPaymentData {
  bank: string;
  personType: PersonType;
  documentType: string;
  documentNumber: string;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'todos', name: 'Todos', icon: 'LayoutGrid' },
  { id: 'vitaminas', name: 'Vitaminas', icon: 'Pill' },
  { id: 'suplementos', name: 'Suplementos', icon: 'Capsule' },
  { id: 'hierbas', name: 'Hierbas', icon: 'Leaf' },
  { id: 'aceites', name: 'Aceites', icon: 'Droplet' },
  { id: 'proteinas', name: 'Proteínas', icon: 'Dumbbell' },
];

export const PROMO_CODES: Record<string, number> = {
  'FITOVIDA10': 10,
  'BIENVENIDO': 5,
  'NATURAL20': 20,
};
