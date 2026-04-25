const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const connStr = (process.env.POSTGRES_URL_NON_POOLING || '').replace('?sslmode=require', '');
const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const res = await pool.query('SELECT count(*) FROM public.user_profiles;');
    console.log('Total profiles:', res.rows[0].count);
  } catch (err) {
    console.error(err);
  } finally { pool.end(); }
}
run();
