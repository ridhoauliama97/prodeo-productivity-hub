const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const connStr = (process.env.POSTGRES_URL_NON_POOLING || '').replace('?sslmode=require', '');
const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const res = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND conrelid = 'user_profiles'::regclass;
    `);
    console.log('Constraints:', res.rows);
  } catch (err) {
    console.error(err);
  } finally { pool.end(); }
}
run();
