import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(dirname(__dirname), '.env.local') });

// Force bypass SSL certificate verification issues common with cloud DBs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ Error: Missing POSTGRES_URL or POSTGRES_URL_NON_POOLING in .env.local');
  process.exit(1);
}

async function fixStorageRLS() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚀 Connecting to database to fix Storage RLS...');
    await client.connect();
    console.log('✅ Connected successfully.');

    const sql = `
      -- Ensure storage schema exists (it should)
      -- Ensure the bucket exists and is public
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('database-media', 'database-media', true)
      ON CONFLICT (id) DO UPDATE SET public = true;

      -- Enable RLS on storage.objects if not already enabled
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies for this bucket to avoid conflicts
      DROP POLICY IF EXISTS "Public Access" ON storage.objects;
      DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
      DROP POLICY IF EXISTS "Public Update" ON storage.objects;
      DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
      DROP POLICY IF EXISTS "Anyone can upload to database-media" ON storage.objects;
      DROP POLICY IF EXISTS "Anyone can view database-media" ON storage.objects;

      -- Policy for Selection (Read) - Allow anyone to view files in this bucket
      CREATE POLICY "Public Access" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'database-media');

      -- Policy for Insertion (Upload) - Allow anyone to upload to this bucket
      CREATE POLICY "Public Insert" ON storage.objects
      FOR INSERT TO public
      WITH CHECK (bucket_id = 'database-media');

      -- Policy for Update
      CREATE POLICY "Public Update" ON storage.objects
      FOR UPDATE TO public
      USING (bucket_id = 'database-media');

      -- Policy for Deletion
      CREATE POLICY "Public Delete" ON storage.objects
      FOR DELETE TO public
      USING (bucket_id = 'database-media');
      
      -- Also ensure the anon role has usage on the storage schema
      GRANT USAGE ON SCHEMA storage TO anon;
      GRANT USAGE ON SCHEMA storage TO authenticated;
      GRANT ALL ON TABLE storage.objects TO anon;
      GRANT ALL ON TABLE storage.objects TO authenticated;
      GRANT ALL ON TABLE storage.buckets TO anon;
      GRANT ALL ON TABLE storage.buckets TO authenticated;
    `;

    console.log('📡 Applying SQL policies...');
    await client.query(sql);
    console.log('✅ SQL policies applied successfully!');

  } catch (err) {
    console.error('❌ Error fixing Storage RLS:');
    console.error(err);
  } finally {
    await client.end();
    console.log('👋 Database connection closed.');
  }
}

fixStorageRLS();
