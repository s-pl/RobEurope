import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import { Camera, Users, User, Pencil, MapPin, Building2, AtSign, Phone as PhoneIcon, Mail, Check, X, Copy, Trophy, Calendar, Loader2, ImagePlus, Shield, Download, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { resolveMediaUrl } from '../lib/apiClient';

/* ────────────────────────────────────────────
   Stagger animation helpers
   ──────────────────────────────────────────── */
const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } },
};

/* ────────────────────────────────────────────
   Copy-to-clipboard micro-interaction
   ──────────────────────────────────────────── */
const CopyButton = memo(({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <button type="button" onClick={copy} className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300" title="Copy">
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
            <Check className="h-3.5 w-3.5 text-blue-500" />
          </motion.span>
        ) : (
          <motion.span key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
            <Copy className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
});
CopyButton.displayName = 'CopyButton';

/* ────────────────────────────────────────────
   Avatar with drag-to-upload + hover overlay
   ──────────────────────────────────────────── */
const AvatarUpload = memo(({ photoUrl, initials, uploading, onUpload, size = 'lg' }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) onUpload({ target: { files: [file] } });
  }, [onUpload]);

  const sizeClasses = size === 'lg'
    ? 'h-36 w-36'
    : 'h-20 w-20';

  const textSize = size === 'lg' ? 'text-4xl' : 'text-xl';

  return (
    <div
      className="group relative shrink-0"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className={`${sizeClasses} overflow-hidden rounded-2xl border-2 transition-all duration-200 ${dragOver ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-100 dark:border-blue-500 dark:bg-blue-950/20 dark:shadow-blue-950/30' : 'border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800'} flex items-center justify-center`}>
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        ) : photoUrl ? (
          <img src={photoUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span className={`font-display ${textSize} font-bold text-stone-300 dark:text-stone-600`}>{initials}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex items-center justify-center rounded-2xl bg-stone-900/0 transition-all duration-200 group-hover:bg-stone-900/50"
      >
        <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {dragOver ? <ImagePlus className="h-7 w-7 text-white" /> : <Camera className="h-7 w-7 text-white" />}
        </span>
      </button>

      <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={onUpload} disabled={uploading} />
    </div>
  );
});
AvatarUpload.displayName = 'AvatarUpload';

/* ────────────────────────────────────────────
   Team card with colored initials circle
   ──────────────────────────────────────────── */
const teamColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
];

const TeamCard = memo(({ member, index }) => {
  const teamName = member.team?.name || 'Team';
  const teamInitials = teamName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colorClass = teamColors[index % teamColors.length];

  return (
    <motion.div variants={stagger.item}>
      <Link
        to={`/teams/${member.team_id}`}
        className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-blue-900 dark:hover:shadow-blue-950/20"
      >
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ${colorClass}`}>
          {member.team?.logo_url
            ? <img src={resolveMediaUrl(member.team.logo_url)} alt="" className="h-full w-full object-cover rounded-full" />
            : <span className="text-sm font-bold">{teamInitials}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate">{teamName}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">{member.role}</p>
        </div>
        <div className="rounded-lg bg-stone-50 p-2 text-stone-400 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500 dark:bg-stone-900 dark:group-hover:bg-blue-950/30">
          <Trophy className="h-4 w-4" />
        </div>
      </Link>
    </motion.div>
  );
});
TeamCard.displayName = 'TeamCard';

/* ────────────────────────────────────────────
   Pill-style tab button
   ──────────────────────────────────────────── */
const PillTab = memo(({ active, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-stone-900 text-white shadow-sm dark:bg-stone-50 dark:text-stone-900'
        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span className="hidden sm:inline">{label}</span>
  </button>
));
PillTab.displayName = 'PillTab';

/* ════════════════════════════════════════════
   PROFILE PAGE
   ════════════════════════════════════════════ */
const Profile = () => {
  const { user, updateProfile, uploadProfilePhoto } = useAuth();
  const api = useApi();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', country_id: '', bio: '', educational_center_id: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [countries, setCountries] = useState([]);
  const [countriesStatus, setCountriesStatus] = useState({ loading: false, error: '' });
  const [centers, setCenters] = useState([]);
  const [centersStatus, setCentersStatus] = useState({ loading: false, error: '' });
  const [userTeams, setUserTeams] = useState([]);
  const [activeSection, setActiveSection] = useState('info');
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  /* -- populate form when user loads -- */
  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        country_id: user.country_id?.toString() || '',
        bio: user.bio || '',
        educational_center_id: user.educational_center_id?.toString() || '',
      });
    }
  }, [user]);

  /* -- fetch countries -- */
  useEffect(() => {
    let active = true;
    setCountriesStatus({ loading: true, error: '' });
    api('/countries')
      .then(data => { if (active) { setCountries(Array.isArray(data) ? data : []); setCountriesStatus({ loading: false, error: '' }); } })
      .catch(() => { if (active) setCountriesStatus({ loading: false, error: 'countries-error' }); });
    return () => { active = false; };
  }, [api]);

  /* -- fetch centers -- */
  useEffect(() => {
    let active = true;
    setCentersStatus({ loading: true, error: '' });
    api('/educational-centers?status=approved')
      .then(data => { if (active) { setCenters(data?.items || (Array.isArray(data) ? data : [])); setCentersStatus({ loading: false, error: '' }); } })
      .catch(() => { if (active) setCentersStatus({ loading: false, error: 'centers-error' }); });
    return () => { active = false; };
  }, [api]);

  /* -- fetch teams -- */
  useEffect(() => {
    if (!user) return;
    api(`/team-members?user_id=${user.id}`)
      .then(members => setUserTeams(members.filter(m => !m.left_at)))
      .catch(() => {});
  }, [api, user]);

  /* -- derived -- */
  const initials = useMemo(() => `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'RE', [user]);
  const currentCenter = useMemo(() => form.educational_center_id ? centers.find(c => String(c.id) === String(form.educational_center_id)) : null, [centers, form.educational_center_id]);
  const currentCountry = useMemo(() => form.country_id ? countries.find(c => String(c.id) === String(form.country_id)) : null, [countries, form.country_id]);

  /* -- handlers -- */
  const flash = useCallback((type, message) => { setFeedback({ type, message }); setTimeout(() => setFeedback({ type: '', message: '' }), 4000); }, []);

  const saveField = useCallback(async (field, value) => {
    try {
      const payload = { [field]: value === '' ? null : value };
      if (field === 'country_id' && value) payload[field] = Number(value);
      if (field === 'educational_center_id') payload[field] = value ? Number(value) : null;
      await updateProfile(payload);
      setForm(prev => ({ ...prev, [field]: value }));
      flash('success', t('profile.feedback.success'));
    } catch (error) {
      flash('error', error.message || t('profile.feedback.error'));
    }
  }, [updateProfile, flash, t]);

  const handleFullSave = useCallback(async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, country_id: form.country_id ? Number(form.country_id) : undefined, educational_center_id: form.educational_center_id ? Number(form.educational_center_id) : null };
      if (payload.country_id === undefined) delete payload.country_id;
      await updateProfile(payload);
      flash('success', t('profile.feedback.success'));
    } catch (error) {
      flash('error', error.message || t('profile.feedback.error'));
    } finally {
      setSaving(false);
    }
  }, [form, updateProfile, flash, t]);

  const handlePhotoUpload = useCallback(async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadProfilePhoto(file);
      flash('success', t('profile.feedback.photoSuccess'));
    } catch (error) {
      flash('error', error.message || t('profile.feedback.photoError'));
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  }, [uploadProfilePhoto, flash, t]);

  const handleChange = useCallback((e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value })), []);

  if (!user) return <p className="text-sm text-stone-500" role="alert">{t('profile.feedback.error')}</p>;

  const photoUrl = resolveMediaUrl(user.profile_photo_url);
  const sections = [
    { key: 'info', label: t('profile.personalInfo'), icon: User },
    { key: 'teams', label: t('teams.title'), icon: Users },
    { key: 'privacy', label: 'Privacy & Data', icon: Shield },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mx-auto max-w-6xl">

      {/* ======= TOAST ======= */}
      <AnimatePresence>
        {feedback.message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-xl backdrop-blur-sm ${
              feedback.type === 'error'
                ? 'border-red-200 bg-red-50/95 text-red-700 dark:border-red-900 dark:bg-red-950/95 dark:text-red-400'
                : 'border-blue-200 bg-blue-50/95 text-blue-700 dark:border-blue-900 dark:bg-blue-950/95 dark:text-blue-400'
            }`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            {feedback.type === 'error' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======= TWO-COLUMN LAYOUT ======= */}
      <div className="flex flex-col gap-8 lg:flex-row">

        {/* ======= LEFT SIDEBAR ======= */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full shrink-0 lg:sticky lg:top-6 lg:w-80 lg:self-start"
        >
          {/* Mobile: horizontal card / Desktop: vertical card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-950">
            {/* Avatar + identity */}
            <div className="flex flex-row items-center gap-5 lg:flex-col lg:items-center lg:text-center">
              <AvatarUpload
                photoUrl={photoUrl}
                initials={initials}
                uploading={uploading}
                onUpload={handlePhotoUpload}
                size="lg"
              />

              <div className="flex-1 space-y-2 lg:mt-2">
                <h1 className="font-display text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 lg:text-2xl">
                  {user.first_name || ''} {user.last_name || ''}
                </h1>

                <div className="flex flex-wrap items-center gap-2 lg:justify-center">
                  <span className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400">
                    <AtSign className="h-3.5 w-3.5" />
                    {user.username}
                  </span>
                  <CopyButton text={user.username} />
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-center">
                  <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{user.role}</Badge>
                  {currentCenter && (
                    <Badge variant={user.role === 'center_admin' ? 'accent' : 'secondary'} className="text-[10px]">
                      {user.role === 'center_admin' ? t('profile.centerAdminBadge') : t('profile.studentBadge')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-5 h-px bg-stone-100 dark:bg-stone-800" />

            {/* Contact info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-stone-600 dark:text-stone-400">
                <Mail className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
                <span className="truncate">{user.email}</span>
                <CopyButton text={user.email} />
              </div>
              {form.phone && (
                <div className="flex items-center gap-2.5 text-stone-600 dark:text-stone-400">
                  <PhoneIcon className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
                  <span>{form.phone}</span>
                </div>
              )}
              {currentCountry && (
                <div className="flex items-center gap-2.5 text-stone-600 dark:text-stone-400">
                  <MapPin className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
                  <span>{currentCountry.flag_emoji} {currentCountry.name}</span>
                </div>
              )}
              {currentCenter && (
                <div className="flex items-center gap-2.5 text-stone-600 dark:text-stone-400">
                  <Building2 className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
                  <span className="truncate">{currentCenter.name}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-5 h-px bg-stone-100 dark:bg-stone-800" />

            {/* Bio preview */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('profile.bio')}
              </p>
              <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {form.bio || <span className="italic text-stone-400 dark:text-stone-500">{t('profile.bioEmpty')}</span>}
              </p>
            </div>

            {/* Divider */}
            <div className="my-5 h-px bg-stone-100 dark:bg-stone-800" />

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-stone-50 p-3 text-center dark:bg-stone-900">
                <Users className="mx-auto mb-1 h-4 w-4 text-stone-400 dark:text-stone-500" />
                <p className="text-lg font-bold text-stone-900 dark:text-stone-50">{userTeams.length}</p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{t('teams.title')}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3 text-center dark:bg-stone-900">
                <Calendar className="mx-auto mb-1 h-4 w-4 text-stone-400 dark:text-stone-500" />
                <p className="text-lg font-bold text-stone-900 dark:text-stone-50">
                  {new Date(user.createdAt || user.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{t('profile.overview')}</p>
              </div>
            </div>

            {/* Photo management */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('profile.photo') || 'Profile Photo'}
              </p>
              <p className="mb-2 text-xs text-stone-500 dark:text-stone-400">JPG, PNG or GIF. Max 5MB.</p>
              <label className="inline-block cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>{uploading ? t('buttons.uploading') : t('buttons.changePhoto')}</span>
                </Button>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </motion.aside>

        {/* ======= RIGHT MAIN CONTENT ======= */}
        <motion.main
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="min-w-0 flex-1"
        >
          {/* Pill-style tabs */}
          <div className="mb-6 flex gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-1.5 dark:border-stone-800 dark:bg-stone-900">
            {sections.map(s => (
              <PillTab
                key={s.key}
                active={activeSection === s.key}
                icon={s.icon}
                label={s.label}
                onClick={() => setActiveSection(s.key)}
              />
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >

              {/* ── INFO FORM ── */}
              {activeSection === 'info' && (
                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-950 sm:p-8">
                  <div className="mb-6">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                      {t('profile.personalInfo')}
                    </h2>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      {t('profile.personalInfoDesc') || 'Update your personal details below.'}
                    </p>
                  </div>

                  <form onSubmit={handleFullSave} className="space-y-6">
                    {/* Name row */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">{t('forms.firstName')}</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={form.first_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">{t('forms.lastName')}</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={form.last_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Phone + Country */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('forms.phone')}</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder={t('placeholders.phoneExample')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country_id">{t('profile.country')}</Label>
                        <Select value={form.country_id} onValueChange={(v) => handleChange({ target: { name: 'country_id', value: v } })} disabled={countriesStatus.loading}>
                          <SelectTrigger id="country_id">
                            <SelectValue placeholder={countriesStatus.loading ? t('general.countriesLoading') : '—'} />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.flag_emoji ? `${c.flag_emoji} ` : ''}{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {countriesStatus.error && <p className="text-xs text-red-600">{t('profile.countriesError')}</p>}
                      </div>
                    </div>

                    {/* Educational center */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="educational_center_id">{t('profile.educationalCenter')}</Label>
                        <select
                          id="educational_center_id"
                          name="educational_center_id"
                          value={form.educational_center_id}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                          disabled={centersStatus.loading}
                        >
                          <option value="">{t('profile.noEducationalCenter')}</option>
                          {centers.map(c => <option key={c.id} value={c.id}>{c.name}{c.city ? ` - ${c.city}` : ''}</option>)}
                        </select>
                        {centersStatus.error && <p className="text-xs text-red-600">{t('profile.centersLoadError')}</p>}
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">{t('profile.bio')}</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        rows={4}
                        placeholder={t('profile.bioEmpty')}
                        className="resize-y"
                      />
                    </div>

                    {/* Save */}
                    <div className="flex justify-end border-t border-stone-100 pt-6 dark:border-stone-800">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="min-w-[140px] rounded-xl bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
                      >
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('buttons.saving')}
                          </span>
                        ) : t('buttons.saveChanges')}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── TEAMS ── */}
              {activeSection === 'teams' && (
                <div>
                  {userTeams.length > 0 ? (
                    <motion.div
                      variants={stagger.container}
                      initial="hidden"
                      animate="visible"
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      {userTeams.map((member, i) => (
                        <TeamCard key={member.id} member={member} index={i} />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-2xl border-2 border-dashed border-stone-200 py-16 text-center dark:border-stone-800"
                    >
                      <Users className="mx-auto h-12 w-12 text-stone-200 dark:text-stone-700" />
                      <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">{t('myTeam.createDesc')}</p>
                      <Button variant="outline" size="sm" asChild className="mt-5 rounded-xl">
                        <Link to="/teams">{t('teams.create')}</Link>
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── PRIVACY & DATA ── */}
              {activeSection === 'privacy' && (
                <motion.div
                  variants={stagger.container}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {/* Export My Data */}
                  <motion.div variants={stagger.item} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-950 sm:p-8">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-xl bg-stone-100 p-2.5 dark:bg-stone-800">
                        <Download className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50">Export My Data</h3>
                        <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                          Download all data RobEurope stores about you (profile, teams, notifications, messages, reviews).
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      disabled={exportingData}
                      onClick={async () => {
                        setExportingData(true);
                        try {
                          const data = await api('/gdpr/my-data');
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `robeurope-my-data-${new Date().toISOString().slice(0, 10)}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          flash('success', 'Data exported successfully.');
                        } catch (error) {
                          flash('error', error.message || 'Failed to export data.');
                        } finally {
                          setExportingData(false);
                        }
                      }}
                      className="rounded-xl"
                    >
                      {exportingData ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Exporting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Download My Data
                        </span>
                      )}
                    </Button>
                  </motion.div>

                  {/* Danger Zone - Delete Account */}
                  <motion.div variants={stagger.item} className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6 dark:border-red-900/60 dark:bg-red-950/20 sm:p-8">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-xl bg-red-100 p-2.5 dark:bg-red-900/40">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-red-700 dark:text-red-400">Delete My Account</h3>
                        <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                          Permanently delete your account. Your personal data will be anonymized. This cannot be undone.
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl border border-red-100 bg-white px-4 py-3 dark:border-red-900/40 dark:bg-stone-950">
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        Account to be deleted: <span className="font-semibold text-stone-900 dark:text-stone-50">{user.email}</span>
                      </p>
                    </div>

                    <Button
                      variant="destructive"
                      disabled={deletingAccount}
                      onClick={async () => {
                        const confirmation = window.prompt(
                          'This action is permanent and cannot be undone. Type DELETE to confirm account deletion:'
                        );
                        if (confirmation !== 'DELETE') {
                          if (confirmation !== null) {
                            flash('error', 'Account deletion cancelled. You must type DELETE to confirm.');
                          }
                          return;
                        }
                        setDeletingAccount(true);
                        try {
                          await api('/gdpr/my-account', { method: 'DELETE' });
                          navigate('/login');
                        } catch (error) {
                          flash('error', error.message || 'Failed to delete account.');
                          setDeletingAccount(false);
                        }
                      }}
                      className="rounded-xl"
                    >
                      {deletingAccount ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Deleting...
                        </span>
                      ) : (
                        'Delete My Account'
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </motion.div>
  );
};

export default Profile;
