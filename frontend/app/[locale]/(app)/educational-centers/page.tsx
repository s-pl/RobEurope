import { apiRequest } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import { MapPin, Globe } from 'lucide-react'

async function getCenters() {
  try {
    const res = await apiRequest<{ data: unknown[] }>('/educational-centers?limit=100')
    return res?.data ?? []
  } catch { return [] }
}

export default async function EducationalCentersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, centers] = await Promise.all([
    getTranslations({ locale, namespace: 'educationalCenters' }),
    getCenters(),
  ])

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">{t('subtitle')}</p>
      </div>

      {(centers as any[]).length === 0 ? (
        <p className="text-stone-400 dark:text-stone-500">{t('empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(centers as any[]).map((center) => (
            <div
              key={center.id}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5 space-y-3 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
            >
              <h2 className="font-display font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                {center.name}
              </h2>
              {center.city && (
                <div className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{[center.city, center.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {center.website && (
                <a
                  href={center.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{center.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
