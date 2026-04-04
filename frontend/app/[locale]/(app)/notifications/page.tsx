import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import NotificationsClient from '@/components/NotificationsClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'notifications' })
  return { title: t('title') }
}

async function getNotifications(accessToken: string) {
  try {
    const res = await apiRequest<{ data: unknown[] }>('/notifications', { accessToken })
    return res?.data ?? []
  } catch { return [] }
}

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect(`/${locale}/login`)

  const notifications = await getNotifications(session.access_token)

  return <NotificationsClient notifications={notifications as any[]} locale={locale} userId={session.user.id} />
}
