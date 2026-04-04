'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

const supabase = createClient()

interface RealtimeContextValue {
  subscribeToTeamChat: (teamId: string, onMessage: (payload: unknown) => void) => () => void
  subscribeToNotifications: (userId: string, onNotification: (payload: unknown) => void) => () => void
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const channels = useRef<RealtimeChannel[]>([])

  function subscribeToTeamChat(teamId: string, onMessage: (payload: unknown) => void) {
    const channel = supabase
      .channel(`team_chat:${teamId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'TeamMessage', filter: `team_id=eq.${teamId}` },
        (payload) => onMessage(payload.new)
      )
      .subscribe()

    channels.current.push(channel)

    return () => {
      supabase.removeChannel(channel)
      channels.current = channels.current.filter((c) => c !== channel)
    }
  }

  function subscribeToNotifications(userId: string, onNotification: (payload: unknown) => void) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Notification', filter: `user_id=eq.${userId}` },
        (payload) => onNotification(payload.new)
      )
      .subscribe()

    channels.current.push(channel)

    return () => {
      supabase.removeChannel(channel)
      channels.current = channels.current.filter((c) => c !== channel)
    }
  }

  // Cleanup all channels on unmount
  useEffect(() => {
    return () => {
      channels.current.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ subscribeToTeamChat, subscribeToNotifications }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}
