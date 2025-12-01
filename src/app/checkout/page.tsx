'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, CreditCard, Lock, ShoppingBag, AlertCircle, Loader2, CheckCircle, Check, Home } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice, cn } from '@/lib/utils';
import { stripeAppearance } from '@/lib/stripe';
import { Order } from '@/types';
import gsap from 'gsap';

// Cargar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Modal de confirmación de pago exitoso
function PaymentSuccessModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalRef.current && contentRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(contentRef.current,
        { scale: 0.8, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)', delay: 0.1 }
      );
    }
  }, []);

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div ref={contentRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          ¡Pago Exitoso!
        </h2>
        <p className="text-[var(--muted)] mb-6">
          Tu pago ha sido procesado correctamente. Recibirás un correo de confirmación.
        </p>
        <div className="bg-[var(--background)] rounded-xl p-4 mb-6">
          <p className="text-sm text-[var(--muted)]">Número de Pedido:</p>
          <p className="text-2xl font-bold text-[var(--primary)]">{order.orderNumber}</p>
          <p className="text-sm text-[var(--muted)] mt-2">Total pagado: <span className="font-semibold">{formatPrice(order.total)}</span></p>
        </div>
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Volver a la tienda
          </Link>
          <Link
            href="/perfil"
            className="w-full py-3 border-2 border-[var(--border)] hover:border-[var(--primary)] text-[var(--foreground)] font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}

// Componente del formulario de pago con Stripe
function CheckoutForm({ onPaymentSuccess }: { onPaymentSuccess: (order: Order) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useUser();
  
  const { pendingOrder, createOrderFromPending, clearPendingOrder } = useCartStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  // Animación de entrada
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !pendingOrder) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Asegurar que el total sea un número entero válido
      const amountToCharge = Math.round(Number(pendingOrder.total));
      
      // Debug: Ver el total del pendingOrder
      console.log('Checkout - pendingOrder.total:', pendingOrder.total, 'Tipo:', typeof pendingOrder.total);
      console.log('Checkout - amountToCharge:', amountToCharge);
      console.log('Checkout - pendingOrder.items:', pendingOrder.items.map(i => ({ name: i.name, price: i.price, qty: i.quantity })));

      // Validar monto mínimo
      if (amountToCharge < 2000) {
        setError(`El monto mínimo es $2,000 COP. Total actual: ${amountToCharge}`);
        setIsProcessing(false);
        return;
      }

      // 1. Crear PaymentIntent en el servidor
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountToCharge,
          orderNumber: `FV-${Date.now()}`,
          customerEmail: pendingOrder.customer.email,
          customerName: pendingOrder.customer.name,
        }),
      });

      const { clientSecret, error: apiError } = await response.json();

      if (apiError) {
        throw new Error(apiError);
      }

      // 2. Confirmar el pago con Stripe
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Error cargando formulario de tarjeta');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: pendingOrder.customer.name,
              email: pendingOrder.customer.email,
              phone: pendingOrder.customer.phone,
              address: {
                line1: pendingOrder.customer.address,
                city: pendingOrder.customer.city,
                postal_code: pendingOrder.customer.zip,
                country: 'CO',
              },
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Error procesando el pago');
      }

      if (paymentIntent?.status === 'succeeded') {
        // 3. Crear la orden en el store (con userId si está autenticado)
        const order = createOrderFromPending(paymentIntent.id, 'stripe', user?.id);
        
        if (order) {
          // Mostrar modal de confirmación
          onPaymentSuccess(order);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando el pago');
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: { complete: boolean; error?: { message: string } }) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  if (!pendingOrder) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-[var(--muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          No hay pedido pendiente
        </h2>
        <p className="text-[var(--muted)] mb-6">
          Parece que no tienes productos en tu carrito o no has iniciado el proceso de pago.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Información del cliente */}
      <div className="bg-[var(--background)] rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-3">Datos de envío</h3>
        <div className="text-sm text-[var(--muted)] space-y-1">
          <p><span className="font-medium">Nombre:</span> {pendingOrder.customer.name}</p>
          <p><span className="font-medium">Email:</span> {pendingOrder.customer.email}</p>
          <p><span className="font-medium">Teléfono:</span> {pendingOrder.customer.phone}</p>
          <p><span className="font-medium">Dirección:</span> {pendingOrder.customer.address}, {pendingOrder.customer.city} {pendingOrder.customer.zip}</p>
        </div>
      </div>

      {/* Tarjeta de crédito */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] mb-3">
          <CreditCard className="h-4 w-4 text-[var(--primary)]" />
          Datos de la tarjeta
        </label>
        <div className="border border-[var(--border)] rounded-xl p-4 bg-white focus-within:ring-2 focus-within:ring-[var(--primary)]/20 focus-within:border-[var(--primary)] transition-all">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1a2e1a',
                  fontFamily: '"Nunito", system-ui, sans-serif',
                  '::placeholder': {
                    color: '#5a7265',
                  },
                },
                invalid: {
                  color: '#ef4444',
                  iconColor: '#ef4444',
                },
              },
              hidePostalCode: true,
            }}
            onChange={handleCardChange}
          />
        </div>
      </div>

      {/* Tarjetas de prueba */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-medium text-blue-800 mb-2">🧪 Modo de prueba</p>
        <p className="text-xs text-blue-600">
          Usa la tarjeta <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code> con cualquier fecha futura y CVC.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Botón de pago */}
      <button
        type="submit"
        disabled={!stripe || isProcessing || !cardComplete}
        className={cn(
          "w-full py-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
          isProcessing || !cardComplete
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Procesando pago...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" />
            Pagar {formatPrice(pendingOrder.total)}
          </>
        )}
      </button>

      {/* Seguridad */}
      <div className="flex items-center justify-center gap-2 text-[var(--muted)] text-xs">
        <Lock className="h-3.5 w-3.5" />
        <span>Pago seguro procesado por Stripe</span>
      </div>
    </form>
  );
}

// Componente de resumen del pedido
function OrderSummary() {
  const { pendingOrder } = useCartStore();
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (summaryRef.current) {
      gsap.fromTo(summaryRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', delay: 0.2 }
      );
    }
  }, []);

  if (!pendingOrder) return null;

  const handleImageError = (id: number) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div ref={summaryRef} className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6 sticky top-24">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] mb-4">
        <ShoppingBag className="h-5 w-5 text-[var(--primary)]" />
        Resumen del pedido
      </h2>

      {/* Items */}
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4 scrollbar-hide">
        {pendingOrder.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--background)]">
              {imageErrors[item.id] ? (
                <div className="w-full h-full bg-[var(--accent-light)]/50 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-[var(--muted)]" />
                </div>
              ) : (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(item.id)}
                  sizes="56px"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--foreground)] text-sm truncate">{item.name}</p>
              <p className="text-[var(--muted)] text-xs">Cantidad: {item.quantity}</p>
            </div>
            <p className="font-semibold text-[var(--foreground)] text-sm">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="border-t border-[var(--border)] pt-4 space-y-2">
        <div className="flex justify-between text-sm text-[var(--muted)]">
          <span>Subtotal</span>
          <span>{formatPrice(pendingOrder.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--muted)]">
          <span>Envío</span>
          <span>{formatPrice(pendingOrder.shipping)}</span>
        </div>
        {pendingOrder.discount > 0 && (
          <div className="flex justify-between text-sm text-[var(--primary)]">
            <span>Descuento {pendingOrder.discountCode && `(${pendingOrder.discountCode})`}</span>
            <span>-{formatPrice(pendingOrder.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-[var(--foreground)] pt-2 border-t border-[var(--border)]">
          <span>Total</span>
          <span>{formatPrice(pendingOrder.total)}</span>
        </div>
      </div>
    </div>
  );
}

// Página principal de checkout
export default function CheckoutPage() {
  const router = useRouter();
  const { pendingOrder } = useCartStore();
  const pageRef = useRef<HTMLDivElement>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Si no hay pedido pendiente y no hay orden completada, redirigir
    if (!pendingOrder && !completedOrder) {
      // Dar un momento para que se hidrate el store
      const timer = setTimeout(() => {
        const store = useCartStore.getState();
        if (!store.pendingOrder) {
          router.push('/');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingOrder, completedOrder, router]);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  const handlePaymentSuccess = (order: Order) => {
    setCompletedOrder(order);
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-[var(--background)]">
      {/* Modal de confirmación */}
      {completedOrder && (
        <PaymentSuccessModal 
          order={completedOrder} 
          onClose={() => router.push('/')} 
        />
      )}
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Volver a la tienda</span>
            </Link>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[var(--primary)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Checkout Seguro</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
            Finalizar compra
          </h1>
          <p className="text-[var(--muted)]">
            Completa tu pago de forma segura con tarjeta de crédito o débito
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulario de pago */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] mb-6">
              <CreditCard className="h-5 w-5 text-[var(--primary)]" />
              Información de pago
            </h2>
            
            <Elements 
              stripe={stripePromise}
              options={{
                appearance: stripeAppearance,
                locale: 'es',
              }}
            >
              <CheckoutForm onPaymentSuccess={handlePaymentSuccess} />
            </Elements>
          </div>

          {/* Resumen del pedido */}
          <OrderSummary />
        </div>
      </main>
    </div>
  );
}
