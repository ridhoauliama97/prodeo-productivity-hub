import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthUser } from '@/lib/auth-server'

// GET /api/inbox — Fetch all notifications for the current user
// GET /api/inbox?count=true — Return only the unread count
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const countOnly = searchParams.get('count') === 'true'

  if (countOnly) {
    // Return just the unread notification count
    const { count, error } = await admin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ count: count || 0 })
  }

  // Fetch all notifications, most recent first
  const { data: notifications, error } = await admin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: notifications || [] })
}

// POST /api/inbox — Mark notifications as read
// Body: { action: 'mark_all_read' } or { action: 'mark_read', id: '...' }
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()

  switch (body.action) {
    case 'mark_all_read': {
      const { error } = await admin
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    case 'mark_read': {
      const { id } = body
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

      const { error } = await admin
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}
