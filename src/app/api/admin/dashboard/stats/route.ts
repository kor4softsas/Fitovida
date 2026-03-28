import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function isSchemaIssue(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = String((error as { code?: string }).code || '');
  return [
    'ER_NO_SUCH_TABLE',
    'ER_BAD_FIELD_ERROR',
    'ER_BAD_DB_ERROR'
  ].includes(code);
}

function isDatabaseIssue(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = String((error as { code?: string }).code || '');
  return [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    'ER_ACCESS_DENIED_ERROR',
    'ER_ACCESS_DENIED_NO_PASSWORD_ERROR'
  ].includes(code);
}

async function safeFirstRow<T extends Record<string, any>>(
  sql: string,
  fallback: T
): Promise<T> {
  try {
    const [row] = await query<T>(sql);
    return (row || fallback) as T;
  } catch (error) {
    if (isSchemaIssue(error) || isDatabaseIssue(error)) {
      return fallback;
    }
    throw error;
  }
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function GET(request: NextRequest) {
  try {
    // Ventas de hoy
    const todaySales = await safeFirstRow(
      `SELECT COALESCE(SUM(total), 0) as amount FROM admin_sales 
       WHERE DATE(created_at) = CURDATE() AND payment_status = 'completed'`,
      { amount: 0 }
    );

    // Ventas de esta semana
    const weekSales = await safeFirstRow(
      `SELECT COALESCE(SUM(total), 0) as amount FROM admin_sales 
       WHERE YEARWEEK(created_at) = YEARWEEK(NOW()) AND payment_status = 'completed'`,
      { amount: 0 }
    );

    // Ventas de este mes
    const monthSales = await safeFirstRow(
      `SELECT COALESCE(SUM(total), 0) as amount FROM admin_sales 
       WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) AND payment_status = 'completed'`,
      { amount: 0 }
    );

    // Ventas de este año
    const yearSales = await safeFirstRow(
      `SELECT COALESCE(SUM(total), 0) as amount FROM admin_sales 
       WHERE YEAR(created_at) = YEAR(NOW()) AND payment_status = 'completed'`,
      { amount: 0 }
    );

    // Ordenes de clientes de hoy
    const todayOrders = await safeFirstRow(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM orders 
       WHERE DATE(created_at) = CURDATE()`,
      { count: 0, amount: 0 }
    );

    // Total de productos en inventario activo
    const totalProducts = await safeFirstRow(
      `SELECT COUNT(*) as count FROM inventory_products WHERE status = 'active'`,
      { count: 0 }
    );

    // Productos con bajo stock
    const lowStockProducts = await safeFirstRow(
      `SELECT COUNT(*) as count FROM inventory_products 
       WHERE current_stock <= min_stock AND status = 'active'`,
      { count: 0 }
    );

    // Productos sin stock
    const outOfStockProducts = await safeFirstRow(
      `SELECT COUNT(*) as count FROM inventory_products 
       WHERE current_stock = 0 AND status = 'active'`,
      { count: 0 }
    );

    // Valor total de inventario
    const inventoryValue = await safeFirstRow(
      `SELECT COALESCE(SUM(current_stock * unit_cost), 0) as value FROM inventory_products 
       WHERE status = 'active'`,
      { value: 0 }
    );

    // Ingresos totales
    const totalIncomes = await safeFirstRow(
      `SELECT COALESCE(SUM(amount), 0) as amount FROM incomes 
       WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`,
      { amount: 0 }
    );

    // Gastos totales
    const totalExpenses = await safeFirstRow(
      `SELECT COALESCE(SUM(amount), 0) as amount FROM expenses 
       WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`,
      { amount: 0 }
    );

    // Balance del mes
    const totalIncomeAmount = toNumber(totalIncomes?.amount);
    const totalExpenseAmount = toNumber(totalExpenses?.amount);
    const monthBalance = totalIncomeAmount - totalExpenseAmount;

    // Órdenes pendientes
    const pendingOrders = await safeFirstRow(
      `SELECT COUNT(*) as count FROM orders 
       WHERE status IN ('pending', 'processing')`,
      { count: 0 }
    );

    // Ventas admin de hoy
    const adminSalesToday = await safeFirstRow(
      `SELECT COUNT(*) as count FROM admin_sales 
       WHERE DATE(created_at) = CURDATE() AND payment_status = 'completed'`,
      { count: 0 }
    );

    return NextResponse.json({
      sales: {
        today: toNumber(todaySales?.amount),
        week: toNumber(weekSales?.amount),
        month: toNumber(monthSales?.amount),
        year: toNumber(yearSales?.amount)
      },
      orders: {
        today_count: todayOrders?.count || 0,
        today_amount: toNumber(todayOrders?.amount),
        pending: pendingOrders?.count || 0
      },
      inventory: {
        total_products: totalProducts?.count || 0,
        low_stock: lowStockProducts?.count || 0,
        out_of_stock: outOfStockProducts?.count || 0,
        total_value: toNumber(inventoryValue?.value)
      },
      finances: {
        total_income: totalIncomeAmount,
        total_expenses: totalExpenseAmount,
        balance: monthBalance,
        profit_margin: totalIncomeAmount > 0
          ? ((monthBalance / totalIncomeAmount) * 100).toFixed(2)
          : '0'
      },
      admin_sales: {
        today_count: adminSalesToday?.count || 0
      }
    });
  } catch (error) {
    console.error('Error en GET /api/admin/dashboard/stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del dashboard' },
      { status: 500 }
    );
  }
}
