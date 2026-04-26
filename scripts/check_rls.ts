import { Client } from 'pg';

const connectionString = 'postgres://postgres.facadidhognljvafbcii:IxhJkdPa8GyndYhI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ 
    connectionString,
  });
  await client.connect();
  const res = await client.query(`
SELECT
    pol.polname AS policy_name,
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command,
    pg_get_expr(pol.polqual, pol.polrelid) AS USING_expression
FROM pg_policy pol
JOIN pg_class tbl ON pol.polrelid = tbl.oid
WHERE tbl.relname = 'emails';
  `);
  console.log('Policies:', res.rows);
  await client.end();
}
run();
