import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'


export default async function CtaSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.cta' })

  return (
    <section className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-stone-950 px-8 py-14 text-center">
      <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
        {t('title')}
      </h2>
      <p className="mt-4 text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
        {t('description')}
      </p>
      <div className="mt-8">
        <Button asChild size="lg" className="gap-2">
          <Link href={`/${locale}/login`}>
            {t('button')} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
