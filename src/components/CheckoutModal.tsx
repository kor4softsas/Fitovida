'use client';

import { useEffect, useState, useRef, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  X, User, CreditCard, ShoppingBag, Lock, Check, AlertCircle, 
  Building2, LogIn, MapPin, Plus, Truck, Edit2, Trash2, Star, Phone, ChevronDown
} from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useAuthStore, UserAddress } from '@/lib/auth';
import { formatPrice, cn } from '@/lib/utils';
import { CustomerInfo, PaymentMethod } from '@/types';
import { departments, getCitiesByDepartment } from '@/lib/colombiaData';
import gsap from 'gsap';

// Error message component with GSAP animation
const ErrorMessage = memo(({ message }: { message?: string }) => {
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
});
ErrorMessage.displayName = 'ErrorMessage';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
}

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

export default function CheckoutModal() {
  const {
    cart,
    isCheckoutOpen,
    checkoutOrigin,
    closeCheckout,
    shippingCost,
    discountCode,
    discountAmount,
    getSubtotal,
    getFinalTotal,
    applyPromoCode,
    resetDiscount,
    createOrder,
    setPendingOrder
  } = useCartStore();
  
  const { user, isAuthenticated, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [notes, setNotes] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | undefined>(undefined);
  const [addressModalTriggerRect, setAddressModalTriggerRect] = useState<DOMRect | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const successModalRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // Función para abrir el modal de dirección con animación
  const openAddressModal = (e: React.MouseEvent, address?: UserAddress) => {
    e.stopPropagation();
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

  // Cargar datos del usuario si está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone || prev.phone,
      }));
      
      // Seleccionar dirección predeterminada
      const defaultAddress = user.addresses.find(a => a.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setFormData(prev => ({
          ...prev,
          address: defaultAddress.address,
          city: defaultAddress.city,
          zip: defaultAddress.zipCode,
        }));
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isCheckoutOpen && !isClosing) {
      document.body.style.overflow = 'hidden';
      
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
      if (modalRef.current) {
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;
        
        let startX = 0;
        let startY = 0;
        
        if (checkoutOrigin) {
          startX = checkoutOrigin.x - viewportCenterX;
          startY = checkoutOrigin.y - viewportCenterY;
        }
        
        gsap.fromTo(modalRef.current,
          { scale: 0.4, opacity: 0, x: startX, y: startY },
          { scale: 1, opacity: 1, x: 0, y: 0, duration: 0.4, ease: 'power3.out' }
        );
      }
    } else if (!isCheckoutOpen) {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isCheckoutOpen, isClosing, checkoutOrigin]);

  const handleClose = () => {
    if (modalRef.current && overlayRef.current) {
      setIsClosing(true);
      
      gsap.to(modalRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 30,
        duration: 0.3,
        ease: 'power2.in'
      });
      
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setIsClosing(false);
          closeCheckout();
        }
      });
    } else {
      closeCheckout();
    }
  };

  useEffect(() => {
    if (showSuccess && successModalRef.current) {
      gsap.fromTo(successModalRef.current,
        { scale: 0.95, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [showSuccess]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'El nombre es obligatorio';
        if (value.trim().length < 3) return 'Mínimo 3 caracteres';
        return undefined;
      case 'email':
        if (!value) return 'El correo es obligatorio';
        if (!value.includes('@')) return 'Incluye un @ en el correo';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Formato de correo inválido';
        return undefined;
      case 'phone':
        if (!value) return 'El teléfono es obligatorio';
        if (!/^\d{7,}$/.test(value.replace(/\s/g, ''))) return 'Ingresa un número válido';
        return undefined;
      case 'address':
        if (!value.trim()) return 'La dirección es obligatoria';
        return undefined;
      case 'city':
        if (!value.trim()) return 'La ciudad es obligatoria';
        return undefined;
      case 'zip':
        if (!value.trim()) return 'El código postal es obligatorio';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    const currentError = errors[name as keyof FormErrors];
    
    if (error !== currentError) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof CustomerInfo]);
      if (error) newErrors[key as keyof FormErrors] = error;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyPromo = () => {
    if (promoInput.trim()) {
      const success = applyPromoCode(promoInput);
      if (!success) {
        alert('Código de descuento inválido');
      }
    }
  };

  const handleSelectAddress = (address: UserAddress) => {
    setSelectedAddressId(address.id);
    setFormData(prev => ({
      ...prev,
      address: address.address,
      city: address.city,
      zip: address.zipCode,
      phone: address.phone || prev.phone,
    }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Calcular valores para el pending order
    const subtotal = getSubtotal();
    const discount = discountAmount > 100 ? discountAmount : (subtotal * discountAmount) / 100;
    
    // Ajustar costo de envío para pago contra entrega
    const finalShipping = paymentMethod === 'cash_on_delivery' ? shippingCost + 5000 : shippingCost;
    const total = subtotal + finalShipping - discount;
    
    // Si el método de pago es tarjeta, redirigir a la página de checkout
    if (paymentMethod === 'card') {
      setPendingOrder({
        customer: formData,
        paymentMethod,
        notes,
        items: [...cart],
        subtotal,
        shipping: finalShipping,
        discount,
        discountCode,
        total,
      });
      
      closeCheckout();
      router.push('/checkout');
      return;
    }
    
    // Para transferencia bancaria o pago contra entrega, crear orden directamente
    const order = createOrder(formData, paymentMethod, notes, user?.id);
    setOrderNumber(order.orderNumber);
    setShowSuccess(true);
    
    // Reset form
    setFormData({ name: '', email: '', phone: '', address: '', city: '', zip: '' });
    setErrors({});
    setNotes('');
    setPromoInput('');
    resetDiscount();
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    closeCheckout();
  };

  const handleImageError = (id: number) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const subtotal = getSubtotal();
  const discount = discountAmount > 100 ? discountAmount : (subtotal * discountAmount) / 100;
  const finalShipping = paymentMethod === 'cash_on_delivery' ? shippingCost + 5000 : shippingCost;
  const total = subtotal + finalShipping - discount;

  if (!isCheckoutOpen) return null;

  // Mostrar pantalla de login si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-[var(--border)]">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-[var(--background)] rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-[var(--muted)]" />
          </button>
          <div className="w-16 h-16 bg-[var(--accent-light)]/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="h-10 w-10 text-[var(--primary)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Inicia sesión para continuar
          </h2>
          <p className="text-[var(--muted)] mb-6">
            Necesitas iniciar sesión o crear una cuenta para finalizar tu compra.
          </p>
          <button
            onClick={() => {
              closeCheckout();
              router.push('/login?redirect=/');
            }}
            className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Iniciar Sesión
          </button>
          <p className="mt-4 text-sm text-[var(--muted)]">
            ¿No tienes cuenta?{' '}
            <button 
              onClick={() => {
                closeCheckout();
                router.push('/login?redirect=/');
              }}
              className="text-[var(--primary)] hover:underline"
            >
              Regístrate gratis
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Success Modal
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm" />
        <div ref={successModalRef} className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-[var(--border)]">
          <div className="w-16 h-16 bg-[var(--accent-light)]/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-[var(--primary)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            ¡Pedido Realizado con Éxito!
          </h2>
          <p className="text-[var(--muted)] mb-4">
            {paymentMethod === 'cash_on_delivery' 
              ? 'Tu pedido será entregado y pagarás al recibirlo.'
              : 'Gracias por tu compra. Hemos recibido tu pedido y te enviaremos un email de confirmación.'}
          </p>
          <div className="bg-[var(--background)] rounded-xl p-4 mb-6">
            <p className="text-sm text-[var(--muted)]">Número de Pedido:</p>
            <p className="text-xl font-bold text-[var(--primary)]">{orderNumber}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                handleCloseSuccess();
                router.push('/perfil');
              }}
              className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold rounded-xl transition-colors"
            >
              Ver mis pedidos
            </button>
            <button
              onClick={handleCloseSuccess}
              className="w-full py-3 border border-[var(--border)] text-[var(--foreground)] font-semibold rounded-xl hover:bg-[var(--background)] transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div ref={overlayRef} className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal de dirección con animación */}
      {showAddressModal && (
        <AddressModal
          address={editingAddress}
          onSave={editingAddress ? handleEditAddress : handleAddAddress}
          onClose={closeAddressModal}
          triggerRect={addressModalTriggerRect}
        />
      )}
      
      <div ref={modalRef} className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)]">Finalizar compra</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--background)] rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-[var(--muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid md:grid-cols-2 gap-6 p-4 md:p-6">
            {/* Form Section */}
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Direcciones guardadas */}
              {user && user.addresses.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] mb-4">
                    <MapPin className="h-5 w-5 text-[var(--primary)]" />
                    Direcciones guardadas
                  </h3>
                  <div className="space-y-2 mb-4">
                    {user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={cn(
                          "p-3 border rounded-xl cursor-pointer transition-all",
                          selectedAddressId === addr.id
                            ? "border-[var(--primary)] bg-[var(--accent-light)]/20"
                            : "border-[var(--border)] hover:border-[var(--primary)]/50"
                        )}
                        onClick={() => handleSelectAddress(addr)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="savedAddress"
                              checked={selectedAddressId === addr.id}
                              onChange={() => handleSelectAddress(addr)}
                              className="text-[var(--primary)]"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[var(--foreground)]">{addr.label}</span>
                                {addr.isDefault && (
                                  <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded-full flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    Predeterminada
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-[var(--muted)]">{addr.address}</p>
                              <p className="text-sm text-[var(--muted)]">{addr.city}, {addr.department}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => openAddressModal(e, addr)}
                              className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] rounded-lg"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }}
                                className="p-1.5 text-[var(--muted)] hover:text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => openAddressModal(e)}
                    className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar nueva dirección
                  </button>
                </div>
              )}

              {/* Información de envío (si no hay direcciones guardadas o se quiere editar) */}
              {(!user || user.addresses.length === 0) && (
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] mb-4">
                    <User className="h-5 w-5 text-[var(--primary)]" />
                    Información de envío
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={cn(
                          "w-full px-4 py-2 border rounded-lg focus:outline-none transition-colors",
                          errors.name 
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                            : "border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        )}
                      />
                      <ErrorMessage message={errors.name} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={cn(
                          "w-full px-4 py-2 border rounded-lg focus:outline-none transition-colors",
                          errors.email 
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                            : "border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        )}
                      />
                      <ErrorMessage message={errors.email} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={cn(
                          "w-full px-4 py-2 border rounded-lg focus:outline-none transition-colors",
                          errors.phone 
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                            : "border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        )}
                      />
                      <ErrorMessage message={errors.phone} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={cn(
                          "w-full px-4 py-2 border rounded-lg focus:outline-none transition-colors",
                          errors.address 
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                            : "border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        )}
                      />
                      <ErrorMessage message={errors.address} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={cn(
                          "w-full px-4 py-2 border rounded-lg focus:outline-none transition-colors",
                          errors.city 
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                            : "border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        )}
                      />
                      <ErrorMessage message={errors.city} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                        Código postal *
                      </label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={cn(
                          "w-full px-4 py-2 border rounded-lg focus:outline-none transition-colors",
                          errors.zip 
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                            : "border-[var(--border)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        )}
                      />
                      <ErrorMessage message={errors.zip} />
                    </div>
                  </div>
                  
                  {/* Botón para guardar dirección */}
                  <button
                    type="button"
                    onClick={(e) => openAddressModal(e)}
                    className="mt-4 flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Guardar esta dirección para futuras compras
                  </button>
                </div>
              )}

              {/* Método de pago */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] mb-4">
                  <CreditCard className="h-5 w-5 text-[var(--primary)]" />
                  Método de pago
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'card', label: 'Tarjeta de Crédito/Débito', icon: '💳', description: 'Pago seguro con Stripe' },
                    { id: 'cash_on_delivery', label: 'Pago Contra Entrega', icon: '🚚', description: 'Paga cuando recibas tu pedido (+$5.000)' },
                    { id: 'transfer', label: 'Transferencia Bancaria', icon: '📋', description: 'Datos de cuenta al finalizar' }
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                        paymentMethod === method.id
                          ? "border-[var(--primary)] bg-[var(--accent-light)]/30"
                          : "border-[var(--border)] hover:bg-[var(--background)]"
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="text-[var(--primary)] focus:ring-[var(--primary)]/20"
                      />
                      <span className="text-xl">{method.icon}</span>
                      <div>
                        <span className="font-medium text-[var(--foreground)]">{method.label}</span>
                        <p className="text-xs text-[var(--muted)]">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Notas del Pedido (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Instrucciones especiales, horario de entrega, etc."
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
                />
              </div>
            </form>

            {/* Summary Section */}
            <div className="bg-[var(--background)] rounded-xl p-4 md:p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] mb-4">
                <ShoppingBag className="h-5 w-5 text-[var(--primary)]" />
                Resumen del Pedido
              </h3>

              {/* Items */}
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      {imageErrors[item.id] ? (
                        <div className="w-full h-full bg-[var(--accent-light)]/50" />
                      ) : (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          onError={() => handleImageError(item.id)}
                          sizes="48px"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--foreground)] truncate text-sm">{item.name}</p>
                      <p className="text-[var(--muted)] text-sm">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[var(--muted)]">
                  <span className="flex items-center gap-1">
                    Envío:
                    {paymentMethod === 'cash_on_delivery' && (
                      <span className="text-xs text-orange-600">(+$5.000 contra entrega)</span>
                    )}
                  </span>
                  <span>{formatPrice(finalShipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[var(--primary)]">
                    <span>Descuento:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-[var(--foreground)] pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Código de descuento"
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 text-sm"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-2 bg-[var(--border)] hover:bg-[var(--accent-light)]/50 text-[var(--foreground)] font-medium rounded-lg transition-colors text-sm"
                >
                  Aplicar
                </button>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full mt-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {paymentMethod === 'cash_on_delivery' ? (
                  <>
                    <Truck className="h-5 w-5" />
                    Pedir y Pagar al Recibir
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Confirmar Pedido
                  </>
                )}
              </button>

              {/* Secure Badge */}
              <div className="flex items-center justify-center gap-2 mt-4 text-[var(--muted)] text-sm">
                <Lock className="h-4 w-4" />
                <span>Compra 100% Segura</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
