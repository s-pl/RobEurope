import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { FileText } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'terms' })
  return { title: t('title') }
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'terms' })

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
      </div>
      <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
        RobEurope es una plataforma educativa de robótica europea. El uso de esta plataforma implica la aceptación de las condiciones de uso y política de privacidad vigentes.
      </p>
    </div>
  )
}
