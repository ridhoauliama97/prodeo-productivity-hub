const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const connStr = (process.env.POSTGRES_URL_NON_POOLING || '').replace('?sslmode=require', '');
const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    console.log('Replacing RLS policies for user_profiles...');
    await pool.query(`
      -- Drop existing to be clean
      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
      DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;

      -- Create/Recreate all
      -- Note: In Supabase, the user's ID is the primary key for the profile row.
      CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
      CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
      CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    `);
    console.log('Successfully recreated all user_profile policies.');
  } catch (err) {
    console.error('Error recreating policies:', err);
  } finally { pool.end(); }
}
run();
