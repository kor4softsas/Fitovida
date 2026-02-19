import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'month';

  try {
    // Calcular rango de fechas
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // all
        startDate = new Date('2020-01-01');
    }

    // Total de ventas (sin filtro de status si no existe la columna)
    let salesData: any[] = [];
    try {
      salesData = await query(
        `SELECT 
          COUNT(*) as sales_count,
          COALESCE(SUM(total), 0) as sales_amount,
          COALESCE(AVG(total), 0) as average_ticket
        FROM admin_sales
        WHERE created_at >= ?`,
        [startDate]
      ) as any[];
    } catch (err) {
      console.error('Error fetching sales data:', err);
      salesData = [];
    }

    // Total de productos vendidos
    let productsData: any[] = [];
    try {
      productsData = await query(
        `SELECT COALESCE(SUM(quantity), 0) as products_sold
        FROM admin_sale_items asi
        JOIN admin_sales a ON asi.sale_id = a.id
        WHERE a.created_at >= ?`,
        [startDate]
      ) as any[];
    } catch (err) {
      console.error('Error fetching products data:', err);
      productsData = [];
    }

    // Top 10 productos
    let topProducts: any[] = [];
    try {
      topProducts = await query(
        `SELECT 
          p.name,
          SUM(asi.quantity) as quantity,
          SUM(asi.quantity * asi.unit_price) as revenue
        FROM admin_sale_items asi
        JOIN admin_sales a ON asi.sale_id = a.id
        JOIN products p ON asi.product_id = p.id
        WHERE a.created_at >= ?
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 10`,
        [startDate]
      ) as any[];
    } catch (err) {
      console.error('Error fetching top products:', err);
      topProducts = [];
    }

    // Top 10 clientes
    let topCustomers: any[] = [];
    try {
      topCustomers = await query(
        `SELECT 
          CONCAT(COALESCE(a.customer_first_name, 'Cliente'), ' ', COALESCE(a.customer_last_name, '')) as name,
          COUNT(*) as purchases,
          SUM(a.total) as total
        FROM admin_sales a
        WHERE a.created_at >= ?
        GROUP BY a.customer_email
        ORDER BY total DESC
        LIMIT 10`,
        [startDate]
      ) as any[];
    } catch (err) {
      console.error('Error fetching top customers:', err);
      topCustomers = [];
    }

    // Desglose por categoría
    let categoriesData: any[] = [];
    try {
      categoriesData = await query(
        `SELECT 
          p.category,
          COALESCE(SUM(asi.quantity * asi.unit_price), 0) as amount
        FROM admin_sale_items asi
        JOIN admin_sales a ON asi.sale_id = a.id
        JOIN products p ON asi.product_id = p.id
        WHERE a.created_at >= ?
        GROUP BY p.category`,
        [startDate]
      ) as any[];
    } catch (err) {
      console.error('Error fetching categories:', err);
      categoriesData = [];
    }

    // Consolidar categorías
    const categoryMap: { [key: string]: number } = {};
    if (categoriesData && Array.isArray(categoriesData)) {
      for (const cat of categoriesData) {
        if (cat && cat.category) {
          categoryMap[cat.category] = (categoryMap[cat.category] || 0) + (cat.amount || 0);
        }
      }
    }

    const totalByCategory = Object.values(categoryMap).reduce((a, b) => a + b, 0);
    const categories_breakdown = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount: amount as number,
        percentage: totalByCategory > 0 ? ((amount as number / totalByCategory) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const report = {
      period,
      sales_count: salesData && salesData[0]?.sales_count ? Number(salesData[0].sales_count) : 0,
      sales_amount: salesData && salesData[0]?.sales_amount ? Number(salesData[0].sales_amount) : 0,
      products_sold: productsData && productsData[0]?.products_sold ? Number(productsData[0].products_sold) : 0,
      average_ticket: salesData && salesData[0]?.average_ticket ? Number(salesData[0].average_ticket) : 0,
      top_products: topProducts && Array.isArray(topProducts) ? topProducts.slice(0, 10) : [],
      top_customers: topCustomers && Array.isArray(topCustomers) ? topCustomers : [],
      categories_breakdown: categories_breakdown || []
    };

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    // Retornar datos vacíos en lugar de error
    return NextResponse.json(
      {
        period: period,
        sales_count: 0,
        sales_amount: 0,
        products_sold: 0,
        average_ticket: 0,
        top_products: [],
        top_customers: [],
        categories_breakdown: []
      },
      { status: 200 }
    );
  }
}
