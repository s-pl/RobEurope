'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

export default function ContactForm({ locale }: { locale: string }) {
  const t = useTranslations('contact')
  const tForms = useTranslations('forms')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await apiRequest('/contact', {
        method: 'POST',
        body: {
          name: fd.get('name'),
          email: fd.get('email'),
          organization: fd.get('organization'),
          message: fd.get('message'),
        },
      })
      setSent(true)
    } catch {
      toast.error(t('errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50">{t('sentTitle')}</h2>
        <p className="text-stone-500 dark:text-stone-400 max-w-md">{t('sentDesc')}</p>
        <Button variant="outline" onClick={() => setSent(false)}>{t('sendAnother')}</Button>
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <span className="label-caps text-blue-600 dark:text-blue-400">{t('title')}</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">{t('contactUs')}</h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">{t('contactUsDesc')}</p>
      </div>

      <Separator />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{tForms('name')}</Label>
            <Input id="name" name="name" required placeholder={t('placeholders.name')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{tForms('email')}</Label>
            <Input id="email" name="email" type="email" required placeholder={t('placeholders.email')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="organization">{tForms('organization')}</Label>
          <Input id="organization" name="organization" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="message">{tForms('message')}</Label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '...' : t('send')}
        </Button>
      </form>
    </div>
  )
}
