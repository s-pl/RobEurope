import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { Tv, ExternalLink } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'streams' })
  return { title: t('title') }
}

interface Stream {
  id: string
  title: string
  description?: string
  stream_url: string
  status: 'live' | 'offline' | 'scheduled'
  team?: { name: string }
  competition?: { title: string }
}

async function getStreams(): Promise<Stream[]> {
  try { return await apiRequest<Stream[]>('/streams') ?? [] }
  catch { return [] }
}

export default async function StreamsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, streams] = await Promise.all([
    getTranslations({ locale, namespace: 'streams' }),
    getStreams(),
  ])

  const statusColor: Record<string, 'destructive' | 'default' | 'secondary'> = {
    live: 'destructive',
    scheduled: 'default',
    offline: 'secondary',
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Tv className="h-5 w-5 text-blue-600" />
          <span className="label-caps text-blue-600 dark:text-blue-400">{t('title')}</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('title')}</h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">{t('subtitle')}</p>
      </div>

      {streams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
          <Tv className="h-10 w-10 text-stone-300 dark:text-stone-700 mb-3" />
          <p className="text-stone-500 dark:text-stone-400">{t('noStreams')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {streams.map((stream) => (
            <div key={stream.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-display font-semibold text-stone-900 dark:text-stone-50 line-clamp-2">{stream.title}</h2>
                  <Badge variant={statusColor[stream.status]}>{t(`status.${stream.status}` as any)}</Badge>
                </div>
                {stream.description && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">{stream.description}</p>
                )}
                {stream.competition && (
                  <p className="text-xs text-stone-400 dark:text-stone-500">{stream.competition.title}</p>
                )}
                {stream.team && (
                  <p className="text-xs text-stone-400 dark:text-stone-500">{stream.team.name}</p>
                )}
              </div>
              <div className="px-5 pb-5">
                <Button asChild variant="outline" size="sm" className="w-full gap-2">
                  <a href={stream.stream_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> {t('watch')}
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
