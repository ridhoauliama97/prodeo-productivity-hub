import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

async function getAuthUser(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  // 1. Try getting user from session/cookies
  const { data: { user }, error } = await supabase.auth.getUser()
  if (user) return user

  // 2. Fallback to Authorization header if cookies are missing
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: headerUser } } = await supabase.auth.getUser(token)
    return headerUser
  }

  return null
}

// GET: Check Google connection status for the current user
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: tokenData, error } = await admin
    .from('google_tokens')
    .select('email, scopes, expires_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!tokenData) {
    return NextResponse.json({
      connected: false,
      email: null,
    })
  }

  return NextResponse.json({
    connected: true,
    email: tokenData.email,
    scopes: tokenData.scopes,
    expires_at: tokenData.expires_at,
    updated_at: tokenData.updated_at,
  })
}

// DELETE: Remove Google tokens (disconnect Google account)
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('google_tokens')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
