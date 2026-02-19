'use client';

import Link from 'next/link';
import Image from 'next/image';;
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Ventas', href: '/admin/ventas', icon: ShoppingCart },
  { name: 'Inventario', href: '/admin/inventario', icon: Package },
  { name: 'Ingresos y Gastos', href: '/admin/finanzas', icon: DollarSign },
  { name: 'Facturación', href: '/admin/facturas', icon: FileText },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Reportes', href: '/admin/reportes', icon: BarChart3 },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    // Limpiar autenticación de admin
    sessionStorage.removeItem('fitovida_admin_auth');
    await logout();
    router.push('/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-emerald-600 text-white"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-gray-900 text-white
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-gray-800">
            <Link href="/admin" className="flex items-center gap-3">
              <Image 
                src="/img/logo.png"
                width={40} 
                height={40}
                alt="Fitovida" 
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  // Fallback si no existe la imagen
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <TrendingUp className="text-emerald-500 hidden" size={32} />
              <div>
                <h1 className="text-xl font-bold">Fitovida</h1>
                <p className="text-xs text-gray-400">Panel Admin</p>
              </div>
            </Link>
          </div>

          {/* User info */}
          {user && (
            <div className="p-4 border-b border-gray-800">
              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <IconComponent size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-gray-300 hover:bg-gray-800 hover:text-white
                transition-colors duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
            
            <Link
              href="/"
              className="mt-2 w-full flex items-center justify-center px-4 py-2 rounded-lg
                text-sm text-gray-400 hover:text-white
                transition-colors duration-200"
            >
              ← Volver a la tienda
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
}
