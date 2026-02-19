const mysql = require('mysql2/promise');

// Datos de productos completos (copiados de src/lib/products.ts)
const products = [
  { id: 1, name: "Colágeno Hidrolizado", category: "suplementos", price: 145000, image: "/img/PHOTO-2025-06-24-16-41-57.jpg", description: "Colágeno hidrolizado para la salud de piel, cabello, uñas y articulaciones. Fórmula de alta absorción." },
  { id: 2, name: "Vitamina C 1000mg", category: "vitaminas", price: 75000, image: "/img/PHOTO-2025-06-24-16-41-57[1].jpg", description: "Vitamina C de alta potencia para fortalecer el sistema inmunológico. 60 cápsulas." },
  { id: 3, name: "Omega 3 Premium", category: "suplementos", price: 120000, image: "/img/PHOTO-2025-06-24-16-41-57[2].jpg", description: "Ácidos grasos esenciales Omega 3 de aceite de pescado. Beneficia la salud cardiovascular." },
  { id: 4, name: "Multivitamínico Completo", category: "vitaminas", price: 98000, image: "/img/PHOTO-2025-06-24-16-44-04.jpg", description: "Fórmula completa de vitaminas y minerales esenciales para el bienestar diario." },
  { id: 5, name: "Magnesio Complex", category: "suplementos", price: 89000, image: "/img/PHOTO-2025-06-24-16-44-04[1].jpg", description: "Complejo de magnesio para músculos, nervios y energía. Mejora el sueño y reduce calambres." },
  { id: 6, name: "Ashwagandha Orgánica", category: "hierbas", price: 108000, image: "/img/PHOTO-2025-06-24-16-44-05.jpg", description: "Hierba adaptógena ayurvédica para reducir el estrés y mejorar la vitalidad." },
  { id: 7, name: "Probióticos Digestivos", category: "suplementos", price: 132000, image: "/img/PHOTO-2025-06-24-16-44-05[1].jpg", description: "50 mil millones de UFC. Mejora la salud digestiva y fortalece el sistema inmune." },
  { id: 8, name: "Cúrcuma con Pimienta Negra", category: "hierbas", price: 79000, image: "/img/PHOTO-2025-06-24-16-44-05[2].jpg", description: "Poderoso antiinflamatorio natural con curcumina de alta biodisponibilidad." },
  { id: 9, name: "Zinc 50mg", category: "vitaminas", price: 65000, image: "/img/PHOTO-2025-06-24-16-44-07.jpg", description: "Zinc quelado para mejor absorción. Apoya el sistema inmune y la salud de la piel." },
  { id: 10, name: "Vitamina D3 5000 UI", category: "vitaminas", price: 68000, image: "/img/PHOTO-2025-06-24-16-44-09.jpg", description: "Vitamina del sol. Esencial para huesos fuertes y sistema inmune saludable." },
  { id: 11, name: "Biotina para Cabello", category: "vitaminas", price: 88000, image: "/img/PHOTO-2025-06-24-16-44-09[1].jpg", description: "10,000 mcg de biotina. Promueve el crecimiento del cabello, piel y uñas saludables." },
  { id: 12, name: "Espirulina Orgánica", category: "suplementos", price: 115000, image: "/img/PHOTO-2025-06-24-16-44-10.jpg", description: "Superalimento rico en proteínas, vitaminas y minerales. 100% orgánica." },
  { id: 13, name: "Aceite de Coco Orgánico", category: "aceites", price: 74000, image: "/img/PHOTO-2025-06-24-16-44-10[1].jpg", description: "Aceite de coco virgen extra orgánico. Para cocinar, piel y cabello. 500ml." },
  { id: 14, name: "Melatonina 10mg", category: "suplementos", price: 72000, image: "/img/PHOTO-2025-06-24-16-44-10[2].jpg", description: "Ayuda natural para dormir. Regula el ciclo del sueño de forma natural." },
  { id: 15, name: "Maca Andina en Polvo", category: "hierbas", price: 95000, image: "/img/PHOTO-2025-06-24-16-44-10[3].jpg", description: "Superalimento peruano. Aumenta energía, resistencia y equilibrio hormonal." },
  { id: 16, name: "CoQ10 200mg", category: "suplementos", price: 160000, image: "/img/PHOTO-2025-06-24-16-44-10[4].jpg", description: "Coenzima Q10 para energía celular y salud cardiovascular." },
  { id: 17, name: "Té Verde Extracto", category: "hierbas", price: 84000, image: "/img/PHOTO-2025-06-24-16-44-11.jpg", description: "Extracto concentrado de té verde. Antioxidante natural y apoyo metabólico." },
  { id: 18, name: "Calcio + Vitamina D", category: "vitaminas", price: 79000, image: "/img/PHOTO-2025-06-24-16-44-11[1].jpg", description: "Fórmula combinada para huesos y dientes fuertes. Previene osteoporosis." },
  { id: 19, name: "Ajo Negro Premium", category: "hierbas", price: 112000, image: "/img/PHOTO-2025-06-24-16-44-11[2].jpg", description: "Ajo negro fermentado. Poderoso antioxidante para la salud cardiovascular." },
  { id: 20, name: "Hierro Quelado", category: "vitaminas", price: 66000, image: "/img/PHOTO-2025-06-24-16-44-12.jpg", description: "Hierro de fácil absorción. Combate la anemia y aumenta la energía." },
  { id: 21, name: "Proteína Vegana", category: "proteinas", price: 180000, image: "/img/PHOTO-2025-06-24-16-44-12[1].jpg", description: "Proteína vegetal de guisantes y arroz. Sin lactosa, sabor chocolate. 1kg." },
  { id: 22, name: "BCAA 2:1:1", category: "proteinas", price: 140000, image: "/img/PHOTO-2025-06-24-16-44-12[2].jpg", description: "Aminoácidos ramificados. Recuperación muscular y rendimiento deportivo." },
  { id: 23, name: "Aceite de Oliva Extra Virgen", category: "aceites", price: 105000, image: "/img/PHOTO-2025-06-24-16-44-12[3].jpg", description: "Aceite de oliva prensado en frío. Alto en antioxidantes. 750ml." },
  { id: 24, name: "L-Carnitina Líquida", category: "suplementos", price: 118000, image: "/img/PHOTO-2025-06-24-16-44-13.jpg", description: "Quemador de grasa natural. Convierte grasa en energía. 500ml." },
  { id: 25, name: "Moringa en Polvo", category: "hierbas", price: 86000, image: "/img/PHOTO-2025-06-24-16-44-14.jpg", description: "Superalimento rico en nutrientes. 90 nutrientes en una sola planta." },
  { id: 26, name: "Glucosamina + Condroitina", category: "suplementos", price: 148000, image: "/img/PHOTO-2025-06-24-16-44-15.jpg", description: "Para la salud articular. Reduce dolor y mejora movilidad." },
  { id: 27, name: "Jengibre en Cápsulas", category: "hierbas", price: 72000, image: "/img/PHOTO-2025-06-24-16-44-15[1].jpg", description: "Antiinflamatorio natural. Mejora digestión y alivia náuseas." },
  { id: 28, name: "Vitamina B Complex", category: "vitaminas", price: 78000, image: "/img/PHOTO-2025-06-24-16-44-15[2].jpg", description: "Todas las vitaminas B en una cápsula. Energía y sistema nervioso." },
  { id: 29, name: "Aceite de Linaza", category: "aceites", price: 92000, image: "/img/PHOTO-2025-06-24-16-44-15[3].jpg", description: "Rico en Omega 3 vegetal. Salud cardiovascular y digestiva." },
  { id: 30, name: "Chlorella Orgánica", category: "suplementos", price: 128000, image: "/img/PHOTO-2025-06-24-16-44-16.jpg", description: "Alga desintoxicante. Elimina metales pesados y toxinas." },
  { id: 31, name: "Saw Palmetto", category: "hierbas", price: 98000, image: "/img/PHOTO-2025-06-24-16-44-16[1].jpg", description: "Para la salud prostática masculina. Extracto natural." },
  { id: 32, name: "Vitamina E 400 UI", category: "vitaminas", price: 76000, image: "/img/PHOTO-2025-06-24-16-44-16[2].jpg", description: "Antioxidante poderoso. Protege células del daño oxidativo." },
  { id: 33, name: "Ginkgo Biloba", category: "hierbas", price: 94000, image: "/img/PHOTO-2025-06-24-16-44-16[3].jpg", description: "Mejora memoria y circulación cerebral. Concentración mental." },
  { id: 34, name: "Resveratrol", category: "suplementos", price: 156000, image: "/img/PHOTO-2025-06-24-16-44-17.jpg", description: "Antioxidante antiedad. Protección cardiovascular y longevidad." },
  { id: 35, name: "Semillas de Chía", category: "suplementos", price: 52000, image: "/img/PHOTO-2025-06-24-16-44-17[1].jpg", description: "Superalimento rico en Omega 3, fibra y proteína. 500g." },
  { id: 36, name: "Aceite de Argán", category: "aceites", price: 140000, image: "/img/PHOTO-2025-06-24-16-44-17[2].jpg", description: "Aceite de argán puro marroquí. Para piel y cabello. 100ml." },
  { id: 37, name: "Rhodiola Rosea", category: "hierbas", price: 106000, image: "/img/PHOTO-2025-06-24-16-44-17[3].jpg", description: "Adaptógeno para energía y resistencia al estrés." },
  { id: 38, name: "Whey Protein Isolate", category: "proteinas", price: 220000, image: "/img/PHOTO-2025-06-24-16-44-17[4].jpg", description: "Proteína de suero aislada. 90% proteína pura. Sabor vainilla. 1kg." },
  { id: 39, name: "NAC (N-Acetil Cisteína)", category: "suplementos", price: 112000, image: "/img/PHOTO-2025-06-24-16-44-18.jpg", description: "Apoyo hepático y antioxidante. Detox natural." },
  { id: 40, name: "Extracto de Arándano", category: "hierbas", price: 88000, image: "/img/PHOTO-2025-06-24-21-15-30.jpg", description: "Para la salud urinaria. Rico en antioxidantes." },
  { id: 41, name: "Lecitina de Soya", category: "suplementos", price: 80000, image: "/img/PHOTO-2025-06-24-21-15-30[1].jpg", description: "Salud cerebral y metabolismo de grasas. 1200mg." },
  { id: 42, name: "Selenio 200mcg", category: "vitaminas", price: 60000, image: "/img/PHOTO-2025-06-24-21-15-32.jpg", description: "Mineral antioxidante. Salud tiroidea e inmunológica." },
  { id: 43, name: "Diente de León", category: "hierbas", price: 66000, image: "/img/PHOTO-2025-06-24-21-15-33.jpg", description: "Desintoxicante hepático. Diurético natural." },
  { id: 44, name: "Aceite de Onagra", category: "aceites", price: 96000, image: "/img/PHOTO-2025-06-24-21-15-33[1].jpg", description: "Equilibrio hormonal femenino. Rico en GLA." },
  { id: 45, name: "Valeriana Complex", category: "hierbas", price: 76000, image: "/img/PHOTO-2025-06-24-21-16-10.jpg", description: "Ayuda natural para dormir. Reduce ansiedad." },
  { id: 46, name: "Potasio 99mg", category: "vitaminas", price: 56000, image: "/img/PHOTO-2025-06-24-21-16-11.jpg", description: "Electrolito esencial. Salud cardiovascular y muscular." },
  { id: 47, name: "Cardo Mariano", category: "hierbas", price: 90000, image: "/img/PHOTO-2025-06-24-21-16-11[1].jpg", description: "Protector hepático. Regeneración del hígado." },
  { id: 48, name: "Glutamina en Polvo", category: "proteinas", price: 116000, image: "/img/PHOTO-2025-06-24-21-16-12.jpg", description: "Recuperación muscular y salud intestinal. 500g." }
];

async function verifyAndSyncData() {
  console.log('🔍 Iniciando verificación de sincronización de datos...\n');

  try {
    // 1. Verificar conexión a la BD
    console.log('✓ Conectando a la base de datos...');
    
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

    const connection = await pool.getConnection();
    console.log('✓ Conexión exitosa a MySQL\n');

    // 2. Verificar que la tabla products existe
    console.log('✓ Verificando tabla products...');
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'",
      [process.env.DB_NAME || 'fitovida']
    );

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
    );

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
        process.stdout.write(`\r  Sincronizando... ${insertedCount}/${products.length}`);
      }
      process.stdout.write('\r                        \r'); // Limpiar línea
      console.log(`✓ ${insertedCount} productos sincronizados a la BD\n`);
    } else {
      // Verificar discrepancias
      const dbProductNames = new Set(dbProducts.map((p) => p.name));
      const fileProductNames = new Set(products.map(p => p.name));
      
      const missingInDb = products.filter(p => !dbProductNames.has(p.name));
      const extraInDb = dbProducts.filter((p) => !fileProductNames.has(p.name));
      
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
        console.log(`  ℹ️  Productos en BD sin sincronizar en archivo: ${extraInDb.length}\n`);
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
      );
      
      const dbCount = dbCategory[0].count;
      const status = fileCount === dbCount ? '✓' : '⚠️';
      console.log(`  ${status} ${category}: Archivo=${fileCount}, BD=${dbCount}`);
    }

    console.log('\n✅ Verificación completada exitosamente');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Verificar que http://localhost:3000/#productos muestre los productos');
    console.log('   2. Verificar que http://localhost:3000/admin obtenga datos correctos');
    console.log('   3. Verificar que la API http://localhost:3000/api/products devuelva datos');
    
    connection.release();
    pool.end();
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }
}

verifyAndSyncData();
