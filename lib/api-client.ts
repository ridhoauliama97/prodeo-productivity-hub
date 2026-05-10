import { createClient } from './supabase-client'

/**
 * Makes an authenticated API call to our server-side routes.
 * These routes use the service role key to bypass RLS.
 */
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('Not authenticated')
  }

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

// ===== Workspaces =====

export async function fetchWorkspacesApi() {
  const res = await authFetch('/api/workspaces')
  
  if (!res.ok) {
    let errorMessage = 'Failed to fetch workspaces'
    const text = await res.text()
    try {
      const err = JSON.parse(text)
      errorMessage = err.error || errorMessage
    } catch (e) {
      errorMessage = `Server Error (${res.status}): ${text.slice(0, 200)}...`
    }
    throw new Error(errorMessage)
  }

  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return json.workspaces
  } catch (e) {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}...`)
  }
}

export async function createWorkspaceApi(name: string) {
  const res = await authFetch('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create workspace')
  }
  const json = await res.json()
  return json.workspace
}

// ===== Data (generic) =====

export async function fetchWorkspaceById(id: string) {
  const res = await authFetch(`/api/data?type=workspace&id=${id}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to fetch workspace')
  }
  const json = await res.json()
  return json.data
}

export async function fetchPages(workspaceId: string) {
  const res = await authFetch(`/api/data?type=pages&workspace_id=${workspaceId}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to fetch pages')
  }
  const json = await res.json()
  return json.data
}

export async function fetchDatabaseData(pageId: string) {
  const res = await authFetch(`/api/data?type=database&page_id=${pageId}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to fetch database')
  }
  const json = await res.json()
  return json.data
}

export async function fetchWorkspaceMembers(workspaceId: string) {
  const res = await authFetch(`/api/data?type=members&workspace_id=${workspaceId}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to fetch members')
  }
  const json = await res.json()
  return json.data
}

// ===== Member mutations =====

export async function inviteMemberApi(workspaceId: string, email: string) {
  const res = await authFetch('/api/data', {
    method: 'POST',
    body: JSON.stringify({ type: 'invite_member', workspace_id: workspaceId, email }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to invite member')
  }
  const json = await res.json()
  return json
}

export async function updateMemberRoleApi(memberId: string, role: string) {
  const res = await authFetch('/api/data', {
    method: 'POST',
    body: JSON.stringify({ type: 'update_member_role', member_id: memberId, role }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update role')
  }
  return true
}

export async function removeMemberApi(memberId: string) {
  const res = await authFetch('/api/data', {
    method: 'POST',
    body: JSON.stringify({ type: 'remove_member', member_id: memberId }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to remove member')
  }
  return true
}

// ===== Inbox / Notifications =====

export async function fetchInbox() {
  const res = await authFetch('/api/inbox')
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to fetch inbox')
  }
  const json = await res.json()
  return json.data || []
}

export async function fetchInboxCount(): Promise<number> {
  const res = await authFetch('/api/inbox?count=true')
  if (!res.ok) {
    return 0
  }
  const json = await res.json()
  return json.count || 0
}

export async function markInboxRead(id: string) {
  const res = await authFetch('/api/inbox', {
    method: 'POST',
    body: JSON.stringify({ action: 'mark_read', id }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to mark as read')
  }
  return true
}

export async function markInboxAllRead() {
  const res = await authFetch('/api/inbox', {
    method: 'POST',
    body: JSON.stringify({ action: 'mark_all_read' }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to mark all as read')
  }
  return true
}

export async function createNotificationApi(userId: string, title: string, content: string, link?: string) {
  const res = await authFetch('/api/data', {
    method: 'POST',
    body: JSON.stringify({ type: 'create_notification', user_id: userId, title, content, link }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create notification')
  }
  return true
}
