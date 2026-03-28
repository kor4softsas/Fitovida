'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Search, Filter, MapPin, Mail, Phone, TrendingUp, X, Save } from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  department: string;
  total_orders: number;
  total_spent: number;
  last_purchase: string;
  status: 'active' | 'inactive';
}

type ModalType = 'view' | 'edit' | 'new' | null;

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('total_spent');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    department: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/admin/customers');
        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalType('view');
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      department: customer.department
    });
    setModalType('edit');
  };

  const openNewModal = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      city: '',
      department: ''
    });
    setSelectedCustomer(null);
    setModalType('new');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedCustomer(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.email) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Recargar clientes
        const data = await fetch('/api/admin/customers');
        const newData = await data.json();
        setCustomers(newData.customers || []);
        alert('Cliente guardado exitosamente');
        closeModal();
      } else {
        alert('Error al guardar el cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers
    .filter(customer => 
      customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'total_spent') return b.total_spent - a.total_spent;
      if (sortBy === 'orders') return b.total_orders - a.total_orders;
      return a.last_purchase.localeCompare(b.last_purchase);
    });

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#e6e9e8] bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-[#012d1d]">
              <Users className="text-[#005236]" size={32} />
              Clientes
            </h1>
            <p className="mt-1 font-medium text-[#414844]">Gestión y seguimiento de clientes</p>
          </div>
          <button 
            onClick={openNewModal}
            className="flex items-center gap-2 rounded-full bg-[#012d1d] px-4 py-2 font-bold text-white transition-colors hover:bg-[#005236]">
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 rounded-[2rem] bg-[#f2f4f3] p-4">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-3 text-[#414844]" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-[#e6e9e8] bg-white py-2 pl-10 pr-4 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
          >
            <option value="total_spent">Mayor gasto</option>
            <option value="orders">Más pedidos</option>
            <option value="recent">Más reciente</option>
          </select>
          <button className="flex items-center gap-2 rounded-full border border-[#e6e9e8] bg-white px-4 py-2 font-bold text-[#414844] transition-colors hover:bg-[#e6e9e8]">
            <Filter size={20} />
            Filtrar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-[#414844]">Cargando clientes...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto mb-4 text-[#9aa39f]" size={48} />
            <p className="font-medium text-[#414844]">No hay clientes para mostrar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="rounded-[2rem] border border-[#e6e9e8] bg-[#f2f4f3] p-6 transition hover:shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#012d1d]">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      customer.status === 'active' 
                        ? 'bg-[#a0f4c8] text-[#005236]' 
                        : 'bg-[#e6e9e8] text-[#414844]'
                    }`}>
                      {customer.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <button className="text-[#414844] hover:text-[#012d1d]">
                    ⋮
                  </button>
                </div>

                {/* Información de contacto */}
                <div className="mb-4 space-y-2 text-sm text-[#414844]">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <a href={`mailto:${customer.email}`} className="text-[#005236] hover:underline">
                      {customer.email}
                    </a>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <a href={`tel:${customer.phone}`} className="text-[#005236] hover:underline">
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{customer.city}, {customer.department}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-4 grid grid-cols-3 gap-2 border-t border-[#e6e9e8] pt-4">
                  <div>
                    <p className="text-xs text-[#414844]">Compras</p>
                    <p className="text-lg font-bold text-[#012d1d]">{customer.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#414844]">Gasto Total</p>
                    <p className="text-lg font-bold text-[#005236]">
                      ${(customer.total_spent / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#414844]">Última Compra</p>
                    <p className="text-xs font-bold text-[#012d1d]">
                      {new Date(customer.last_purchase).toLocaleDateString('es-CO', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-[#e6e9e8] pt-4">
                  <button 
                    onClick={() => openViewModal(customer)}
                    className="flex-1 rounded-full border border-[#cce6d0] px-3 py-2 text-sm font-bold text-[#005236] transition hover:bg-[#dceee1]">
                    Ver Historial
                  </button>
                  <button 
                    onClick={() => openEditModal(customer)}
                    className="flex-1 rounded-full border border-[#e6e9e8] px-3 py-2 text-sm font-bold text-[#414844] transition hover:bg-[#e6e9e8]">
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumen */}
        {filteredCustomers.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-[1.5rem] bg-[#f2f4f3] p-4">
              <p className="text-sm text-[#414844]">Total Clientes</p>
              <p className="text-2xl font-extrabold text-[#012d1d]">{customers.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#f2f4f3] p-4">
              <p className="text-sm text-[#414844]">Clientes Activos</p>
              <p className="text-2xl font-extrabold text-[#005236]">
                {customers.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[#f2f4f3] p-4">
              <p className="text-sm text-[#414844]">Gasto Promedio</p>
              <p className="text-2xl font-extrabold text-[#005236]">
                ${(customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length).toLocaleString('es-CO', {
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-[#f2f4f3] p-4">
              <p className="text-sm text-[#414844]">Compras Totales</p>
              <p className="text-2xl font-extrabold text-[#012d1d]">
                {customers.reduce((sum, c) => sum + c.total_orders, 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {modalType === 'view' && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#012d1d]/20 p-4 backdrop-blur-[2px]">
          <div className="mx-4 w-full max-w-md rounded-[2.5rem] bg-white p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#012d1d]">Historial del Cliente</h2>
              <button onClick={closeModal} className="text-[#414844] hover:text-[#012d1d]">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#414844]">Nombre</p>
                <p className="text-lg font-bold text-[#012d1d]">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
              </div>

              <div>
                <p className="text-sm text-[#414844]">Email</p>
                <p className="text-[#012d1d]">{selectedCustomer.email}</p>
              </div>

              <div>
                <p className="text-sm text-[#414844]">Teléfono</p>
                <p className="text-[#012d1d]">{selectedCustomer.phone || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-[#e6e9e8] pt-4">
                <div className="text-center">
                  <p className="text-sm text-[#414844]">Compras</p>
                  <p className="text-2xl font-bold text-[#012d1d]">{selectedCustomer.total_orders}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#414844]">Gasto Total</p>
                  <p className="text-2xl font-bold text-[#005236]">
                    ${selectedCustomer.total_spent.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#414844]">Última Compra</p>
                  <p className="text-sm font-bold text-[#012d1d]">
                    {new Date(selectedCustomer.last_purchase).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#e6e9e8] pt-4">
                <p className="text-sm text-[#414844]">Ciudad</p>
                <p className="text-[#012d1d]">{selectedCustomer.city}, {selectedCustomer.department}</p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="mt-6 w-full rounded-full bg-[#005236] px-4 py-2 font-bold text-white transition-colors hover:bg-[#003d2d]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Edit/New Modal */}
      {(modalType === 'edit' || modalType === 'new') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#012d1d]/20 p-4 backdrop-blur-[2px]">
          <div className="mx-4 w-full max-w-md rounded-[2.5rem] bg-white p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#012d1d]">
                {modalType === 'edit' ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={closeModal} className="text-[#414844] hover:text-[#012d1d]">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#414844]">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Nombre"
                    className="w-full rounded-full border border-[#e6e9e8] px-3 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-[#414844]">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Apellido"
                    className="w-full rounded-full border border-[#e6e9e8] px-3 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#414844]">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="cliente@example.com"
                  className="w-full rounded-full border border-[#e6e9e8] px-3 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[#414844]">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+57 (2) XXXX-XXXX"
                  className="w-full rounded-full border border-[#e6e9e8] px-3 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#414844]">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Cali"
                    className="w-full rounded-full border border-[#e6e9e8] px-3 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-[#414844]">
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Valle del Cauca"
                    className="w-full rounded-full border border-[#e6e9e8] px-3 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#e6e9e8] pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-full border border-[#e6e9e8] px-4 py-2 font-bold text-[#414844] transition hover:bg-[#f2f4f3]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#005236] px-4 py-2 font-bold text-white transition hover:bg-[#003d2d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={16} />
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
