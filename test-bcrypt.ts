import bcrypt from 'bcryptjs';

// Hash conocido: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lGGSKfs2G3Km
// Contraseña: demo123

const correctHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lGGSKfs2G3Km';
const password = 'demo123';

async function test() {
  try {
    console.log('Testing bcrypt...');
    console.log('Hash:', correctHash);
    console.log('Password:', password);
    
    const isValid = await bcrypt.compare(password, correctHash);
    console.log('');
    console.log('Result:', isValid);
    
    if (isValid) {
      console.log('✅ La contraseña es correcta!');
    } else {
      console.log('❌ La contraseña NO coincide');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

test();
