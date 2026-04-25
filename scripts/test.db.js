const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

(async () => {
  const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query("SELECT * FROM pg_policies WHERE tablename = 'database_rows';");
    console.log('Policies for database_rows:', res.rows);
    
    // Also try to insert a dummy row to see the exact Postgres error
    // Assuming there's a valid database_id. We'll just insert a bad insert to see if RLS or trigger fires
    // If it's a UUID error we might see it.
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
})();
