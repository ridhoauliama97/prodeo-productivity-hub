const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

(async () => {
  const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // 1. Get a test user and database
    const userRes = await client.query("SELECT id FROM auth.users LIMIT 1;");
    const userId = userRes.rows[0]?.id;
    
    const dbRes = await client.query("SELECT id FROM databases LIMIT 1;");
    const dbId = dbRes.rows[0]?.id;

    console.log('Testing insert with User:', userId, 'and DB:', dbId);

    if (userId && dbId) {
      const insertQuery = `
        INSERT INTO database_rows (database_id, created_by, properties)
        VALUES ($1, $2, '{}')
        RETURNING *;
      `;
      const res = await client.query(insertQuery, [dbId, userId]);
      console.log('Insert successful:', res.rows[0]);
    }
    
  } catch (err) {
    console.error('INSERT FAILED:', err.message);
    console.error(err);
  } finally {
    await client.query('ROLLBACK;'); // rollback just in case
    await client.end();
  }
})();
