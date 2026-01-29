// Tipos para el panel de administración

// ============= VENTAS =============
export interface Sale {
  id: string;
  saleNumber: string; // Número consecutivo de venta
  date: Date;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDocument?: string; // NIT o CC para futura facturación DIAN
  items: SaleItem[];
  subtotal: number;
  tax: number; // IVA
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'pse' | 'wompi';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  // Campos para futura integración con DIAN
  invoiceNumber?: string;
  invoiceCUFE?: string; // Código Único de Facturación Electrónica
  invoiceDate?: Date;
  invoiceStatus?: 'pending' | 'authorized' | 'rejected';
  createdBy: string; // ID del usuario que registró la venta
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number; // IVA por item
  subtotal: number;
  total: number;
}

// ============= INVENTARIO =============
export interface InventoryProduct {
  id: string;
  name: string;
  sku?: string;
  category: string;
  description?: string;
  currentStock: number;
  minStock: number; // Alerta de stock mínimo
  maxStock?: number;
  unitCost: number; // Costo de compra
  salePrice: number; // Precio de venta
  taxRate: number; // Tasa de IVA (0, 5, 19)
  status: 'active' | 'inactive' | 'discontinued';
  supplier?: string;
  barcode?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  totalCost?: number;
  reason: string; // 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | 'transfer'
  reference?: string; // Número de compra, venta, etc.
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

// ============= INGRESOS Y GASTOS =============
export interface Income {
  id: string;
  date: Date;
  amount: number;
  category: 'sales' | 'services' | 'other';
  description: string;
  reference?: string; // Número de venta, factura, etc.
  paymentMethod: 'cash' | 'card' | 'transfer' | 'pse' | 'wompi';
  status: 'received' | 'pending';
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  date: Date;
  amount: number;
  category: 'inventory' | 'services' | 'salaries' | 'rent' | 'utilities' | 'marketing' | 'other';
  description: string;
  supplier?: string;
  reference?: string; // Número de factura
  paymentMethod: 'cash' | 'card' | 'transfer';
  status: 'paid' | 'pending';
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

// ============= DASHBOARD =============
export interface DashboardStats {
  sales: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  finances: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  };
}

// ============= FILTROS Y BÚSQUEDA =============
export interface SalesFilter {
  startDate?: Date;
  endDate?: Date;
  status?: Sale['status'];
  paymentMethod?: Sale['paymentMethod'];
  customerName?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface InventoryFilter {
  category?: string;
  status?: InventoryProduct['status'];
  lowStock?: boolean;
  search?: string;
}

export interface FinancesFilter {
  startDate?: Date;
  endDate?: Date;
  category?: Income['category'] | Expense['category'];
  status?: 'received' | 'pending' | 'paid';
}
