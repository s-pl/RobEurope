import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { locale } = await params
  const { token } = await searchParams
  const supabase = await createClient()
  const [t, { data: { session } }] = await Promise.all([
    getTranslations({ locale, namespace: 'teams.accept' }),
    supabase.auth.getSession(),
  ])

  if (!session) redirect(`/${locale}/login`)
  if (!token) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50">{t('invalidTitle')}</h1>
        <p className="text-stone-500 dark:text-stone-400">{t('invalidMessage')}</p>
        <Button asChild variant="outline"><Link href="/">{t('goHome')}</Link></Button>
      </div>
    )
  }

  let result: { success: boolean; teamName?: string; error?: string } = { success: false }
  try {
    const res = await apiRequest<{ team?: { name: string } }>(`/teams/accept-invite`, {
      accessToken: session.access_token,
      method: 'POST',
      body: { token },
    })
    result = { success: true, teamName: res?.team?.name }
  } catch (err: any) {
    result = { success: false, error: err?.message ?? 'error' }
  }

  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      {result.success ? (
        <>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50">{t('successTitle')}</h1>
          <p className="text-stone-500 dark:text-stone-400">
            {result.teamName ? t('successMessageWithTeam', { team: result.teamName }) : t('successMessage')}
          </p>
          <Button asChild><Link href="/my-team">{t('goToTeam')}</Link></Button>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50">{t('errorTitle')}</h1>
          <p className="text-stone-500 dark:text-stone-400">{t('errorMessage')}</p>
          <Button asChild variant="outline"><Link href="/">{t('goHome')}</Link></Button>
        </>
      )}
    </div>
  )
}
