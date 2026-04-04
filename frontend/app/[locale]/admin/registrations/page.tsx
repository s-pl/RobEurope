import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import AdminDataTable from '@/components/admin/AdminDataTable'
import { Badge } from '@/components/ui/badge'

async function getRegistrations(accessToken: string) {
  try {
    const res = await apiRequest<{ data: unknown[] }>('/registrations?limit=200', { accessToken })
    return res?.data ?? []
  } catch { return [] }
}

export default async function AdminRegistrationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const [t, regs] = await Promise.all([
    getTranslations({ locale, namespace: 'admin.registrations' }),
    getRegistrations(session!.access_token),
  ])

  const statusColor: Record<string, 'default' | 'secondary' | 'destructive'> = {
    approved: 'default',
    pending: 'secondary',
    rejected: 'destructive',
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      <AdminDataTable
        data={regs as any[]}
        searchKey="status"
        emptyText={t('empty')}
        columns={[
          { key: 'team', label: 'Equipo', render: (r) => r.team?.name ?? '—' },
          { key: 'competition', label: 'Competición', render: (r) => r.competition?.title ?? '—' },
          {
            key: 'status',
            label: 'Estado',
            render: (r) => <Badge variant={statusColor[r.status] ?? 'secondary'}>{r.status}</Badge>,
          },
          {
            key: 'registration_date',
            label: 'Fecha',
            render: (r) => new Date(r.registration_date ?? r.created_at).toLocaleDateString(locale),
          },
        ]}
      />
    </div>
  )
}
