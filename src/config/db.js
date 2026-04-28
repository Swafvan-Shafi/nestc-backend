const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nestc',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const logFile = path.join(__dirname, '../../query_errors.log');

module.exports = {
  query: async (text, params = []) => {
    const placeholders = text.match(/\$\d+/g) || [];
    const mysqlText = text.replace(/\$\d+/g, '?');
    const mysqlParams = placeholders.map(p => params[parseInt(p.slice(1)) - 1]);

    try {
      // CHANGED: Use .query instead of .execute to support all MySQL protocols
      const [rows] = await pool.query(mysqlText, mysqlParams);
      return { rows };
    } catch (err) {
      const errorLog = `
--- ERROR ---
Time: ${new Date().toISOString()}
Query: ${mysqlText}
Params: ${JSON.stringify(mysqlParams)}
Error: ${err.message}
-------------
`;
      fs.appendFileSync(logFile, errorLog);
      throw err;
    }
  },
  pool
};
