import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// POST /api/auth/signup - create user via admin client (bypasses email rate limit)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, full_name } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Create user via admin API (skips email confirmation & rate limits)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: { full_name }
  })

  if (error) {
    console.error('Admin signup error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.user) {
    // Create user profile
    await admin.from('user_profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      full_name: full_name || data.user.email?.split('@')[0] || 'User',
    }, { onConflict: 'id' })
  }

  return NextResponse.json({ user: data.user })
}
