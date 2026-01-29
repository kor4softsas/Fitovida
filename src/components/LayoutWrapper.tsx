'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import CheckoutModal from '@/components/CheckoutModal';
import { useAuthStore } from '@/lib/auth';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// Rutas donde NO se muestra el Header/Footer
const EXCLUDED_ROUTES = ['/checkout', '/checkout/pse', '/checkout/success', '/admin'];

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const { checkAuth } = useAuthStore();
  
  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // Verificar si estamos en una ruta excluida (checkout o admin)
  const isExcludedPage = EXCLUDED_ROUTES.some(route => pathname?.startsWith(route));

  // Si es página excluida, mostrar solo el contenido sin navbar/footer
  if (isExcludedPage) {
    return <>{children}</>;
  }

  // Para todas las demás páginas, mostrar layout completo
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CartSidebar />
      <CheckoutModal />
    </>
  );
}
