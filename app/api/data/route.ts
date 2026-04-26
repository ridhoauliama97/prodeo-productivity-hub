import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { sendInvitationEmail } from '@/lib/email'

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

// GET /api/data?type=workspace&id=xxx
// GET /api/data?type=pages&workspace_id=xxx
// GET /api/data?type=database&page_id=xxx
// GET /api/data?type=members&workspace_id=xxx
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const admin = createAdminClient()

  switch (type) {
    case 'workspace': {
      const id = searchParams.get('id')
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      
      const { data, error } = await admin
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }

    case 'pages': {
      const workspaceId = searchParams.get('workspace_id')
      if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
      
      const { data, error } = await admin
        .from('pages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: data || [] })
    }

    case 'database': {
      const pageId = searchParams.get('page_id')
      if (!pageId) return NextResponse.json({ error: 'page_id required' }, { status: 400 })
      
      // Get the database
      const { data: db, error: dbError } = await admin
        .from('databases')
        .select('*')
        .eq('page_id', pageId)
        .maybeSingle()
      
      if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
      
      if (!db) {
        // Return empty database structure instead of 500
        return NextResponse.json({ 
          data: { 
            database: null, 
            fields: [], 
            rows: [] 
          } 
        })
      }
      
      // Get fields
      const { data: fields, error: fieldsError } = await admin
        .from('database_fields')
        .select('*')
        .eq('database_id', db.id)
        .order('order_index', { ascending: true })
      
      if (fieldsError) return NextResponse.json({ error: fieldsError.message }, { status: 500 })
      
      // Get rows
      const { data: rows, error: rowsError } = await admin
        .from('database_rows')
        .select('*')
        .eq('database_id', db.id)
        .order('created_at', { ascending: true })
      
      if (rowsError) return NextResponse.json({ error: rowsError.message }, { status: 500 })
      
      return NextResponse.json({ data: { database: db, fields: fields || [], rows: rows || [] } })
    }

    case 'members': {
      const workspaceId = searchParams.get('workspace_id')
      if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
      
      const { data: members, error } = await admin
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Fetch user profiles for each member
      const userIds = (members || []).map((m: any) => m.user_id)
      let profiles: any[] = []
      if (userIds.length > 0) {
        const { data: profilesData } = await admin
          .from('user_profiles')
          .select('*')
          .in('id', userIds)
        profiles = profilesData || []
      }

      // Merge profiles into members
      const enrichedMembers = (members || []).map((member: any) => ({
        ...member,
        user_profiles: profiles.find((p: any) => p.id === member.user_id) || null,
      }))

      return NextResponse.json({ data: enrichedMembers })
    }

    default:
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
}

// POST /api/data - for mutations
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { type, action, ...payload } = body
  const admin = createAdminClient()

  switch (type) {
    case 'invite_member': {
      const { workspace_id, email } = payload
      
      // Find user by email
      const { data: profile, error: profileError } = await admin
        .from('user_profiles')
        .select('id')
        .ilike('email', email)
        .single()
      
      // Create invitation regardless of whether user exists
      const { data: invite, error: inviteError } = await admin
        .from('invitations')
        .insert({
          workspace_id,
          email,
          inviter_id: user.id,
          role: 'member'
        })
        .select('token')
        .single()

      if (inviteError) {
        if (inviteError.code === '23505') { // Unique constraint violation (already invited)
          const { data: existingInvite } = await admin
            .from('invitations')
            .select('token')
            .eq('workspace_id', workspace_id)
            .eq('email', email)
            .single()
          
          return NextResponse.json({ 
            invited: false, 
            invitation_token: existingInvite?.token,
            message: 'An invitation already exists for this email.' 
          })
        }
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
      }

      // Fetch workspace and inviter info for notifications/emails
      const { data: workspace } = await admin.from('workspaces').select('name').eq('id', workspace_id).single()
      const { data: inviter } = await admin.from('user_profiles').select('full_name').eq('id', user.id).single()

      if (profile) {
        // User exists! Check if they are already a member
        const { data: existingMember } = await admin
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspace_id)
          .eq('user_id', profile.id)
          .single()
        
        if (existingMember) {
          // If already a member, remove the invitation we just created to keep it clean
          await admin.from('invitations').delete().eq('token', invite.token)
          return NextResponse.json({ error: 'User is already a member of this workspace.' }, { status: 409 })
        }

        // Send an in-app notification
        await admin.from('notifications').insert({
          user_id: profile.id,
          title: `Workspace Invitation: ${workspace?.name || 'a workspace'}`,
          message: JSON.stringify({
            type: 'invite',
            token: invite.token,
            workspaceName: workspace?.name || 'a workspace',
            inviterName: inviter?.full_name || 'Someone',
            workspaceId: workspace_id
          }),
          read: false
        })

        return NextResponse.json({ success: true, message: 'Invitation sent via in-app notification.' })
      } else {
        // User not found, try to send automatic email
        try {
          const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const inviteLink = `${origin}/invite/${invite.token}`

          await sendInvitationEmail({
            to: email,
            workspaceName: workspace?.name || 'a workspace',
            inviterName: inviter?.full_name || 'Someone',
            inviteLink
          })
        } catch (emailErr) {
          console.error('Failed to send automatic invitation email:', emailErr)
        }

        return NextResponse.json({ 
          success: true,
          invited: false, 
          invitation_token: invite.token,
          message: 'User not found. An invitation email has been sent.' 
        })
      }
    }

    case 'update_member_role': {
      const { member_id, role } = payload
      const { error } = await admin
        .from('workspace_members')
        .update({ role })
        .eq('id', member_id)
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'remove_member': {
      const { member_id } = payload
      const { error } = await admin
        .from('workspace_members')
        .delete()
        .eq('id', member_id)
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'create_notification': {
      const { user_id, title, content, link } = payload
      if (!user_id || !title) return NextResponse.json({ error: 'user_id and title required' }, { status: 400 })

      const { error } = await admin
        .from('notifications')
        .insert({
          user_id,
          title,
          message: content,
          action_url: link || null,
          read: false
        })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    default:
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
}
