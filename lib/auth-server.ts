import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from './supabase-server-client'

/**
 * Standardizes user authentication across API routes.
 * Checks both session cookies and the Authorization header.
 */
export async function getAuthUser(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  
  // 1. Try getting user from session/cookies
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user

  // 2. Fallback to Authorization header if cookies are missing (e.g. mobile or direct API calls)
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: headerUser } } = await supabase.auth.getUser(token)
    return headerUser
  }

  return null
}
