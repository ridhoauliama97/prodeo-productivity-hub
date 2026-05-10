import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthUser } from '@/lib/auth-server'

// POST /api/auth/profile - create user profile after signup (only if not exists)
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  
  const body = await req.json()
  const { user_id, email, full_name } = body

  if (!user_id || !email) {
    return NextResponse.json({ error: 'user_id and email are required' }, { status: 400 })
  }

  // Security check: Ensure the user_id matches the authenticated user
  if (!user || user.id !== user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Check if profile already exists — if so, don't overwrite
  const { data: existing } = await admin
    .from('user_profiles')
    .select('id')
    .eq('id', user_id)
    .single()

  if (existing) {
    // Profile already exists, don't overwrite user-set names
    return NextResponse.json({ profile: existing })
  }

  // Create new profile only for first-time users
  const { data, error } = await admin
    .from('user_profiles')
    .insert({
      id: user_id,
      email,
      full_name: full_name || email.split('@')[0],
      username: email.split('@')[0],
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // After profile creation, check for pending invitations for this email
  const { data: invitations } = await admin
    .from('invitations')
    .select('*')
    .ilike('email', email)
    .eq('status', 'pending')

  if (invitations && invitations.length > 0) {
    for (const invite of invitations) {
      // Add to workspace
      await admin.from('workspace_members').insert({
        workspace_id: invite.workspace_id,
        user_id: user_id,
        role: invite.role,
      })
      
      // Mark as accepted
      await admin.from('invitations').update({ status: 'accepted' }).eq('id', invite.id)
    }
  }

  return NextResponse.json({ profile: data, invitations_claimed: invitations?.length || 0 })
}
