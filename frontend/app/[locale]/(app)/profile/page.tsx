import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import ProfileClient from '@/components/ProfileClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'profile' })
  return { title: t('title') }
}

async function getUserProfile(accessToken: string) {
  try {
    return await apiRequest<Record<string, unknown>>('/users/me', { accessToken })
  } catch { return null }
}

async function getCountries(accessToken: string) {
  try {
    return await apiRequest<unknown[]>('/country', { accessToken }) ?? []
  } catch { return [] }
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  const accessToken = session.access_token

  const [profile, countries] = await Promise.all([
    getUserProfile(accessToken),
    getCountries(accessToken),
  ])

  return (
    <ProfileClient
      profile={profile}
      countries={countries as any[]}
      locale={locale}
      accessToken={accessToken}
    />
  )
}
