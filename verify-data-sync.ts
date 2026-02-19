import mysql from 'mysql2/promise';
import { products } from './src/lib/products';

interface MysqlProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fitovida',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function verifyAndSyncData() {
  console.log('🔍 Iniciando verificación de sincronización de datos...\n');

  try {
    // 1. Verificar conexión a la BD
    console.log('✓ Conectando a la base de datos...');
    const connection = await pool.getConnection();
    console.log('✓ Conexión exitosa a MySQL\n');

    // 2. Verificar que la tabla products existe
    console.log('✓ Verificando tabla products...');
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'",
      [process.env.DB_NAME || 'fitovida']
    ) as any[];

    if (tables.length === 0) {
      console.log('⚠️  Tabla products NO existe. Creando...\n');
      
      // Crear tabla
      const createTableSQL = `
        CREATE TABLE products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(12, 2) NOT NULL,
          original_price DECIMAL(12, 2) DEFAULT NULL,
          image VARCHAR(500) NOT NULL,
          category VARCHAR(100) NOT NULL,
          stock INT DEFAULT 100,
          featured BOOLEAN DEFAULT FALSE,
          discount INT DEFAULT NULL,
          rating DECIMAL(2, 1) DEFAULT 4.5,
          reviews INT DEFAULT 0,
          benefits JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_products_category (category),
          INDEX idx_products_featured (featured)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      await connection.query(createTableSQL);
      console.log('✓ Tabla products creada correctamente\n');
    } else {
      console.log('✓ Tabla products existe\n');
    }

    // 3. Obtener productos desde la BD
    console.log('✓ Leyendo productos de la base de datos...');
    const [dbProducts] = await connection.query(
      'SELECT id, name, price, category FROM products'
    ) as any[];

    console.log(`  Productos en BD: ${dbProducts.length}`);
    console.log(`  Productos en archivo .ts: ${products.length}\n`);

    // 4. Comparar y sincronizar
    if (dbProducts.length === 0) {
      console.log('⚠️  La BD está vacía. Sincronizando productos desde archivo .ts...\n');
      
      let insertedCount = 0;
      for (const product of products) {
        await connection.query(
          `INSERT INTO products (name, description, price, image, category, stock, featured, discount, rating, reviews, benefits)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.name,
            product.description,
            product.price,
            product.image,
            product.category,
            100,
            false,
            null,
            4.5,
            0,
            null
          ]
        );
        insertedCount++;
      }
      
      console.log(`✓ ${insertedCount} productos sincronizados a la BD\n`);
    } else {
      // Verificar discrepancias
      const dbProductNames = new Set(dbProducts.map((p: MysqlProduct) => p.name));
      const fileProductNames = new Set(products.map(p => p.name));
      
      const missingInDb = products.filter(p => !dbProductNames.has(p.name));
      const extraInDb = dbProducts.filter((p: MysqlProduct) => !fileProductNames.has(p.name));
      
      console.log('📊 Análisis de consistencia:');
      console.log(`  Productos sincronizados: ${products.length - missingInDb.length}/${products.length}`);
      
      if (missingInDb.length > 0) {
        console.log(`  ⚠️  Productos faltantes en BD: ${missingInDb.length}`);
        missingInDb.forEach(p => console.log(`     - ${p.name}`));
        console.log('     Sincronizando...');
        
        for (const product of missingInDb) {
          await connection.query(
            `INSERT INTO products (name, description, price, image, category, stock, featured, discount, rating, reviews, benefits)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              product.name,
              product.description,
              product.price,
              product.image,
              product.category,
              100,
              false,
              null,
              4.5,
              0,
              null
            ]
          );
        }
        console.log(`     ✓ ${missingInDb.length} productos agregados\n`);
      } else {
        console.log('  ✓ Todos los productos están en BD\n');
      }
      
      if (extraInDb.length > 0) {
        console.log(`  ℹ️  Productos en BD sin sincronizar en archivo: ${extraInDb.length}`);
      }
    }

    // 5. Verificar consistencia por categoría
    console.log('✓ Verificando consistencia por categoría:');
    const categories = ['vitaminas', 'suplementos', 'hierbas', 'aceites', 'proteinas'];
    
    for (const category of categories) {
      const fileCount = products.filter(p => p.category === category).length;
      const [dbCategory] = await connection.query(
        'SELECT COUNT(*) as count FROM products WHERE category = ?',
        [category]
      ) as any[];
      
      const dbCount = dbCategory[0].count;
      const status = fileCount === dbCount ? '✓' : '⚠️';
      console.log(`  ${status} ${category}: Archivo=${fileCount}, BD=${dbCount}`);
    }

    console.log('\n✓ Verificación completada exitosamente');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Verificar que http://localhost:3000/#productos muestre los productos');
    console.log('   2. Verificar que http://localhost:3000/admin obtenga datos correctos');
    console.log('   3. Verificar que la API http://localhost:3000/api/products devuelva datos');
    
    connection.release();
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }

  pool.end();
}

verifyAndSyncData();
