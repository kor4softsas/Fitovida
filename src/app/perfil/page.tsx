'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, Package, Settings, ChevronRight, Calendar, MapPin, Phone, Mail, 
  Edit2, Check, X, Loader2, ShoppingBag, Clock, AlertCircle, XCircle,
  ChevronDown, ChevronUp, CreditCard, Truck, CheckCircle2, RefreshCw,
  Plus, Star, Trash2, Home, LogOut, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { ORDER_CANCELLATION_WINDOW_MS } from '@/types';
import { useAuthStore, UserAddress } from '@/lib/auth';
import { useCartStore } from '@/lib/store';
import { departments, getCitiesByDepartment } from '@/lib/colombiaData';
import gsap from 'gsap';

type Tab = 'perfil' | 'direcciones' | 'compras' | 'configuracion';

// Tipo para órdenes locales del store
interface LocalOrder {
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
  };
  paymentMethod: 'card' | 'pse' | 'transfer' | 'cash_on_delivery';
  notes: string;
  items: {
    id: number;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
  discountCode: string;
  total: number;
  date: string;
  status: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  paymentId?: string;
  paymentProvider?: 'stripe' | 'wompi' | 'none';
  userId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

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
  cash_on_delivery: 'Pago contra entrega',
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

// Componente de mensaje de error con animación
const ErrorMessage = ({ message }: { message?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isVisible = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    gsap.killTweensOf([container, content]);

    if (message && !isVisible.current) {
      isVisible.current = true;
      gsap.set(container, { height: 0, opacity: 0, overflow: 'hidden' });
      gsap.set(content, { y: -8, opacity: 0 });
      gsap.to(container, { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(content, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', delay: 0.05 });
    } 
    else if (!message && isVisible.current) {
      isVisible.current = false;
      gsap.to(content, { y: -8, opacity: 0, duration: 0.15, ease: 'power2.in' });
      gsap.to(container, { height: 0, opacity: 0, duration: 0.2, ease: 'power2.in', delay: 0.05 });
    }
  }, [message]);

  return (
    <div ref={containerRef} style={{ height: 0, opacity: 0, overflow: 'hidden' }}>
      <div ref={contentRef} className="flex items-center gap-1.5 text-red-500 text-xs pt-1" style={{ opacity: 0, transform: 'translateY(-8px)' }}>
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>{message || ''}</span>
      </div>
    </div>
  );
};

// Modal para agregar/editar dirección con animación
function AddressModal({ 
  address,
  onSave, 
  onClose,
  triggerRect
}: { 
  address?: UserAddress;
  onSave: (data: Omit<UserAddress, 'id'>) => void; 
  onClose: () => void;
  triggerRect?: DOMRect | null;
}) {
  const [formData, setFormData] = useState({
    label: address?.label || '',
    address: address?.address || '',
    city: address?.city || '',
    department: address?.department || '',
    zipCode: address?.zipCode || '',
    phone: address?.phone || '',
    instructions: address?.instructions || '',
    isDefault: address?.isDefault || false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableCities, setAvailableCities] = useState<string[]>(
    formData.department ? getCitiesByDepartment(formData.department) : []
  );
  
  // Update cities when department changes
  const handleDepartmentChange = (department: string) => {
    setFormData(prev => ({ ...prev, department, city: '' }));
    setAvailableCities(getCitiesByDepartment(department));
    if (errors.department) {
      setErrors(prev => ({ ...prev, department: '' }));
    }
  };
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);
  
  // Animación de entrada
  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay || !content) return;
    
    document.body.style.overflow = 'hidden';
    
    // Animate overlay
    gsap.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    
    // Animate content from trigger position
    if (triggerRect) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const startX = triggerRect.left + triggerRect.width / 2 - centerX;
      const startY = triggerRect.top + triggerRect.height / 2 - centerY;
      
      gsap.fromTo(content,
        { 
          opacity: 0,
          scale: 0.3,
          x: startX,
          y: startY,
        },
        { 
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
          duration: 0.4,
          ease: 'power3.out'
        }
      );
    } else {
      gsap.fromTo(content,
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      );
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [triggerRect]);
  
  // Animación de cierre
  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    
    const overlay = overlayRef.current;
    const content = contentRef.current;
    
    if (overlay && content) {
      gsap.to(content, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.25,
        ease: 'power2.in'
      });
      
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          document.body.style.overflow = 'auto';
          onClose();
        }
      });
    } else {
      onClose();
    }
  };
  
  const validateField = (name: string, value: string) => {
    if (!value.trim() && ['label', 'address', 'city', 'department', 'zipCode', 'phone'].includes(name)) {
      return 'Este campo es obligatorio';
    }
    if (name === 'phone' && value && !/^\d{7,}$/.test(value.replace(/\s/g, ''))) {
      return 'Ingresa un número válido';
    }
    return '';
  };
  
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleBlur = (name: string, value: string) => {
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'instructions' && key !== 'isDefault') {
        const error = validateField(key, value as string);
        if (error) newErrors[key] = error;
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(formData);
  };



  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
        style={{ opacity: 0 }}
      />
      
      {/* Modal Content */}
      <div 
        ref={contentRef}
        className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        style={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--primary)]/10 rounded-xl">
              <MapPin className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {address ? 'Editar dirección' : 'Nueva dirección'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--background)] rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-[var(--muted)]" />
          </button>
        </div>
        
        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4">
            {/* Etiqueta */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Etiqueta
              </label>
              <div className="relative group">
                <Star className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                  errors.label ? "text-red-400" : "text-[var(--muted)] group-focus-within:text-[var(--primary)]"
                )} />
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => handleInputChange('label', e.target.value)}
                  onBlur={(e) => handleBlur('label', e.target.value)}
                  placeholder="Ej: Casa, Oficina, Trabajo"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-sm",
                    errors.label 
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                      : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                  )}
                />
              </div>
              <ErrorMessage message={errors.label} />
            </div>
            
            {/* Dirección completa */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Dirección completa
              </label>
              <div className="relative group">
                <MapPin className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                  errors.address ? "text-red-400" : "text-[var(--muted)] group-focus-within:text-[var(--primary)]"
                )} />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onBlur={(e) => handleBlur('address', e.target.value)}
                  placeholder="Calle 123 #45-67, Apto 101"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-sm",
                    errors.address 
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                      : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                  )}
                />
              </div>
              <ErrorMessage message={errors.address} />
            </div>
            
            {/* Departamento y Ciudad - Grid responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Departamento
                </label>
                <div className="relative group">
                  <Building2 className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors pointer-events-none z-10",
                    errors.department ? "text-red-400" : "text-[var(--muted)] group-focus-within:text-[var(--primary)]"
                  )} />
                  <select
                    value={formData.department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    onBlur={(e) => handleBlur('department', e.target.value)}
                    className={cn(
                      "w-full pl-10 pr-10 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] text-sm appearance-none cursor-pointer",
                      errors.department 
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                        : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    )}
                  >
                    <option value="">Selecciona un departamento</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)] pointer-events-none" />
                </div>
                <ErrorMessage message={errors.department} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Ciudad
                </label>
                <div className="relative group">
                  <MapPin className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors pointer-events-none z-10",
                    !formData.department ? "text-[var(--muted)]/50" :
                    errors.city ? "text-red-400" : "text-[var(--muted)] group-focus-within:text-[var(--primary)]"
                  )} />
                  <select
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    onBlur={(e) => handleBlur('city', e.target.value)}
                    disabled={!formData.department}
                    className={cn(
                      "w-full pl-10 pr-10 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] text-sm appearance-none",
                      !formData.department ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                      errors.city 
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                        : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    )}
                  >
                    <option value="">{formData.department ? 'Selecciona una ciudad' : 'Primero selecciona un departamento'}</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <ChevronDown className={cn(
                    "absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors",
                    !formData.department ? "text-[var(--muted)]/50" : "text-[var(--muted)]"
                  )} />
                </div>
                <ErrorMessage message={errors.city} />
              </div>
            </div>
            
            {/* Código postal y Teléfono - Grid responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Código postal
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  onBlur={(e) => handleBlur('zipCode', e.target.value)}
                  placeholder="110111"
                  className={cn(
                    "w-full px-4 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-sm",
                    errors.zipCode 
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                      : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                  )}
                />
                <ErrorMessage message={errors.zipCode} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Teléfono de contacto
                </label>
                <div className="relative group">
                  <Phone className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                    errors.phone ? "text-red-400" : "text-[var(--muted)] group-focus-within:text-[var(--primary)]"
                  )} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onBlur={(e) => handleBlur('phone', e.target.value)}
                    placeholder="3001234567"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-sm",
                      errors.phone 
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                        : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    )}
                  />
                </div>
                <ErrorMessage message={errors.phone} />
              </div>
            </div>
            
            {/* Instrucciones */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Instrucciones de entrega <span className="text-[var(--muted)]">(opcional)</span>
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Timbre del apartamento 101, dejar con el portero..."
                rows={2}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-sm resize-none transition-all"
              />
            </div>
            
            {/* Checkbox estilizado */}
            <label className="flex items-center gap-3 cursor-pointer group py-2">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                  formData.isDefault 
                    ? "bg-[var(--primary)] border-[var(--primary)]" 
                    : "bg-white border-[var(--border)] group-hover:border-[var(--primary)]/50"
                )}>
                  {formData.isDefault && (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  )}
                </div>
              </div>
              <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                Establecer como dirección predeterminada
              </span>
            </label>
          </div>
        </form>
        
        {/* Footer with Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 p-4 sm:p-6 border-t border-[var(--border)] bg-[var(--background)]/50">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-xl hover:bg-[var(--background)] transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 px-4 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:shadow-[var(--primary)]/30"
          >
            {address ? 'Guardar cambios' : 'Agregar dirección'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para un pedido individual
function OrderCard({ order, onCancel }: { order: LocalOrder; onCancel: (orderNumber: string, reason?: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  const timeRemaining = getTimeRemaining(order.date);
  
  // Verificar si se puede cancelar
  const cancellableStatuses = ['pending', 'processing'];
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
              <p className="font-semibold text-[var(--foreground)]">{order.orderNumber}</p>
              <p className="text-xs text-[var(--muted)]">
                {new Date(order.date).toLocaleDateString('es-CO', {
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
            {order.items.length} producto{order.items.length > 1 ? 's' : ''}
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
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--background)] shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
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
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.name}</p>
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
                <span>Descuento {order.discountCode && `(${order.discountCode})`}</span>
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
              <p><span className="font-medium">Nombre:</span> {order.customer.name}</p>
              <p><span className="font-medium">Dirección:</span> {order.customer.address}, {order.customer.city} {order.customer.zip}</p>
              <p><span className="font-medium">Teléfono:</span> {order.customer.phone}</p>
              <p><span className="font-medium">Email:</span> {order.customer.email}</p>
            </div>
          </div>

          {/* Método de pago */}
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-4">
            <CreditCard className="h-4 w-4" />
            <span>{paymentMethodLabels[order.paymentMethod]}</span>
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
                      onClick={() => { onCancel(order.orderNumber, cancelReason); setShowCancelConfirm(false); }}
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
                {order.cancelledAt && (
                  <p className="text-red-600 text-xs">
                    Cancelado el {new Date(order.cancelledAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
                {order.cancellationReason && (
                  <p className="text-red-600 text-xs mt-1">Razón: {order.cancellationReason}</p>
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
  const { user, isAuthenticated, logout, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuthStore();
  const { getOrdersByUserId, cancelOrder } = useCartStore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Direcciones
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | undefined>(undefined);
  const [addressModalTriggerRect, setAddressModalTriggerRect] = useState<DOMRect | null>(null);
  
  // Función para abrir el modal de dirección con animación
  const openAddressModal = (e: React.MouseEvent, address?: UserAddress) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAddressModalTriggerRect(rect);
    setEditingAddress(address);
    setShowAddressModal(true);
  };
  
  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditingAddress(undefined);
    setAddressModalTriggerRect(null);
  };
  
  // Órdenes del usuario
  const userOrders = user?.id ? getOrdersByUserId(user.id) : [];

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Cargar datos del formulario
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      });
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const handleEdit = () => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 500));
    updateProfile(formData);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCancelOrder = (orderNumber: string, reason?: string) => {
    const result = cancelOrder(orderNumber, reason);
    if (result.success) {
      setCancelMessage({ type: 'success', text: 'Pedido cancelado exitosamente' });
    } else {
      setCancelMessage({ type: 'error', text: result.error || 'Error al cancelar el pedido' });
    }
    setTimeout(() => setCancelMessage(null), 5000);
  };

  const handleAddAddress = (data: Omit<UserAddress, 'id'>) => {
    addAddress(data);
    setShowAddressModal(false);
    setEditingAddress(undefined);
  };

  const handleEditAddress = (data: Omit<UserAddress, 'id'>) => {
    if (editingAddress) {
      updateAddress(editingAddress.id, data);
    }
    setShowAddressModal(false);
    setEditingAddress(undefined);
  };

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const tabs = [
    { id: 'perfil' as Tab, label: 'Mi perfil', icon: User },
    { id: 'direcciones' as Tab, label: 'Direcciones', icon: MapPin, count: user.addresses.length },
    { id: 'compras' as Tab, label: 'Mis compras', icon: Package, count: userOrders.length },
    { id: 'configuracion' as Tab, label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)] pt-24 pb-12">
      {/* Modal de dirección con animación */}
      {showAddressModal && (
        <AddressModal
          address={editingAddress}
          onSave={editingAddress ? handleEditAddress : handleAddAddress}
          onClose={closeAddressModal}
          triggerRect={addressModalTriggerRect}
        />
      )}

      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold">
              {user.firstName[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-[var(--muted)] text-sm">{user.email}</p>
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
            {/* Pestaña Perfil */}
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
                      <p className="text-[var(--foreground)] font-medium">{user.firstName || '-'}</p>
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
                      <p className="text-[var(--foreground)] font-medium">{user.lastName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Correo electrónico
                    </label>
                    <p className="text-[var(--foreground)] font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Teléfono
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    ) : (
                      <p className="text-[var(--foreground)] font-medium">{user.phone || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Miembro desde
                    </label>
                    <p className="text-[var(--foreground)] font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña Direcciones */}
            {activeTab === 'direcciones' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Mis direcciones</h2>
                  <button
                    onClick={(e) => openAddressModal(e)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar dirección
                  </button>
                </div>

                {user.addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-[var(--muted)]/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No tienes direcciones guardadas</h3>
                    <p className="text-[var(--muted)] mb-6">Agrega una dirección para facilitar tus próximas compras</p>
                    <button
                      onClick={(e) => openAddressModal(e)}
                      className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium rounded-xl transition-colors"
                    >
                      Agregar primera dirección
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-[var(--foreground)]">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded-full flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  Predeterminada
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[var(--foreground)]">{addr.address}</p>
                            <p className="text-sm text-[var(--muted)]">{addr.city}, {addr.department} - {addr.zipCode}</p>
                            <p className="text-sm text-[var(--muted)]">Tel: {addr.phone}</p>
                            {addr.instructions && (
                              <p className="text-xs text-[var(--muted)] mt-2 italic">&quot;{addr.instructions}&quot;</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!addr.isDefault && (
                              <button
                                onClick={() => setDefaultAddress(addr.id)}
                                className="p-2 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-lg transition-colors"
                                title="Establecer como predeterminada"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => openAddressModal(e, addr)}
                              className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] rounded-lg transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {!addr.isDefault && (
                              <button
                                onClick={() => deleteAddress(addr.id)}
                                className="p-2 text-[var(--muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pestaña Compras */}
            {activeTab === 'compras' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Historial de compras</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {userOrders.length} pedido{userOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-[var(--muted)]/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Aún no tienes pedidos</h3>
                    <p className="text-[var(--muted)] mb-6">Cuando realices una compra, aparecerá aquí</p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium rounded-xl transition-colors"
                    >
                      <Home className="h-5 w-5" />
                      Explorar productos
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <OrderCard 
                        key={order.orderNumber} 
                        order={order as LocalOrder} 
                        onCancel={handleCancelOrder}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pestaña Configuración */}
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
                      className="w-full flex items-center justify-center gap-2 py-3 text-[var(--muted)] hover:text-[var(--foreground)] font-medium transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
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
