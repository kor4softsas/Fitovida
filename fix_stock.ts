import { query } from './src/lib/db';

async function run() {
  const result = await query('UPDATE inventory_products SET current_stock = 0 WHERE current_stock < 0');
  console.log('Stocks negativos corregidos a 0:', JSON.stringify(result));
  const remaining = await query('SELECT product_id, current_stock FROM inventory_products WHERE current_stock < 0');
  console.log('Remaining negative:', JSON.stringify(remaining));
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
