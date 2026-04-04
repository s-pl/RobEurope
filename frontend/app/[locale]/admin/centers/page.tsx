import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import AdminDataTable from '@/components/admin/AdminDataTable'
import { Badge } from '@/components/ui/badge'

export default async function AdminCentersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const t = await getTranslations({ locale, namespace: 'admin.centers' })
  let centers: any[] = []
  try {
    const res = await apiRequest<{ data: unknown[] }>('/educational-centers?limit=200', { accessToken: session!.access_token })
    centers = res?.data ?? []
  } catch {}
  const statusColor: Record<string, any> = { approved: 'default', pending: 'secondary', rejected: 'destructive' }
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      <AdminDataTable data={centers} searchKey="name" emptyText={t('empty')} columns={[
        { key: 'name', label: 'Nombre' },
        { key: 'city', label: 'Ciudad' },
        { key: 'approval_status', label: 'Estado', render: (c: any) => <Badge variant={statusColor[c.approval_status]}>{c.approval_status}</Badge> },
        { key: 'created_at', label: 'Fecha', render: (c: any) => new Date(c.created_at).toLocaleDateString(locale) },
      ]} />
    </div>
  )
}
