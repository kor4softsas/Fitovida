'use client';

import { ArrowRight, Heart, Award, Users, Leaf, Target, Sparkles, Check, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ContactSection from '@/components/ContactSection';
import ImageCarousel from '@/components/ImageCarousel';
import { useState, useEffect } from 'react';

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
    description: 'Con la visión de acercar productos naturales a más personas',
    icon: Leaf,
    stat: 'Inicio',
    details: 'Fundación con enfoque en calidad natural'
  },
  {
    year: '2020',
    title: 'Crecimiento exponencial',
    description: '500+ clientes satisfechos, primera distribuidora nacional',
    icon: TrendingUp,
    stat: '500+',
    details: 'Clientes en toda la región'
  },
  {
    year: '2022',
    title: 'Expansión digital',
    description: 'Lanzamiento de nuestra tienda online para llegar a todo el país',
    icon: Zap,
    stat: 'Online',
    details: 'Alcance nacional 24/7'
  },
  {
    year: '2024',
    title: 'Líderes naturistas',
    description: '5000+ clientes activos y más de 200 productos en catálogo',
    icon: Award,
    stat: '5000+',
    details: '200 productos certificados'
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
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [animateTimeline, setAnimateTimeline] = useState(false);

  useEffect(() => {
    setAnimateTimeline(true);
  }, []);

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
      <section className="py-16 md:py-20 lg:py-24 bg-[var(--accent-light)]/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-4 animate-fade-in">
              Nuestra trayectoria
            </h2>
            <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
              Un camino de crecimiento impulsado por la confianza de nuestros clientes
            </p>
          </div>

          {/* Desktop Timeline - Horizontal */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Animated Timeline Line */}
              <div className="absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)]/20 via-[var(--primary)]/40 to-[var(--primary)]/20">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/60 transition-all duration-1000"
                  style={{ width: animateTimeline ? '100%' : '0%' }}
                />
              </div>

              {/* Timeline Items */}
              <div className="grid grid-cols-4 gap-4 relative z-10">
                {milestones.map((milestone, index) => {
                  const Icon = milestone.icon;
                  const isExpanded = expandedMilestone === milestone.year;
                  return (
                    <div 
                      key={milestone.year}
                      className="flex flex-col items-center"
                      style={{
                        animation: animateTimeline ? `slideUp 0.6s ease-out ${index * 0.15}s forwards` : 'none',
                        opacity: 0,
                      }}
                    >
                      {/* Circle with Icon */}
                      <button
                        onClick={() => setExpandedMilestone(isExpanded ? null : milestone.year)}
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 mb-6 group ${
                          isExpanded 
                            ? 'bg-[var(--primary)] shadow-lg shadow-[var(--primary)]/30 scale-110' 
                            : 'bg-white border-4 border-[var(--primary)] hover:bg-[var(--accent-light)]/10'
                        }`}
                      >
                        <Icon className={`w-8 h-8 transition-all ${isExpanded ? 'text-white' : 'text-[var(--primary)]'}`} />
                        {isExpanded && (
                          <div className="absolute inset-0 rounded-full animate-ping opacity-75" 
                            style={{ backgroundColor: 'var(--primary)', animation: 'pulse 2s infinite' }}
                          />
                        )}
                      </button>

                      {/* Card Content */}
                      <div className="w-full">
                        <div className="text-center mb-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--primary)] text-white rounded-full text-sm font-bold">
                            {milestone.year}
                          </span>
                        </div>

                        <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                          isExpanded 
                            ? 'border-[var(--primary)]/50 shadow-xl p-4' 
                            : 'border-[var(--border)] hover:border-[var(--primary)]/30 hover:shadow-lg p-3'
                        }`}>
                          <h3 className={`font-bold text-[var(--foreground)] transition-all ${isExpanded ? 'text-lg mb-3' : 'text-base mb-2'}`}>
                            {milestone.title}
                          </h3>

                          {isExpanded && (
                            <div className="space-y-3 animate-fade-in">
                              <p className="text-sm text-[var(--muted)] leading-relaxed">
                                {milestone.description}
                              </p>
                              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-center gap-2">
                                <span className="px-3 py-1 bg-[var(--primary)]/10 rounded-lg text-sm font-semibold text-[var(--primary)]">
                                  {milestone.stat}
                                </span>
                                <span className="text-xs text-[var(--muted)]">{milestone.details}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Timeline - Vertical */}
          <div className="lg:hidden">
            <div className="space-y-6 md:space-y-8">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon;
                const isExpanded = expandedMilestone === milestone.year;
                return (
                  <div 
                    key={milestone.year} 
                    className="flex gap-4 md:gap-6"
                    style={{
                      animation: animateTimeline ? `slideUp 0.6s ease-out ${index * 0.12}s forwards` : 'none',
                      opacity: 0,
                    }}
                  >
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => setExpandedMilestone(isExpanded ? null : milestone.year)}
                        className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 group z-10 ${
                          isExpanded 
                            ? 'bg-[var(--primary)] shadow-lg shadow-[var(--primary)]/30 scale-110' 
                            : 'bg-white border-4 border-[var(--primary)] hover:bg-[var(--accent-light)]/10'
                        }`}
                      >
                        <Icon className={`w-6 h-6 md:w-7 md:h-7 transition-all ${isExpanded ? 'text-white' : 'text-[var(--primary)]'}`} />
                      </button>
                      {index !== milestones.length - 1 && (
                        <div className={`w-1 h-24 md:h-32 mt-2 transition-all duration-500 ${
                          isExpanded ? 'bg-[var(--primary)]' : 'bg-gradient-to-b from-[var(--primary)] to-[var(--accent-light)]'
                        }`} />
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 pb-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary)] text-white rounded-full text-sm font-bold mb-2 md:mb-3">
                        {milestone.year}
                      </div>
                      
                      <button
                        onClick={() => setExpandedMilestone(isExpanded ? null : milestone.year)}
                        className={`w-full text-left bg-white rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-lg ${
                          isExpanded 
                            ? 'border-[var(--primary)]/50 shadow-xl p-4 md:p-5' 
                            : 'border-[var(--border)] hover:border-[var(--primary)]/30 p-3 md:p-4'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className={`font-bold text-[var(--foreground)] flex-1 transition-all ${isExpanded ? 'text-lg' : 'text-base md:text-lg'}`}>
                            {milestone.title}
                          </h3>
                          <div className="ml-2 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <Check className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 space-y-3 animate-fade-in">
                            <p className="text-sm text-[var(--muted)] leading-relaxed">
                              {milestone.description}
                            </p>
                            <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-2">
                              <div className="px-3 py-2 bg-[var(--primary)]/10 rounded-lg">
                                <p className="font-semibold text-sm text-[var(--primary)]">{milestone.stat}</p>
                              </div>
                              <div className="px-3 py-2 bg-[var(--accent-light)]/10 rounded-lg">
                                <p className="text-xs text-[var(--muted)]">{milestone.details}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          :global(.animate-fade-in) {
            animation: fade-in 0.4s ease-out;
          }
        `}</style>
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

            {/* Carrusel de Imágenes */}
            <div className="relative h-[400px] md:h-[500px]">
              <ImageCarousel />
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
      <section className="py-12 md:py-16 bg-white border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="group text-center p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/40 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer bg-white hover:bg-[var(--accent-light)]/5">
              <div className="text-3xl md:text-4xl font-bold text-[var(--primary)] mb-2 group-hover:scale-110 transition-transform duration-300">
                5+
              </div>
              <p className="text-sm md:text-base text-[var(--muted)] font-medium">Años de trayectoria</p>
            </div>
            <div className="group text-center p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/40 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer bg-white hover:bg-[var(--accent-light)]/5">
              <div className="text-3xl md:text-4xl font-bold text-[var(--primary)] mb-2 group-hover:scale-110 transition-transform duration-300">
                5000+
              </div>
              <p className="text-sm md:text-base text-[var(--muted)] font-medium">Clientes satisfechos</p>
            </div>
            <div className="group text-center p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/40 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer bg-white hover:bg-[var(--accent-light)]/5">
              <div className="text-3xl md:text-4xl font-bold text-[var(--primary)] mb-2 group-hover:scale-110 transition-transform duration-300">
                200+
              </div>
              <p className="text-sm md:text-base text-[var(--muted)] font-medium">Productos disponibles</p>
            </div>
            <div className="group text-center p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/40 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer bg-white hover:bg-[var(--accent-light)]/5">
              <div className="text-3xl md:text-4xl font-bold text-[var(--primary)] mb-2 group-hover:scale-110 transition-transform duration-300">
                100%
              </div>
              <p className="text-sm md:text-base text-[var(--muted)] font-medium">Naturales certificados</p>
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
