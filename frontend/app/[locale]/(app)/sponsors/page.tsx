import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Image from 'next/image'
import { apiRequest } from '@/lib/api'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sponsors' })
  return { title: t('title') }
}

interface Sponsor { id: string; name: string; logo_url?: string; website_url?: string }

async function getSponsors(): Promise<Sponsor[]> {
  try { return await apiRequest<Sponsor[]>('/sponsors') ?? [] }
  catch { return [] }
}

export default async function SponsorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, sponsors] = await Promise.all([
    getTranslations({ locale, namespace: 'sponsors' }),
    getSponsors(),
  ])

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
      {sponsors.length === 0 ? (
        <p className="text-stone-400 dark:text-stone-500">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {sponsors.map((s) => (
            <a
              key={s.id}
              href={s.website_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors aspect-video"
            >
              {s.logo_url ? (
                <Image src={s.logo_url} alt={s.name} width={160} height={80} className="object-contain max-h-16" />
              ) : (
                <span className="font-display font-semibold text-stone-700 dark:text-stone-300 text-center">{s.name}</span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
