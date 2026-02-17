import { query, queryOne } from './src/lib/db';

async function testLogin() {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Simple query
    console.log('Test 1: Contando usuarios...');
    const users = await query('SELECT COUNT(*) as count FROM users');
    console.log('Usuarios en BD:', users);
    
    // Test 2: Query usuario admin
    console.log('\nTest 2: Buscando admin@fitovida.com...');
    const admin = await queryOne(
      'SELECT id, email, first_name, password_hash FROM users WHERE email = ?',
      ['admin@fitovida.com']
    );
    console.log('Admin encontrado:', admin);
    
    if (admin && admin.password_hash) {
      console.log('\n✅ ÉXITO: La BD está funcionando correctamente');
      console.log('   El usuario admin existe y tiene password_hash');
    } else {
      console.log('\n❌ ERROR: El usuario NO tiene password_hash');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
  
  process.exit(0);
}

testLogin();
