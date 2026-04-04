'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/components/providers/AuthProvider'
import { User, Camera, Save } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiRequest } from '@/lib/api'
import { toast } from 'sonner'

interface Country { id: string; name: string; flag_emoji?: string }
interface Profile {
  id?: string
  first_name?: string
  last_name?: string
  username?: string
  bio?: string
  profile_photo_url?: string
  role?: string
  country_id?: string
}

export default function ProfileClient({
  profile,
  countries,
  locale,
  accessToken,
}: {
  profile: Profile | null
  countries: Country[]
  locale: string
  accessToken: string
}) {
  const t = useTranslations('profile')
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    username: profile?.username ?? '',
    bio: profile?.bio ?? '',
    country_id: profile?.country_id ?? '',
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await apiRequest('/users/me', { method: 'PATCH', body: form, accessToken })
      toast.success(t('feedback.success'))
    } catch {
      toast.error(t('feedback.error'))
    } finally {
      setLoading(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('profile_photo', file)
    try {
      await apiRequest('/users/me', { method: 'PATCH', body: fd, formData: true, accessToken })
      toast.success(t('feedback.photoSuccess'))
    } catch {
      toast.error(t('feedback.photoError'))
    } finally {
      setUploading(false)
    }
  }

  const avatarSrc = profile?.profile_photo_url ?? user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? undefined
  const roleColor: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    center_admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    user: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-blue-600" />
        <h1 className="font-display text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {t('title')}
        </h1>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt={user?.user_metadata?.full_name ?? 'Profile'}
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-stone-200 dark:border-stone-700"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-2xl font-bold">
              {form.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-1.5 text-white hover:bg-blue-700 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={uploading}
          />
        </div>
        <div>
          <p className="font-semibold text-stone-900 dark:text-stone-50">
            {user?.user_metadata?.full_name ?? `${form.first_name} ${form.last_name}`.trim()}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400">{user?.email}</p>
          {profile?.role && (
            <span className={`mt-1 inline-block label-caps px-2 py-0.5 rounded-md text-xs ${roleColor[profile.role] ?? roleColor.user}`}>
              {profile.role}
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <h2 className="font-display font-semibold text-lg text-stone-900 dark:text-stone-50">{t('personalInfo')}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">Nombre</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Apellidos</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">{t('bio')}</Label>
          <textarea
            id="bio"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        {countries.length > 0 && (
          <div className="space-y-1.5">
            <Label>País</Label>
            <Select
              value={form.country_id}
              onValueChange={(v) => setForm({ ...form, country_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un país" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.flag_emoji} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button type="submit" disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  )
}
