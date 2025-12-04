'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { Leaf, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const { handleEmailLinkVerification } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Clerk maneja la verificación automáticamente desde el link del email
        await handleEmailLinkVerification({
          redirectUrl: '/',
          redirectUrlComplete: '/',
        });
        
        setStatus('success');
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (err: any) {
        console.error('Error verificando email:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Hubo un error al verificar tu email');
      }
    };

    verifyEmail();
  }, [handleEmailLinkVerification, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--celadon)]/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-[var(--border)] p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-[var(--primary)]">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--foreground)]">Fitovida</span>
            </Link>
          </div>

          {/* Content */}
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary)]/10 mb-4">
                  <Loader2 className="h-8 w-8 text-[var(--primary)] animate-spin" />
                </div>
                <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
                  Verificando tu email
                </h1>
                <p className="text-[var(--muted)] text-sm">
                  Por favor espera mientras confirmamos tu dirección de correo...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
                  ¡Email verificado!
                </h1>
                <p className="text-[var(--muted)] text-sm mb-6">
                  Tu cuenta ha sido verificada exitosamente. Serás redirigido al inicio en un momento...
                </p>
                <div className="flex justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-medium transition-all shadow-lg shadow-[var(--primary)]/20"
                  >
                    Ir al inicio
                  </Link>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
                  Error de verificación
                </h1>
                <p className="text-[var(--muted)] text-sm mb-6">
                  {errorMessage || 'Hubo un problema al verificar tu email. El enlace puede haber expirado.'}
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-medium transition-all shadow-lg shadow-[var(--primary)]/20"
                  >
                    Volver al inicio de sesión
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-[var(--border)] hover:bg-[var(--background)] text-[var(--foreground)] rounded-xl font-medium transition-all"
                  >
                    Ir al inicio
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-[var(--muted)] mt-4">
          ¿Necesitas ayuda?{' '}
          <a href="mailto:soporte@fitovida.com" className="text-[var(--primary)] hover:underline">
            Contáctanos
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
