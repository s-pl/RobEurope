'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function FeedbackPage() {
  const t = useTranslations('feedback')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setSent(true)
      toast.success(t('successMessage'))
    } catch {
      toast.error(t('errorMessage'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto space-y-4 text-center py-16">
        <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">{t('sentTitle')}</h1>
        <p className="text-stone-500 dark:text-stone-400">{t('sentSubtitle')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
        <p className="text-stone-500 dark:text-stone-400">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">{t('name')}</Label>
          <Input id="name" name="name" required placeholder={t('namePlaceholder')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" required placeholder={t('emailPlaceholder')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">{t('message')}</Label>
          <Textarea id="message" name="message" required rows={5} placeholder={t('messagePlaceholder')} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('sending') : t('submit')}
        </Button>
      </form>
    </div>
  )
}
