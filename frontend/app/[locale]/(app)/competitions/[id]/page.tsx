import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Calendar, Users, FileText } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface CompetitionDetail {
  id: string
  title: string
  description?: string
  status: string
  location?: string
  start_date?: string
  end_date?: string
  max_teams?: number
  rules_url?: string
  is_active?: boolean
  teams?: { id: string; name: string }[]
  streams?: { id: string; title: string; stream_url: string; status: string }[]
}

async function getCompetition(id: string): Promise<CompetitionDetail | null> {
  try {
    return await apiRequest<CompetitionDetail>(`/competitions/${id}`)
  } catch {
    return null
  }
}

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const [t, competition] = await Promise.all([
    getTranslations({ locale, namespace: 'competitions' }),
    getCompetition(id),
  ])

  if (!competition) notFound()

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="gap-2 -ml-2">
        <Link href={`/${locale}/competitions`}>
          <ArrowLeft className="h-4 w-4" /> {t('detail.back')}
        </Link>
      </Button>

      {/* Title */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            {competition.title}
          </h1>
          <Badge variant={competition.status === 'published' ? 'default' : 'secondary'}>
            {t(`status.${competition.status}` as any)}
          </Badge>
        </div>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-500 dark:text-stone-400">
          {competition.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {competition.location}
            </div>
          )}
          {competition.start_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(competition.start_date).toLocaleDateString(locale)}
              {competition.end_date && ` → ${new Date(competition.end_date).toLocaleDateString(locale)}`}
            </div>
          )}
          {competition.max_teams && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Max. {competition.max_teams} {t('card.teams')}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* About */}
      {competition.description && (
        <section>
          <h2 className="font-display font-semibold text-lg text-stone-900 dark:text-stone-50 mb-3">
            {t('detail.aboutEvent')}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{competition.description}</p>
        </section>
      )}

      {/* Rules */}
      {competition.rules_url && (
        <div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href={competition.rules_url} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4" /> Reglamento
            </a>
          </Button>
        </div>
      )}

      {/* Teams */}
      {competition.teams && competition.teams.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-lg text-stone-900 dark:text-stone-50 mb-3">
            {t('detail.participatingTeams')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {competition.teams.map((team) => (
              <Link
                key={team.id}
                href={`/${locale}/teams`}
                className="rounded-lg border border-stone-200 dark:border-stone-800 px-4 py-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                {team.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Streams */}
      {competition.streams && competition.streams.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-lg text-stone-900 dark:text-stone-50 mb-3">
            {t('detail.liveStreams')}
          </h2>
          <div className="space-y-2">
            {competition.streams.map((stream) => (
              <a
                key={stream.id}
                href={stream.stream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-800 px-4 py-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <span className="text-sm font-medium text-stone-900 dark:text-stone-50">{stream.title}</span>
                <Badge variant={stream.status === 'live' ? 'destructive' : 'secondary'} className="text-xs">
                  {stream.status}
                </Badge>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
