const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
// Replace sslmode=require from URL to prevent override
const connStr = (process.env.POSTGRES_URL_NON_POOLING || '').replace('?sslmode=require', '');
const pool = new Pool({ 
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      -- Create RPC to delete own user account securely
      CREATE OR REPLACE FUNCTION delete_user_account()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        IF auth.uid() IS NULL THEN
          RAISE EXCEPTION 'Not authenticated';
        END IF;
        -- Delete the user from auth.users (will cascade to user_profiles, workspaces, etc.)
        DELETE FROM auth.users WHERE id = auth.uid();
      END;
      $$;

      -- Update user_profiles
      ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_name text;
      ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_name text;

      -- Create Storage policies
      DO $$
      BEGIN
         IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Avatar images are publicly accessible.' AND tablename = 'objects'
         ) THEN
            CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
         END IF;
         
         IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar.' AND tablename = 'objects'
         ) THEN
            CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
         END IF;

         IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar.' AND tablename = 'objects'
         ) THEN
            CREATE POLICY "Users can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
         END IF;

         IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own avatar.' AND tablename = 'objects'
         ) THEN
            CREATE POLICY "Users can delete their own avatar." ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
         END IF;
      END$$;
    `);
    console.log('Database SQL executed successfully');
  } catch (err) {
    console.error('Error executing DB query:', err);
  } finally {
    pool.end();
  }
}
run();
