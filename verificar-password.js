// Script para verificar credenciales de admin@fitovida.com
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function verificar() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'fitovida'
    });

    try {
        const [rows] = await connection.execute(
            'SELECT email, password_hash FROM users WHERE email = ?',
            ['admin@fitovida.com']
        );

        if (!rows || rows.length === 0) {
            console.log('❌ Usuario no encontrado');
            return;
        }

        const user = rows[0];
        const isValid = await bcrypt.compare('demo123', user.password_hash);

        console.log('\n=== RESULTADO ===');
        console.log('Email:', user.email);
        console.log('Password "demo123":', isValid ? '✅ CORRECTA' : '❌ INCORRECTA');
        console.log('================\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

verificar();
