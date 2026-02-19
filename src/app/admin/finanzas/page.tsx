'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
  Calendar
} from 'lucide-react';
import type { Income, Expense } from '@/types/admin';

type TransactionType = 'income' | 'expense';

export default function FinanzasPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('income');

  useEffect(() => {
    const fetchFinances = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/finances');
        
        const data = await response.json();
        
        if (!data.records) {
          setIncomes([]);
          setExpenses([]);
          return;
        }
        
        // Mapear ingresos
        const mappedIncomes = (data.records || [])
          .filter((r: any) => r.type === 'income')
          .map((i: any) => ({
            id: i.id,
            date: new Date(i.date || i.created_at),
            amount: Number(i.amount) || 0,
            category: i.category || 'other',
            description: i.description || '',
            reference: i.reference || '',
            paymentMethod: i.payment_method || 'transfer',
            status: i.status || 'received',
            createdBy: i.created_by || '',
            createdAt: new Date(i.created_at)
          }));
        
        // Mapear gastos
        const mappedExpenses = (data.records || [])
          .filter((r: any) => r.type === 'expense')
          .map((e: any) => ({
            id: e.id,
            date: new Date(e.date || e.created_at),
            amount: Number(e.amount) || 0,
            category: e.category || 'other',
            description: e.description || '',
            reference: e.reference || '',
            paymentMethod: e.payment_method || 'transfer',
            status: e.status || 'paid',
            createdBy: e.created_by || '',
            createdAt: new Date(e.created_at)
          }));
        
        setIncomes(mappedIncomes);
        setExpenses(mappedExpenses);
      } catch (error) {
        console.error('Error cargando finanzas:', error);
        setIncomes([]);
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFinances();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const getCategoryLabel = (category: Income['category'] | Expense['category']) => {
    const labels: Record<string, string> = {
      sales: 'Ventas',
      services: 'Servicios',
      other: 'Otros',
      inventory: 'Inventario',
      salaries: 'Salarios',
      rent: 'Arriendo',
      utilities: 'Servicios Públicos',
      marketing: 'Marketing'
    };
    return labels[category] || category;
  };

  const getPaymentMethodLabel = (method: Income['paymentMethod'] | Expense['paymentMethod']) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      pse: 'PSE',
      wompi: 'Wompi'
    };
    return labels[method] || method;
  };

  // Combinar y ordenar transacciones
  const allTransactions = [
    ...incomes.map(i => ({ ...i, type: 'income' as const })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ingresos y Gastos</h1>
          <p className="text-gray-600 mt-1">Control financiero básico</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTransactionType('income');
              setShowTransactionModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={20} />
            Ingreso
          </button>
          <button
            onClick={() => {
              setTransactionType('expense');
              setShowTransactionModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={20} />
            Gasto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{incomes.length} transacciones</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="text-emerald-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gastos</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(totalExpense)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{expenses.length} transacciones</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="text-red-600" size={32} />
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
          balance >= 0 ? 'border-blue-500' : 'border-orange-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Balance</p>
              <p className={`text-2xl font-bold mt-2 ${
                balance >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatCurrency(balance)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {balance >= 0 ? 'Positivo' : 'Negativo'}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              <DollarSign className={balance >= 0 ? 'text-blue-600' : 'text-orange-600'} size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">Todas las transacciones</option>
            <option value="income">Solo Ingresos</option>
            <option value="expense">Solo Gastos</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={20} />
            Exportar
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Método de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Referencia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Monto
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron transacciones
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.type === 'income' ? (
                        <span className="flex items-center gap-2 text-emerald-600">
                          <TrendingUp size={16} />
                          <span className="text-sm font-medium">Ingreso</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-600">
                          <TrendingDown size={16} />
                          <span className="text-sm font-medium">Gasto</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      {'supplier' in transaction && transaction.supplier && (
                        <div className="text-xs text-gray-500">
                          Proveedor: {transaction.supplier}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getCategoryLabel(transaction.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.status === 'received' || transaction.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status === 'received' || transaction.status === 'paid' 
                          ? 'Completado' 
                          : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <TransactionModal
          type={transactionType}
          onClose={() => setShowTransactionModal(false)}
          onSave={(transaction) => {
            if (transactionType === 'income') {
              setIncomes([transaction as Income, ...incomes]);
            } else {
              setExpenses([transaction as Expense, ...expenses]);
            }
            setShowTransactionModal(false);
          }}
        />
      )}
    </div>
  );
}

// Transaction Modal Component
function TransactionModal({ 
  type, 
  onClose,
  onSave
}: { 
  type: TransactionType; 
  onClose: () => void;
  onSave: (transaction: Income | Expense) => void;
}) {
  const isIncome = type === 'income';
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    description: '',
    reference: '',
    paymentMethod: 'cash' as const,
    supplier: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isIncome) {
      const newIncome: Income = {
        id: `income-${Date.now()}`,
        date: new Date(formData.date),
        amount: formData.amount,
        category: formData.category as Income['category'],
        description: formData.description,
        reference: formData.reference || undefined,
        paymentMethod: formData.paymentMethod,
        status: 'received',
        notes: formData.notes || undefined,
        createdBy: 'admin',
        createdAt: new Date()
      };
      onSave(newIncome);
    } else {
      const newExpense: Expense = {
        id: `expense-${Date.now()}`,
        date: new Date(formData.date),
        amount: formData.amount,
        category: formData.category as Expense['category'],
        description: formData.description,
        supplier: formData.supplier || undefined,
        reference: formData.reference || undefined,
        paymentMethod: formData.paymentMethod,
        status: 'paid',
        notes: formData.notes || undefined,
        createdBy: 'admin',
        createdAt: new Date()
      };
      onSave(newExpense);
    }
  };

  const incomeCategories = ['sales', 'services', 'other'];
  const expenseCategories = ['inventory', 'services', 'salaries', 'rent', 'utilities', 'marketing', 'other'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isIncome ? (
              <>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="text-emerald-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Nuevo Ingreso</h2>
              </>
            ) : (
              <>
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="text-red-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Nuevo Gasto</h2>
              </>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="$0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select 
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Seleccionar categoría...</option>
              {(isIncome ? incomeCategories : expenseCategories).map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'sales' ? 'Ventas' :
                   cat === 'services' ? 'Servicios' :
                   cat === 'inventory' ? 'Inventario' :
                   cat === 'salaries' ? 'Salarios' :
                   cat === 'rent' ? 'Arriendo' :
                   cat === 'utilities' ? 'Servicios Públicos' :
                   cat === 'marketing' ? 'Marketing' :
                   'Otros'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Descripción de la transacción"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago *
              </label>
              <select 
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                {isIncome && (
                  <>
                    <option value="pse">PSE</option>
                    <option value="wompi">Wompi</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia (opcional)
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ej: V-001, C-001"
              />
            </div>
          </div>

          {!isIncome && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor (opcional)
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Nombre del proveedor"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                isIncome 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Guardar {isIncome ? 'Ingreso' : 'Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
