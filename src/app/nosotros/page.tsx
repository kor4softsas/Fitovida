'use client';

import { ArrowRight, Heart, Award, Users, Leaf, Target, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ContactSection from '@/components/ContactSection';

const values = [
  {
    icon: Leaf,
    title: 'Naturaleza pura',
    description: 'Comprometidos con productos 100% naturales sin químicos dañinos'
  },
  {
    icon: Heart,
    title: 'Salud integral',
    description: 'Promovemos el bienestar holístico de nuestros clientes'
  },
  {
    icon: Award,
    title: 'Calidad garantizada',
    description: 'Proveedores certificados y productos con estándares internacionales'
  },
  {
    icon: Users,
    title: 'Comunidad',
    description: 'Construyendo una comunidad de personas comprometidas con su salud'
  },
];

const milestones = [
  {
    year: '2019',
    title: 'Nacimiento de Fitovida',
    description: 'Con la visión de acercar productos naturales a más personas'
  },
  {
    year: '2020',
    title: 'Crecimiento exponencial',
    description: '500+ clientes satisfechos, primera distribuidora nacional'
  },
  {
    year: '2022',
    title: 'Expansión digital',
    description: 'Lanzamiento de nuestra tienda online para llegar a todo el país'
  },
  {
    year: '2024',
    title: 'Líderes naturistas',
    description: '5000+ clientes activos y más de 200 productos en catálogo'
  },
];

const team = [
  {
    name: 'Diana Martínez',
    role: 'Fundadora & Directora',
    bio: 'Nutricionista certificada con 10+ años en medicina natural'
  },
  {
    name: 'Carlos Ruiz',
    role: 'Asesor de Productos',
    bio: 'Especialista en fitofarmacia y plantas medicinales'
  },
  {
    name: 'María González',
    role: 'Directora de Operaciones',
    bio: 'Experta en logística y distribución de productos naturales'
  },
];

const features = [
  'Productos 100% certificados',
  'Envío en 24-48 horas',
  'Garantía de satisfacción',
  'Asesoría especializada',
  'Precios competitivos',
  'Atención al cliente 24/7'
];

export default function NosotrosPage() {
  const scrollToProducts = () => {
    window.location.href = '/#productos';
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden pt-28 md:pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[var(--accent-light)]/15 to-[var(--background)]" />
        
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--celadon)]/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-[var(--primary)]/10">
              <Leaf className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Conoce nuestra historia</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--foreground)] leading-[1.1]">
              Sobre{' '}
              <span className="text-[var(--primary)]">Fitovida</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Más de 5 años dedicados a traer la naturaleza a tu vida, con productos de calidad certificada y asesoría experta.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={scrollToProducts}
                className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium px-8 py-4 rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-[var(--primary)]/25"
              >
                Ver productos
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] font-medium px-6 py-4 rounded-full transition-colors border border-[var(--border)] hover:border-[var(--primary)]/30"
              >
                Contactanos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Valores Principales */}
      <section className="py-16 md:py-20 lg:py-24 bg-white border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-4">
              Nuestros valores
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Principios que guían cada decisión en Fitovida
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="p-6 md:p-8 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-300 bg-white hover:bg-[var(--accent-light)]/5"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--accent-light)]/40 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                    {value.title}
                  </h3>
                  <p className="text-[var(--muted)]">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Historia y Timeline */}
      <section className="py-16 md:py-20 lg:py-24 bg-[var(--accent-light)]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-4">
              Nuestra trayectoria
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Un camino de crecimiento impulsado por la confianza de nuestros clientes
            </p>
          </div>

          <div className="space-y-8 md:space-y-12">
            {milestones.map((milestone, index) => (
              <div key={milestone.year} className="flex gap-6 md:gap-8">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[var(--primary)] border-4 border-white relative z-10" />
                  {index !== milestones.length - 1 && (
                    <div className="w-1 h-20 md:h-32 bg-gradient-to-b from-[var(--primary)] to-[var(--accent-light)] mt-2" />
                  )}
                </div>
                
                {/* Content */}
                <div className="pb-4 md:pb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)] text-white rounded-full text-sm font-semibold mb-2">
                    {milestone.year}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2">
                    {milestone.title}
                  </h3>
                  <p className="text-[var(--muted)]">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué elegirnos */}
      <section className="py-16 md:py-20 lg:py-24 bg-white border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Contenido */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-light)]/20 rounded-full border border-[var(--primary)]/10 mb-6">
                <Target className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">¿Por qué elegirnos?</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-6">
                La opción inteligente para tu bienestar
              </h2>

              <p className="text-lg text-[var(--muted)] mb-8 leading-relaxed">
                En Fitovida no solo vendemos productos, construimos relaciones basadas en la confianza y el compromiso con tu salud. Cada producto está cuidadosamente seleccionado y certificado para garantizar la máxima calidad.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                    <span className="text-[var(--foreground)] font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={scrollToProducts}
                className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium px-8 py-4 rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-[var(--primary)]/25"
              >
                Explorar catálogo
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Imagen/Ilustración */}
            <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden border border-[var(--border)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-light)]/10 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-20 h-20 text-[var(--primary)] mx-auto mb-4 opacity-50" />
                  <p className="text-[var(--muted)] font-semibold">Tu bienestar es nuestro compromiso</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-16 md:py-20 lg:py-24 bg-[var(--accent-light)]/5 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-4">
              Nuestro equipo
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Profesionales apasionados por la salud natural
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-48 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-light)]/20 flex items-center justify-center">
                  <Users className="w-16 h-16 text-[var(--primary)] opacity-50" />
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">
                    {member.name}
                  </h3>
                  <p className="text-[var(--primary)] font-semibold text-sm mb-3">
                    {member.role}
                  </p>
                  <p className="text-[var(--muted)]">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-16 md:py-20 lg:py-24 bg-white border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[var(--primary)] mb-2">
                5+
              </div>
              <p className="text-[var(--muted)] font-medium">Años de trayectoria</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[var(--primary)] mb-2">
                5000+
              </div>
              <p className="text-[var(--muted)] font-medium">Clientes satisfechos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[var(--primary)] mb-2">
                200+
              </div>
              <p className="text-[var(--muted)] font-medium">Productos disponibles</p>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[var(--primary)] mb-2">
                100%
              </div>
              <p className="text-[var(--muted)] font-medium">Naturales certificados</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1]">
              ¿Listo para cuidar tu bienestar?
            </h2>
            
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Únete a miles de clientes que confían en Fitovida para mejorar su salud de forma natural.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={scrollToProducts}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[var(--primary)] font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:shadow-xl"
              >
                Comprar ahora
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 text-white font-medium px-6 py-4 rounded-full transition-colors border border-white/30 hover:border-white/60"
              >
                Más información
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Contacto */}
      <section id="contacto">
        <ContactSection />
      </section>
    </>
  );
}
