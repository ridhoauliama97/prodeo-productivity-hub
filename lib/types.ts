export interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface UserProfile {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  workspace_ids: string[]
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
}

export interface Page {
  id: string
  workspace_id: string
  title: string
  icon?: string
  created_by: string
  parent_page_id?: string
  is_database: boolean
  cover_url?: string
  created_at: string
  updated_at: string
}

export interface Block {
  id: string
  page_id: string
  parent_block_id?: string
  type: string
  content: Record<string, any>
  properties: Record<string, any>
  order_index: number
  created_at: string
  updated_at: string
}

export interface Database {
  id: string
  page_id: string
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface DatabaseField {
  id: string
  database_id: string
  name: string
  type: string
  properties: Record<string, any>
  order_index: number
  is_title_field: boolean
  created_at: string
}

export interface DatabaseRow {
  id: string
  database_id: string
  properties: Record<string, any>
  created_by?: string
  created_at: string
  updated_at: string
}

export interface View {
  id: string
  database_id: string
  name: string
  type: 'table' | 'board' | 'gallery' | 'calendar'
  properties: Record<string, any>
  created_at: string
}
