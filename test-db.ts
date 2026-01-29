// Script para probar conexión a MySQL
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fitovida',
});

async function test() {
  try {
    console.log('🔍 Probando conexión a MySQL...');
    console.log('Host:', process.env.DB_HOST || 'localhost');
    console.log('User:', process.env.DB_USER || 'root');
    console.log('Database:', process.env.DB_NAME || 'fitovida');
    
    const [rows] = await pool.execute(
      'SELECT id, email, first_name FROM users WHERE email = ?',
      ['admin@fitovida.com']
    );
    
    console.log('✅ Conexión exitosa!');
    console.log('Usuario encontrado:', rows);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
