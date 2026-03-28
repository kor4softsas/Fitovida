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
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#005236]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#012d1d]">Ingresos y Gastos</h2>
          <p className="mt-1 font-medium text-[#414844]">Control financiero básico</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setTransactionType('income');
              setShowTransactionModal(true);
            }}
            className="flex items-center gap-2 rounded-full bg-[#005236] px-4 py-2 font-bold text-white transition-colors hover:bg-[#003d2d]"
          >
            <Plus size={20} />
            Ingreso
          </button>
          <button
            onClick={() => {
              setTransactionType('expense');
              setShowTransactionModal(true);
            }}
            className="flex items-center gap-2 rounded-full bg-[#ba1a1a] px-4 py-2 font-bold text-white transition-colors hover:bg-[#93000a]"
          >
            <Plus size={20} />
            Gasto
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-[2.5rem] bg-[#f2f4f3] p-8 transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Total Ingresos</p>
              <p className="mt-2 text-3xl font-extrabold text-[#005236]">
                {formatCurrency(totalIncome)}
              </p>
              <p className="mt-1 text-xs text-[#414844]">{incomes.length} transacciones</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#a0f4c8] text-[#005236]">
              <TrendingUp size={28} />
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-[#f2f4f3] p-8 transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Total Gastos</p>
              <p className="mt-2 text-3xl font-extrabold text-[#93000a]">
                {formatCurrency(totalExpense)}
              </p>
              <p className="mt-1 text-xs text-[#414844]">{expenses.length} transacciones</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffdad6] text-[#93000a]">
              <TrendingDown size={28} />
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] bg-[#f2f4f3] p-8 transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#414844]">Balance</p>
              <p className={`mt-2 text-3xl font-extrabold ${
                balance >= 0 ? 'text-[#005236]' : 'text-[#93000a]'
              }`}>
                {formatCurrency(balance)}
              </p>
              <p className="mt-1 text-xs text-[#414844]">
                {balance >= 0 ? 'Positivo' : 'Negativo'}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              balance >= 0 ? 'bg-[#cce6d0] text-[#506856]' : 'bg-amber-100 text-amber-900'
            }`}>
              <DollarSign size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[2rem] bg-[#f2f4f3] p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]" size={20} />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-[#e6e9e8] bg-white py-2 pl-10 pr-4 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="rounded-full border border-[#e6e9e8] bg-white px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
          >
            <option value="all">Todas las transacciones</option>
            <option value="income">Solo Ingresos</option>
            <option value="expense">Solo Gastos</option>
          </select>
          <button className="flex items-center gap-2 rounded-full border border-[#e6e9e8] bg-white px-4 py-2 font-bold text-[#414844] transition-colors hover:bg-[#e6e9e8]">
            <Download size={20} />
            Exportar
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-[2.5rem] bg-[#f2f4f3]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#d9ddd9] bg-[#e6e9e8]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                  Método de Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#414844]">
                  Referencia
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#414844]">
                  Monto
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#414844]">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e9e8] bg-white">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#414844]">
                    No se encontraron transacciones
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-[#f8faf9]">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#414844]">
                      {new Date(transaction.date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.type === 'income' ? (
                        <span className="flex items-center gap-2 text-[#005236]">
                          <TrendingUp size={16} />
                          <span className="text-sm font-bold">Ingreso</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-[#93000a]">
                          <TrendingDown size={16} />
                          <span className="text-sm font-bold">Gasto</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[#012d1d]">
                        {transaction.description}
                      </div>
                      {'supplier' in transaction && transaction.supplier && (
                        <div className="text-xs text-[#414844]">
                          Proveedor: {transaction.supplier}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#414844]">
                      {getCategoryLabel(transaction.category)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#414844]">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-[#414844]">
                      {transaction.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${
                        transaction.type === 'income' ? 'text-[#005236]' : 'text-[#93000a]'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        transaction.status === 'received' || transaction.status === 'paid'
                          ? 'bg-[#a0f4c8] text-[#005236]'
                          : 'bg-amber-50 text-amber-900'
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
          onSave={async (transaction) => {
            try {
              const payload = {
                type: transactionType,
                date: new Date(transaction.date).toISOString().split('T')[0],
                description: transaction.description,
                amount: transaction.amount,
                category: transaction.category,
                supplier: 'supplier' in transaction ? (transaction as any).supplier : undefined,
                reference: transaction.reference,
                payment_method: transaction.paymentMethod,
                status: transaction.status,
                notes: transaction.notes,
                created_by: 'admin'
              };

              const res = await fetch('/api/admin/finances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al guardar');
              }

              // Refetch para actualizar la lista desde la BD
              const refreshRes = await fetch('/api/admin/finances');
              if (refreshRes.ok) {
                const data = await refreshRes.json();
                const mappedIncomes = (data.records || [])
                  .filter((r: any) => r.type === 'income')
                  .map((i: any) => ({
                    id: i.id, date: new Date(i.date || i.created_at), amount: Number(i.amount) || 0,
                    category: i.category || 'other', description: i.description || '',
                    reference: i.reference || '', paymentMethod: i.payment_method || 'transfer',
                    status: i.status || 'received', createdBy: i.created_by || '', createdAt: new Date(i.created_at)
                  }));
                const mappedExpenses = (data.records || [])
                  .filter((r: any) => r.type === 'expense')
                  .map((e: any) => ({
                    id: e.id, date: new Date(e.date || e.created_at), amount: Number(e.amount) || 0,
                    category: e.category || 'other', description: e.description || '',
                    reference: e.reference || '', paymentMethod: e.payment_method || 'transfer',
                    status: e.status || 'paid', createdBy: e.created_by || '', createdAt: new Date(e.created_at)
                  }));
                setIncomes(mappedIncomes);
                setExpenses(mappedExpenses);
              }
              setShowTransactionModal(false);
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Error al guardar');
            }
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

  const [salesList, setSalesList] = useState<any[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  
  useEffect(() => {
    if (isIncome && formData.category === 'sales') {
      const fetchSales = async () => {
        setLoadingSales(true);
        try {
          const res = await fetch('/api/admin/sales');
          if (res.ok) {
            const data = await res.json();
            setSalesList(data.sales || []);
          }
        } catch (error) {
          console.error("Error loading sales:", error);
        } finally {
          setLoadingSales(false);
        }
      };
      if (salesList.length === 0) {
        fetchSales();
      }
    }
  }, [isIncome, formData.category, salesList.length]);

  const toggleSale = (sale: any) => {
    setSelectedSales((prev) => {
      const isSelected = prev.includes(sale.id);
      const newSelected = isSelected 
        ? prev.filter((id) => id !== sale.id)
        : [...prev, sale.id];
      
      const newAmount = salesList
        .filter((s) => newSelected.includes(s.id))
        .reduce((sum, s) => sum + Number(s.total), 0);
        
      const references = salesList
        .filter((s) => newSelected.includes(s.id))
        .map((s) => s.sale_number)
        .join(', ');
        
      setFormData((f) => ({
        ...f,
        amount: newAmount,
        description: newSelected.length > 0 ? `Ingreso por ventas: ${references}` : '',
        reference: references,
      }));
      
      return newSelected;
    });
  };

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
      <div className="w-full max-w-2xl rounded-[2.5rem] bg-white">
        <div className="flex items-center justify-between border-b border-[#e6e9e8] p-8">
          <div className="flex items-center gap-3">
            {isIncome ? (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a0f4c8] text-[#005236]">
                  <TrendingUp size={22} />
                </div>
                <h2 className="text-xl font-bold text-[#012d1d]">Nuevo Ingreso</h2>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffdad6] text-[#93000a]">
                  <TrendingDown size={22} />
                </div>
                <h2 className="text-xl font-bold text-[#012d1d]">Nuevo Gasto</h2>
              </>
            )}
          </div>
          <button onClick={onClose} className="text-[#414844] transition-colors hover:text-[#012d1d]">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 p-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#414844]">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#414844]">
                Monto *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                placeholder="$0"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">
              Categoría *
            </label>
            <select 
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
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

          {isIncome && formData.category === 'sales' && (
            <div className="rounded-[1.5rem] border border-[#e6e9e8] bg-[#f2f4f3] p-4">
              <label className="mb-2 block text-sm font-bold text-[#414844]">
                Seleccionar Ventas ({selectedSales.length} seleccionadas)
              </label>
              {loadingSales ? (
                <div className="flex items-center justify-center p-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#005236]"></div>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {salesList.length === 0 ? (
                    <p className="py-2 text-center text-sm text-[#414844]">No se encontraron ventas</p>
                  ) : (
                    salesList.map((sale) => {
                      const isSelected = selectedSales.includes(sale.id);
                      return (
                        <div 
                          key={sale.id}
                          onClick={() => toggleSale(sale)}
                          className={`flex cursor-pointer items-center justify-between rounded-[1rem] border p-3 transition-colors ${
                            isSelected 
                              ? 'border-[#6fc29a] bg-[#d9f7e8]' 
                              : 'border-[#e6e9e8] bg-white hover:border-[#9fc9b2]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              readOnly
                              className="mt-1 h-4 w-4 rounded border-[#c7cdc9] text-[#005236] focus:ring-[#005236]"
                            />
                            <div>
                              <p className="border-b border-transparent text-sm font-bold text-[#012d1d]">
                                {sale.sale_number} - {sale.customer_name || 'Cliente sin nombre'}
                              </p>
                              <p className="mt-0.5 text-xs text-[#414844]">
                                {new Date(sale.created_at).toLocaleDateString('es-CO')}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[#012d1d]">
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            }).format(Number(sale.total))}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">
              Descripción *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
              placeholder="Descripción de la transacción"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#414844]">
                Método de Pago *
              </label>
              <select 
                required
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
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
              <label className="mb-2 block text-sm font-bold text-[#414844]">
                Referencia (opcional)
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                placeholder="Ej: V-001, C-001"
              />
            </div>
          </div>

          {!isIncome && (
            <div>
              <label className="mb-2 block text-sm font-bold text-[#414844]">
                Proveedor (opcional)
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full rounded-full border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
                placeholder="Nombre del proveedor"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-[#414844]">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-[1.25rem] border border-[#e6e9e8] px-4 py-2 text-[#012d1d] focus:outline-none focus:ring-2 focus:ring-[#005236]"
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[#e6e9e8] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#e6e9e8] px-4 py-2 font-bold text-[#414844] transition-colors hover:bg-[#f2f4f3]"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className={`rounded-full px-4 py-2 font-bold text-white transition-colors ${
                isIncome 
                  ? 'bg-[#005236] hover:bg-[#003d2d]' 
                  : 'bg-[#ba1a1a] hover:bg-[#93000a]'
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
