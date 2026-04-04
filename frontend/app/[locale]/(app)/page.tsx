import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import StatsSection from '@/components/home/StatsSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import LatestSection from '@/components/home/LatestSection'
import CtaSection from '@/components/home/CtaSection'
import { apiRequest } from '@/lib/api'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home.hero' })
  return { title: t('title') }
}

async function getHomeData() {
  try {
    const [stats, competitions, posts] = await Promise.allSettled([
      apiRequest<{ teamsCount: number; competitionsCount: number; countries: number }>('/stats'),
      apiRequest<{ data: unknown[] }>('/competitions?status=published&limit=3'),
      apiRequest<{ data: unknown[] }>('/posts?limit=3'),
    ])

    return {
      stats: stats.status === 'fulfilled' ? stats.value : null,
      competitions: competitions.status === 'fulfilled' ? competitions.value?.data ?? [] : [],
      posts: posts.status === 'fulfilled' ? posts.value?.data ?? [] : [],
    }
  } catch {
    return { stats: null, competitions: [], posts: [] }
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { stats, competitions, posts } = await getHomeData()

  return (
    <div className="space-y-24">
      <HeroSection locale={locale} />
      <StatsSection stats={stats} locale={locale} />
      <HowItWorksSection locale={locale} />
      <LatestSection competitions={competitions as any[]} posts={posts as any[]} locale={locale} />
      <CtaSection locale={locale} />
    </div>
  )
}
