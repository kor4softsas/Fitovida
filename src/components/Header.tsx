'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, X, LogOut, Settings, Package } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import Image from 'next/image';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toggleCart, getCartCount, setSearchQuery, searchQuery } = useCartStore();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const cartCount = getCartCount();
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    
    // Si no estamos en la página principal, navegar primero
    if (pathname !== '/') {
      router.push(`/#${id}`);
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    router.push('/');
  };

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
          isScrolled ? "py-1.5" : "py-3 md:py-4"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className={cn(
              "relative flex items-center justify-between px-4 md:px-6 transition-all duration-500 rounded-2xl",
              isScrolled 
                ? "h-16 bg-white/95 backdrop-blur-md shadow-lg shadow-black/5" 
                : "h-20 bg-transparent"
            )}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group relative z-10">
              <div className={cn(
                "relative transition-all duration-300",
                isScrolled ? "w-12 h-12" : "w-16 h-16"
              )}>
                <Image 
                  src="/img/logo.png" 
                  alt="Fitovida Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => scrollToSection('inicio')}
                className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-all duration-200"
              >
                Inicio
              </button>
              <button 
                onClick={() => scrollToSection('productos')}
                className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-all duration-200"
              >
                Productos
              </button>
              <Link 
                href="/nosotros"
                className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-all duration-200"
              >
                Nosotros
              </Link>
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-2 relative z-10">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200 group hover:bg-[var(--accent-light)]/30",
                  isSearchOpen ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:text-[var(--primary)]"
                )}
                aria-label="Buscar"
              >
                <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
              </button>
              
              <button
                onClick={toggleCart}
                className="relative p-2.5 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 group"
                aria-label="Carrito"
              >
                <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
                {isMounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm border-2 border-white animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </button>

              {!isLoading && !isAuthenticated && (
                <Link
                  href="/login"
                  className="p-2.5 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 group"
                  aria-label="Iniciar sesion"
                >
                  <User className="h-5 w-5 transition-transform group-hover:scale-110" />
                </Link>
              )}
              
              {!isLoading && isAuthenticated && user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--accent-light)]/30 transition-all duration-200"
                    aria-label="Menu de usuario"
                  >
                    <div className="h-8 w-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-semibold">
                      {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                    </div>
                  </button>
                  
                  {/* User Menu Dropdown */}
                  <div className={cn(
                    "absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-[var(--border)] overflow-hidden transition-all duration-200 origin-top-right z-50",
                    isUserMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                  )}>
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]">
                      <p className="font-semibold text-[var(--foreground)]">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-[var(--muted)] truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[var(--foreground)] hover:bg-[var(--accent-light)]/30 rounded-lg transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Mi Perfil
                      </Link>
                      <Link
                        href="/perfil?tab=compras"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[var(--foreground)] hover:bg-[var(--accent-light)]/30 rounded-lg transition-colors"
                      >
                        <Package className="h-4 w-4" />
                        Mis Pedidos
                      </Link>
                      <Link
                        href="/perfil?tab=configuracion"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[var(--foreground)] hover:bg-[var(--accent-light)]/30 rounded-lg transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Configuración
                      </Link>
                    </div>
                    <div className="p-2 border-t border-[var(--border)]">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2.5 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden absolute top-full left-4 right-4 mt-2 bg-white/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl transition-all duration-300 overflow-hidden origin-top",
          isMenuOpen ? "max-h-96 opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-95"
        )}>
          <nav className="flex flex-col p-2 gap-1">
            <button 
              onClick={() => scrollToSection('inicio')}
              className="text-left py-3 px-4 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 font-medium"
            >
              Inicio
            </button>
            <button 
              onClick={() => scrollToSection('productos')}
              className="text-left py-3 px-4 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 font-medium"
            >
              Productos
            </button>
            <Link 
              href="/nosotros"
              onClick={() => setIsMenuOpen(false)}
              className="text-left py-3 px-4 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 font-medium"
            >
              Nosotros
            </Link>
            <div className="border-t border-[var(--border)] my-2" />
            {!isLoading && !isAuthenticated && (
              <Link 
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 font-medium"
              >
                <User className="h-5 w-5" />
                Iniciar sesión
              </Link>
            )}
            {!isLoading && isAuthenticated && user && (
              <>
                <div className="px-4 py-3 bg-[var(--background)] rounded-xl mb-1">
                  <p className="font-semibold text-[var(--foreground)]">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-[var(--muted)] truncate">{user.email}</p>
                </div>
                <Link
                  href="/perfil"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-4 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 font-medium"
                >
                  <User className="h-5 w-5" />
                  Mi perfil
                </Link>
                <Link
                  href="/perfil?tab=compras"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-4 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 font-medium"
                >
                  <Package className="h-5 w-5" />
                  Mis Pedidos
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full py-3 px-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar sesión
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Search Bar Overlay */}
      <div className={cn(
        "fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-all duration-300",
        isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
        onClick={() => setIsSearchOpen(false)}
      />
      <div className={cn(
        "fixed top-0 left-0 right-0 z-[70] bg-white shadow-xl transition-all duration-300 ease-out",
        isSearchOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="w-full relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" />
            <input
              type="search"
              id="product-search"
              name="product-search"
              placeholder="¿Qué producto natural buscas hoy?"
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  setIsSearchOpen(false);
                  document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              autoFocus={isSearchOpen}
              className="w-full pl-14 pr-12 py-4 bg-[var(--background)] border-2 border-transparent focus:border-[var(--primary)]/30 rounded-2xl focus:outline-none shadow-inner text-lg transition-all placeholder:text-gray-400"
            />
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--muted)] hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
