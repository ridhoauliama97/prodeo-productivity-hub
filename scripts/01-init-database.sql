-- Create extension for UUID generation
create extension if not exists "uuid-ossp";

-- Workspaces table
create table if not exists workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- User profiles
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  full_name text,
  avatar_url text,
  workspace_ids uuid[] default array[]::uuid[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Workspace members
create table if not exists workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member', -- 'owner', 'admin', 'member', 'viewer'
  created_at timestamp with time zone default now(),
  unique(workspace_id, user_id)
);

-- Pages (documents)
create table if not exists pages (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null default 'Untitled',
  icon text,
  created_by uuid not null references auth.users(id) on delete set null,
  parent_page_id uuid references pages(id) on delete cascade,
  is_database boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Blocks (content within pages - paragraphs, headings, etc)
create table if not exists blocks (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references pages(id) on delete cascade,
  parent_block_id uuid references blocks(id) on delete cascade,
  type text not null, -- 'paragraph', 'heading1', 'heading2', 'heading3', 'bullet_list', 'numbered_list', 'code', 'image', 'video', etc
  content jsonb default '{}', -- stores rich text content
  properties jsonb default '{}', -- stores additional properties like color, background, etc
  order_index integer not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Databases (Notion-style databases)
create table if not exists databases (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null unique references pages(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Database fields (columns)
create table if not exists database_fields (
  id uuid primary key default uuid_generate_v4(),
  database_id uuid not null references databases(id) on delete cascade,
  name text not null,
  type text not null, -- 'text', 'number', 'select', 'multi_select', 'date', 'checkbox', 'url', 'email', 'phone', etc
  properties jsonb default '{}', -- stores field-specific settings like select options
  order_index integer not null,
  is_title_field boolean default false,
  created_at timestamp with time zone default now(),
  unique(database_id, name)
);

-- Database rows
create table if not exists database_rows (
  id uuid primary key default uuid_generate_v4(),
  database_id uuid not null references databases(id) on delete cascade,
  properties jsonb not null default '{}'::jsonb, -- stores field values as JSON {field_id: value}
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Views (different ways to display database data)
create table if not exists views (
  id uuid primary key default uuid_generate_v4(),
  database_id uuid not null references databases(id) on delete cascade,
  name text not null,
  type text not null, -- 'table', 'board', 'gallery', 'calendar'
  properties jsonb default '{}', -- view-specific settings
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Comments on pages
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Cursor positions for real-time collaboration
create table if not exists presence (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  page_id uuid references pages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  cursor_position integer,
  selection_start integer,
  selection_end integer,
  last_seen_at timestamp with time zone default now(),
  unique(workspace_id, page_id, user_id)
);

-- Enable Row Level Security
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table pages enable row level security;
alter table blocks enable row level security;
alter table databases enable row level security;
alter table database_fields enable row level security;
alter table database_rows enable row level security;
alter table views enable row level security;
alter table user_profiles enable row level security;
alter table comments enable row level security;
alter table presence enable row level security;

-- RLS Policies for workspaces
create policy "Users can view workspaces they're members of"
  on workspaces for select
  using (
    auth.uid() = owner_id or
    exists (select 1 from workspace_members where workspace_members.workspace_id = id and workspace_members.user_id = auth.uid())
  );

create policy "Users can create workspaces"
  on workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Workspace owners can update their workspaces"
  on workspaces for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Workspace owners can delete their workspaces"
  on workspaces for delete
  using (auth.uid() = owner_id);

-- RLS Policies for workspace_members
create policy "Users can view workspace members"
  on workspace_members for select
  using (user_id = auth.uid());

create policy "Users can insert workspace members"
  on workspace_members for insert
  with check (
    user_id = auth.uid() or 
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  );

create policy "Users can update workspace members"
  on workspace_members for update
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  );

create policy "Users can delete workspace members"
  on workspace_members for delete
  using (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  );

-- RLS Policies for pages
create policy "Users can view pages in their workspaces"
  on pages for select
  using (
    exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = pages.workspace_id
      and workspace_members.user_id = auth.uid()
    ) or
    auth.uid() = created_by
  );

create policy "Users can create pages in their workspaces"
  on pages for insert
  with check (
    exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = pages.workspace_id
      and workspace_members.user_id = auth.uid()
    )
  );

create policy "Users can update pages in their workspaces"
  on pages for update
  using (
    exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = pages.workspace_id
      and workspace_members.user_id = auth.uid()
    )
  );

create policy "Users can delete pages in their workspaces"
  on pages for delete
  using (
    auth.uid() = created_by
    or exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = pages.workspace_id
      and workspace_members.user_id = auth.uid()
    )
  );

-- RLS Policies for blocks
create policy "Users can view blocks they have access to"
  on blocks for select
  using (
    exists (
      select 1 from pages
      where pages.id = blocks.page_id
      and exists (
        select 1 from workspace_members
        where workspace_members.workspace_id = pages.workspace_id
        and workspace_members.user_id = auth.uid()
      )
    )
  );

create policy "Users can create blocks in pages they can edit"
  on blocks for insert
  with check (
    exists (
      select 1 from pages
      where pages.id = blocks.page_id
      and exists (
        select 1 from workspace_members
        where workspace_members.workspace_id = pages.workspace_id
        and workspace_members.user_id = auth.uid()
      )
    )
  );

create policy "Users can update blocks in pages they can edit"
  on blocks for update
  using (
    exists (
      select 1 from pages
      where pages.id = blocks.page_id
      and exists (
        select 1 from workspace_members
        where workspace_members.workspace_id = pages.workspace_id
        and workspace_members.user_id = auth.uid()
      )
    )
  );

create policy "Users can delete blocks in pages they can edit"
  on blocks for delete
  using (
    exists (
      select 1 from pages
      where pages.id = blocks.page_id
      and (
        auth.uid() = pages.created_by
        or exists (
          select 1 from workspace_members
          where workspace_members.workspace_id = pages.workspace_id
          and workspace_members.user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for databases
create policy "Users can view databases in their workspaces" on databases for select using (exists (select 1 from workspace_members where workspace_members.workspace_id = databases.workspace_id and workspace_members.user_id = auth.uid()));
create policy "Users can create databases in their workspaces" on databases for insert with check (exists (select 1 from workspace_members where workspace_members.workspace_id = databases.workspace_id and workspace_members.user_id = auth.uid()));
create policy "Users can update databases in their workspaces" on databases for update using (exists (select 1 from workspace_members where workspace_members.workspace_id = databases.workspace_id and workspace_members.user_id = auth.uid()));
create policy "Users can delete databases in their workspaces" on databases for delete using (exists (select 1 from workspace_members where workspace_members.workspace_id = databases.workspace_id and workspace_members.user_id = auth.uid()));

-- RLS Policies for database_fields
create policy "Users can view database fields" on database_fields for select using (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = database_fields.database_id and wm.user_id = auth.uid()));
create policy "Users can insert database fields" on database_fields for insert with check (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = database_fields.database_id and wm.user_id = auth.uid()));
create policy "Users can update database fields" on database_fields for update using (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = database_fields.database_id and wm.user_id = auth.uid()));
create policy "Users can delete database fields" on database_fields for delete using (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = database_fields.database_id and wm.user_id = auth.uid()));

-- RLS Policies for database_rows
create policy "Users can view database rows" on database_rows for select using (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = database_rows.database_id and wm.user_id = auth.uid()));
create policy "Users can insert database rows" on database_rows for insert with check (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = database_rows.database_id and wm.user_id = auth.uid()));
create policy "Users can update database rows" on database_rows for update using (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = database_rows.database_id and wm.user_id = auth.uid()));
create policy "Users can delete database rows" on database_rows for delete using (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = database_rows.database_id and wm.user_id = auth.uid()));

-- RLS Policies for views
create policy "Users can view views" on views for select using (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = views.database_id and wm.user_id = auth.uid()));
create policy "Users can insert views" on views for insert with check (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = views.database_id and wm.user_id = auth.uid()));
create policy "Users can update views" on views for update using (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = views.database_id and wm.user_id = auth.uid()));
create policy "Users can delete views" on views for delete using (exists (select 1 from databases d join workspace_members wm on d.workspace_id = wm.workspace_id where d.id = views.database_id and wm.user_id = auth.uid()));

-- RLS Policies for user_profiles
create policy "Users can view all profiles" on user_profiles for select to authenticated using (true);
create policy "Users can update their own profile" on user_profiles for update using (id = auth.uid());

-- RLS Policies for comments
create policy "Users can view comments on accessible pages" on comments for select using (exists (select 1 from pages p join workspace_members wm on p.workspace_id = wm.workspace_id where p.id = comments.page_id and wm.user_id = auth.uid()));
create policy "Users can insert comments" on comments for insert with check (exists (select 1 from pages p join workspace_members wm on p.workspace_id = wm.workspace_id where p.id = comments.page_id and wm.user_id = auth.uid()));
create policy "Users can update their own comments" on comments for update using (user_id = auth.uid());
create policy "Users can delete their own comments" on comments for delete using (user_id = auth.uid());

-- RLS Policies for presence
create policy "Users can view presence in their workspaces" on presence for select using (exists (select 1 from workspace_members where workspace_members.workspace_id = presence.workspace_id and workspace_members.user_id = auth.uid()));
create policy "Users can manage their own presence" on presence for all using (user_id = auth.uid());

-- Indexes for performance
create index idx_pages_workspace_id on pages(workspace_id);
create index idx_pages_parent_page_id on pages(parent_page_id);
create index idx_pages_created_by on pages(created_by);
create index idx_blocks_page_id on blocks(page_id);
create index idx_blocks_parent_block_id on blocks(parent_block_id);
create index idx_database_fields_database_id on database_fields(database_id);
create index idx_database_rows_database_id on database_rows(database_id);
create index idx_views_database_id on views(database_id);
create index idx_workspace_members_workspace_id on workspace_members(workspace_id);
create index idx_workspace_members_user_id on workspace_members(user_id);
create index idx_comments_page_id on comments(page_id);
create index idx_presence_workspace_id on presence(workspace_id);
create index idx_user_profiles_email on user_profiles(email);
create index idx_user_profiles_username on user_profiles(username);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_workspaces_updated_at before update on workspaces
  for each row execute function update_updated_at_column();

create trigger update_pages_updated_at before update on pages
  for each row execute function update_updated_at_column();

create trigger update_blocks_updated_at before update on blocks
  for each row execute function update_updated_at_column();

create trigger update_databases_updated_at before update on databases
  for each row execute function update_updated_at_column();

create trigger update_database_rows_updated_at before update on database_rows
  for each row execute function update_updated_at_column();

create trigger update_user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at_column();
