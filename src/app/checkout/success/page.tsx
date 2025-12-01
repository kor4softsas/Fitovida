'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Home, ShoppingBag, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import gsap from 'gsap';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { orders, getOrderByNumber, updateOrderStatus } = useCartStore();
  
  const orderNumber = searchParams.get('order');
  const provider = searchParams.get('provider'); // 'stripe' o 'wompi'
  const wompiRef = searchParams.get('ref'); // Referencia de Wompi
  
  const [order, setOrder] = useState(orderNumber ? getOrderByNumber(orderNumber) : null);
  const [isLoading, setIsLoading] = useState(true);
  
  const pageRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Buscar orden o esperar a que se hidrate el store
  useEffect(() => {
    const timer = setTimeout(() => {
      if (orderNumber) {
        const foundOrder = useCartStore.getState().getOrderByNumber(orderNumber);
        setOrder(foundOrder || null);
      } else if (wompiRef) {
        // Buscar por referencia de Wompi en los metadatos
        const allOrders = useCartStore.getState().orders;
        const found = allOrders.find(o => o.paymentId?.includes(wompiRef));
        setOrder(found || null);
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [orderNumber, wompiRef]);

  // Si viene de Wompi, verificar el estado del pago
  useEffect(() => {
    if (provider === 'wompi' && wompiRef && order) {
      // En un caso real, aquí consultarías el estado de la transacción
      // Por ahora en sandbox, asumimos que si llegó aquí, el pago fue exitoso
      if (order.status === 'processing') {
        updateOrderStatus(order.orderNumber, 'paid');
      }
    }
  }, [provider, wompiRef, order, updateOrderStatus]);

  // Animaciones
  useEffect(() => {
    if (!isLoading && pageRef.current) {
      gsap.fromTo(pageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && checkRef.current && contentRef.current) {
      const tl = gsap.timeline();
      
      tl.fromTo(checkRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' }
      );
      
      tl.fromTo(contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      );
    }
  }, [isLoading, order]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[var(--primary)] mx-auto mb-4" />
          <p className="text-[var(--muted)]">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  // Si no hay orden
  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            No encontramos tu pedido
          </h1>
          <p className="text-[var(--muted)] mb-6">
            Si realizaste un pago, tu pedido puede estar procesándose. Revisa tu correo electrónico para más detalles.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold rounded-xl transition-colors"
          >
            <Home className="h-5 w-5" />
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const providerName = provider === 'stripe' ? 'Stripe (Tarjeta)' : provider === 'wompi' ? 'PSE' : 'Manual';

  return (
    <div ref={pageRef} className="min-h-screen bg-[var(--background)]">
      {/* Confetti effect placeholder - could add a confetti library */}
      
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Icon */}
        <div ref={checkRef} className="w-24 h-24 bg-[var(--accent-light)] rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="h-14 w-14 text-[var(--primary)]" />
        </div>

        {/* Content */}
        <div ref={contentRef} className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-3">
            ¡Pago Exitoso!
          </h1>
          <p className="text-lg text-[var(--muted)] mb-8">
            Gracias por tu compra. Hemos recibido tu pedido y te enviaremos un correo de confirmación.
          </p>

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6 mb-8 text-left">
            {/* Order Number */}
            <div className="text-center pb-6 border-b border-[var(--border)] mb-6">
              <p className="text-sm text-[var(--muted)] mb-1">Número de Pedido</p>
              <p className="text-2xl font-bold text-[var(--primary)]">{order.orderNumber}</p>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Método de pago</span>
                <span className="font-medium text-[var(--foreground)]">{providerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Estado</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Pagado
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Productos</span>
                <span className="font-medium text-[var(--foreground)]">{order.items.length} artículo(s)</span>
              </div>
              
              {/* Items preview */}
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--foreground)] mb-3">Productos:</p>
                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-[var(--muted)] truncate flex-1 mr-2">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-medium text-[var(--foreground)]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-sm text-[var(--muted)]">
                      +{order.items.length - 3} más...
                    </p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-[var(--border)] flex justify-between text-lg">
                <span className="font-semibold text-[var(--foreground)]">Total pagado</span>
                <span className="font-bold text-[var(--primary)]">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">Dirección de envío:</p>
              <p className="text-sm text-[var(--muted)]">
                {order.customer.name}<br />
                {order.customer.address}<br />
                {order.customer.city}, {order.customer.zip}<br />
                Tel: {order.customer.phone}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold rounded-xl transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              Seguir comprando
            </Link>
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[var(--border)] hover:border-[var(--primary)] text-[var(--foreground)] font-semibold rounded-xl transition-colors"
            >
              Ver mis pedidos
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Email notice */}
          <p className="mt-8 text-sm text-[var(--muted)]">
            📧 Hemos enviado un correo de confirmación a <strong>{order.customer.email}</strong>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[var(--primary)] mx-auto mb-4" />
          <p className="text-[var(--muted)]">Cargando...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
