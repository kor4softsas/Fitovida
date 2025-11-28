'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useSignUp, useAuth } from '@clerk/nextjs';
import { Leaf, Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
      <div ref={contentRef} className="flex items-center gap-1.5 text-red-500 text-xs pt-1.5 pb-0.5" style={{ opacity: 0, transform: 'translateY(-8px)' }}>
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{message || ''}</span>
      </div>
    </div>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

type AuthMode = 'login' | 'register' | 'forgot' | 'verify';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push('/');
    }
  }, [isSignedIn, router]);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'El correo es obligatorio';
    if (!email.includes('@')) return 'Incluye un @ en el correo';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El formato del correo no es valido';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'La contrasena es obligatoria';
    if (password.length < 8) return 'Minimo 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Incluye al menos una mayuscula';
    if (!/[a-z]/.test(password)) return 'Incluye al menos una minuscula';
    if (!/[0-9]/.test(password)) return 'Incluye al menos un numero';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (mode === 'register' && !formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    
    if (mode === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contrasena';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contrasenas no coinciden';
      }
    }
    
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key as keyof FormErrors]) delete newErrors[key as keyof FormErrors];
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle email/password sign in
  const handleSignIn = async () => {
    if (!signIn) return;
    
    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (result.status === 'complete') {
        router.push('/');
      }
    } catch (err: unknown) {
      const error = err as { errors?: { message: string }[] };
      setErrors({ general: error.errors?.[0]?.message || 'Error al iniciar sesion' });
    }
  };

  // Handle email/password sign up
  const handleSignUp = async () => {
    if (!signUp) return;
    
    try {
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' ') || undefined,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // Show verification form
      setMode('verify');
    } catch (err: unknown) {
      const error = err as { errors?: { message: string; code?: string }[] };
      const errorMessage = error.errors?.[0]?.message || 'Error al crear cuenta';
      setErrors({ general: errorMessage });
    }
  };

  // Handle email verification
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    
    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        router.push('/');
      }
    } catch (err: unknown) {
      const error = err as { errors?: { message: string }[] };
      setErrors({ general: error.errors?.[0]?.message || 'Codigo invalido' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      if (mode === 'login') {
        await handleSignIn();
      } else {
        await handleSignUp();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth sign in (Google, Facebook)
  const handleOAuthSignIn = async (provider: 'oauth_google' | 'oauth_facebook') => {
    if (!signIn) return;
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err: unknown) {
      const error = err as { errors?: { message: string }[] };
      setErrors({ general: error.errors?.[0]?.message || 'Error con el proveedor' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let error: string | undefined;
    
    switch (name) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'name':
        if (mode === 'register' && !value.trim()) error = 'El nombre es obligatorio';
        break;
      case 'confirmPassword':
        if (mode === 'register') {
          if (!value) error = 'Confirma tu contrasena';
          else if (value !== formData.password) error = 'Las contrasenas no coinciden';
        }
        break;
    }
    
    const currentError = errors[name as keyof FormErrors];
    if (error !== currentError) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    
    setIsLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: formData.email,
      });
      setEmailSent(true);
    } catch (err: unknown) {
      const error = err as { errors?: { message: string }[] };
      setErrors({ general: error.errors?.[0]?.message || 'Error al enviar correo' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!signInLoaded || !signUpLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  // Forgot password view
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)] flex items-center justify-center p-4 pt-24">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--celadon)]/20 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-[var(--border)] p-8">
            <button
              onClick={() => { setMode('login'); setEmailSent(false); }}
              className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary)]/10 rounded-full mb-4">
                <Mail className="h-8 w-8 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                {emailSent ? '¡Correo enviado!' : 'Recuperar contraseña'}
              </h1>
              <p className="text-sm text-[var(--muted)] mt-2">
                {emailSent 
                  ? 'Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.'
                  : 'Ingresa tu correo y te enviaremos instrucciones para recuperar tu cuenta.'}
              </p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/25"
                >
                  Enviar instrucciones
                </button>
              </form>
            ) : (
              <button
                onClick={() => { setMode('login'); setEmailSent(false); }}
                className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-xl transition-all duration-200"
              >
                Volver a iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Email verification view
  if (mode === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)] flex items-center justify-center p-4 pt-24">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--celadon)]/20 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-[var(--border)] p-8">
            <button
              onClick={() => { setMode('register'); setVerificationCode(''); setErrors({}); }}
              className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary)]/10 rounded-full mb-4">
                <Mail className="h-8 w-8 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                Verifica tu correo
              </h1>
              <p className="text-sm text-[var(--muted)] mt-2">
                Enviamos un codigo de 6 digitos a <span className="font-medium text-[var(--foreground)]">{formData.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-4">
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {errors.general}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Codigo de verificacion
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-center text-2xl tracking-widest font-mono"
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-[var(--muted)] text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)] flex items-center justify-center p-4 pt-24 pb-8">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--celadon)]/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-[var(--border)] p-6 sm:p-8 max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-[var(--primary)]">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--foreground)]">Fitovida</span>
            </div>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {/* Name field - only for register */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", errors.name ? "text-red-400" : "text-[var(--muted)]")} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Tu nombre"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-sm",
                      errors.name 
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                        : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    )}
                  />
                </div>
                <ErrorMessage message={errors.name} />
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", errors.email ? "text-red-400" : "text-[var(--muted)]")} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="tu@email.com"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-sm",
                    errors.email 
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                      : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                  )}
                />
              </div>
              <ErrorMessage message={errors.email} />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", errors.password ? "text-red-400" : "text-[var(--muted)]")} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  className={cn(
                    "w-full pl-10 pr-10 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-sm",
                    errors.password 
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                      : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <ErrorMessage message={errors.password} />
            </div>

            {/* Confirm password - only for register */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", errors.confirmPassword ? "text-red-400" : "text-[var(--muted)]")} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="••••••••"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border rounded-xl focus:outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted)]/50 text-sm",
                      errors.confirmPassword 
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" 
                        : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    )}
                  />
                </div>
                <ErrorMessage message={errors.confirmPassword} />
              </div>
            )}

            {/* Forgot password - only for login */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* General error */}
            <ErrorMessage message={errors.general} />

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/25 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">o continua con</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Social login */}
          <div className="flex gap-3">
            <button 
              onClick={() => handleOAuthSignIn('oauth_google')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] rounded-xl hover:bg-[var(--background)] transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-[var(--foreground)]">Google</span>
            </button>
            <button 
              onClick={() => handleOAuthSignIn('oauth_facebook')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] rounded-xl hover:bg-[var(--background)] transition-colors"
            >
              <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium text-[var(--foreground)]">Facebook</span>
            </button>
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
