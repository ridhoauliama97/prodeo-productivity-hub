-- Fix: Add email column to user_profiles if it doesn't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email text;

-- Fix: Create a SECURITY DEFINER function to check workspace membership without RLS recursion
CREATE OR REPLACE FUNCTION check_is_workspace_member(p_workspace_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id
  );
$$;

-- Fix: Drop ALL existing RLS policies to start fresh
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  -- Drop all policies on workspace_members
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'workspace_members' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON workspace_members', pol.policyname);
  END LOOP;
  
  -- Drop all policies on workspaces
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'workspaces' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON workspaces', pol.policyname);
  END LOOP;
  
  -- Drop all policies on pages
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'pages' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON pages', pol.policyname);
  END LOOP;
  
  -- Drop all policies on user_profiles
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', pol.policyname);
  END LOOP;
  
  -- Drop all policies on databases
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'databases' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON databases', pol.policyname);
  END LOOP;

  -- Drop all policies on database_fields
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'database_fields' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON database_fields', pol.policyname);
  END LOOP;

  -- Drop all policies on database_rows
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'database_rows' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON database_rows', pol.policyname);
  END LOOP;

  -- Drop all policies on blocks
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'blocks' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON blocks', pol.policyname);
  END LOOP;

  -- Drop all policies on views
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'views' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON views', pol.policyname);
  END LOOP;

  -- Drop all policies on comments
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'comments' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON comments', pol.policyname);
  END LOOP;

  -- Drop all policies on presence
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'presence' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON presence', pol.policyname);
  END LOOP;
END $$;

-- ============================================
-- RECREATE CLEAN RLS POLICIES (NO RECURSION)
-- ============================================

-- WORKSPACE_MEMBERS: Non-recursive base policy
-- Users can see their own membership records
CREATE POLICY "wm_select_own" ON workspace_members FOR SELECT
  USING (user_id = auth.uid());

-- Workspace owners can see all members (uses workspaces directly, no recursion)
CREATE POLICY "wm_select_as_owner" ON workspace_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

CREATE POLICY "wm_insert" ON workspace_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY "wm_update" ON workspace_members FOR UPDATE
  USING (EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

CREATE POLICY "wm_delete" ON workspace_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid()));

-- WORKSPACES: Use SECURITY DEFINER function to avoid recursion
CREATE POLICY "ws_select" ON workspaces FOR SELECT
  USING (owner_id = auth.uid() OR check_is_workspace_member(id, auth.uid()));

CREATE POLICY "ws_insert" ON workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "ws_update" ON workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- USER_PROFILES: Allow users to see profiles of people in their workspaces
CREATE POLICY "up_select_own" ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "up_select_workspace_peers" ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = user_profiles.id
    )
  );

CREATE POLICY "up_insert_own" ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "up_update_own" ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- PAGES: Use SECURITY DEFINER function
CREATE POLICY "pages_select" ON pages FOR SELECT
  USING (created_by = auth.uid() OR check_is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "pages_insert" ON pages FOR INSERT
  WITH CHECK (check_is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "pages_update" ON pages FOR UPDATE
  USING (check_is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "pages_delete" ON pages FOR DELETE
  USING (created_by = auth.uid() OR check_is_workspace_member(workspace_id, auth.uid()));

-- BLOCKS: Use SECURITY DEFINER function through pages
CREATE POLICY "blocks_select" ON blocks FOR SELECT
  USING (EXISTS (SELECT 1 FROM pages WHERE pages.id = blocks.page_id AND (pages.created_by = auth.uid() OR check_is_workspace_member(pages.workspace_id, auth.uid()))));

CREATE POLICY "blocks_insert" ON blocks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM pages WHERE pages.id = blocks.page_id AND check_is_workspace_member(pages.workspace_id, auth.uid())));

CREATE POLICY "blocks_update" ON blocks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM pages WHERE pages.id = blocks.page_id AND check_is_workspace_member(pages.workspace_id, auth.uid())));

CREATE POLICY "blocks_delete" ON blocks FOR DELETE
  USING (EXISTS (SELECT 1 FROM pages WHERE pages.id = blocks.page_id AND check_is_workspace_member(pages.workspace_id, auth.uid())));

-- DATABASES
CREATE POLICY "db_select" ON databases FOR SELECT
  USING (check_is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "db_insert" ON databases FOR INSERT
  WITH CHECK (check_is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "db_update" ON databases FOR UPDATE
  USING (check_is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "db_delete" ON databases FOR DELETE
  USING (check_is_workspace_member(workspace_id, auth.uid()));

-- DATABASE_FIELDS
CREATE POLICY "df_select" ON database_fields FOR SELECT
  USING (EXISTS (SELECT 1 FROM databases d WHERE d.id = database_fields.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

CREATE POLICY "df_insert" ON database_fields FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM databases d WHERE d.id = database_fields.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

CREATE POLICY "df_update" ON database_fields FOR UPDATE
  USING (EXISTS (SELECT 1 FROM databases d WHERE d.id = database_fields.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

CREATE POLICY "df_delete" ON database_fields FOR DELETE
  USING (EXISTS (SELECT 1 FROM databases d WHERE d.id = database_fields.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

-- DATABASE_ROWS
CREATE POLICY "dr_select" ON database_rows FOR SELECT
  USING (EXISTS (SELECT 1 FROM databases d WHERE d.id = database_rows.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

CREATE POLICY "dr_insert" ON database_rows FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM databases d WHERE d.id = database_rows.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

CREATE POLICY "dr_update" ON database_rows FOR UPDATE
  USING (EXISTS (SELECT 1 FROM databases d WHERE d.id = database_rows.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

CREATE POLICY "dr_delete" ON database_rows FOR DELETE
  USING (EXISTS (SELECT 1 FROM databases d WHERE d.id = database_rows.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

-- VIEWS
CREATE POLICY "views_select" ON views FOR SELECT
  USING (EXISTS (SELECT 1 FROM databases d WHERE d.id = views.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

CREATE POLICY "views_insert" ON views FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM databases d WHERE d.id = views.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

CREATE POLICY "views_update" ON views FOR UPDATE
  USING (EXISTS (SELECT 1 FROM databases d WHERE d.id = views.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

CREATE POLICY "views_delete" ON views FOR DELETE
  USING (EXISTS (SELECT 1 FROM databases d WHERE d.id = views.database_id AND check_is_workspace_member(d.workspace_id, auth.uid())));

-- COMMENTS
CREATE POLICY "comments_select" ON comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM pages p WHERE p.id = comments.page_id AND check_is_workspace_member(p.workspace_id, auth.uid())));

CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM pages p WHERE p.id = comments.page_id AND check_is_workspace_member(p.workspace_id, auth.uid())));

CREATE POLICY "comments_update" ON comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "comments_delete" ON comments FOR DELETE
  USING (user_id = auth.uid());

-- PRESENCE
CREATE POLICY "presence_select" ON presence FOR SELECT
  USING (check_is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "presence_all" ON presence FOR ALL
  USING (user_id = auth.uid());
