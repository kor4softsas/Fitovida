import { query } from './src/lib/db';

async function test() {
  try {
    const orders = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
    console.log(`Encontramos ${orders.length} pedidos en la tabla orders.`);
    if (orders.length > 0) {
      console.log('Sample order ID:', orders[0].id, 'Customer:', orders[0].customer_name);
    }
  } catch (error) {
    console.error('Error querying orders table:', error);
  }
  process.exit(0);
}

test();
