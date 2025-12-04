'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  Barcode, 
  DollarSign,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Settings,
  Bell
} from 'lucide-react';
import { useAdminAuthStore } from '@/lib/adminAuth';

const menuItems = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: LayoutDashboard,
    description: 'Vista general'
  },
  { 
    name: 'Usuarios', 
    href: '/admin/usuarios', 
    icon: Users,
    description: 'Gestión de usuarios'
  },
  { 
    name: 'Pedidos', 
    href: '/admin/pedidos', 
    icon: ShoppingCart,
    description: 'Gestión de pedidos'
  },
  { 
    name: 'Inventario', 
    href: '/admin/inventario', 
    icon: Package,
    description: 'Control de stock'
  },
  { 
    name: 'Productos', 
    href: '/admin/productos', 
    icon: Barcode,
    description: 'Generador de códigos'
  },
  { 
    name: 'Costos', 
    href: '/admin/costos', 
    icon: DollarSign,
    description: 'Gestión de costos'
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAdminAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Si es la página de login, no verificar autenticación
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isAuthenticated && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoginPage, router]);

  // Si es la página de login, renderizar solo el children
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Si no está autenticado, mostrar loading
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-green-800 to-green-900 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-green-700">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-green-800 font-bold text-lg">F</span>
            </div>
            <span className="text-white font-semibold text-lg">Fitovida Admin</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-green-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-green-100 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs opacity-70 truncate">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-green-100 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Volver a la tienda</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page title - hidden on mobile */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-gray-800">
                Panel de Administración
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Settings */}
              <Link 
                href="/admin/configuracion"
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </Link>

              {/* User menu */}
              <div className="relative z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[60]"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-[70] overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          {user?.role === 'super_admin' ? 'Super Admin' : 'Administrador'}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/admin/perfil"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Mi perfil
                        </Link>
                        <Link
                          href="/admin/configuracion"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Configuración
                        </Link>
                      </div>
                      <div className="border-t border-gray-100">
                        <button
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
