// Tipos generados para la base de datos Supabase
// Ejecutar el SQL en supabase/schema.sql para crear las tablas

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: number;
          name: string;
          description: string;
          price: number;
          original_price: number | null;
          image: string;
          category: string;
          stock: number;
          featured: boolean;
          discount: number | null;
          rating: number;
          reviews: number;
          benefits: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description: string;
          price: number;
          original_price?: number | null;
          image: string;
          category: string;
          stock?: number;
          featured?: boolean;
          discount?: number | null;
          rating?: number;
          reviews?: number;
          benefits?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string;
          price?: number;
          original_price?: number | null;
          image?: string;
          category?: string;
          stock?: number;
          featured?: boolean;
          discount?: number | null;
          rating?: number;
          reviews?: number;
          benefits?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          customer_address: string;
          customer_city: string;
          customer_zip: string;
          payment_method: 'card' | 'pse' | 'transfer';
          payment_id: string | null;
          payment_provider: 'stripe' | 'wompi' | null;
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          notes: string | null;
          subtotal: number;
          shipping: number;
          discount: number;
          discount_code: string | null;
          total: number;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          customer_address: string;
          customer_city: string;
          customer_zip: string;
          payment_method: 'card' | 'pse' | 'transfer';
          payment_id?: string | null;
          payment_provider?: 'stripe' | 'wompi' | null;
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          notes?: string | null;
          subtotal: number;
          shipping: number;
          discount?: number;
          discount_code?: string | null;
          total: number;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          customer_address?: string;
          customer_city?: string;
          customer_zip?: string;
          payment_method?: 'card' | 'pse' | 'transfer';
          payment_id?: string | null;
          payment_provider?: 'stripe' | 'wompi' | null;
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          notes?: string | null;
          subtotal?: number;
          shipping?: number;
          discount?: number;
          discount_code?: string | null;
          total?: number;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: number;
          product_name: string;
          product_image: string;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: number;
          product_name: string;
          product_image: string;
          quantity: number;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: number;
          product_name?: string;
          product_image?: string;
          quantity?: number;
          price?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      payment_method: 'card' | 'pse' | 'transfer';
      payment_provider: 'stripe' | 'wompi';
      order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    };
  };
};

// Tipos de ayuda
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

// Tipos específicos para uso en la aplicación
export type DbProduct = Tables<'products'>;
export type DbOrder = Tables<'orders'>;
export type DbOrderItem = Tables<'order_items'>;

export type DbOrderWithItems = DbOrder & {
  order_items: DbOrderItem[];
};
