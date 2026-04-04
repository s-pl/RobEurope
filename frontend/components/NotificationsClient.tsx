'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRealtime } from '@/components/providers/RealtimeProvider'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export default function NotificationsClient({
  notifications: initial,
  locale,
  userId,
}: {
  notifications: Notification[]
  locale: string
  userId: string
}) {
  const t = useTranslations('notifications')
  const { session } = useAuth()
  const { subscribeToNotifications } = useRealtime()
  const [notifications, setNotifications] = useState<Notification[]>(initial)

  // Subscribe to real-time notifications via Supabase
  useEffect(() => {
    const unsubscribe = subscribeToNotifications(userId, (notif: any) => {
      setNotifications((prev) => [notif as Notification, ...prev])
    })
    return unsubscribe
  }, [userId, subscribeToNotifications])

  async function markAllRead() {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST', accessToken: session?.access_token })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch { /* ignore */ }
  }

  async function markRead(id: string) {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH', accessToken: session?.access_token })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch { /* ignore */ }
  }

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            {t('title')}
          </h1>
          {unread > 0 && (
            <Badge className="ml-1">{unread}</Badge>
          )}
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="gap-1 text-xs">
            <Check className="h-3.5 w-3.5" /> {t('markAllRead')}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
          <Bell className="h-10 w-10 text-stone-300 dark:text-stone-700 mb-3" />
          <p className="text-stone-500 dark:text-stone-400">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                n.is_read
                  ? 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950'
                  : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 cursor-pointer hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`font-medium text-sm ${n.is_read ? 'text-stone-700 dark:text-stone-300' : 'text-stone-900 dark:text-stone-50'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{n.message}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                  <time className="text-xs text-stone-400">
                    {new Date(n.created_at).toLocaleDateString(locale)}
                  </time>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
