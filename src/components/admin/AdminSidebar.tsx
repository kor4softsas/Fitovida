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
  X,
  ShoppingBag
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
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#a0f4c8] text-[#005236]"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen flex flex-col py-8 gap-2 bg-[#f2f4f3] w-72 rounded-r-[3rem] shadow-[0_20px_40px_rgba(1,45,29,0.06)]
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="px-8 mb-10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#012d1d] to-[#005236] flex items-center justify-center text-white overflow-hidden shrink-0">
              <Image 
                src="/img/logo.png"
                width={40} 
                height={40}
                alt="Fitovida" 
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <TrendingUp className="text-white hidden" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#012d1d] tracking-tight">Fitovida</h1>
              <p className="text-[10px] uppercase tracking-widest text-[#414844]/60 font-bold">Panel Admin</p>
            </div>
          </Link>
        </div>

        {/* User info */}
        {user && (
          <div className="px-8 mb-6">
            <p className="text-sm font-bold text-[#012d1d]">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-[#414844]/70">{user.email}</p>
          </div>
        )}

        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto w-full">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  mx-4 py-3 px-6 flex items-center gap-4 transition-all duration-200 active:scale-95
                  ${isActive 
                    ? 'bg-[#a0f4c8] text-[#005236] rounded-full shadow-lg font-bold' 
                    : 'text-[#414844] rounded-full hover:bg-[#e6e9e8] hover:scale-[1.02]'
                  }
                `}
              >
                <IconComponent size={20} />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-8 mt-auto flex flex-col gap-6 py-6 border-t border-[#e6e9e8]">
          <Link
            href="/"
            className="text-[#414844]/60 flex items-center gap-3 px-2 py-2 text-sm font-medium hover:text-[#012d1d] transition-colors"
          >
            <Settings size={20} />
            Volver a la tienda
          </Link>
          
          <button
            onClick={handleLogout}
            className="text-[#414844]/60 flex items-center gap-3 px-2 py-2 text-sm font-medium hover:text-[#012d1d] transition-colors w-full text-left"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
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
