import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '192.168.100.163',
      port: 3306,
      user: 'villa_user',
      password: 'VillaMcj2026*',
      database: 'villa_mcj'
    });

    console.log('✅ Conexión exitosa a MariaDB en 192.168.100.163:3306');
    const [rows] = await connection.query('SHOW TABLES;');
    console.log('Tablas existentes:', rows);
    await connection.end();
  } catch (error) {
    console.error('❌ Error conectando a MariaDB:', error);
  }
}

testConnection();
