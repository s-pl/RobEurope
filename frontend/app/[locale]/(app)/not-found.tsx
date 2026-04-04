import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
      <Bot className="h-16 w-16 text-stone-300 dark:text-stone-700" />
      <div className="space-y-2">
        <p className="label-caps text-stone-400 dark:text-stone-500">404</p>
        <h1 className="font-display text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 max-w-md mx-auto">{t('description')}</p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline"><Link href="javascript:history.back()">{t('goBack')}</Link></Button>
        <Button asChild><Link href="/">{t('goHome')}</Link></Button>
      </div>
    </div>
  )
}
