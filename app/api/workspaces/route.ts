import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

// Helper to get the authenticated user from the request
async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.replace('Bearer ', '')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

// GET /api/workspaces - list user's workspaces
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Get workspaces where user is owner OR member
  const { data: memberWorkspaceIds, error: memberError } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  const wsIds = (memberWorkspaceIds || []).map((m: any) => m.workspace_id)

  // Also include workspaces where user is owner
  const { data: ownedWorkspaces, error: ownedError } = await admin
    .from('workspaces')
    .select('*')
    .eq('owner_id', user.id)

  if (ownedError) {
    return NextResponse.json({ error: ownedError.message }, { status: 500 })
  }

  // Get member workspaces
  let memberWorkspaces: any[] = []
  if (wsIds.length > 0) {
    const { data, error } = await admin
      .from('workspaces')
      .select('*')
      .in('id', wsIds)
    if (!error && data) {
      memberWorkspaces = data
    }
  }

  // Merge and deduplicate
  const allWorkspaces = [...(ownedWorkspaces || []), ...memberWorkspaces]
  const uniqueMap = new Map(allWorkspaces.map(w => [w.id, w]))
  const workspaces = Array.from(uniqueMap.values())

  return NextResponse.json({ workspaces })
}

// POST /api/workspaces - create a new workspace
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name } = body

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Create workspace
  const { data: workspace, error: wsError } = await admin
    .from('workspaces')
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single()

  if (wsError) {
    return NextResponse.json({ error: wsError.message }, { status: 500 })
  }

  // Add user as owner member
  const { error: memberError } = await admin
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError) {
    console.error('Error adding owner as member:', memberError)
  }

  // Ensure user_profiles exists
  const { error: profileError } = await admin
    .from('user_profiles')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('Error creating profile:', profileError)
  }

  return NextResponse.json({ workspace })
}
