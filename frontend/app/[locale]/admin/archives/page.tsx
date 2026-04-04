import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import AdminDataTable from '@/components/admin/AdminDataTable'

export default async function AdminArchivesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const t = await getTranslations({ locale, namespace: 'admin.archives' })
  let archives: any[] = []
  try {
    const res = await apiRequest<{ data: unknown[] }>('/archives?limit=200', { accessToken: session!.access_token })
    archives = res?.data ?? []
  } catch {}
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      <AdminDataTable data={archives} searchKey="title" emptyText={t('empty')} columns={[
        { key: 'title', label: 'Título' },
        { key: 'visibility', label: 'Visibilidad' },
        { key: 'created_at', label: 'Fecha', render: (a: any) => new Date(a.created_at).toLocaleDateString(locale) },
      ]} />
    </div>
  )
}
