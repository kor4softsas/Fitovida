import { query } from './src/lib/db';

async function run() {
  try {
    const orders = await query('DESCRIBE orders');
    console.log('orders\n', orders);
    const orderItems = await query('DESCRIBE order_items');
    console.log('order_items\n', orderItems);
    const adminSales = await query('DESCRIBE admin_sales');
    console.log('admin_sales\n', adminSales);
    const adminSaleItems = await query('DESCRIBE admin_sale_items');
    console.log('admin_sale_items\n', adminSaleItems);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

run();
