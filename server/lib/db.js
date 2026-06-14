import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'cleaning_user',
  password: process.env.DB_PASSWORD || 'cleaning_password',
  database: process.env.DB_NAME || 'cleaning_service',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

export async function query(sql, params = []) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function insert(sql, params = []) {
  const result = await query(sql, params);
  return result.insertId;
}

export async function update(sql, params = []) {
  const result = await query(sql, params);
  return result.affectedRows;
}

export async function remove(sql, params = []) {
  const result = await query(sql, params);
  return result.affectedRows;
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default pool;
