import { query } from './src/lib/db';

async function run() {
  // Precios guardados en la venta vs precios en inventario
  const result = await query(`
    SELECT 
      asi.product_name,
      asi.quantity,
      asi.unit_price as precio_en_venta,
      asi.tax as iva_en_venta,
      asi.subtotal as subtotal_en_venta,
      asi.total as total_en_venta,
      ip.selling_price as precio_inventario,
      ip.tax_rate as iva_inventario
    FROM admin_sale_items asi
    LEFT JOIN inventory_products ip ON ip.product_id = asi.product_id
    LIMIT 20
  `);
  console.table(result);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
