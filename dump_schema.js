const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function dump() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  const [tables] = await connection.query('SHOW TABLES');
  let sql = '';
  
  for (let row of tables) {
    const tableName = Object.values(row)[0];
    const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    sql += createTableResult[0]['Create Table'] + ';\n\n';
  }

  fs.writeFileSync('schema_dump.sql', sql);
  console.log('Schema dumped to schema_dump.sql');
  await connection.end();
}

dump().catch(console.error);
