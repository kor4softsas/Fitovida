import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { query } from './src/lib/db';

async function test() {
  try {
    const adminSales: any = await query('SELECT COUNT(*) as count FROM admin_sales');
    console.log("admin_sales count:", adminSales[0]?.count);

    const orders: any = await query('SELECT COUNT(*) as count FROM orders');
    console.log("orders count:", orders[0]?.count);

    const firstAdminSale: any = await query('SELECT created_at FROM admin_sales ORDER BY created_at ASC LIMIT 1');
    console.log("first admin_sale:", firstAdminSale[0]?.created_at);

    process.exit(0);
  } catch (e) {
    console.error("DEBUG ERROR:", e);
    process.exit(1);
  }
}
test();
