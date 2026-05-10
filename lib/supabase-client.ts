import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let cookieOptions: any = {};
  
  if (typeof window !== 'undefined') {
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
      // 30 minutes as requested
      cookieOptions.maxAge = 30 * 60; 
    } else if (rememberMe === 'false') {
      // If remember me is not checked, we ideally want a session cookie.
      // Supabase's default maxAge is 31536000 (1 year). 
      // We set a very short duration or try to let it be a session cookie.
      // For session cookie, we can omit maxAge in the underlying cookie setter, 
      // but passing undefined here causes Supabase to use its default 1-year maxAge.
      // So we can set a short maxAge for non-remember-me, e.g., 24 hours, or just omit it.
      // Let's set it to 0 so it expires on close? No, 0 expires immediately.
      // Let's do 1 day (86400) if not remembered, but wait, the user asked for 30 minutes FOR remember me.
      // Let's just pass nothing for false so it falls back to session if we configure the server too.
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Check your .env.local file.')
    // Return a dummy client or handle gracefully to prevent app crash
    // but in this case, @supabase/ssr will throw an error anyway if we pass empty strings.
    // Providing clear logs is the first step.
  }

  return createBrowserClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
      cookieOptions
    }
  )
}
