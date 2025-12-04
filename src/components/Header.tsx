'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Leaf, Search, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toggleCart, getCartCount, setSearchQuery, searchQuery } = useCartStore();
  const cartCount = getCartCount();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
          isScrolled ? "py-2" : "py-4 md:py-6"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className={cn(
              "relative flex items-center justify-between px-4 md:px-6 transition-all duration-500 rounded-2xl",
              isScrolled 
                ? "h-14 bg-white/95 backdrop-blur-md shadow-lg shadow-black/5" 
                : "h-16 bg-transparent"
            )}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group relative z-10">
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isScrolled 
                  ? "bg-[var(--primary)] text-white" 
                  : "bg-[var(--primary)] text-white"
              )}>
                <Leaf className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
                Fitovida
              </span>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {['inicio', 'productos', 'sobre-nosotros'].map((item) => (
                <button 
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] rounded-lg hover:bg-[var(--accent-light)]/20 transition-all duration-200"
                >
                  {item === 'sobre-nosotros' ? 'Nosotros' : item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
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
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm border-2 border-white animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </button>

              <SignedOut>
                <Link
                  href="/login"
                  className="p-2.5 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 group"
                  aria-label="Iniciar sesion"
                >
                  <User className="h-5 w-5 transition-transform group-hover:scale-110" />
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  afterSignOutUrl="/"
                  showName={false}
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9",
                      userButtonPopoverCard: "shadow-xl border border-[var(--border)] rounded-xl",
                      userButtonPopoverActionButton: "hover:bg-[var(--accent-light)]/30",
                    }
                  }}
                />
              </SignedIn>

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
            {['Inicio', 'Productos', 'Nosotros'].map((item) => (
              <button 
                key={item}
                onClick={() => scrollToSection(item.toLowerCase() === 'nosotros' ? 'sobre-nosotros' : item.toLowerCase())}
                className="text-left py-3 px-4 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 font-medium"
              >
                {item}
              </button>
            ))}
            <div className="border-t border-[var(--border)] my-2" />
            <SignedOut>
              <Link 
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 font-medium"
              >
                <User className="h-5 w-5" />
                Iniciar sesion
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/perfil"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-xl transition-all duration-200 font-medium"
              >
                <User className="h-5 w-5" />
                Mi perfil
              </Link>
            </SignedIn>
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
