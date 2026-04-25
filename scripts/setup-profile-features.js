const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ 
  connectionString: process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL,
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
      
      -- Enable Storage if not already enabled and create 'avatars' bucket
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('avatars', 'avatars', true)
      ON CONFLICT (id) DO NOTHING;

      -- Allow public access to read avatars
      DO $$
      BEGIN
         IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Avatar images are publicly accessible.' AND tablename = 'objects'
         ) THEN
            CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
         END IF;
      END$$;

      -- Allow users to upload avatars
      DO $$
      BEGIN
         IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar.' AND tablename = 'objects'
         ) THEN
            CREATE POLICY "Users can upload their own avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
         END IF;
      END$$;

      -- Allow users to update their own avatar
      DO $$
      BEGIN
         IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar.' AND tablename = 'objects'
         ) THEN
            CREATE POLICY "Users can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
         END IF;
      END$$;

      -- Allow users to delete their own avatar
      DO $$
      BEGIN
         IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own avatar.' AND tablename = 'objects'
         ) THEN
            CREATE POLICY "Users can delete their own avatar." ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
         END IF;
      END$$;

      -- Add first_name and last_name to user_profiles
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name text;
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name text;
    `);
    console.log('Database setup successful');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
run();
