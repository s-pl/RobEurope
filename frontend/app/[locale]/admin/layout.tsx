import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect(`/${locale}/login`)

  // Role check via user_metadata or app_metadata
  const role = session.user.user_metadata?.role ?? session.user.app_metadata?.role
  if (role !== 'super_admin') redirect(`/${locale}`)

  return (
    <div className="flex min-h-screen bg-paper dark:bg-paper-dark">
      {/* Admin top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-red-600" />
      <AdminSidebar locale={locale} />
      <main className="flex-1 lg:ml-56 pt-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
