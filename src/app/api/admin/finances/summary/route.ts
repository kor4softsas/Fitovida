import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Obtener fechas por defecto (este mes)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDate = fromDate || firstDay.toISOString().split('T')[0];
    const endDate = toDate || lastDay.toISOString().split('T')[0];

    // Sumar ingresos
    const [incomeResult] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?`,
      [startDate, endDate]
    );

    // Sumar gastos
    const [expenseResult] = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?`,
      [startDate, endDate]
    );

    // Ventas por método de pago (admin_sales)
    const paymentMethods = await query(
      `SELECT payment_method, COALESCE(SUM(total), 0) as total, COUNT(*) as count
       FROM admin_sales
       WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? AND payment_status = 'completed'
       GROUP BY payment_method`,
      [startDate, endDate]
    );

    // Órdenes de cliente
    const clientOrders = await query(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_amount
       FROM orders
       WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? AND status IN ('completed', 'shipped')`,
      [startDate, endDate]
    );

    // Top 5 productos más vendidos
    const topProducts = await query(
      `SELECT 
        p.name, 
        SUM(COALESCE(oi.quantity, 0) + COALESCE(asi.quantity, 0)) as total_quantity,
        SUM(COALESCE(oi.quantity, 0) * COALESCE(oi.price, 0) + COALESCE(asi.quantity, 0) * COALESCE(asi.unit_price, 0)) as total_amount
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN admin_sale_items asi ON p.id = asi.product_id
      WHERE DATE(COALESCE(oi.created_at, asi.created_at)) >= ? AND DATE(COALESCE(oi.created_at, asi.created_at)) <= ?
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 5`,
      [startDate, endDate]
    );

    // Gastos por categoría
    const expensesByCategory = await query(
      `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
       FROM expenses
       WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
       GROUP BY category`,
      [startDate, endDate]
    );

    const totalIncome = incomeResult?.total || 0;
    const totalExpense = expenseResult?.total || 0;
    const balance = totalIncome - totalExpense;

    return NextResponse.json({
      summary: {
        period: {
          from: startDate,
          to: endDate
        },
        income: parseFloat(totalIncome),
        expenses: parseFloat(totalExpense),
        balance: balance,
        profit_margin: totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(2) : '0'
      },
      sales: {
        payment_methods: paymentMethods,
        admin_sales_total: paymentMethods.reduce((sum: any, p: any) => sum + parseFloat(p.total), 0),
        client_orders: clientOrders[0]
      },
      top_products: topProducts,
      expenses_by_category: expensesByCategory
    });
  } catch (error) {
    console.error('Error en GET /api/admin/finances/summary:', error);
    return NextResponse.json(
      { error: 'Error al obtener resumen de finanzas' },
      { status: 500 }
    );
  }
}
