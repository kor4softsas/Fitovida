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

export type PaymentMethod = 'card' | 'paypal' | 'transfer';

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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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
