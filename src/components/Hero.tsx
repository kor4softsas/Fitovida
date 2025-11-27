'use client';

import { ArrowRight, ShieldCheck, Leaf, Truck, Sparkles } from 'lucide-react';

export default function Hero() {
  const scrollToProducts = () => {
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="inicio" className="relative min-h-[90vh] flex items-center overflow-hidden pt-28 md:pt-32 pb-20">
      {/* Unified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)]" />
      
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--celadon)]/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Centered Content */}
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-[var(--primary)]/10">
            <Leaf className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">Productos 100% Naturales</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[var(--foreground)] leading-[1.1]">
            Tu bienestar,{' '}
            <span className="text-[var(--primary)]">nuestra pasión</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
            Suplementos y productos orgánicos de la más alta calidad para cuidar tu salud de forma natural.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={scrollToProducts}
              className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium px-8 py-4 rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-[var(--primary)]/25"
            >
              Ver productos
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => document.getElementById('sobre-nosotros')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] font-medium px-6 py-4 rounded-full transition-colors"
            >
              Conocer más
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-8 text-sm">
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
              <span>Calidad certificada</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Truck className="w-5 h-5 text-[var(--primary)]" />
              <span>Envío rápido</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              <span>+2000 clientes felices</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
