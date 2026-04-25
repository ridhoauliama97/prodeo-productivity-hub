const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function run() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Fix the trigger function
    const sql = `
CREATE OR REPLACE FUNCTION public.notify_on_assignment()
RETURNS TRIGGER AS $$
DECLARE
  field_rec RECORD;
  old_val TEXT;
  new_val TEXT;
  assigned_user_id UUID;
  task_name TEXT;
  primary_field_id TEXT;
  db_rec RECORD;
  page_rec RECORD;
  ws_rec RECORD;
BEGIN
  -- Get database info
  SELECT d.id, d.page_id, d.workspace_id INTO db_rec
  FROM databases d WHERE d.id = NEW.database_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get page info
  SELECT p.id, p.title INTO page_rec
  FROM pages p WHERE p.id = db_rec.page_id;

  -- Get workspace info
  SELECT w.id, w.name INTO ws_rec
  FROM workspaces w WHERE w.id = db_rec.workspace_id;

  -- Find person-type fields for this database
  FOR field_rec IN
    SELECT df.id, df.name, df.type
    FROM database_fields df
    WHERE df.database_id = NEW.database_id
      AND df.type = 'person'
  LOOP
    -- Fix: cast field_rec.id to text explicitly so ->> works with jsonb
    new_val := NEW.properties ->> (field_rec.id::TEXT);

    IF TG_OP = 'UPDATE' THEN
      old_val := OLD.properties ->> (field_rec.id::TEXT);
    ELSE
      old_val := NULL;
    END IF;

    -- Only proceed if value changed and new value is not null/empty
    IF new_val IS NOT NULL AND new_val != '' AND (old_val IS NULL OR old_val != new_val) THEN
      -- Find primary field to get task name
      SELECT df.id INTO primary_field_id
      FROM database_fields df
      WHERE df.database_id = NEW.database_id AND df.is_title_field = true
      LIMIT 1;

      IF primary_field_id IS NOT NULL THEN
        task_name := COALESCE(NEW.properties ->> (primary_field_id::TEXT), 'Untitled Task');
      ELSE
        task_name := 'Untitled Task';
      END IF;

      -- Try to cast to UUID (person field stores user ID)
      BEGIN
        assigned_user_id := new_val::UUID;

        -- Insert notification
        INSERT INTO notifications (user_id, title, message, action_url, read, type, workspace_id, row_id, created_at, updated_at)
        VALUES (
          assigned_user_id,
          'New Assignment: ' || task_name,
          'You were assigned to "' || task_name || '" in ' || COALESCE(ws_rec.name, 'Workspace') || ' → ' || COALESCE(page_rec.title, 'Page'),
          '/workspace/' || db_rec.workspace_id || '/database/' || db_rec.page_id,
          false,
          'assignment',
          db_rec.workspace_id::TEXT,
          NEW.id::TEXT,
          NOW(),
          NOW()
        );
      EXCEPTION WHEN OTHERS THEN
        -- new_val is not a valid UUID, skip
        NULL;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await client.query(sql);
    console.log('Trigger function updated successfully!');
  } catch (err) {
    console.error('Failed to update trigger:', err);
  } finally {
    await client.end();
  }
}

run();
