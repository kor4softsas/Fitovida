'use client';

import { Leaf, ShieldCheck, Truck, HeartHandshake } from 'lucide-react';

const benefits = [
  {
    icon: Leaf,
    title: '100% natural',
    description: 'Productos orgánicos certificados'
  },
  {
    icon: ShieldCheck,
    title: 'Calidad garantizada',
    description: 'Proveedores certificados'
  },
  {
    icon: Truck,
    title: 'Envío rápido',
    description: 'Entrega en 24-48 horas'
  },
  {
    icon: HeartHandshake,
    title: 'Asesoría experta',
    description: 'Te ayudamos a elegir'
  },
];

export default function AboutSection() {
  return (
    <section id="sobre-nosotros" className="py-12 md:py-16 lg:py-20 bg-white border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Benefits Grid - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div key={benefit.title} className="text-center p-3 sm:p-4">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-light)]/40 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--primary)]" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-[var(--foreground)] mb-0.5 sm:mb-1">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-[var(--muted)]">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* Simple About Text */}
        <div className="mt-10 sm:mt-14 md:mt-16 pt-8 sm:pt-10 md:pt-12 border-t border-[var(--border)] text-center max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3 sm:mb-4">
            Tu tienda naturista de confianza
          </h2>
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            En Fitovida seleccionamos cuidadosamente cada producto para ofrecerte lo mejor de la naturaleza. 
            Más de 5 años ayudando a miles de clientes a mejorar su bienestar de forma natural.
          </p>
        </div>
      </div>
    </section>
  );
}
