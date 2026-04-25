const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

(async () => {
  const client = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const userRes = await client.query("SELECT id FROM auth.users LIMIT 1;");
    const userId = userRes.rows[0]?.id;
    
    const dbRes = await client.query("SELECT id FROM databases LIMIT 1;");
    const dbId = dbRes.rows[0]?.id;

    if (userId && dbId) {
      // Find a person field in this DB
      const fieldRes = await client.query("SELECT id FROM database_fields WHERE database_id = $1 AND type = 'person' LIMIT 1;", [dbId]);
      const fieldId = fieldRes.rows[0]?.id || 'dummy_field';
      
      const properties = {
        [fieldId]: userId // Assign to themselves
      };

      const insertQuery = `
        INSERT INTO database_rows (database_id, created_by, properties)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const res = await client.query(insertQuery, [dbId, userId, JSON.stringify(properties)]);
      console.log('Insert with properties successful:', res.rows[0]);
    }
  } catch (err) {
    console.error('INSERT FAILED:', err.message);
    console.error(err);
  } finally {
    await client.end();
  }
})();
