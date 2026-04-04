import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { apiRequest } from '@/lib/api'
import TeamsClient from '@/components/teams/TeamsClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'teams' })
  return { title: t('title') }
}

async function getTeams() {
  try {
    const [teamsRes, countriesRes] = await Promise.allSettled([
      apiRequest<{ data: unknown[] }>('/teams?limit=100'),
      apiRequest<unknown[]>('/countries'),
    ])
    return {
      teams: teamsRes.status === 'fulfilled' ? teamsRes.value?.data ?? [] : [],
      countries: countriesRes.status === 'fulfilled' ? countriesRes.value ?? [] : [],
    }
  } catch {
    return { teams: [], countries: [] }
  }
}

export default async function TeamsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const { teams, countries } = await getTeams()
  return <TeamsClient teams={teams as any[]} countries={countries as any[]} locale={locale} />
}
