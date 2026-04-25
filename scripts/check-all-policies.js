const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const connStr = (process.env.POSTGRES_URL_NON_POOLING || '').replace('?sslmode=require', '');
const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const res = await pool.query("SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'user_profiles';");
    console.log('All Profile Policies:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally { pool.end(); }
}
run();
