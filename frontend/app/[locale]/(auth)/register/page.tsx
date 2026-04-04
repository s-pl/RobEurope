'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Github, Mail, Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Country { id: number; name: string; flag_emoji?: string }
interface EducationalCenter { id: number; name: string; city?: string }

const STEPS = ['Cuenta', 'Perfil', 'Detalles']

export default function RegisterPage() {
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const supabase = createClient()

  // Step state
  const [step, setStep] = useState(0)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [countryId, setCountryId] = useState('')
  const [centerId, setCenterId] = useState('')

  // Data
  const [countries, setCountries] = useState<Country[]>([])
  const [centers, setCenters] = useState<EducationalCenter[]>([])

  // UI
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    apiRequest<Country[]>('/country').then(setCountries).catch(() => {})
    apiRequest<{ data: EducationalCenter[] }>('/educational-centers?limit=200')
      .then(r => setCenters(r?.data ?? []))
      .catch(() => {})
  }, [])

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/${locale}`,
      },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(null)
    }
  }

  const nextStep = () => {
    setError(null)
    if (step === 0) {
      if (!email || !password) { setError('Email y contraseña son obligatorios'); return }
      if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
      if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    }
    if (step === 1) {
      if (!firstName || !lastName || !username) { setError('Nombre, apellidos y username son obligatorios'); return }
    }
    setStep(s => s + 1)
  }

  const handleRegister = async () => {
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          username,
          phone: phone || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // If session available (email confirmation disabled), update profile with extra fields
    if (data.session) {
      try {
        await apiRequest('/users/me', {
          method: 'PATCH',
          accessToken: data.session.access_token,
          body: {
            country_id: countryId ? Number(countryId) : undefined,
            educational_center_id: centerId ? Number(centerId) : undefined,
            phone: phone || undefined,
          },
        })
        router.push(`/${locale}`)
        router.refresh()
        return
      } catch {
        // Non-critical — profile can be updated later
      }
      router.push(`/${locale}`)
      router.refresh()
      return
    }

    // Email confirmation required
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="font-display text-xl font-bold text-foreground">¡Revisa tu email!</h2>
          <p className="text-sm text-muted-foreground">
            Te hemos enviado un enlace de confirmación a <strong>{email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/${locale}/login`}>Volver al login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Crear cuenta
          </h1>
          <p className="text-sm text-muted-foreground">
            Únete a la comunidad europea de robótica
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i < step ? 'bg-blue-600 text-white' :
                i === step ? 'bg-blue-600 text-white' :
                'bg-muted text-muted-foreground'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn('text-xs font-medium truncate', i === step ? 'text-foreground' : 'text-muted-foreground')}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px flex-1', i < step ? 'bg-blue-600' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Account */}
        {step === 0 && (
          <div className="space-y-5">
            {/* OAuth */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => handleOAuth('google')} disabled={!!oauthLoading} className="gap-2">
                {oauthLoading === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Google
              </Button>
              <Button variant="outline" onClick={() => handleOAuth('github')} disabled={!!oauthLoading} className="gap-2">
                {oauthLoading === 'github' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                GitHub
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">o</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="tu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} className="pl-9" autoComplete="email" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                  value={password} onChange={e => setPassword(e.target.value)} className="pr-9" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input id="confirmPassword" type="password" placeholder="Repite la contraseña"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" placeholder="Ada" value={firstName}
                  onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Apellidos</Label>
                <Input id="lastName" placeholder="Lovelace" value={lastName}
                  onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">
                Username <span className="text-muted-foreground text-xs">(único)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input id="username" placeholder="ada_lovelace" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                  className="pl-7" autoComplete="username" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Teléfono <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input id="phone" type="tel" placeholder="+34 600 000 000" value={phone}
                onChange={e => setPhone(e.target.value)} autoComplete="tel" />
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta información es opcional y puedes cambiarla más tarde en tu perfil.
            </p>

            {countries.length > 0 && (
              <div className="space-y-1.5">
                <Label>País</Label>
                <Select value={countryId} onValueChange={setCountryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.flag_emoji} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {centers.length > 0 && (
              <div className="space-y-1.5">
                <Label>Centro educativo</Label>
                <Select value={centerId} onValueChange={setCenterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu centro" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {centers.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}{c.city ? ` — ${c.city}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Atrás
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep} className="flex-1 gap-1.5">
              Siguiente <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleRegister} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear cuenta'}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href={`/${locale}/login`} className="text-blue-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
