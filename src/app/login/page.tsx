'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, Phone, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, TEST_USERS } from '@/lib/auth';
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

type AuthMode = 'login' | 'register' | 'forgot';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  
  const { login, register, isAuthenticated, isLoading } = useAuthStore();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showTestCredentials, setShowTestCredentials] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already signed in
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'El correo es obligatorio';
    if (!email.includes('@')) return 'Incluye un @ en el correo';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'El formato del correo no es válido';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'La contraseña es obligatoria';
    if (password.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Incluye al menos una mayúscula';
    if (!/[a-z]/.test(password)) return 'Incluye al menos una minúscula';
    if (!/[0-9]/.test(password)) return 'Incluye al menos un número';
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return 'El teléfono es obligatorio';
    if (!/^\d{7,}$/.test(phone.replace(/\s/g, ''))) return 'Ingresa un número válido (mínimo 7 dígitos)';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (mode === 'register') {
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre es obligatorio';
      } else if (formData.name.trim().length < 3) {
        newErrors.name = 'Mínimo 3 caracteres';
      }
      newErrors.phone = validatePhone(formData.phone);
    }
    
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    
    if (mode === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }
    
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key as keyof FormErrors]) delete newErrors[key as keyof FormErrors];
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = async () => {
    setLocalLoading(true);
    const result = await login(formData.email, formData.password);
    setLocalLoading(false);
    
    if (result.success) {
      router.push(redirectUrl);
    } else {
      setErrors({ general: result.error || 'Error al iniciar sesión' });
    }
  };

  // Handle register
  const handleRegister = async () => {
    setLocalLoading(true);
    
    const nameParts = formData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName,
      lastName,
      phone: formData.phone,
    });
    
    setLocalLoading(false);
    
    if (result.success) {
      router.push(redirectUrl);
    } else {
      setErrors({ general: result.error || 'Error al crear cuenta' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Para login, solo validar email y password básicamente
    if (mode === 'login') {
      if (!formData.email || !formData.password) {
        setErrors({ general: 'Ingresa tu correo y contraseña' });
        return;
      }
      await handleLogin();
    } else {
      if (!validateForm()) return;
      await handleRegister();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
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
        if (mode === 'register') error = validatePassword(value);
        break;
      case 'name':
        if (mode === 'register') {
          if (!value.trim()) error = 'El nombre es obligatorio';
          else if (value.trim().length < 3) error = 'Mínimo 3 caracteres';
        }
        break;
      case 'phone':
        if (mode === 'register') error = validatePhone(value);
        break;
      case 'confirmPassword':
        if (mode === 'register') {
          if (!value) error = 'Confirma tu contraseña';
          else if (value !== formData.password) error = 'Las contraseñas no coinciden';
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
    setLocalLoading(true);
    // Simular envío de correo
    await new Promise(resolve => setTimeout(resolve, 1000));
    setEmailSent(true);
    setLocalLoading(false);
  };

  const fillTestCredentials = (email: string, password: string) => {
    setFormData(prev => ({ ...prev, email, password }));
    setShowTestCredentials(false);
    setErrors({});
  };

  const loading = isLoading || localLoading;

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
                  disabled={loading}
                  className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
              onClick={() => { setMode('login'); setErrors({}); }}
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
              onClick={() => { setMode('register'); setErrors({}); }}
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

          {/* Test credentials button - only in login mode */}
          {mode === 'login' && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowTestCredentials(!showTestCredentials)}
                className="w-full py-2.5 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                <span>🧪</span>
                Usar credenciales de prueba
              </button>
              
              {showTestCredentials && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                  <p className="text-xs text-blue-600 font-medium mb-2">Selecciona un usuario de prueba:</p>
                  {TEST_USERS.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => fillTestCredentials(user.email, user.password)}
                      className="w-full p-2 bg-white rounded-lg text-left hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                      <p className="text-sm font-medium text-[var(--foreground)]">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-[var(--muted)]">{user.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {/* Name field - only for register */}
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", errors.name ? "text-red-400" : "text-[var(--muted)]")} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Tu nombre completo"
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
              <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", errors.email ? "text-red-400" : "text-[var(--muted)]")} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
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

            {/* Phone field - only for register */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", errors.phone ? "text-red-400" : "text-[var(--muted)]")} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
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
            )}

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", errors.password ? "text-red-400" : "text-[var(--muted)]")} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", errors.confirmPassword ? "text-red-400" : "text-[var(--muted)]")} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
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
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errors.general}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/25 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          {/* Register benefits */}
          {mode === 'register' && (
            <div className="mt-5 p-4 bg-[var(--accent-light)]/30 rounded-xl">
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">Al registrarte podrás:</p>
              <ul className="space-y-1.5">
                {[
                  'Guardar tus direcciones de envío',
                  'Ver el historial de tus pedidos',
                  'Hacer seguimiento a tus envíos',
                  'Recibir ofertas exclusivas'
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <CheckCircle className="h-4 w-4 text-[var(--primary)]" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
