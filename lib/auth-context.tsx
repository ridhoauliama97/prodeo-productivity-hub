'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, full_name?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ link?: string, email?: string, token?: string } | undefined>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function ensureUserProfile(user: any) {
  if (!user) return
  try {
    await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      }),
    })
  } catch (err) {
    console.error('Error ensuring user profile:', err)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user as User || null
      setUser(currentUser)
      if (currentUser) {
        await ensureUserProfile(currentUser)
      }
      setLoading(false)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user as User || null
      setUser(currentUser)
      if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await ensureUserProfile(currentUser)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, full_name?: string) => {
    // Use admin API to bypass email rate limit & auto-confirm
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name }),
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error || 'Failed to sign up')
    }
    // Auto-login after admin-created account
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    console.log("Attempting password reset for:", email);
    
    // Using our custom API to bypass Supabase rate limits
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        redirectTo: `${window.location.origin}/auth/reset-password` 
      }),
    })
    
    const json = await res.json()
    if (!res.ok) {
      console.error("Reset API Error:", json.error);
      throw new Error(json.error || 'Failed to send reset link');
    }

    return {
        link: json.testLink,
        email: json.email,
        token: json.token
    };
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
