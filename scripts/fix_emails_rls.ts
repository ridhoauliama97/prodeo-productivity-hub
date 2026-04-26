import { Client } from 'pg';

const connectionString = 'postgres://postgres.facadidhognljvafbcii:IxhJkdPa8GyndYhI@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  
  try {
    const res = await client.query(`
      CREATE POLICY "Users can delete their own emails" 
      ON emails 
      FOR DELETE 
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    `);
    console.log('Policy created:', res);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
