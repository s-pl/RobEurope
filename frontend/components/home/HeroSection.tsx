'use client'

import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const pillars = ['stem', 'europe', 'impact'] as const

export default function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations('home')

  return (
    <section className="relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-6 py-16 sm:px-12 sm:py-24">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Scan line accent — purely decorative, no entrance delay */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }}
        animate={{ y: [0, 400, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        aria-hidden
      />

      {/* Corner brackets */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <div
          key={pos}
          className={`absolute w-8 h-8 pointer-events-none ${
            pos === 'tl' ? 'top-4 left-4' :
            pos === 'tr' ? 'top-4 right-4 rotate-90' :
            pos === 'bl' ? 'bottom-4 left-4 -rotate-90' :
            'bottom-4 right-4 rotate-180'
          }`}
          aria-hidden
        >
          <svg viewBox="0 0 32 32" fill="none" className="text-stone-900 dark:text-white">
            <path d="M2 30 L2 2 L30 2" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
          </svg>
        </div>
      ))}

      <div className="relative z-10 max-w-3xl">
        <Badge variant="secondary" className="label-caps mb-6">
          {t('hero.tagline')}
        </Badge>

        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-5xl lg:text-6xl">
          {t('hero.title')}
        </h1>

        <p className="mt-6 text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
          {t('hero.description')}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href={`/${locale}/competitions`}>
              <Calendar className="h-4 w-4" />
              {t('hero.primaryCta')}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href={`/${locale}/teams`}>
              {t('hero.secondaryCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Pillars */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pillars.map((key) => (
            <div
              key={key}
              className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-4"
            >
              <p className="label-caps text-blue-600 dark:text-blue-400 mb-1">
                {t(`pillars.${key}.title`)}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t(`pillars.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
