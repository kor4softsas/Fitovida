import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import CheckoutModal from "@/components/CheckoutModal";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fitovida - Tienda Naturista",
  description: "Tu tienda naturista de confianza. Productos naturales para tu salud y bienestar.",
  keywords: ["tienda naturista", "vitaminas", "suplementos", "hierbas", "aceites", "proteinas", "salud natural"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth">
        <body className={`${inter.className} antialiased`}>
          <Header />
          <main>{children}</main>
          <Footer />
          <CartSidebar />
          <CheckoutModal />
        </body>
      </html>
    </ClerkProvider>
  );
}
