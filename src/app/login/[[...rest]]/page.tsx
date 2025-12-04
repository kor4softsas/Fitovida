'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)] flex items-center justify-center p-4 pt-24 pb-8">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--celadon)]/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-[var(--border)] p-6 sm:p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-[var(--primary)]">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--foreground)]">Fitovida</span>
            </Link>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              {mode === 'login' 
                ? 'Ingresa tus credenciales para continuar' 
                : 'Regístrate para empezar a comprar'}
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex bg-[var(--background)] rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode('login')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                mode === 'login'
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode('register')}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                mode === 'register'
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              Registrarse
            </button>
          </div>

          {/* Clerk Components */}
          <div className="clerk-container">
            {mode === 'login' ? (
              <SignIn 
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none p-0 bg-transparent",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "hidden",
                    dividerRow: "hidden",
                    formFieldLabel: "text-sm font-medium text-[var(--foreground)]",
                    formFieldInput: "border border-[var(--border)] rounded-xl py-2.5 px-4 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-all",
                    formButtonPrimary: "bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl py-3 font-medium transition-all shadow-lg shadow-[var(--primary)]/20",
                    footerActionLink: "text-[var(--primary)] hover:text-[var(--primary-hover)]",
                    identityPreviewEditButton: "text-[var(--primary)]",
                    formFieldAction: "text-[var(--primary)] hover:text-[var(--primary-hover)]",
                    alert: "rounded-xl",
                    alertText: "text-sm",
                    footer: "hidden",
                  },
                  layout: {
                    socialButtonsPlacement: "bottom",
                    showOptionalFields: false,
                  }
                }}
                forceRedirectUrl="/"
                fallbackRedirectUrl="/"
              />
            ) : (
              <SignUp 
                routing="hash"
                unsafeMetadata={{
                  signUpUrl: '/login'
                }}
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none p-0 bg-transparent",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "hidden",
                    socialButtonsBlockButtonText: "hidden",
                    socialButtonsProviderIcon: "hidden",
                    dividerRow: "hidden",
                    dividerLine: "hidden",
                    dividerText: "hidden",
                    formFieldLabel: "text-sm font-medium text-[var(--foreground)]",
                    formFieldInput: "border border-[var(--border)] rounded-xl py-2.5 px-4 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-all",
                    formButtonPrimary: "bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl py-3 font-medium transition-all shadow-lg shadow-[var(--primary)]/20",
                    footerActionLink: "text-[var(--primary)] hover:text-[var(--primary-hover)]",
                    identityPreviewEditButton: "text-[var(--primary)]",
                    formFieldAction: "text-[var(--primary)] hover:text-[var(--primary-hover)]",
                    alert: "rounded-xl",
                    alertText: "text-sm",
                    footer: "hidden",
                    formFieldRow: "gap-2",
                  },
                  layout: {
                    socialButtonsPlacement: "bottom",
                    showOptionalFields: true,
                  }
                }}
                forceRedirectUrl="/"
                fallbackRedirectUrl="/"
              />
            )}
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-[var(--muted)] mt-4">
          Al continuar, aceptas nuestros{' '}
          <a href="#" className="text-[var(--primary)] hover:underline">términos</a>
          {' '}y{' '}
          <a href="#" className="text-[var(--primary)] hover:underline">privacidad</a>
        </p>
      </div>
    </div>
  );
}
