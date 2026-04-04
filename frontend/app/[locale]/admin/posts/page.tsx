import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import AdminDataTable from '@/components/admin/AdminDataTable'
import { Badge } from '@/components/ui/badge'

export default async function AdminPostsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const t = await getTranslations({ locale, namespace: 'admin.posts' })
  let posts: any[] = []
  try {
    const res = await apiRequest<{ data: unknown[] }>('/posts?limit=200', { accessToken: session!.access_token })
    posts = res?.data ?? []
  } catch {}
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      <AdminDataTable data={posts} searchKey="title" emptyText={t('noPosts')} columns={[
        { key: 'title', label: 'Título' },
        { key: 'author', label: 'Autor', render: (p: any) => p.author?.username ?? '—' },
        { key: 'is_pinned', label: 'Estado', render: (p: any) => p.is_pinned ? <Badge variant="secondary">{t('pinned')}</Badge> : null },
        { key: 'created_at', label: 'Fecha', render: (p: any) => new Date(p.created_at).toLocaleDateString(locale) },
      ]} />
    </div>
  )
}
