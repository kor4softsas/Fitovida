'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { User, Package, Settings, ChevronRight, Calendar, MapPin, Phone, Mail, Edit2, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';

type Tab = 'perfil' | 'compras' | 'configuracion';

// Mock purchases data - in production this would come from your database
const mockPurchases = [
  {
    id: '1',
    orderNumber: 'FV-2024-001',
    date: '2024-11-25',
    total: 285000,
    status: 'delivered' as const,
    items: [
      { name: 'Colageno Hidrolizado', quantity: 2, price: 145000, image: '/img/PHOTO-2025-06-24-16-41-57.jpg' },
    ]
  },
  {
    id: '2', 
    orderNumber: 'FV-2024-002',
    date: '2024-11-27',
    total: 180000,
    status: 'processing' as const,
    items: [
      { name: 'Omega 3', quantity: 1, price: 95000, image: '/img/PHOTO-2025-06-24-16-41-57.jpg' },
      { name: 'Vitamina D3', quantity: 1, price: 85000, image: '/img/PHOTO-2025-06-24-16-41-57.jpg' },
    ]
  }
];

const statusLabels = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: ''
  });

  // Redirect if not logged in
  if (isLoaded && !user) {
    router.push('/login');
    return null;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const handleEdit = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: (user?.publicMetadata?.phone as string) || '',
      address: (user?.publicMetadata?.address as string) || '',
      city: (user?.publicMetadata?.city as string) || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      // Note: publicMetadata can only be updated from the backend
      // For now we just update the basic info
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'perfil' as Tab, label: 'Mi perfil', icon: User },
    { id: 'compras' as Tab, label: 'Mis compras', icon: Package },
    { id: 'configuracion' as Tab, label: 'Configuracion', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[var(--accent-light)]/10 to-[var(--background)] pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold">
              {user?.firstName?.[0]?.toUpperCase() || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-[var(--muted)] text-sm">{user?.emailAddresses[0]?.emailAddress}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--accent-light)]/50 text-[var(--primary)] text-xs font-medium rounded-full">
                Comprador
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-3 h-fit">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6">
            {activeTab === 'perfil' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Informacion personal</h2>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--accent-light)]/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Guardar
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Nombre</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    ) : (
                      <p className="text-[var(--foreground)] font-medium">{user?.firstName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Apellido</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    ) : (
                      <p className="text-[var(--foreground)] font-medium">{user?.lastName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Correo electronico
                    </label>
                    <p className="text-[var(--foreground)] font-medium">{user?.emailAddresses[0]?.emailAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Telefono
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Tu numero de telefono"
                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    ) : (
                      <p className="text-[var(--foreground)] font-medium">{(user?.publicMetadata?.phone as string) || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Direccion
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Tu direccion"
                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    ) : (
                      <p className="text-[var(--foreground)] font-medium">{(user?.publicMetadata?.address as string) || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">Ciudad</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Tu ciudad"
                        className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    ) : (
                      <p className="text-[var(--foreground)] font-medium">{(user?.publicMetadata?.city as string) || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Miembro desde
                    </label>
                    <p className="text-[var(--foreground)] font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CO', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compras' && (
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">Historial de compras</h2>
                
                {mockPurchases.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-[var(--muted)] mx-auto mb-3" />
                    <p className="text-[var(--muted)]">Aun no tienes compras</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockPurchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">{purchase.orderNumber}</p>
                            <p className="text-sm text-[var(--muted)]">
                              {new Date(purchase.date).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 text-xs font-medium rounded-full",
                            statusLabels[purchase.status].color
                          )}>
                            {statusLabels[purchase.status].label}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          {purchase.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm">
                              <span className="text-[var(--muted)]">{item.quantity}x</span>
                              <span className="text-[var(--foreground)]">{item.name}</span>
                              <span className="text-[var(--muted)] ml-auto">{formatPrice(item.price)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                          <span className="font-semibold text-[var(--foreground)]">Total: {formatPrice(purchase.total)}</span>
                          <button className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline">
                            Ver detalles
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'configuracion' && (
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">Configuracion de cuenta</h2>
                
                <div className="space-y-4">
                  <button
                    onClick={() => user?.createEmailAddress}
                    className="w-full flex items-center justify-between p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-[var(--muted)]" />
                      <div className="text-left">
                        <p className="font-medium text-[var(--foreground)]">Cambiar correo electronico</p>
                        <p className="text-sm text-[var(--muted)]">Actualiza tu direccion de correo</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--muted)]" />
                  </button>

                  <button
                    className="w-full flex items-center justify-between p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-[var(--muted)]" />
                      <div className="text-left">
                        <p className="font-medium text-[var(--foreground)]">Cambiar contrasena</p>
                        <p className="text-sm text-[var(--muted)]">Actualiza tu contrasena de acceso</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--muted)]" />
                  </button>

                  <div className="pt-4 border-t border-[var(--border)]">
                    <button
                      className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                    >
                      Eliminar mi cuenta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
