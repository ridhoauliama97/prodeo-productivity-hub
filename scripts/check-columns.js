const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const connStr = (process.env.POSTGRES_URL_NON_POOLING || '').replace('?sslmode=require', '');
const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles';");
    console.log('Columns:', res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally { pool.end(); }
}
run();
