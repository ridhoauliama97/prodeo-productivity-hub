import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

async function getAuthUser(req: NextRequest) {
  // First try Bearer token from header
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase.auth.getUser(token)
    if (!error && data.user) return data.user
  }
  
  // Next try cookies (since we access via browser fetch)
  const cookieHeader = req.headers.get('cookie')
  if (cookieHeader) {
    // In server components or API routes without Next.js cookies() helper,
    // we can use standard supabase auth getSession if we forward cookies,
    // but the easiest way is to let Supabase auth client with cookies do it.
    // However, since we're in standard Route Handler, let's just use 
    // supabase-server if needed, or rely on the frontend sending the Bearer token.
    // Since our frontend fetch("/api/admin/users") currently doesn't send Bearer 
    // token explicitly via authFetch, it might fail unless we update it.
    // Let's rely on standard cookies via createServerClient or update the frontend to use authFetch.
  }
  
  return null
}

// Alternatively, let's just use createServerClient if possible, but our current
// authFetch in api-client.ts sends the Bearer token. I should update the frontend 
// to use authFetch or send the token.
// For now, I'll update the frontend to send the token. Let's assume the frontend sends the token.
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  
  if (!user || user.email !== 'superadmin@example.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Fetch all user profiles
  const { data: users, error } = await admin
    .from('user_profiles')
    .select('id, email, full_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  
  if (!user || user.email !== 'superadmin@example.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (user.id === id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Delete user from Supabase Auth completely
  // Note: auth.admin.deleteUser requires service_role key, which createAdminClient uses.
  const { error: authError } = await admin.auth.admin.deleteUser(id)
  
  if (authError) {
    console.error('Error deleting user from auth:', authError)
    // Sometimes user may not exist in Auth but exists in profiles
    // We should proceed to delete from profiles anyway, but if it's a real auth error we return it
    if (authError.status !== 404) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
  }

  // Delete from user_profiles (if not cascaded)
  const { error: profileError } = await admin
    .from('user_profiles')
    .delete()
    .eq('id', id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
