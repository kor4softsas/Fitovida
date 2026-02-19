import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Ventas de hoy
    const [todaySales] = await query(
      `SELECT COALESCE(SUM(total), 0) as amount FROM admin_sales 
       WHERE DATE(created_at) = CURDATE() AND payment_status = 'completed'`
    );

    // Ventas de esta semana
    const [weekSales] = await query(
      `SELECT COALESCE(SUM(total), 0) as amount FROM admin_sales 
       WHERE YEARWEEK(created_at) = YEARWEEK(NOW()) AND payment_status = 'completed'`
    );

    // Ventas de este mes
    const [monthSales] = await query(
      `SELECT COALESCE(SUM(total), 0) as amount FROM admin_sales 
       WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) AND payment_status = 'completed'`
    );

    // Ventas de este año
    const [yearSales] = await query(
      `SELECT COALESCE(SUM(total), 0) as amount FROM admin_sales 
       WHERE YEAR(created_at) = YEAR(NOW()) AND payment_status = 'completed'`
    );

    // Ordenes de clientes de hoy
    const [todayOrders] = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM orders 
       WHERE DATE(created_at) = CURDATE()`
    );

    // Total de productos
    const [totalProducts] = await query(
      `SELECT COUNT(*) as count FROM products`
    );

    // Productos con bajo stock
    const [lowStockProducts] = await query(
      `SELECT COUNT(*) as count FROM inventory_products 
       WHERE current_stock <= min_stock AND status = 'active'`
    );

    // Productos sin stock
    const [outOfStockProducts] = await query(
      `SELECT COUNT(*) as count FROM inventory_products 
       WHERE current_stock = 0 AND status = 'active'`
    );

    // Valor total de inventario
    const [inventoryValue] = await query(
      `SELECT COALESCE(SUM(current_stock * unit_cost), 0) as value FROM inventory_products 
       WHERE status = 'active'`
    );

    // Ingresos totales
    const [totalIncomes] = await query(
      `SELECT COALESCE(SUM(amount), 0) as amount FROM incomes 
       WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`
    );

    // Gastos totales
    const [totalExpenses] = await query(
      `SELECT COALESCE(SUM(amount), 0) as amount FROM expenses 
       WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())`
    );

    // Balance del mes
    const monthBalance = parseFloat(totalIncomes?.amount || 0) - parseFloat(totalExpenses?.amount || 0);

    // Órdenes pendientes
    const [pendingOrders] = await query(
      `SELECT COUNT(*) as count FROM orders 
       WHERE status IN ('pending', 'processing')`
    );

    // Ventas admin de hoy
    const [adminSalesToday] = await query(
      `SELECT COUNT(*) as count FROM admin_sales 
       WHERE DATE(created_at) = CURDATE() AND payment_status = 'completed'`
    );

    return NextResponse.json({
      sales: {
        today: parseFloat(todaySales?.amount || 0),
        week: parseFloat(weekSales?.amount || 0),
        month: parseFloat(monthSales?.amount || 0),
        year: parseFloat(yearSales?.amount || 0)
      },
      orders: {
        today_count: todayOrders[0]?.count || 0,
        today_amount: parseFloat(todayOrders[0]?.amount || 0),
        pending: pendingOrders[0]?.count || 0
      },
      inventory: {
        total_products: totalProducts[0]?.count || 0,
        low_stock: lowStockProducts[0]?.count || 0,
        out_of_stock: outOfStockProducts[0]?.count || 0,
        total_value: parseFloat(inventoryValue[0]?.value || 0)
      },
      finances: {
        total_income: parseFloat(totalIncomes?.amount || 0),
        total_expenses: parseFloat(totalExpenses?.amount || 0),
        balance: monthBalance,
        profit_margin: parseFloat(totalIncomes?.amount || 0) > 0 
          ? ((monthBalance / parseFloat(totalIncomes?.amount || 0)) * 100).toFixed(2)
          : '0'
      },
      admin_sales: {
        today_count: adminSalesToday[0]?.count || 0
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
