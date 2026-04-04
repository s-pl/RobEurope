import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, MapPin, Calendar, Users } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'competitions' })
  return { title: t('title') }
}

interface Competition {
  id: string
  title: string
  description?: string
  status: 'draft' | 'published' | 'archived'
  location?: string
  start_date?: string
  end_date?: string
  max_teams?: number
  is_active?: boolean
}

async function getCompetitions(): Promise<Competition[]> {
  try {
    const res = await apiRequest<{ data: Competition[] }>('/competitions?status=published')
    return res?.data ?? []
  } catch {
    return []
  }
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
  archived: 'outline',
}

export default async function CompetitionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const [t, competitions] = await Promise.all([
    getTranslations({ locale, namespace: 'competitions' }),
    getCompetitions(),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-blue-600" />
          <span className="label-caps text-blue-600 dark:text-blue-400">{t('title')}</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
      </div>

      {/* Grid */}
      {competitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 dark:border-stone-800 py-20 text-center">
          <Trophy className="h-10 w-10 text-stone-300 dark:text-stone-700 mb-3" />
          <p className="text-stone-500 dark:text-stone-400">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((c) => (
            <article
              key={c.id}
              className="group flex flex-col rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              {/* Header band */}
              <div className="border-b border-stone-200 dark:border-stone-800 px-5 py-4 flex items-start justify-between gap-2">
                <h2 className="font-display font-semibold text-stone-900 dark:text-stone-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {c.title}
                </h2>
                <Badge variant={statusVariant[c.status] ?? 'secondary'} className="shrink-0">
                  {t(`status.${c.status}` as any)}
                </Badge>
              </div>

              {/* Body */}
              <div className="flex-1 p-5 space-y-3">
                {c.description && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-3">
                    {c.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-stone-400 dark:text-stone-500">
                  {c.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {c.location}
                    </div>
                  )}
                  {c.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {new Date(c.start_date).toLocaleDateString(locale)}
                    </div>
                  )}
                  {c.max_teams && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      Max. {c.max_teams} {t('card.teams')}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-stone-200 dark:border-stone-800">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/${locale}/competitions/${c.id}`}>
                    {t('viewDetails')}
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
