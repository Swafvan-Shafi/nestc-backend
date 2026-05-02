const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool(process.env.DATABASE_URL);

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
