import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email, redirectTo } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    // 1. Verify if user actually exists in Auth
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
    const userExists = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    if (!userExists) {
      console.error('User not found in Auth table:', email)
      return NextResponse.json({ 
        error: 'Email ini tidak terdaftar sebagai akun pengguna (tidak ditemukan di Auth Users).' 
      }, { status: 404 })
    }

    // 2. Generate a reset link via admin API
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo
      }
    })

    if (error) {
      console.error('Admin generate link error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.properties?.action_link) {
      // Try to send the email via Resend
      const { success } = await sendPasswordResetEmail({
        to: email,
        resetLink: data.properties.action_link
      })

      // Return everything needed for a direct bypass in testing mode
      return NextResponse.json({ 
        message: success ? 'Reset link sent to email' : 'Reset link generated (Testing Mode)',
        testLink: data.properties.action_link,
        email: email,
        token: data.properties.email_otp // This is the plain OTP code
      })
    }

    return NextResponse.json({ message: 'Reset link generated' })
  } catch (err: any) {
    console.error('Unexpected reset error:', err)
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 })
  }
}
