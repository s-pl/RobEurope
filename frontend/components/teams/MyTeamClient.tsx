'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Users, MessageSquare, Trophy, Settings, Send } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRealtime } from '@/components/providers/RealtimeProvider'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  user: { id: string; username: string; profile_photo_url?: string }
  role: string
}

interface Message {
  id: string
  content: string
  type: string
  user: { username: string; profile_photo_url?: string }
  created_at: string
}

interface Props {
  teamId: string | null | undefined
  team: any
  members: any[]
  registrations: any[]
  messages: any[]
  countries: any[]
  isOwner: boolean
  locale: string
  userId: string
}

export default function MyTeamClient({
  teamId,
  team,
  members,
  registrations,
  messages: initialMessages,
  isOwner,
  locale,
  userId,
}: Props) {
  const t = useTranslations('myTeam')
  const { session } = useAuth()
  const { subscribeToTeamChat } = useRealtime()
  const [messages, setMessages] = useState<Message[]>(initialMessages as Message[])
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Subscribe to Supabase Realtime for new messages
  useEffect(() => {
    if (!teamId) return
    const unsubscribe = subscribeToTeamChat(teamId, (msg: any) => {
      setMessages((prev) => [...prev, msg as Message])
    })
    return unsubscribe
  }, [teamId, subscribeToTeamChat])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!chatInput.trim() || !teamId) return
    setSending(true)
    try {
      await apiRequest(`/teams/${teamId}/messages`, {
        method: 'POST',
        body: { content: chatInput.trim() },
        accessToken: session?.access_token,
      })
      setChatInput('')
    } catch {
      toast.error('No se pudo enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  if (!teamId || !team) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <Users className="h-16 w-16 text-stone-300 dark:text-stone-700" />
        <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">{t('createTitle')}</h1>
        <p className="text-stone-500 dark:text-stone-400 max-w-sm">{t('createDesc')}</p>
        <Button>{t('actions.register')}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            {(team as any).name}
          </h1>
          {(team as any).country && (
            <p className="mt-1 text-stone-400 dark:text-stone-500 flex items-center gap-2">
              <span>{(team as any).country.flag_emoji}</span>
              <span>{(team as any).country.name}</span>
            </p>
          )}
        </div>
        {isOwner && (
          <Badge variant="secondary" className="label-caps">{t('roles.owner')}</Badge>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="members" className="gap-1">
            <Users className="h-3.5 w-3.5" /> {t('tabs.members')}
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {t('tabs.chat')}
          </TabsTrigger>
          <TabsTrigger value="competitions" className="gap-1">
            <Trophy className="h-3.5 w-3.5" /> {t('tabs.competitions')}
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="settings" className="gap-1">
              <Settings className="h-3.5 w-3.5" /> {t('tabs.settings')}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-4">
          {(team as any).description && (
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5">
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-50 mb-2">{t('settings.editTitle')}</h3>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{(team as any).description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5 text-center">
              <p className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">{members.length}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('members.title')}</p>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5 text-center">
              <p className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">{registrations.length}</p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('tabs.competitions')}</p>
            </div>
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-6 space-y-3">
          {(members as TeamMember[]).map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.user.profile_photo_url} />
                  <AvatarFallback>{m.user.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-stone-900 dark:text-stone-50">{m.user.username}</span>
              </div>
              <Badge variant="secondary" className="label-caps text-xs">{m.role}</Badge>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-stone-400 dark:text-stone-500 text-sm">{t('members.noMembers')}</p>
          )}
        </TabsContent>

        {/* Chat — powered by Supabase Realtime */}
        <TabsContent value="chat" className="mt-6">
          <div className="flex flex-col rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 h-[500px]">
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm text-stone-900 dark:text-stone-50">{t('tabs.chat')}</span>
              <Badge variant="secondary" className="ml-auto text-xs">Supabase Realtime</Badge>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-stone-400 dark:text-stone-500 py-8">
                    {t('chat.empty')}
                  </p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={msg.user?.profile_photo_url} />
                      <AvatarFallback className="text-xs">{msg.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-900 dark:text-stone-50">
                          {msg.user?.username}
                        </span>
                        <span className="text-xs text-stone-400">
                          {new Date(msg.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-stone-200 dark:border-stone-800 flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t('chat.placeholder')}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={sending}
              />
              <Button size="icon" onClick={sendMessage} disabled={sending || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Competitions */}
        <TabsContent value="competitions" className="mt-6 space-y-3">
          {registrations.length === 0 ? (
            <p className="text-stone-400 dark:text-stone-500 text-sm">{t('members.noRequests')}</p>
          ) : (
            (registrations as any[]).map((reg: any) => (
              <div key={reg.id} className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 py-3">
                <span className="font-medium text-stone-900 dark:text-stone-50">
                  {reg.competition?.title ?? `Competición #${reg.competition_id}`}
                </span>
                <Badge variant={
                  reg.status === 'approved' ? 'default' :
                  reg.status === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {reg.status}
                </Badge>
              </div>
            ))
          )}
        </TabsContent>

        {/* Settings (owner only) */}
        {isOwner && (
          <TabsContent value="settings" className="mt-6 space-y-6">
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5">
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-50 mb-4">{t('settings.editTitle')}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">{t('settings.editTitle')}</p>
            </div>
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-5">
              <h3 className="font-display font-semibold text-red-700 dark:text-red-400 mb-2">{t('settings.dangerZone')}</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{t('settings.deleteWarning')}</p>
              <Button variant="destructive" size="sm">{t('actions.delete')}</Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
