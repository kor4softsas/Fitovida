'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const galleryImages = [
  { id: 1, src: '/img/fitovida ecomerce/foto1.jpeg', alt: 'Fitovida Ecommerce 1' },
  { id: 2, src: '/img/fitovida ecomerce/foto2.jpeg', alt: 'Fitovida Ecommerce 2' },
  { id: 3, src: '/img/fitovida ecomerce/foto3.jpeg', alt: 'Fitovida Ecommerce 3' },
  { id: 4, src: '/img/fitovida ecomerce/foto4.jpeg', alt: 'Fitovida Ecommerce 4' },
  { id: 5, src: '/img/fitovida ecomerce/foto5.jpeg', alt: 'Fitovida Ecommerce 5' },
];

export default function GallerySection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    setAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    setAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setAutoPlay(false);
  };

  return (
    <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-white via-[var(--accent-light)]/8 to-white border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-sm font-medium text-[var(--steel-blue)] uppercase tracking-wider">TIENDAS</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mt-2 mb-4">
            Conoce nuestras sedes
          </h2>
          <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
            Visita nuestras tiendas y descubre la experiencia Fitovida.</p>
        </div>

        {/* Main Carousel */}
        <div className="relative mb-8 md:mb-12">
          <div className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden bg-[var(--background)] border border-[var(--border)]">
            {/* Image Container */}
            <div className="relative w-full h-full">
              {galleryImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-contain cursor-pointer hover:scale-105 transition-transform duration-500"
                    onClick={() => setSelectedImage(index)}
                    priority={index === 0}
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={goToPrevious}
              onMouseEnter={() => setAutoPlay(false)}
              onMouseLeave={() => setAutoPlay(true)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/80 hover:bg-white text-[var(--foreground)] transition-all duration-300 hover:shadow-lg backdrop-blur-sm hover:scale-110"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={goToNext}
              onMouseEnter={() => setAutoPlay(false)}
              onMouseLeave={() => setAutoPlay(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/80 hover:bg-white text-[var(--foreground)] transition-all duration-300 hover:shadow-lg backdrop-blur-sm hover:scale-110"
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 right-4 z-20 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              {currentIndex + 1} / {galleryImages.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-light)] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / galleryImages.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:bg-white/20 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <div className="relative h-[60vh] sm:h-[70vh] rounded-2xl overflow-hidden bg-black">
              <Image
                src={galleryImages[selectedImage].src}
                alt={galleryImages[selectedImage].alt}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Navigation in Lightbox */}
            <div className="flex items-center justify-between mt-4 px-2">
              <button
                onClick={() => {
                  setSelectedImage((prev) => (prev! - 1 + galleryImages.length) % galleryImages.length);
                }}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="text-white text-sm font-medium">
                {selectedImage + 1} / {galleryImages.length}
              </div>

              <button
                onClick={() => {
                  setSelectedImage((prev) => (prev! + 1) % galleryImages.length);
                }}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        :global(.animate-fade-in) {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}
