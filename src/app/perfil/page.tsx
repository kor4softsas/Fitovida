'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  User, Package, Settings, ChevronRight, Calendar, MapPin, Phone, Mail, 
  Edit2, Check, X, Loader2, ShoppingBag, Clock, AlertCircle, XCircle,
  ChevronDown, ChevronUp, CreditCard, Truck, CheckCircle2, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { ORDER_CANCELLATION_WINDOW_MS } from '@/types';
import gsap from 'gsap';

type Tab = 'perfil' | 'compras' | 'configuracion';

// Tipo para órdenes desde Supabase
interface OrderItem {
  id: string;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
}

interface DbOrder {
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
  order_items: OrderItem[];
}

type Tab = 'perfil' | 'compras' | 'configuracion';

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-700', icon: CreditCard },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const paymentMethodLabels = {
  card: 'Tarjeta de crédito/débito',
  pse: 'PSE - Transferencia bancaria',
  transfer: 'Transferencia manual',
};

// Calcular tiempo restante para cancelar
function getTimeRemaining(orderDate: string): { canCancel: boolean; timeString: string } {
  const orderTime = new Date(orderDate).getTime();
  const now = Date.now();
  const elapsed = now - orderTime;
  const remaining = ORDER_CANCELLATION_WINDOW_MS - elapsed;
  
  if (remaining <= 0) {
    return { canCancel: false, timeString: 'Tiempo expirado' };
  }
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return { 
    canCancel: true, 
    timeString: `${hours}h ${minutes}m restantes para cancelar` 
  };
}

// Componente para un pedido individual
function OrderCard({ order, onCancel }: { order: DbOrder; onCancel: (orderNumber: string, reason?: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  const timeRemaining = getTimeRemaining(order.created_at);
  
  // Verificar si se puede cancelar
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  const canCancel = cancellableStatuses.includes(order.status) && timeRemaining.canCancel;

  useEffect(() => {
    if (contentRef.current) {
      if (isExpanded) {
        gsap.to(contentRef.current, { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' });
      } else {
        gsap.to(contentRef.current, { height: 0, opacity: 0, duration: 0.2, ease: 'power2.in' });
      }
    }
  }, [isExpanded]);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--primary)]/30 transition-colors">
      {/* Header del pedido */}
      <div 
        className="p-4 cursor-pointer hover:bg-[var(--background)]/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-light)]/50 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">{order.order_number}</p>
              <p className="text-xs text-[var(--muted)]">
                {new Date(order.created_at).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5",
              status.color
            )}>
              <StatusIcon className={cn("h-3.5 w-3.5", order.status === 'processing' && "animate-spin")} />
              {status.label}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-[var(--muted)]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[var(--muted)]" />
            )}
          </div>
        </div>
        
        {/* Resumen rápido */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">
            {order.order_items.length} producto{order.order_items.length > 1 ? 's' : ''}
          </span>
          <span className="font-semibold text-[var(--foreground)]">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Contenido expandible */}
      <div ref={contentRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-4">
          {/* Productos */}
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Productos</h4>
          <div className="space-y-3 mb-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--background)] shrink-0">
                  {item.product_image ? (
                    <Image
                      src={item.product_image}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-[var(--muted)]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.product_name}</p>
                  <p className="text-xs text-[var(--muted)]">Cantidad: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Resumen de precios */}
          <div className="bg-[var(--background)] rounded-lg p-3 mb-4 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--muted)]">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Envío</span>
              <span>{formatPrice(order.shipping)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento {order.discount_code && `(${order.discount_code})`}</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Información de envío */}
          <div className="bg-[var(--background)] rounded-lg p-3 mb-4 text-sm">
            <h4 className="font-medium text-[var(--foreground)] mb-2">Información de envío</h4>
            <div className="space-y-1 text-[var(--muted)]">
              <p><span className="font-medium">Nombre:</span> {order.customer_name}</p>
              <p><span className="font-medium">Dirección:</span> {order.customer_address}, {order.customer_city} {order.customer_zip}</p>
              <p><span className="font-medium">Teléfono:</span> {order.customer_phone}</p>
              <p><span className="font-medium">Email:</span> {order.customer_email}</p>
            </div>
          </div>

          {/* Método de pago */}
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-4">
            <CreditCard className="h-4 w-4" />
            <span>{paymentMethodLabels[order.payment_method]}</span>
          </div>

          {/* Botón de cancelar */}
          {canCancel && order.status !== 'cancelled' && (
            <div className="border-t border-[var(--border)] pt-4">
              {!showCancelConfirm ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Clock className="h-4 w-4" />
                    <span>{timeRemaining.timeString}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowCancelConfirm(true); }}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Cancelar pedido
                  </button>
                </div>
              ) : (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm text-[var(--foreground)] font-medium">¿Estás seguro de cancelar este pedido?</p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Razón de cancelación (opcional)"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--background)] rounded-lg transition-colors"
                    >
                      No, mantener
                    </button>
                    <button
                      onClick={() => { onCancel(order.order_number, cancelReason); setShowCancelConfirm(false); }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      Sí, cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mensaje si ya no se puede cancelar */}
          {!canCancel && order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'shipped' && (
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-sm text-[var(--muted)] flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                El tiempo para cancelar este pedido ha expirado
              </p>
            </div>
          )}

          {/* Mensaje si fue cancelado */}
          {order.status === 'cancelled' && (
            <div className="border-t border-[var(--border)] pt-4">
              <div className="bg-red-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-red-700 mb-1">Pedido cancelado</p>
                {order.cancelled_at && (
                  <p className="text-red-600 text-xs">
                    Cancelado el {new Date(order.cancelled_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
                {order.cancellation_reason && (
                  <p className="text-red-600 text-xs mt-1">Razón: {order.cancellation_reason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: ''
  });
  const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estado para órdenes desde Supabase
  const [userOrders, setUserOrders] = useState<DbOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Función para cargar órdenes desde la API
  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingOrders(true);
    setOrdersError(null);
    
    try {
      const response = await fetch(`/api/orders?userId=${user.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error cargando órdenes');
      }
      
      setUserOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrdersError(error instanceof Error ? error.message : 'Error cargando órdenes');
    } finally {
      setLoadingOrders(false);
    }
  }, [user?.id]);

  // Cargar órdenes cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id, fetchOrders]);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/login');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleEdit = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: (user?.publicMetadata?.phone as string) || '',
      address: (user?.publicMetadata?.address as string) || '',
      city: (user?.publicMetadata?.city as string) || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = async (orderNumber: string, reason?: string) => {
    try {
      const response = await fetch(`/api/orders/${orderNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: reason || 'Cancelado por el usuario',
          userId: user?.id
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar el pedido');
      }
      
      setCancelMessage({ type: 'success', text: 'Pedido cancelado exitosamente' });
      // Recargar órdenes
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      setCancelMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error al cancelar el pedido' 
      });
    }
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => setCancelMessage(null), 5000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const tabs = [
    { id: 'perfil' as Tab, label: 'Mi perfil', icon: User },
    { id: 'compras' as Tab, label: 'Mis compras', icon: Package, count: userOrders.length },
    { id: 'configuracion' as Tab, label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)] pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold">
              {user?.firstName?.[0]?.toUpperCase() || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-[var(--muted)] text-sm">{user?.emailAddresses[0]?.emailAddress}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--accent-light)]/50 text-[var(--primary)] text-xs font-medium rounded-full">
                Cliente
              </span>
            </div>
          </div>
        </div>

        {/* Mensaje de cancelación */}
        {cancelMessage && (
          <div className={cn(
            "mb-6 p-4 rounded-xl flex items-center gap-3",
            cancelMessage.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            {cancelMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{cancelMessage.text}</span>
          </div>
        )}

        <div className="grid md:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-3 h-fit">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </div>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "px-2 py-0.5 text-xs rounded-full",
                      activeTab === tab.id ? "bg-white/20" : "bg-[var(--primary)]/10 text-[var(--primary)]"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6">
            {activeTab === 'perfil' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Información personal</h2>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Guardar
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Nombre</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    ) : (
                      <p className="text-[var(--foreground)] font-medium">{user?.firstName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Apellido</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    ) : (
                      <p className="text-[var(--foreground)] font-medium">{user?.lastName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Correo electrónico
                    </label>
                    <p className="text-[var(--foreground)] font-medium">{user?.emailAddresses[0]?.emailAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Miembro desde
                    </label>
                    <p className="text-[var(--foreground)] font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compras' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Historial de compras</h2>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-[var(--muted)]">
                      {userOrders.length} pedido{userOrders.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={fetchOrders}
                      disabled={loadingOrders}
                      className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] rounded-lg transition-colors"
                      title="Actualizar órdenes"
                    >
                      <RefreshCw className={cn("h-4 w-4", loadingOrders && "animate-spin")} />
                    </button>
                  </div>
                </div>
                
                {loadingOrders ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mx-auto mb-4" />
                    <p className="text-[var(--muted)]">Cargando tus pedidos...</p>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Error al cargar pedidos</h3>
                    <p className="text-[var(--muted)] mb-4">{ordersError}</p>
                    <button
                      onClick={fetchOrders}
                      className="px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium rounded-xl transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-[var(--muted)]/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Aún no tienes pedidos</h3>
                    <p className="text-[var(--muted)] mb-6">Cuando realices una compra, aparecerá aquí</p>
                    <button
                      onClick={() => router.push('/')}
                      className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium rounded-xl transition-colors"
                    >
                      Explorar productos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <OrderCard 
                        key={order.orderNumber} 
                        order={order} 
                        onCancel={handleCancelOrder}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'configuracion' && (
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">Configuración de cuenta</h2>
                
                <div className="space-y-4">
                  <button
                    className="w-full flex items-center justify-between p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-[var(--muted)]" />
                      <div className="text-left">
                        <p className="font-medium text-[var(--foreground)]">Cambiar correo electrónico</p>
                        <p className="text-sm text-[var(--muted)]">Actualiza tu dirección de correo</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--muted)]" />
                  </button>

                  <button
                    className="w-full flex items-center justify-between p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-[var(--muted)]" />
                      <div className="text-left">
                        <p className="font-medium text-[var(--foreground)]">Cambiar contraseña</p>
                        <p className="text-sm text-[var(--muted)]">Actualiza tu contraseña de acceso</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--muted)]" />
                  </button>

                  <div className="pt-6 border-t border-[var(--border)] space-y-4">
                    <button
                      onClick={handleSignOut}
                      className="w-full py-3 text-[var(--muted)] hover:text-[var(--foreground)] font-medium transition-colors"
                    >
                      Cerrar sesión
                    </button>
                    <button
                      className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                    >
                      Eliminar mi cuenta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
