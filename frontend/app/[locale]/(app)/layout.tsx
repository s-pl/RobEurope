import AppLayout from '@/components/layout/AppLayout'

interface AppShellLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AppShellLayout({ children, params }: AppShellLayoutProps) {
  const { locale } = await params
  return <AppLayout locale={locale}>{children}</AppLayout>
}
