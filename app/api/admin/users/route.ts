import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { getAuthUser } from '@/lib/auth-server'
export async function GET(req: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('Admin users GET error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('Admin users DELETE error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
