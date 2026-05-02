const mysql = require('mysql2/promise');
require('dotenv').config();

async function ping() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  await connection.query('UPDATE drivers SET location_updated_at=NOW(), last_latitude=11.3216, last_longitude=75.9338 WHERE status="available"');
  console.log('Driver locations updated!');
  await connection.end();
}

ping();
