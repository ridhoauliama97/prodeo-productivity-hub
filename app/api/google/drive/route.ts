import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

async function getAuthUser(req: NextRequest) {
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
  return null
}

async function refreshAccessToken(userId: string, refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Missing Google Client ID or Secret for token refresh')
    return null
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Error refreshing Google token:', data)
      return null
    }

    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('google_tokens')
      .update({
        provider_token: data.access_token,
        expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating refreshed token in DB:', updateError)
      return null
    }

    return data.access_token
  } catch (err) {
    console.error('Failed to refresh Google token:', err)
    return null
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folderId') || 'root'
  const pageToken = searchParams.get('pageToken')

  const admin = createAdminClient()

  // 1. Get the tokens from the database
  const { data: tokenData, error: tokenError } = await admin
    .from('google_tokens')
    .select('provider_token, provider_refresh_token, expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (tokenError || !tokenData?.provider_token) {
    return NextResponse.json({ error: 'Google account not linked or token missing' }, { status: 403 })
  }

  let providerToken = tokenData.provider_token
  const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false

  // If token is expired and we have a refresh token, try to refresh it first
  if (isExpired && tokenData.provider_refresh_token) {
    console.log('Token expired, attempting auto-refresh for user:', user.id)
    const newToken = await refreshAccessToken(user.id, tokenData.provider_refresh_token)
    if (newToken) {
      providerToken = newToken
    }
  }

  // 2. Query Google Drive API
  const fetchFromGoogle = async (token: string) => {
    let q = `'${folderId}' in parents and trashed = false`
    if (folderId === 'sharedWithMe') {
      q = `sharedWithMe = true and trashed = false`
    } else if (folderId === 'root') {
      q = `'root' in parents and trashed = false`
    }

    const fields = 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink, thumbnailLink)'
    let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}`
    
    if (folderId !== 'sharedWithMe') {
      url += `&orderBy=folder,name`
    }
    
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`
    }

    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  try {
    let response = await fetchFromGoogle(providerToken)

    // If still 401, try refreshing one last time if we haven't already
    if (response.status === 401 && tokenData.provider_refresh_token && !isExpired) {
      console.log('Received 401, attempting auto-refresh for user:', user.id)
      const newToken = await refreshAccessToken(user.id, tokenData.provider_refresh_token)
      if (newToken) {
        response = await fetchFromGoogle(newToken)
      }
    }

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Google Drive API Error:', errorData)
      
      if (response.status === 401) {
        return NextResponse.json({ 
          error: 'Google session expired. Please reconnect your Google account in your Profile.',
          expired: true 
        }, { status: 401 })
      }
      
      return NextResponse.json({ error: 'Failed to fetch files from Google Drive' }, { status: response.status })
    }

    const data = await response.json()

    // Inject "Shared with me" pseudo-folder at the root
    if (folderId === 'root' && !pageToken) {
      data.files = [
        {
          id: 'sharedWithMe',
          name: 'Shared with me',
          mimeType: 'application/vnd.google-apps.folder',
          iconLink: 'https://fonts.gstatic.com/s/i/productlogos/drive_shared_with_me/v6/web-512dp/logo_drive_shared_with_me_color_1x_web_512dp.png'
        },
        ...(data.files || [])
      ]
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Error fetching Google Drive:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
