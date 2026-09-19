const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

let dbType = process.env.DB_TYPE || 'auto'; // 'mysql', 'sqlite', or 'auto'
let mysqlPool = null;
let sqliteDb = null;
let activeEngine = 'sqlite';

const SQLITE_DB_PATH = path.join(__dirname, '..', '..', 'database', 'doctor_appointments.sqlite');

// Initialize database connection
async function initDatabaseConnection() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'doctor_appointment_db';

  if (dbType === 'mysql' || dbType === 'auto') {
    try {
      const mysql = require('mysql2/promise');
      // Test connection with short timeout
      const tempPool = mysql.createPool({
        host,
        port: Number(port),
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 2000
      });

      const conn = await tempPool.getConnection();
      conn.release();

      mysqlPool = tempPool;
      activeEngine = 'mysql';
      console.log(`[DB] Connected successfully to MySQL database '${database}' on ${host}:${port}`);
      return;
    } catch (err) {
      if (dbType === 'mysql') {
        console.error(`[DB Error] Failed to connect to MySQL: ${err.message}`);
        throw err;
      }
      console.log(`[DB Notice] MySQL not reachable on ${host}:${port} (${err.message}). Seamlessly falling back to high-performance local SQLite database.`);
    }
  }

  // Fallback to SQLite
  try {
    const Database = require('better-sqlite3');
    const dbDir = path.dirname(SQLITE_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    sqliteDb = new Database(SQLITE_DB_PATH);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
    activeEngine = 'sqlite';
    console.log(`[DB] Local SQLite database loaded at: ${SQLITE_DB_PATH}`);
  } catch (sqliteErr) {
    console.error(`[DB Error] Failed to initialize SQLite: ${sqliteErr.message}`);
    throw sqliteErr;
  }
}

// Translate MySQL queries to SQLite queries when needed
function adaptSql(sql) {
  if (activeEngine === 'mysql') return sql;

  // SQLite adaptations:
  // Convert AUTO_INCREMENT to AUTOINCREMENT
  let adapted = sql
    .replace(/\bAUTO_INCREMENT\b/gi, 'AUTOINCREMENT')
    .replace(/\bENGINE\s*=\s*InnoDB\b/gi, '')
    .replace(/\bON UPDATE CURRENT_TIMESTAMP\b/gi, '');

  return adapted;
}

// Query helper: returns Array of rows
async function query(sql, params = []) {
  if (activeEngine === 'mysql') {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows;
  } else {
    const adapted = adaptSql(sql);
    const stmt = sqliteDb.prepare(adapted);
    // Replace undefined with null in params
    const sanitizedParams = (Array.isArray(params) ? params : [params]).map(p => p === undefined ? null : p);
    return stmt.all(...sanitizedParams);
  }
}

// Get helper: returns single object or null
async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

// Run helper: INSERT, UPDATE, DELETE -> returns { insertId, changes }
async function run(sql, params = []) {
  if (activeEngine === 'mysql') {
    const [result] = await mysqlPool.execute(sql, params);
    return {
      insertId: result.insertId,
      changes: result.affectedRows
    };
  } else {
    const adapted = adaptSql(sql);
    const stmt = sqliteDb.prepare(adapted);
    const sanitizedParams = (Array.isArray(params) ? params : [params]).map(p => p === undefined ? null : p);
    const info = stmt.run(...sanitizedParams);
    return {
      insertId: Number(info.lastInsertRowid),
      changes: info.changes
    };
  }
}

function getActiveEngine() {
  return activeEngine;
}

module.exports = {
  initDatabaseConnection,
  query,
  get,
  run,
  getActiveEngine,
  SQLITE_DB_PATH
};
