'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Users, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface Team {
  id: string
  name: string
  slug?: string
  description?: string
  country?: { id: string; name: string; flag_emoji?: string }
  _count?: { team_members: number }
}

interface Country {
  id: string
  name: string
  flag_emoji?: string
}

export default function TeamsClient({
  teams,
  countries,
  locale,
}: {
  teams: Team[]
  countries: Country[]
  locale: string
}) {
  const t = useTranslations('teams')
  const [search, setSearch] = useState('')
  const [countryId, setCountryId] = useState('all')

  const filtered = teams.filter((team) => {
    const matchSearch = team.name.toLowerCase().includes(search.toLowerCase())
    const matchCountry = countryId === 'all' || team.country?.id === countryId
    return matchSearch && matchCountry
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="label-caps text-blue-600 dark:text-blue-400">{t('title')}</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">{t('subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={countryId} onValueChange={setCountryId}>
          <SelectTrigger className="w-44">
            <Globe className="h-4 w-4 mr-2 text-stone-400" />
            <SelectValue placeholder={t('allCountries')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCountries')}</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.flag_emoji} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Teams grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
          <Users className="h-10 w-10 text-stone-300 dark:text-stone-700 mb-3" />
          <p className="text-stone-500 dark:text-stone-400">{t('noTeams')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-display font-semibold text-stone-900 dark:text-stone-50">
                  {team.name}
                </h2>
                {team.country && (
                  <span className="text-lg" title={team.country.name}>
                    {team.country.flag_emoji}
                  </span>
                )}
              </div>
              {team.description && (
                <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">
                  {team.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <Users className="h-3.5 w-3.5" />
                <span>{team._count?.team_members ?? 0} {t('members')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
