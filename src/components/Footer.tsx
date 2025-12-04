'use client';

import { Leaf, Facebook, Instagram, MessageCircle, Send, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('¡Gracias por suscribirte!');
    setEmail('');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[var(--foreground)] text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 lg:gap-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-[var(--primary)]">
                <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-white">Fitovida</span>
            </div>
            <p className="text-white/50 leading-relaxed text-xs sm:text-sm max-w-xs">
              Tu tienda naturista de confianza. Productos naturales para tu salud.
            </p>
            <div className="flex items-center gap-2">
              <a href="#" className="p-2 bg-white/5 hover:bg-[var(--primary)] rounded-lg transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-white/5 hover:bg-[var(--primary)] rounded-lg transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-white/5 hover:bg-[var(--primary)] rounded-lg transition-colors" aria-label="WhatsApp">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-medium text-sm sm:text-base mb-3 sm:mb-4">Navegación</h4>
            <ul className="space-y-2">
              {['Inicio', 'Productos', 'Nosotros'].map((item) => (
                <li key={item}>
                  <button 
                    onClick={() => scrollToSection(item.toLowerCase() === 'nosotros' ? 'sobre-nosotros' : item.toLowerCase())}
                    className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-medium text-sm sm:text-base mb-3 sm:mb-4">Contacto</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-center gap-2 text-xs sm:text-sm text-white/50">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--primary)] flex-shrink-0" />
                <span className="truncate">Cra.5 Norte #42-23</span>
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm text-white/50">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--primary)] flex-shrink-0" />
                602-400-36-11
              </li>
              
            </ul>
          </div>

          {/* Newsletter - Full width on mobile */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-medium text-sm sm:text-base mb-3 sm:mb-4">Newsletter</h4>
            <p className="text-xs sm:text-sm text-white/50 mb-3">
              Recibe ofertas exclusivas
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu email"
                required
                className="flex-1 min-w-0 px-3 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[var(--primary)] text-white placeholder:text-white/30 text-xs sm:text-sm transition-all"
              />
              <button
                type="submit"
                className="px-3 py-2 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors flex-shrink-0"
                aria-label="Suscribirse"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-8 sm:mt-10 pt-4 sm:pt-6 text-center">
          <p className="text-xs sm:text-sm text-white/40">
            &copy; {new Date().getFullYear()} Fitovida. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
