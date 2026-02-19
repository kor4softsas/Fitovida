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
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="text-purple-600" size={32} />
              Clientes
            </h1>
            <p className="text-gray-600 mt-1">Gestión y seguimiento de clientes</p>
          </div>
          <button 
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="total_spent">Mayor gasto</option>
            <option value="orders">Más pedidos</option>
            <option value="recent">Más reciente</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Filter size={20} />
            Filtrar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando clientes...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">No hay clientes para mostrar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    ⋮
                  </button>
                </div>

                {/* Información de contacto */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                      {customer.email}
                    </a>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
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
                <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Compras</p>
                    <p className="text-lg font-bold text-gray-900">{customer.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gasto Total</p>
                    <p className="text-lg font-bold text-purple-600">
                      ${(customer.total_spent / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Última Compra</p>
                    <p className="text-xs font-medium text-gray-900">
                      {new Date(customer.last_purchase).toLocaleDateString('es-CO', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => openViewModal(customer)}
                    className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition">
                    Ver Historial
                  </button>
                  <button 
                    onClick={() => openEditModal(customer)}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition">
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Clientes Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Gasto Promedio</p>
              <p className="text-2xl font-bold text-purple-600">
                ${(customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length).toLocaleString('es-CO', {
                  maximumFractionDigits: 0
                })}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Compras Totales</p>
              <p className="text-2xl font-bold text-orange-600">
                {customers.reduce((sum, c) => sum + c.total_orders, 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {modalType === 'view' && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Historial del Cliente</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-lg font-semibold text-gray-900">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900">{selectedCustomer.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="text-gray-900">{selectedCustomer.phone || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Compras</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedCustomer.total_orders}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Gasto Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${selectedCustomer.total_spent.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Última Compra</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedCustomer.last_purchase).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">Ciudad</p>
                <p className="text-gray-900">{selectedCustomer.city}, {selectedCustomer.department}</p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Edit/New Modal */}
      {(modalType === 'edit' || modalType === 'new') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {modalType === 'edit' ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Nombre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Apellido"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="cliente@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+57 (2) XXXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Cali"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Valle del Cauca"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
