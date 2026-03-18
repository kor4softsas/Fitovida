#!/usr/bin/env node
/**
 * Script de Configuración - Módulo de Inventario
 * Ejecuta: node setup-inventory.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fitovida'
};

async function main() {
  console.log('🚀 Iniciando configuración del módulo de inventario...\n');

  try {
    // Conectar a MySQL
    console.log('📡 Conectando a MySQL...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Conectado exitosamente\n');

    // Verificar tabla products
    console.log('📋 Verificando tablas...');
    try {
      const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
      console.log(`✅ Tabla products: ${products[0].count} registros`);
    } catch (err) {
      console.log('⚠️  Tabla products: no encontrada');
    }

    // Verificar tabla inventory_products
    try {
      const [inventory] = await connection.execute('SELECT COUNT(*) as count FROM inventory_products');
      console.log(`✅ Tabla inventory_products: ${inventory[0].count} registros`);
    } catch (err) {
      console.log('⚠️  Tabla inventory_products: no encontrada');
    }

    // Verificar columna image
    console.log('\n🔍 Verificando campo image...');
    const [[result]] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'fitovida' 
       AND TABLE_NAME = 'inventory_products' 
       AND COLUMN_NAME = 'image'`
    );

    if (result) {
      console.log('✅ Campo image ya existe');
    } else {
      console.log('⚠️  Campo image no existe - ejecutando migración...\n');
      
      // Ejecutar migración
      const migrationFile = path.join(__dirname, 'mysql', 'migrate-to-image.sql');
      if (!fs.existsSync(migrationFile)) {
        throw new Error(`Archivo de migración no encontrado: ${migrationFile}`);
      }

      const sql = fs.readFileSync(migrationFile, 'utf8');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          await connection.execute(statement);
          console.log(`✅ ${statement.substring(0, 50)}...`);
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.log(`⚠️  ${err.message}`);
          }
        }
      }
    }

    // Crear carpeta de imágenes si no existe
    console.log('\n📁 Verificando carpeta de imágenes...');
    const imgDir = path.join(__dirname, 'public', 'img', 'products');
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
      console.log(`✅ Carpeta creada: ${imgDir}`);
    } else {
      console.log(`✅ Carpeta existe: ${imgDir}`);
    }

    // Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('✨ CONFIGURACIÓN COMPLETADA ✨');
    console.log('='.repeat(50));
    console.log('El módulo de inventario está listo para usar.');
    console.log('\n▶️  Para acceder:');
    console.log('   http://localhost:3000/admin/inventario');
    console.log('\n▶️  Para diagnosticar:');
    console.log('   http://localhost:3000/api/admin/inventory/diagnose');
    console.log('\n');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la configuración:');
    console.error(error.message);
    console.error('\n💡 Soluciones:');
    console.error('1. Verifica que MySQL está corriendo (XAMPP)');
    console.error('2. Verifica credenciales en config (línea 15)');
    console.error('3. Ejecuta manualmente: mysql -u root fitovida < mysql/migrate-to-image.sql');
    process.exit(1);
  }
}

main();
