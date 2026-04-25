-- Create invitations table for users who haven't signed up yet
create table if not exists invitations (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  token uuid not null default uuid_generate_v4(),
  status text not null default 'pending', -- 'pending', 'accepted', 'expired'
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '7 days'),
  unique(workspace_id, email)
);

-- Enable RLS
alter table invitations enable row level security;

-- RLS Policies
create policy "Invitors can view their own invitations"
  on invitations for select
  using (auth.uid() = inviter_id);

create policy "Invitors can create invitations"
  on invitations for insert
  with check (auth.uid() = inviter_id);

create policy "Invitors can delete their own pending invitations"
  on invitations for delete
  using (auth.uid() = inviter_id);

-- Anyone can view an invitation by token (needed for the landing page)
create policy "Anyone can view invitation by token"
  on invitations for select
  using (true);

-- Index for token lookups
create index if not exists idx_invitations_token on invitations(token);
create index if not exists idx_invitations_email on invitations(email);
