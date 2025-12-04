'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import CheckoutModal from '@/components/CheckoutModal';
import { useClerkSync } from '@/lib/useClerkSync';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// Rutas donde NO se muestra el Header/Footer (páginas de checkout)
const CHECKOUT_ROUTES = ['/checkout', '/checkout/pse', '/checkout/success'];

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // Sincronizar Clerk con el store local
  useClerkSync();
  
  // Verificar si estamos en una página de checkout
  const isCheckoutPage = CHECKOUT_ROUTES.some(route => pathname?.startsWith(route));

  // Si es página de checkout, mostrar solo el contenido sin navbar/footer
  if (isCheckoutPage) {
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
