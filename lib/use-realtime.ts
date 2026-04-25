import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeListenerOptions {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onMessage: (payload: any) => void
  schema?: string
}

export function useRealtimeListener(
  table: string,
  options: RealtimeListenerOptions
) {
  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel | null = null

    const subscribe = async () => {
      channel = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: options.event,
            schema: options.schema || 'public',
            table: table,
          },
          (payload) => {
            options.onMessage(payload)
          }
        )
        .subscribe()
    }

    subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, options])
}

export function usePresence(
  workspaceId: string,
  pageId: string | null,
  userId: string | null
) {
  const supabase = createClient()

  const updatePresence = useCallback(
    async (cursorPosition?: number) => {
      if (!userId || !workspaceId) return

      try {
        await supabase
          .from('presence')
          .upsert({
            workspace_id: workspaceId,
            page_id: pageId,
            user_id: userId,
            cursor_position: cursorPosition,
            last_seen_at: new Date().toISOString(),
          })
      } catch (err) {
        console.error('Error updating presence:', err)
      }
    },
    [supabase, workspaceId, pageId, userId]
  )

  const clearPresence = useCallback(async () => {
    if (!userId || !workspaceId) return

    try {
      await supabase
        .from('presence')
        .delete()
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
    } catch (err) {
      console.error('Error clearing presence:', err)
    }
  }, [supabase, workspaceId, userId])

  return { updatePresence, clearPresence }
}
