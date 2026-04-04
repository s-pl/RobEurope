import { getTranslations } from 'next-intl/server'
import { UserPlus, Users, Medal, Rocket } from 'lucide-react'

const stepIcons = [UserPlus, Users, Rocket, Medal]
const stepKeys = ['register', 'team', 'enroll', 'compete'] as const

export default async function HowItWorksSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.howItWorks' })

  return (
    <section>
      <div className="mb-10">
        <p className="label-caps text-blue-600 dark:text-blue-400 mb-2">{t('title')}</p>
        <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 sm:text-4xl">
          {t('title')}
        </h2>
        <p className="mt-3 text-stone-500 dark:text-stone-400 max-w-2xl">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stepKeys.map((key, i) => {
          const Icon = stepIcons[i]
          return (
            <div
              key={key}
              className="relative rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-6"
            >
              <span className="label-caps text-stone-300 dark:text-stone-700 absolute top-4 right-4">
                0{i + 1}
              </span>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-display font-semibold text-stone-900 dark:text-stone-50 mb-2">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                {t(`steps.${key}.description`)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
