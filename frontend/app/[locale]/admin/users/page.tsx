import { createClient } from '@/lib/supabase/server'
import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import AdminDataTable from '@/components/admin/AdminDataTable'
import { Badge } from '@/components/ui/badge'

async function getUsers(accessToken: string) {
  try {
    const res = await apiRequest<{ data: unknown[] }>('/admin/users', { accessToken })
    return res?.data ?? []
  } catch { return [] }
}

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const [t, users] = await Promise.all([
    getTranslations({ locale, namespace: 'admin.users' }),
    getUsers(session!.access_token),
  ])

  const roleColor: Record<string, string> = {
    super_admin: 'destructive',
    center_admin: 'secondary',
    user: 'outline',
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      <AdminDataTable
        data={users as any[]}
        searchKey="username"
        searchPlaceholder={t('searchPlaceholder')}
        emptyText={t('empty')}
        columns={[
          { key: 'username', label: 'Username' },
          { key: 'email', label: 'Email' },
          {
            key: 'role',
            label: 'Rol',
            render: (u) => (
              <Badge variant={(roleColor[u.role] as any) ?? 'outline'}>{u.role}</Badge>
            ),
          },
          {
            key: 'created_at',
            label: 'Creado',
            render: (u) => new Date(u.created_at).toLocaleDateString(locale),
          },
        ]}
      />
    </div>
  )
}
