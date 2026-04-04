import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import AdminDataTable from '@/components/admin/AdminDataTable'

async function getTeams(accessToken: string) {
  try {
    const res = await apiRequest<{ data: unknown[] }>('/teams?limit=200', { accessToken })
    return res?.data ?? []
  } catch { return [] }
}

export default async function AdminTeamsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const [t, teams] = await Promise.all([
    getTranslations({ locale, namespace: 'admin.teams' }),
    getTeams(session!.access_token),
  ])
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      <AdminDataTable
        data={teams as any[]}
        searchKey="name"
        searchPlaceholder={t('searchPlaceholder')}
        emptyText={t('empty')}
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'country', label: 'País', render: (t) => t.country?.name ?? '—' },
          { key: 'members', label: 'Miembros', render: (t) => t._count?.team_members ?? 0 },
          { key: 'created_at', label: 'Creado', render: (t) => new Date(t.created_at).toLocaleDateString(locale) },
        ]}
      />
    </div>
  )
}
