import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import AdminDataTable from '@/components/admin/AdminDataTable'
import { Badge } from '@/components/ui/badge'

async function getCompetitions(accessToken: string) {
  try {
    const res = await apiRequest<{ data: unknown[] }>('/competitions?limit=200', { accessToken })
    return res?.data ?? []
  } catch { return [] }
}

export default async function AdminCompetitionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const [t, comps] = await Promise.all([
    getTranslations({ locale, namespace: 'admin.competitions' }),
    getCompetitions(session!.access_token),
  ])
  const statusColor: Record<string, any> = { published: 'default', draft: 'secondary', archived: 'outline' }
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      <AdminDataTable
        data={comps as any[]}
        searchKey="title"
        searchPlaceholder={t('searchPlaceholder')}
        emptyText={t('empty')}
        columns={[
          { key: 'title', label: 'Título' },
          { key: 'status', label: 'Estado', render: (c) => <Badge variant={statusColor[c.status]}>{t(`status.${c.status}` as any)}</Badge> },
          { key: 'location', label: 'Lugar', render: (c) => c.location ?? '—' },
          { key: 'start_date', label: 'Fecha', render: (c) => c.start_date ? new Date(c.start_date).toLocaleDateString(locale) : '—' },
        ]}
      />
    </div>
  )
}
