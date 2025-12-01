'use client';

import { useEffect, useState, useRef, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { X, User, CreditCard, ShoppingBag, Lock, Check, AlertCircle, Building2, LogIn } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice, cn } from '@/lib/utils';
import { CustomerInfo, PaymentMethod } from '@/types';
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
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
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
  
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();

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
  
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const successModalRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isCheckoutOpen && !isClosing) {
      document.body.style.overflow = 'hidden';
      
      // GSAP animation for modal entrance
      if (overlayRef.current) {
        gsap.fromTo(overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
      if (modalRef.current) {
        // Calculate starting position relative to viewport center
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;
        
        let startX = 0;
        let startY = 0;
        
        if (checkoutOrigin) {
          startX = checkoutOrigin.x - viewportCenterX;
          startY = checkoutOrigin.y - viewportCenterY;
        }
        
        gsap.fromTo(modalRef.current,
          { 
            scale: 0.4, 
            opacity: 0, 
            x: startX,
            y: startY
          },
          { 
            scale: 1, 
            opacity: 1, 
            x: 0,
            y: 0, 
            duration: 0.4, 
            ease: 'power3.out'
          }
        );
      }
    } else if (!isCheckoutOpen) {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isCheckoutOpen, isClosing, checkoutOrigin]);

  // Handle close with animation
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

  // Animate success modal
  useEffect(() => {
    if (showSuccess && successModalRef.current) {
      gsap.fromTo(successModalRef.current,
        { scale: 0.95, opacity: 0, y: 10 },
        { 
          scale: 1, 
          opacity: 1, 
          y: 0, 
          duration: 0.3, 
          ease: 'power2.out'
        }
      );
    }
  }, [showSuccess]);

  // Validation functions
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
    
    // Clear error when typing
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Si el método de pago es tarjeta o PSE, redirigir a la página de checkout correspondiente
    if (paymentMethod === 'card' || paymentMethod === 'pse') {
      // Calcular valores para el pending order
      const subtotal = getSubtotal();
      const discount = discountAmount > 100 ? discountAmount : (subtotal * discountAmount) / 100;
      const total = subtotal + shippingCost - discount;
      
      // Guardar datos del pedido antes de redirigir
      setPendingOrder({
        customer: formData,
        paymentMethod,
        notes,
        items: [...cart],
        subtotal,
        shipping: shippingCost,
        discount,
        discountCode,
        total,
      });
      
      // Cerrar modal y redirigir
      closeCheckout();
      
      if (paymentMethod === 'card') {
        router.push('/checkout');
      } else {
        router.push('/checkout/pse');
      }
      return;
    }
    
    // Para transferencia bancaria, crear orden directamente (flujo original)
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
  const total = getFinalTotal();

  if (!isCheckoutOpen) return null;

  // TEMPORALMENTE DESHABILITADO PARA PRUEBAS
  // Mostrar pantalla de login si no está autenticado
  // if (isLoaded && !isSignedIn) {
  //   return (
  //     <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
  //       <div className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm" onClick={handleClose} />
  //       <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-[var(--border)]">
  //         <button
  //           onClick={handleClose}
  //           className="absolute top-4 right-4 p-2 hover:bg-[var(--background)] rounded-full transition-colors"
  //         >
  //           <X className="h-5 w-5 text-[var(--muted)]" />
  //         </button>
  //         <div className="w-16 h-16 bg-[var(--accent-light)]/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
  //           <LogIn className="h-10 w-10 text-[var(--primary)]" />
  //         </div>
  //         <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
  //           Inicia sesión para continuar
  //         </h2>
  //         <p className="text-[var(--muted)] mb-6">
  //           Necesitas iniciar sesión o crear una cuenta para finalizar tu compra.
  //         </p>
  //         <button
  //           onClick={() => {
  //             closeCheckout();
  //             router.push('/login');
  //           }}
  //           className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
  //         >
  //           <LogIn className="h-5 w-5" />
  //           Iniciar Sesión
  //         </button>
  //         <p className="mt-4 text-sm text-[var(--muted)]">
  //           ¿No tienes cuenta? Al iniciar sesión podrás crear una.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

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
            Gracias por tu compra. Hemos recibido tu pedido y te enviaremos un email de confirmación.
          </p>
          <div className="bg-[var(--background)] rounded-xl p-4 mb-6">
            <p className="text-sm text-[var(--muted)]">Número de Pedido:</p>
            <p className="text-xl font-bold text-[var(--primary)]">{orderNumber}</p>
          </div>
          <button
            onClick={handleCloseSuccess}
            className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold rounded-xl transition-colors"
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div ref={overlayRef} className="absolute inset-0 bg-[var(--foreground)]/40 backdrop-blur-sm" onClick={handleClose} />
      
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
              {/* Personal Info */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] mb-4">
                  <User className="h-5 w-5 text-[var(--primary)]" />
                  Información personal
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
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] mb-4">
                  <CreditCard className="h-5 w-5 text-[var(--primary)]" />
                  Método de pago
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'card', label: 'Tarjeta de Crédito/Débito', icon: '💳' },
                    { id: 'pse', label: 'PSE (Débito Bancario)', icon: '🏦' },
                    { id: 'transfer', label: 'Transferencia Bancaria', icon: '📋' }
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
                      <span className="font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
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
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
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
                  <span>Envío:</span>
                  <span>{formatPrice(shippingCost)}</span>
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
                <Check className="h-5 w-5" />
                Confirmar Pedido
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
