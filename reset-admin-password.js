// Script para resetear la contraseña del admin a "demo123"
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'fitovida'
    });

    try {
        console.log('\n🔄 Reseteando contraseña de admin...\n');

        // Crear hash de la nueva contraseña
        const newPassword = 'demo123';
        const hash = await bcrypt.hash(newPassword, 12);

        console.log('✅ Hash generado para "demo123"');
        console.log(`   Hash: ${hash.substring(0, 30)}...\n`);

        // Actualizar en la base de datos
        const [result] = await connection.execute(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [hash, 'admin@fitovida.com']
        );

        if (result.affectedRows > 0) {
            console.log('✅ ¡Contraseña actualizada exitosamente!');
            console.log('\n📋 Nuevas credenciales:');
            console.log('   Email: admin@fitovida.com');
            console.log('   Password: demo123');
            console.log('\n💡 Ahora puedes hacer login con estas credenciales.\n');
        } else {
            console.log('❌ Usuario no encontrado');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

resetPassword();
