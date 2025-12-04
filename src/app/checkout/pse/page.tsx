'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Building2, Lock, ShoppingBag, AlertCircle, Loader2, User, FileText, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useLocalAuth } from '@/lib/auth';
import { formatPrice, cn } from '@/lib/utils';
import { DOCUMENT_TYPES, PERSON_TYPES } from '@/lib/wompi';
import { WompiBank } from '@/types';
import gsap from 'gsap';

// Componente del formulario PSE
function PSEForm() {
  const router = useRouter();
  const { user: localUser } = useLocalAuth();
  const { pendingOrder, createOrderFromPending } = useCartStore();
  
  const [banks, setBanks] = useState<WompiBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    bankCode: '',
    personType: '0', // 0 = natural, 1 = jurídica
    documentType: 'CC',
    documentNumber: '',
  });
  
  const formRef = useRef<HTMLFormElement>(null);

  // Cargar lista de bancos
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('/api/wompi/banks');
        const data = await response.json();
        
        if (data.banks) {
          setBanks(data.banks);
        }
      } catch (err) {
        console.error('Error cargando bancos:', err);
        setError('Error cargando lista de bancos');
      } finally {
        setLoadingBanks(false);
      }
    };

    fetchBanks();
  }, []);

  // Animación de entrada
  useEffect(() => {
    if (formRef.current && !loadingBanks) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [loadingBanks]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pendingOrder) return;

    // Validaciones
    if (!formData.bankCode) {
      setError('Selecciona un banco');
      return;
    }
    if (!formData.documentNumber) {
      setError('Ingresa tu número de documento');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const orderNumber = `FV-${Date.now()}`;
      
      const response = await fetch('/api/wompi/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: pendingOrder.total,
          orderNumber,
          customerEmail: pendingOrder.customer.email,
          customerName: pendingOrder.customer.name,
          customerPhone: pendingOrder.customer.phone,
          bankCode: formData.bankCode,
          personType: formData.personType,
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear transacción PSE');
      }

      if (data.paymentUrl) {
        // Crear orden en estado pendiente antes de redirigir (con userId si está autenticado)
        createOrderFromPending(data.transactionId, 'wompi', localUser?.id);
        
        // Redirigir al banco (simulación en sandbox)
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando el pago');
      setIsProcessing(false);
    }
  };

  const isFormValid = formData.bankCode && formData.documentNumber;

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

  if (loadingBanks) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        <span className="ml-3 text-[var(--muted)]">Cargando bancos...</span>
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

      {/* Selección de banco */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] mb-2">
          <Building2 className="h-4 w-4 text-[var(--primary)]" />
          Selecciona tu banco
        </label>
        <div className="relative">
          <select
            name="bankCode"
            value={formData.bankCode}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] appearance-none bg-white transition-all"
          >
            <option value="">Seleccionar banco...</option>
            {banks.map((bank) => (
              <option key={bank.financial_institution_code} value={bank.financial_institution_code}>
                {bank.financial_institution_name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)] pointer-events-none" />
        </div>
      </div>

      {/* Tipo de persona */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] mb-2">
          <User className="h-4 w-4 text-[var(--primary)]" />
          Tipo de persona
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PERSON_TYPES.map((type) => (
            <label
              key={type.value}
              className={cn(
                "flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all",
                formData.personType === type.value
                  ? "border-[var(--primary)] bg-[var(--accent-light)]/30 ring-2 ring-[var(--primary)]/20"
                  : "border-[var(--border)] hover:bg-[var(--background)]"
              )}
            >
              <input
                type="radio"
                name="personType"
                value={type.value}
                checked={formData.personType === type.value}
                onChange={handleChange}
                className="sr-only"
              />
              <span className="font-medium text-sm">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tipo de documento */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] mb-2">
          <FileText className="h-4 w-4 text-[var(--primary)]" />
          Tipo de documento
        </label>
        <div className="relative">
          <select
            name="documentType"
            value={formData.documentType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] appearance-none bg-white transition-all"
          >
            {DOCUMENT_TYPES.map((doc) => (
              <option key={doc.value} value={doc.value}>
                {doc.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)] pointer-events-none" />
        </div>
      </div>

      {/* Número de documento */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Número de documento
        </label>
        <input
          type="text"
          name="documentNumber"
          value={formData.documentNumber}
          onChange={handleChange}
          placeholder="Ej: 1234567890"
          className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
        />
      </div>

      {/* Información de sandbox */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-medium text-blue-800 mb-2">🧪 Modo de prueba (Sandbox)</p>
        <p className="text-xs text-blue-600">
          En modo sandbox, serás redirigido a una página de simulación de Wompi donde podrás aprobar o rechazar el pago.
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
        disabled={isProcessing || !isFormValid}
        className={cn(
          "w-full py-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
          isProcessing || !isFormValid
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-[var(--secondary)] hover:bg-[var(--secondary-hover)] text-white"
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Redirigiendo al banco...
          </>
        ) : (
          <>
            <Building2 className="h-5 w-5" />
            Pagar {formatPrice(pendingOrder.total)} con PSE
          </>
        )}
      </button>

      {/* Seguridad */}
      <div className="flex items-center justify-center gap-2 text-[var(--muted)] text-xs">
        <Lock className="h-3.5 w-3.5" />
        <span>Pago seguro procesado por Wompi</span>
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

      {/* Info PSE */}
      <div className="mt-4 p-3 bg-[var(--accent-light)]/30 rounded-lg">
        <p className="text-xs text-[var(--muted)]">
          <strong>PSE</strong> es el botón de pagos en línea de ACH Colombia que te permite pagar desde tu cuenta bancaria de forma segura.
        </p>
      </div>
    </div>
  );
}

// Página principal de checkout PSE
export default function PSECheckoutPage() {
  const router = useRouter();
  const { pendingOrder } = useCartStore();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si no hay pedido pendiente, redirigir
    if (!pendingOrder) {
      const timer = setTimeout(() => {
        const store = useCartStore.getState();
        if (!store.pendingOrder) {
          router.push('/');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingOrder, router]);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-[var(--background)]">
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
              <Lock className="h-4 w-4 text-[var(--secondary)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Pago PSE Seguro</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
            Pago con PSE
          </h1>
          <p className="text-[var(--muted)]">
            Paga de forma segura desde tu cuenta bancaria
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulario PSE */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)] mb-6">
              <Building2 className="h-5 w-5 text-[var(--secondary)]" />
              Información bancaria
            </h2>
            
            <PSEForm />
          </div>

          {/* Resumen del pedido */}
          <OrderSummary />
        </div>
      </main>
    </div>
  );
}
