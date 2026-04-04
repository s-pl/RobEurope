import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import MyTeamClient from '@/components/teams/MyTeamClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'myTeam' })
  return { title: t('title') }
}

async function getTeamData(accessToken: string) {
  try {
    const [status, countries] = await Promise.allSettled([
      apiRequest<{ ownedTeamId?: string; memberOfTeamId?: string; team?: unknown }>('/teams/status', { accessToken }),
      apiRequest<unknown[]>('/countries', { accessToken }),
    ])

    const teamStatus = status.status === 'fulfilled' ? status.value : null
    const teamId = teamStatus?.ownedTeamId ?? teamStatus?.memberOfTeamId

    let team = null
    let members: unknown[] = []
    let registrations: unknown[] = []
    let messages: unknown[] = []

    if (teamId) {
      const [teamRes, membersRes, regsRes, msgsRes] = await Promise.allSettled([
        apiRequest<unknown>(`/teams/${teamId}`, { accessToken }),
        apiRequest<unknown[]>(`/teams/${teamId}/members`, { accessToken }),
        apiRequest<unknown[]>(`/registrations?teamId=${teamId}`, { accessToken }),
        apiRequest<{ data: unknown[] }>(`/teams/${teamId}/messages?limit=50`, { accessToken }),
      ])
      team = teamRes.status === 'fulfilled' ? teamRes.value : null
      members = membersRes.status === 'fulfilled' ? membersRes.value ?? [] : []
      registrations = regsRes.status === 'fulfilled' ? regsRes.value ?? [] : []
      messages = msgsRes.status === 'fulfilled' ? msgsRes.value?.data ?? [] : []
    }

    return {
      teamId,
      team,
      members,
      registrations,
      messages,
      countries: countries.status === 'fulfilled' ? countries.value ?? [] : [],
      isOwner: Boolean(teamStatus?.ownedTeamId),
    }
  } catch {
    return { teamId: null, team: null, members: [], registrations: [], messages: [], countries: [], isOwner: false }
  }
}

export default async function MyTeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect(`/${locale}/login`)

  const accessToken = session.access_token
  const data = await getTeamData(accessToken)

  return (
    <MyTeamClient
      {...data}
      locale={locale}
      userId={session.user.id}
    />
  )
}
