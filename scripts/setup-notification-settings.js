const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ 
  connectionString: process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Adding notification_settings column to user_profiles...');
    const res = await pool.query(`
      -- Add notification_settings to user_profiles if it doesn't exist
      ALTER TABLE public.user_profiles 
      ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
        "email": {
          "mentions": true,
          "assignments": true,
          "comments": true,
          "updates": false
        },
        "desktop": {
          "mentions": true,
          "assignments": true,
          "comments": true
        }
      }'::jsonb;

      -- Update existing rows to have the default if they are null
      UPDATE public.user_profiles 
      SET notification_settings = '{
        "email": {
          "mentions": true,
          "assignments": true,
          "comments": true,
          "updates": false
        },
        "desktop": {
          "mentions": true,
          "assignments": true,
          "comments": true
        }
      }'::jsonb
      WHERE notification_settings IS NULL;
    `);
    console.log('Database update successful');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    pool.end();
  }
}

run();
