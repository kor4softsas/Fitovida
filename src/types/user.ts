export type UserRole = 'super_admin' | 'admin' | 'buyer';

// Permisos disponibles en el sistema
export type Permission = 
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete'
  | 'orders.view' | 'orders.create' | 'orders.edit' | 'orders.delete' | 'orders.cancel'
  | 'inventory.view' | 'inventory.edit' | 'inventory.adjust'
  | 'products.view' | 'products.create' | 'products.edit' | 'products.delete' | 'products.barcode'
  | 'costs.view' | 'costs.edit'
  | 'reports.view' | 'reports.export'
  | 'settings.view' | 'settings.edit';

// Permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.cancel',
    'inventory.view', 'inventory.edit', 'inventory.adjust',
    'products.view', 'products.create', 'products.edit', 'products.delete', 'products.barcode',
    'costs.view', 'costs.edit',
    'reports.view', 'reports.export',
    'settings.view', 'settings.edit',
  ],
  admin: [
    'orders.view', 'orders.edit',
    'inventory.view', 'inventory.edit',
    'products.view', 'products.edit',
    'reports.view',
  ],
  buyer: [],
};

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  createdAt: Date;
  isActive?: boolean;
}

export interface Purchase {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: {
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
}
