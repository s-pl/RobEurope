import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import AdminDataTable from '@/components/admin/AdminDataTable'
import { Badge } from '@/components/ui/badge'

export default async function AdminRequestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const t = await getTranslations({ locale, namespace: 'admin.requests' })
  let requests: any[] = []
  try {
    const res = await apiRequest<{ data: unknown[] }>('/admin/center-admin-requests', { accessToken: session!.access_token })
    requests = res?.data ?? []
  } catch {}
  const statusColor: Record<string, any> = { approved: 'default', pending: 'secondary', rejected: 'destructive' }
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      <AdminDataTable data={requests} searchKey="status" emptyText={t('empty')} columns={[
        { key: 'user', label: 'Usuario', render: (r: any) => r.user?.username ?? r.user_id },
        { key: 'request_type', label: 'Tipo', render: (r: any) => t(`type.${r.request_type === 'create_center' ? 'create' : 'join'}` as any) },
        { key: 'status', label: 'Estado', render: (r: any) => <Badge variant={statusColor[r.status]}>{r.status}</Badge> },
        { key: 'created_at', label: 'Fecha', render: (r: any) => new Date(r.created_at).toLocaleDateString(locale) },
      ]} />
    </div>
  )
}
