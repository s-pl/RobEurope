import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Image from 'next/image'
import { apiRequest } from '@/lib/api'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'gallery' })
  return { title: t('title') }
}

interface GalleryItem {
  id: string
  url: string
  title?: string
  description?: string
  media_type: 'image' | 'video'
}

async function getGallery(): Promise<GalleryItem[]> {
  try {
    const res = await apiRequest<{ data: GalleryItem[] }>('/gallery?limit=50')
    return res?.data ?? []
  } catch { return [] }
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [t, items] = await Promise.all([
    getTranslations({ locale, namespace: 'gallery' }),
    getGallery(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">{t('description')}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center py-20 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
          <p className="text-stone-400">{t('loading')}</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="break-inside-avoid rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800">
              {item.media_type === 'image' ? (
                <Image
                  src={item.url}
                  alt={item.title ?? 'Gallery image'}
                  width={600}
                  height={400}
                  className="w-full object-cover"
                />
              ) : (
                <video src={item.url} controls className="w-full" />
              )}
              {item.title && (
                <div className="p-3 bg-white dark:bg-stone-950">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{item.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
