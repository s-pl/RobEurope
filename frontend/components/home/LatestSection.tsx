import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowRight, Calendar, Newspaper } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Competition {
  id: string
  title: string
  status: string
  location?: string
  start_date?: string
}

interface Post {
  id: string
  title: string
  created_at: string
  author?: { username?: string }
}

export default async function LatestSection({
  competitions,
  posts,
  locale,
}: {
  competitions: Competition[]
  posts: Post[]
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: 'home.latest' })
  const tc = await getTranslations({ locale, namespace: 'competitions' })

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Competitions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="font-display font-semibold text-xl text-stone-900 dark:text-stone-50">
              {t('competitions')}
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
            <Link href={`/${locale}/competitions`}>
              {t('viewCalendar')} <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          {competitions.length === 0 ? (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
              {t('noCompetitions' as any)}
            </p>
          ) : (
            competitions.map((c) => (
              <Link
                key={c.id}
                href={`/${locale}/competitions/${c.id}`}
                className="flex items-start gap-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 dark:text-stone-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {c.title}
                  </p>
                  {c.location && (
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{c.location}</p>
                  )}
                </div>
                <Badge
                  variant={c.status === 'published' ? 'default' : 'secondary'}
                  className="shrink-0 text-xs"
                >
                  {tc(`status.${c.status}` as any)}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Posts */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-blue-600" />
            <h2 className="font-display font-semibold text-xl text-stone-900 dark:text-stone-50">
              {t('news')}
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
            <Link href={`/${locale}/posts`}>
              {t('viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
              {t('noNews' as any)}
            </p>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/${locale}/posts`}
                className="block rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
              >
                <p className="font-medium text-stone-900 dark:text-stone-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {post.title}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
                  {post.author?.username ?? '—'} ·{' '}
                  {new Date(post.created_at).toLocaleDateString(locale)}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
