import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTeamContext } from '../context/TeamContext';
import { useTeams } from '../hooks/useTeams';
import { useRegistrations } from '../hooks/useRegistrations';
import { useStreams } from '../hooks/useStreams';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  Users, Settings, Trophy, Info,
  LogOut, Trash2, Check, X, Video,
  UserPlus, MessageCircle, Building2,
  Globe, MapPin, Hash, ChevronRight,
  Wifi, WifiOff, Shield, Crown, Search,
  Mail, ExternalLink, Zap, Clock,
  ArrowRight, Pencil, Copy, ChevronUp, ChevronDown,
  FolderOpen, Activity, Image, FileText, Download,
  FileVideo, FileAudio, UserCheck, Flag, UploadCloud, AlertCircle,
} from 'lucide-react';
import TeamChat from '../components/teams/TeamChat';
import TeamCompetitionDashboard from '../components/teams/TeamCompetitionDashboard';
import { resolveMediaUrl, getApiBaseUrl } from '../lib/apiClient';
import { CountrySelect } from '../components/ui/CountrySelect';
import { useCountries } from '../hooks/useCountries';
import { useFeatures } from '../context/FeaturesContext';

// ── Helpers ─────────────────────────────────────────────────────────────────

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } } },
};

// ── Tab config ──────────────────────────────────────────────────────────────

const tabConfig = (t, isOwner, r2Enabled) => [
  { id: 'overview',     label: t('myTeam.tabs.overview'),     Icon: Info },
  { id: 'chat',         label: t('team.chat.tab'),            Icon: MessageCircle },
  { id: 'members',      label: t('myTeam.tabs.members'),      Icon: Users },
  { id: 'competitions', label: t('myTeam.tabs.competitions'), Icon: Trophy },
  ...(r2Enabled ? [{ id: 'files', label: 'Archivos', Icon: FolderOpen }] : []),
  { id: 'activity',     label: 'Actividad',                   Icon: Activity },
  ...(isOwner ? [{ id: 'settings', label: t('myTeam.tabs.settings'), Icon: Settings }] : []),
];

// ── Avatar ──────────────────────────────────────────────────────────────────

const Avatar = ({ src, name, size = 'md' }) => {
  const initials = (name || '??').slice(0, 2).toUpperCase();
  const palettes = [
    'bg-blue-600 text-blue-50',
    'bg-violet-600 text-violet-50',
    'bg-emerald-600 text-emerald-50',
    'bg-amber-600 text-amber-50',
    'bg-rose-600 text-rose-50',
    'bg-cyan-600 text-cyan-50',
  ];
  const palette = palettes[initials.charCodeAt(0) % palettes.length];
  const sizeClasses = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-sm' };

  return (
    <div className={`${sizeClasses[size]} overflow-hidden shrink-0 flex items-center justify-center font-bold ${!src ? palette : 'bg-stone-100 dark:bg-stone-800'}`}>
      {src
        ? <img src={src} alt={name} className="h-full w-full object-cover" />
        : <span>{initials}</span>
      }
    </div>
  );
};

// ── Inline toast ─────────────────────────────────────────────────────────────

const InlineToast = ({ toast }) => (
  <AnimatePresence>
    {toast.show && (
      <motion.div
        key="toast"
        initial={{ opacity: 0, y: -12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 text-sm font-medium border-2 backdrop-blur-sm ${
          toast.type === 'success'
            ? 'bg-emerald-50/95 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-800'
            : toast.type === 'error'
            ? 'bg-red-50/95 text-red-800 border-red-200 dark:bg-red-950/90 dark:text-red-300 dark:border-red-800'
            : 'bg-white/95 text-stone-800 border-stone-200 dark:bg-stone-900/90 dark:text-stone-200 dark:border-stone-700'
        }`}
      >
        {toast.type === 'success' && (
          <div className="flex items-center justify-center w-5 h-5 bg-emerald-500 shrink-0">
            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
              <motion.path d="M2 6l3 3 5-5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
            </svg>
          </div>
        )}
        {toast.type === 'error' && (
          <div className="flex items-center justify-center w-5 h-5 bg-red-500 shrink-0">
            <X className="h-3 w-3 text-white" />
          </div>
        )}
        {toast.message}
      </motion.div>
    )}
  </AnimatePresence>
);

// ── Spinner ─────────────────────────────────────────────────────────────────

const Spinner = ({ className = 'w-4 h-4' }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
    className={`${className} border-2 border-current/25 border-t-current rounded-full`}
  />
);

// ── Creation form ────────────────────────────────────────────────────────────

const CreateTeamForm = ({ onCreated, t, api, countries = [], countriesLoading = false }) => {
  const { create } = useTeams();
  const { refreshTeamStatus } = useTeamContext();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', institution: '', country_id: '', description: '', website_url: '' });
  const [educationalCenters, setEducationalCenters] = useState([]);
  const [centerId, setCenterId] = useState('');

  useEffect(() => {
    api('/educational-centers?status=approved').then(r => {
      const items = r?.items || (Array.isArray(r) ? r : []);
      setEducationalCenters(items);
    }).catch(() => {});
  }, [api]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.country_id) payload.country_id = Number(payload.country_id);
      if (centerId) payload.educational_center_id = Number(centerId);
      const newTeam = await create(payload);
      refreshTeamStatus();
      setStep(2);
      setTimeout(() => onCreated(newTeam), 1800);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const steps = [
    {
      title: t('myTeam.createTitle'),
      subtitle: 'Informacion basica del equipo',
      content: (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
          <motion.div variants={stagger.item}>
            <Label htmlFor="cf-name">{t('myTeam.form.name')} *</Label>
            <Input id="cf-name" className="mt-2" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre del equipo..." required />
          </motion.div>
          <motion.div variants={stagger.item} className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cf-city">{t('myTeam.form.city')}</Label>
              <Input id="cf-city" className="mt-2" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Madrid..." />
            </div>
            <div>
              <Label htmlFor="cf-inst">{t('myTeam.form.institution')}</Label>
              <Input id="cf-inst" className="mt-2" value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="IES..." />
            </div>
          </motion.div>
          <motion.div variants={stagger.item}>
            <Label>{t('myTeam.form.country')}</Label>
            <div className="mt-2">
              <CountrySelect
                value={form.country_id ? String(form.country_id) : 'all'}
                onValueChange={val => set('country_id', val === 'all' ? '' : val)}
                countries={countries}
                loading={countriesLoading}
                allLabel={t('myTeam.form.noCountry')}
                placeholder={t('teams.searchCountry')}
              />
            </div>
          </motion.div>
          <motion.div variants={stagger.item}>
            <Label htmlFor="cf-desc">{t('myTeam.form.description')}</Label>
            <Textarea id="cf-desc" className="mt-2 resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
          </motion.div>
        </motion.div>
      ),
      nextDisabled: !form.name.trim()
    },
    {
      title: 'Detalles adicionales',
      subtitle: 'Opcional — puedes completar esto despues',
      content: (
        <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
          <motion.div variants={stagger.item}>
            <Label htmlFor="cf-web">{t('myTeam.form.website')}</Label>
            <Input id="cf-web" className="mt-2" type="url" value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://..." />
          </motion.div>
          <motion.div variants={stagger.item}>
            <Label htmlFor="cf-center">{t('myTeam.form.selectCenter')}</Label>
            <select
              id="cf-center"
              value={centerId}
              onChange={e => setCenterId(e.target.value)}
              className="mt-2 w-full border-2 border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50 dark:focus:border-stone-400 dark:focus:ring-stone-400"
            >
              <option value="">{t('myTeam.form.noCenter')}</option>
              {educationalCenters.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.city ? ` (${c.city})` : ''}</option>
              ))}
            </select>
          </motion.div>
          <motion.div variants={stagger.item}>
            <p className="text-xs text-stone-400 dark:text-stone-500">{t('myTeam.form.onlyAdminsCanCreate')}</p>
          </motion.div>
        </motion.div>
      ),
      nextDisabled: false
    }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 2 ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center gap-6 py-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 stroke-emerald-600 dark:stroke-emerald-400" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }} />
              </svg>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-center">
              <p className="text-xl font-display font-bold text-stone-900 dark:text-stone-50">{t('myTeam.feedback.created')}</p>
              <p className="text-sm text-stone-500 mt-2">Redirigiendo a tu equipo...</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <div className="border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-stone-100 dark:bg-stone-800">
                <motion.div
                  className="h-full bg-stone-900 dark:bg-stone-50"
                  initial={false}
                  animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              <div className="p-8 space-y-6">
                {/* Step label */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-stone-900 text-white text-xs font-bold dark:bg-stone-50 dark:text-stone-900">
                    {step + 1}
                  </span>
                  <div>
                    <h2 className="text-lg font-display font-bold text-stone-900 dark:text-stone-50">{steps[step].title}</h2>
                    <p className="text-xs text-stone-400 mt-0.5">{steps[step].subtitle}</p>
                  </div>
                </div>

                {steps[step].content}

                {/* Actions */}
                <div className="flex gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                  {step > 0 && (
                    <Button type="button" variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">
                      Atras
                    </Button>
                  )}
                  {step < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={() => setStep(s => s + 1)}
                      disabled={steps[step].nextDisabled}
                      className="flex-1 gap-2"
                    >
                      Siguiente <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleSubmit} disabled={saving} className="flex-1 gap-2">
                      {saving ? <><Spinner /> Creando...</> : <>{t('myTeam.form.submitCreate')} <ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, Icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className="group relative border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-5 overflow-hidden transition-all duration-300 hover:border-stone-300 dark:hover:border-stone-700"
  >
    <div className="absolute top-0 right-0 w-24 h-24 -translate-y-8 translate-x-8 opacity-[0.04] dark:opacity-[0.06]">
      <Icon className="w-full h-full" />
    </div>
    <div className="relative">
      <div className="w-9 h-9 bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3 transition-colors group-hover:bg-stone-900 dark:group-hover:bg-stone-50">
        <Icon className="h-4.5 w-4.5 text-stone-600 dark:text-stone-400 transition-colors group-hover:text-white dark:group-hover:text-stone-900" />
      </div>
      <p className="text-3xl font-display font-bold text-stone-900 dark:text-stone-50 tracking-tight">{value}</p>
      <p className="text-xs text-stone-500 mt-1 font-medium">{label}</p>
    </div>
  </motion.div>
);

// ── Member row ───────────────────────────────────────────────────────────────

const MemberRow = ({ member, isOwner, onRemove, onRoleChange, t, index }) => {
  const roleIcons = { owner: Crown, admin: Shield };
  const roleColors = { owner: 'text-amber-500', admin: 'text-blue-500' };
  const RoleIcon = roleIcons[member.role];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="flex items-center justify-between px-5 py-3.5 group hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors"
    >
      <div className="flex items-center gap-3.5">
        <Avatar src={resolveMediaUrl(member.user_photo)} name={member.user_username} size="md" />
        <div>
          <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
            {member.user_username || `${t('myTeam.members.userPrefix')}${member.user_id}`}
          </p>
          <p className="text-xs text-stone-500 capitalize flex items-center gap-1.5 mt-0.5">
            {RoleIcon && <RoleIcon className={`h-3 w-3 ${roleColors[member.role]}`} />}
            {member.role}
          </p>
        </div>
      </div>
      {isOwner && member.role !== 'owner' && (
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
          {/* Promote / demote */}
          <Button
            size="sm"
            variant="ghost"
            title={member.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
            className={`h-8 px-2.5 text-xs gap-1 ${member.role === 'admin' ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30'}`}
            onClick={() => onRoleChange(member.id, member.role === 'admin' ? 'member' : 'admin')}
          >
            {member.role === 'admin' ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            {member.role === 'admin' ? 'Demote' : 'Admin'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            onClick={() => onRemove(member.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// ── Registration row ─────────────────────────────────────────────────────────

const RegistrationRow = ({ reg, comp, isOwner, onWithdraw, t, index, teamId }) => {
  const displayStatus = reg.status === 'pending' ? (reg.center_approval_status || 'pending') : reg.status;
  const statusStyles = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
    rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
    pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  };
  const statusIcons = { approved: Check, rejected: X, pending: Clock };
  const StatusIcon = statusIcons[displayStatus] || Clock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <div className="flex items-center justify-between px-5 py-4 gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">
            {comp?.title ?? `${t('myTeam.competitions.compPrefix')}${reg.competition_id}`}
          </p>
          <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {new Date(reg.registration_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border-2 ${statusStyles[displayStatus] || statusStyles.pending}`}>
            <StatusIcon className="h-3 w-3" />
            {t(`myTeam.competitions.status.${displayStatus}`) || displayStatus}
          </span>
          {isOwner && displayStatus === 'pending' && (
            <button
              onClick={() => onWithdraw(reg.id)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 dark:text-red-400 transition-colors"
            >
              <X className="h-3 w-3" />
              {t('myTeam.competitions.withdraw')}
            </button>
          )}
        </div>
      </div>
      {reg.status === 'approved' && (
        <div className="px-5 pb-4">
          <TeamCompetitionDashboard competitionId={reg.competition_id} teamId={teamId} />
        </div>
      )}
    </motion.div>
  );
};

// ── Files Tab ────────────────────────────────────────────────────────────────

const FILE_ICONS = {
  image: Image,
  video: FileVideo,
  audio: FileAudio,
  pdf:   FileText,
  default: FileText,
};

const getFileCategory = (name = '') => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','webp','svg','avif'].includes(ext)) return 'image';
  if (['mp4','webm','mov','avi','mkv'].includes(ext)) return 'video';
  if (['mp3','wav','ogg','flac'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  return 'default';
};

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB

const fmtSize = (b) => {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtNum = (n) => Number(n).toLocaleString('es-ES');

/** Single horizontal gauge bar */
const Gauge = ({ label, used, limit, fmtUsed, fmtLimit, warning = 80, danger = 95 }) => {
  const pct = Math.min(100, (used / limit) * 100);
  const color = pct >= danger ? 'bg-red-500' : pct >= warning ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-mono ${pct >= danger ? 'text-red-500' : pct >= warning ? 'text-amber-500' : 'text-stone-500 dark:text-stone-400'}`}>
          {fmtUsed} / {fmtLimit}
        </span>
      </div>
      <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
        <div className={`h-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/** Usage panel shown in FilesTab */
const StorageGauges = ({ usage }) => {
  const { team, global: g, ops } = usage;
  const teamNearLimit  = team.pct  >= 80;
  const globalNearLimit = g.pct   >= 80;
  const opsNearLimit   = (ops.classA / ops.classALimit) * 100 >= 80;

  return (
    <div className="border-2 border-stone-200 dark:border-stone-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">Uso de almacenamiento</span>
        <span className="text-[10px] text-stone-400">Cloudflare R2 · {ops.month}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Team storage */}
        <Gauge
          label="Este equipo"
          used={team.used}
          limit={team.limit}
          fmtUsed={fmtSize(team.used)}
          fmtLimit={fmtSize(team.limit)}
        />

        {/* Global storage */}
        <Gauge
          label="Almacenamiento global"
          used={g.used}
          limit={g.limit}
          fmtUsed={fmtSize(g.used)}
          fmtLimit={fmtSize(g.limit)}
        />

        {/* Class A ops */}
        <Gauge
          label="Escrituras mensuales (Clase A)"
          used={ops.classA}
          limit={ops.classALimit}
          fmtUsed={fmtNum(ops.classA)}
          fmtLimit={fmtNum(ops.classALimit)}
        />

        {/* Class B ops */}
        <Gauge
          label="Lecturas mensuales (Clase B)"
          used={ops.classB}
          limit={ops.classBLimit}
          fmtUsed={fmtNum(ops.classB)}
          fmtLimit={fmtNum(ops.classBLimit)}
        />
      </div>

      {/* Warnings */}
      {(teamNearLimit || globalNearLimit || opsNearLimit) && (
        <div className="px-4 py-3 border-t-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-1">
          {teamNearLimit && (
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              El equipo ha usado {team.pct.toFixed(0)}% de su cuota. Elimina archivos para liberar espacio.
            </p>
          )}
          {globalNearLimit && (
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              El almacenamiento global está al {g.pct.toFixed(0)}%. Contacta con el administrador.
            </p>
          )}
          {opsNearLimit && (
            <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Las escrituras mensuales están al {((ops.classA / ops.classALimit) * 100).toFixed(0)}% del límite gratuito.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const FilesTab = ({ teamId, api, isAdmin }) => {
  const { t } = useTranslation();
  const [files,     setFiles]     = useState(null);   // null = loading
  const [usage,     setUsage]     = useState(null);
  const [filter,    setFilter]    = useState('all');
  const [lightbox,  setLightbox]  = useState(null);
  const [isDrag,    setIsDrag]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [uploadErr, setUploadErr] = useState(null);
  const dropRef  = useRef(null);
  const inputRef = useRef(null);

  const load = useCallback(() => {
    api(`/teams/${teamId}/files`)
      .then(data => setFiles(Array.isArray(data) ? data : []))
      .catch(() => setFiles([]));
    api(`/teams/${teamId}/files/usage`)
      .then(data => setUsage(data))
      .catch(() => {});
  }, [teamId, api]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = useCallback(async (fileObj) => {
    if (!fileObj) return;
    if (fileObj.size > MAX_UPLOAD_SIZE) {
      setUploadErr(`El archivo supera el límite de ${MAX_UPLOAD_SIZE / 1024 / 1024} MB.`);
      return;
    }
    setUploading(true);
    setProgress(0);
    setUploadErr(null);

    const base = getApiBaseUrl();
    const fd = new FormData();
    fd.append('file', fileObj);

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${base}/teams/${teamId}/files`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          try { reject(new Error(JSON.parse(xhr.responseText).error || `HTTP ${xhr.status}`)); }
          catch { reject(new Error(`HTTP ${xhr.status}`)); }
        }
      };
      xhr.onerror = () => reject(new Error('Error de red'));
      xhr.send(fd);
    }).then(() => {
      load();
    }).catch(err => {
      setUploadErr(err.message);
    }).finally(() => {
      setUploading(false);
      setProgress(0);
    });
  }, [teamId, api, load]);

  const handleDelete = useCallback(async (fileId) => {
    try {
      await api(`/teams/${teamId}/files/${fileId}`, { method: 'DELETE' });
      setFiles(prev => prev.filter(f => f.id !== fileId));
      // Refresh usage counters after delete
      api(`/teams/${teamId}/files/usage`).then(setUsage).catch(() => {});
    } catch (err) {
      setUploadErr(err.message);
    }
  }, [teamId, api]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleUpload(f);
  };

  const allFiles  = files ?? [];
  const categories = ['all', 'image', 'video', 'audio', 'pdf', 'default'];
  const catLabels  = { all: 'Todo', image: 'Imágenes', video: 'Vídeos', audio: 'Audio', pdf: 'PDFs', default: 'Otros' };

  const filtered = filter === 'all' ? allFiles : allFiles.filter(f => getFileCategory(f.original_name) === filter);
  const images   = filtered.filter(f => getFileCategory(f.original_name) === 'image');
  const others   = filtered.filter(f => getFileCategory(f.original_name) !== 'image');

  if (files === null) {
    return (
      <div className="p-6 sm:p-8 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-stone-100 dark:bg-stone-800 animate-pulse" />)}
      </div>
    );
  }

  return (
    <motion.div
      ref={dropRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`p-6 sm:p-8 space-y-6 relative ${isDrag && isAdmin ? 'outline-2 outline-dashed outline-blue-500 outline-offset-[-4px]' : ''}`}
      onDragOver={isAdmin ? (e) => { e.preventDefault(); setIsDrag(true); } : undefined}
      onDragLeave={isAdmin ? (e) => { if (!dropRef.current?.contains(e.relatedTarget)) setIsDrag(false); } : undefined}
      onDrop={isAdmin ? onDrop : undefined}
    >
      {/* Drag overlay */}
      {isDrag && isAdmin && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-blue-50/80 dark:bg-blue-950/50 pointer-events-none">
          <div className="flex flex-col items-center gap-3 p-10 border-2 border-dashed border-blue-500">
            <UploadCloud className="h-10 w-10 text-blue-500" />
            <p className="font-semibold text-blue-600 dark:text-blue-400">{t('myTeam.files.dropHere')}</p>
            <p className="text-xs text-blue-500">{t('myTeam.files.maxSize')}</p>
          </div>
        </div>
      )}

      {/* Storage usage gauges */}
      {usage && (
        <StorageGauges usage={usage} />
      )}

      {/* Admin upload area */}
      {isAdmin && (
        <div className="border-2 border-dashed border-stone-200 dark:border-stone-700 p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <UploadCloud className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('myTeam.files.uploadTitle')}</p>
                <p className="text-xs text-stone-400">Cloudflare R2 · Máx. 50 MB · Arrastra o selecciona</p>
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="gap-2 shrink-0"
            >
              {uploading
                ? <><span className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Subiendo {progress}%</>
                : <><UploadCloud className="h-3.5 w-3.5" /> Seleccionar</>
              }
            </Button>
          </div>
          {uploading && (
            <div className="mt-3 h-1.5 w-full bg-stone-100 dark:bg-stone-800">
              <div
                className="h-full bg-violet-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {uploadErr && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{uploadErr}
            </p>
          )}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-xs font-semibold border-2 transition-colors ${
              filter === cat
                ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-stone-900 dark:border-stone-50'
                : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500'
            }`}
          >
            {catLabels[cat]}
            {cat !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {allFiles.filter(f => getFileCategory(f.original_name) === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-stone-200 dark:border-stone-800">
          <FolderOpen className="h-10 w-10 mx-auto mb-3 text-stone-300 dark:text-stone-700" />
          <p className="text-sm text-stone-400 font-medium">
            {isAdmin ? 'Sin archivos. Sube el primero.' : 'Sin archivos compartidos'}
          </p>
        </div>
      ) : (
        <>
          {/* Image grid */}
          {images.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Imágenes · {images.length}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {images.map((f) => (
                  <div key={f.id} className="relative group aspect-square overflow-hidden border-2 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-colors">
                    <button
                      type="button"
                      onClick={() => setLightbox(f.signed_url || f.url)}
                      className="h-full w-full"
                    >
                      <img src={f.signed_url || f.url} alt={f.original_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id)}
                        className="absolute top-1 right-1 p-1 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File list */}
          {others.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Archivos · {others.length}</p>
              <div className="border-2 border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
                {others.map((f) => {
                  const cat = getFileCategory(f.original_name);
                  const FileIcon = FILE_ICONS[cat] ?? FILE_ICONS.default;
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors group">
                      <div className="w-9 h-9 bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                        <FileIcon className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{f.original_name}</p>
                        <p className="text-xs text-stone-400">
                          {f.uploader?.first_name ?? 'Admin'}
                          {f.size && ` · ${fmtSize(f.size)}`}
                          {f.created_at && ` · ${new Date(f.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={f.signed_url || f.url}
                          download={f.original_name}
                          onClick={e => e.stopPropagation()}
                          className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(f.id)}
                            className="p-2 text-stone-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-h-full max-w-full object-contain" onClick={e => e.stopPropagation()} />
          <button type="button" onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

// ── Activity Tab ──────────────────────────────────────────────────────────────

const ActivityItem = ({ icon: Icon, iconBg, iconColor, title, subtitle, time }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`w-9 h-9 ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex-1 w-px bg-stone-200 dark:bg-stone-800 mt-1" />
    </div>
    <div className="pb-6">
      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</p>
      {subtitle && <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>}
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{time}</p>
    </div>
  </div>
);

const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

const ActivityTab = ({ team, members, registrations, competitions }) => {
  const { t } = useTranslation();
  const events = useMemo(() => {
    const list = [];

    // Team created
    list.push({
      key: 'team-created',
      icon: Flag,
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      title: `Equipo "${team.name}" creado`,
      subtitle: null,
      time: fmtDate(team.created_at),
      ts: new Date(team.created_at).getTime(),
    });

    // Members joined
    members.forEach(m => {
      if (m.joined_at) {
        list.push({
          key: `member-${m.id}`,
          icon: UserCheck,
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          title: `${m.username ?? m.name} se unió al equipo`,
          subtitle: m.role === 'owner' ? 'Propietario' : null,
          time: fmtDate(m.joined_at),
          ts: new Date(m.joined_at).getTime(),
        });
      }
    });

    // Competition registrations
    registrations.forEach(r => {
      const comp = competitions.find(c => c.id === r.competition_id);
      list.push({
        key: `reg-${r.id}`,
        icon: Trophy,
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        title: `Inscripción a "${comp?.title ?? `Competición #${r.competition_id}`}"`,
        subtitle: r.status === 'approved' ? 'Aprobada' : r.status === 'pending' ? 'Pendiente de aprobación' : r.status,
        time: fmtDate(r.created_at ?? r.registered_at),
        ts: new Date(r.created_at ?? r.registered_at).getTime(),
      });
    });

    return list.sort((a, b) => b.ts - a.ts);
  }, [team, members, registrations, competitions]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
          <Activity className="h-4 w-4 text-stone-600 dark:text-stone-400" />
        </div>
        <div>
          <h2 className="font-display font-bold text-stone-900 dark:text-stone-50">Historial de actividad</h2>
          <p className="text-xs text-stone-500">{events.length} eventos registrados</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-stone-200 dark:border-stone-800">
          <Activity className="h-10 w-10 mx-auto mb-3 text-stone-300 dark:text-stone-700" />
          <p className="text-sm text-stone-400 font-medium">{t('myTeam.activity.empty')}</p>
        </div>
      ) : (
        <div>
          {events.map((ev, i) => (
            <div key={ev.key} className={i === events.length - 1 ? '[&_.w-px]:hidden' : ''}>
              <ActivityItem {...ev} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

const MyTeam = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshTeamStatus } = useTeamContext();
  const features = useFeatures();
  const api = useApi();
  const { mine, update, invite, remove, listRequests, approveRequest, getMembers, removeMember, leave } = useTeams();
  const { list: listRegistrations, create: createRegistration, remove: removeRegistration } = useRegistrations();
  const { streams, createStream, deleteStream } = useStreams();
  const { countries, loading: countriesLoading } = useCountries();

  const [team, setTeam] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [form, setForm] = useState({ name: '', city: '', institution: '', country_id: '', description: '', website_url: '', stream_url: '' });
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState({ ownedTeamId: null, memberOfTeamId: null });
  const [competitions, setCompetitions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [compSearch, setCompSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [emailInvite, setEmailInvite] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, payload: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [teamResult, statusResult, compsResult] = await Promise.allSettled([
          mine(),
          api('/teams/status'),
          api('/competitions')
        ]);
        const tRes = teamResult.status === 'fulfilled' ? teamResult.value : null;
        const st   = statusResult.status === 'fulfilled' ? statusResult.value : {};
        const comps = compsResult.status === 'fulfilled' ? compsResult.value : [];

        setStatus({ ownedTeamId: st?.ownedTeamId ?? null, memberOfTeamId: st?.memberOfTeamId ?? null });
        setCompetitions(Array.isArray(comps) ? comps : []);

        if (tRes) {
          setTeam(tRes);
          setForm({ name: tRes.name || '', city: tRes.city || '', institution: tRes.institution || '', country_id: tRes.country_id || '', description: tRes.description || '', website_url: tRes.website_url || '', stream_url: tRes.stream_url || '' });
          const [reqs, mem, regs] = await Promise.allSettled([
            listRequests(tRes.id),
            getMembers(tRes.id),
            listRegistrations({ team_id: tRes.id })
          ]);
          setRequests(reqs.status === 'fulfilled' && Array.isArray(reqs.value) ? reqs.value : []);
          setMembers(mem.status === 'fulfilled' && Array.isArray(mem.value) ? mem.value : []);
          setRegistrations(regs.status === 'fulfilled' && Array.isArray(regs.value) ? regs.value : []);
        }
      } catch { setTeam(null); }
      setLoaded(true);
    };
    load();
  }, []); // eslint-disable-line

  const doSearch = useMemo(() => debounce(async (text) => {
    if (!text) { setCandidates([]); return; }
    try { const res = await api(`/users?q=${encodeURIComponent(text)}`); setCandidates(Array.isArray(res) ? res : []); } catch { setCandidates([]); }
  }, 300), [api]);

  useEffect(() => { doSearch(query); }, [query, doSearch]);

  const isOwner = team && status.ownedTeamId === team.id;
  const activeStream = streams.find(s => s.team_id === team?.id && s.status === 'live');

  const onCreated = (newTeam) => {
    setTeam(newTeam);
    setStatus({ ownedTeamId: newTeam.id, memberOfTeamId: newTeam.id });
    setForm({ name: newTeam.name || '', city: newTeam.city || '', institution: newTeam.institution || '', country_id: newTeam.country_id || '', description: newTeam.description || '', website_url: newTeam.website_url || '', stream_url: '' });
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!team) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.country_id) payload.country_id = Number(payload.country_id);
      const updated = await update(team.id, payload);
      setTeam(updated);
      showToast(t('myTeam.feedback.saved'));
    } catch (err) {
      showToast(err.message || t('myTeam.feedback.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onInviteUsername = async (username) => {
    try {
      await invite(team.id, { username });
      setQuery(''); setCandidates([]);
      showToast(t('myTeam.feedback.invited', { username }));
    } catch (err) {
      showToast(err.message || t('myTeam.feedback.inviteError'), 'error');
    }
  };

  const onInviteEmail = async (e) => {
    e.preventDefault();
    if (!emailInvite.trim()) return;
    try {
      await invite(team.id, { email: emailInvite.trim() });
      setEmailInvite('');
      showToast(t('myTeam.feedback.emailInvited'));
    } catch (err) {
      showToast(err.message || t('myTeam.feedback.inviteError'), 'error');
    }
  };

  const onApprove = async (id) => {
    try {
      await approveRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      const mem = await getMembers(team.id);
      setMembers(Array.isArray(mem) ? mem : []);
      showToast(t('myTeam.feedback.approved'));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const onRemoveMember = async (memberId) => {
    try {
      await removeMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      showToast(t('myTeam.feedback.memberRemoved'));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const onRoleChange = async (memberId, newRole) => {
    try {
      await api(`/team-members/${memberId}`, { method: 'PUT', body: { role: newRole } });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      showToast(newRole === 'admin' ? 'Miembro promovido a admin' : 'Admin degradado a miembro');
    } catch (err) {
      showToast(err.message || 'Error al cambiar rol', 'error');
    }
  };

  const onLeave = async () => {
    try {
      await leave();
      setTeam(null); setMembers([]); setRegistrations([]);
      setStatus({ ownedTeamId: null, memberOfTeamId: null });
      refreshTeamStatus();
      showToast(t('myTeam.feedback.left'));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const onDelete = async () => {
    try {
      await remove(team.id);
      setTeam(null); setStatus({ ownedTeamId: null, memberOfTeamId: null });
      refreshTeamStatus();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const registeredCompIds = useMemo(() => new Set(registrations.map(r => r.competition_id)), [registrations]);
  const approvedRegs = useMemo(() => registrations.filter(r => r.status === 'approved'), [registrations]);
  const pendingRegs = useMemo(() => registrations.filter(r => r.status === 'pending'), [registrations]);
  const adminCount = useMemo(() => members.filter(m => m.role === 'admin').length, [members]);

  const copyTeamLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/teams/${team.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch { /* ignore */ }
  };
  const filteredCompetitions = useMemo(() =>
    competitions.filter(c => c.title?.toLowerCase().includes(compSearch.toLowerCase())),
    [competitions, compSearch]
  );

  const onRegister = async () => {
    if (!selectedCompetition) return;
    try {
      await createRegistration({ team_id: team.id, competition_id: Number(selectedCompetition) });
      showToast(t('myTeam.feedback.registrationSent'));
      const regs = await listRegistrations({ team_id: team.id });
      setRegistrations(Array.isArray(regs) ? regs : []);
      setSelectedCompetition('');
      setCompSearch('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const onWithdrawRegistration = async (id) => {
    try {
      await removeRegistration(id);
      setRegistrations(prev => prev.filter(r => r.id !== id));
      showToast(t('myTeam.competitions.withdrawnSuccess'));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const onToggleStream = async () => {
    try {
      if (activeStream) {
        await deleteStream(activeStream.id);
        showToast(t('myTeam.feedback.streamStopped'));
      } else {
        if (!form.stream_url) { showToast(t('myTeam.feedback.streamUrlMissing'), 'error'); return; }
        await createStream({ title: `${team.name} LIVE`, team_id: team.id, stream_url: form.stream_url, status: 'live' });
        showToast(t('myTeam.feedback.streamStarted'));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openConfirmDialog = (type, payload = null) => setConfirmDialog({ open: true, type, payload });
  const closeConfirmDialog = () => { if (!confirmLoading) setConfirmDialog({ open: false, type: null, payload: null }); };

  const onConfirmDialogAction = async () => {
    const { type, payload } = confirmDialog;
    if (!type) return;
    setConfirmLoading(true);
    try {
      if (type === 'remove-member') await onRemoveMember(payload);
      if (type === 'leave-team') await onLeave();
      if (type === 'delete-team') await onDelete();
      if (type === 'withdraw-registration') await onWithdrawRegistration(payload);
      setConfirmDialog({ open: false, type: null, payload: null });
    } finally {
      setConfirmLoading(false);
    }
  };

  const confirmDialogConfig = (() => {
    switch (confirmDialog.type) {
      case 'remove-member': return { title: t('myTeam.members.title'), description: t('myTeam.feedback.confirmRemoveMember'), confirmLabel: t('actions.delete') };
      case 'leave-team': return { title: t('myTeam.actions.leave'), description: t('myTeam.feedback.confirmLeave'), confirmLabel: t('myTeam.actions.leave') };
      case 'delete-team': return { title: t('myTeam.actions.delete'), description: t('myTeam.feedback.confirmDelete'), confirmLabel: t('myTeam.actions.delete') };
      case 'withdraw-registration': return { title: t('myTeam.competitions.withdraw'), description: t('myTeam.competitions.confirmWithdraw'), confirmLabel: t('myTeam.competitions.withdraw') };
      default: return { title: '', description: '', confirmLabel: t('actions.delete') };
    }
  })();

  // ── Loading state ─────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="space-y-6 py-8 max-w-6xl mx-auto">
        <Skeleton className="h-32 w-full" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-24" />)}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  // ── No team ────────────────────────────────────────────────────────────
  if (!team) return <Navigate to="/" replace />;

  const tabItems = tabConfig(t, isOwner, features.r2);

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <InlineToast toast={toast} />

      {/* ────────────────── Team Header ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              {/* Team initials badge */}
              <div className="w-16 h-16 bg-stone-900 dark:bg-stone-50 flex items-center justify-center text-white dark:text-stone-900 font-display font-bold text-xl shrink-0">
                {team.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-50 tracking-tight">{team.name}</h1>
                  <Badge variant={isOwner ? 'default' : 'secondary'} className="text-xs gap-1">
                    {isOwner ? <><Crown className="h-3 w-3" />{t('myTeam.roles.owner')}</> : t('myTeam.roles.member')}
                  </Badge>
                  {activeStream && (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 text-xs font-bold border-2 border-cyan-200 dark:border-cyan-800"
                    >
                      <Wifi className="h-3 w-3" /> LIVE
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-stone-500 dark:text-stone-400 flex-wrap">
                  {team.city && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{team.city}</span>}
                  {team.institution && <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{team.institution}</span>}
                  <span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />{team.id}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {team.website_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={team.website_url} target="_blank" rel="noreferrer" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Web
                  </a>
                </Button>
              )}
              {!isOwner && (
                <Button variant="ghost" size="sm" onClick={() => openConfirmDialog('leave-team')} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <LogOut className="h-3.5 w-3.5" /> {t('myTeam.actions.leave')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ────────────────── Tab Navigation ────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex overflow-x-auto scrollbar-none -mb-px"
        >
          {tabItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`
                relative flex items-center gap-2 px-5 py-3 text-sm font-medium
                whitespace-nowrap shrink-0 transition-all duration-200
                border-2 border-b-0
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset
                ${activeTab === id
                  ? 'text-stone-900 dark:text-stone-50 bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 -mb-px z-10'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 border-transparent bg-transparent hover:bg-stone-50 dark:hover:bg-stone-800/30'
                }
              `}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {id === 'members' && requests.length > 0 && (
                <span className="flex items-center justify-center h-4 w-4 text-[10px] font-bold bg-blue-600 text-white shrink-0">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        <div className="border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">

          {/* ────────────────── OVERVIEW ────────────────── */}
          <TabsContent value="overview">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-8 space-y-8"
            >
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label={t('myTeam.overview.membersCount')} value={members.length} Icon={Users} delay={0.05} />
                <StatCard label="Admins" value={adminCount} Icon={Shield} delay={0.08} />
                <StatCard label={t('myTeam.overview.compsCount')} value={registrations.length} Icon={Trophy} delay={0.1} />
                <StatCard label="Aprobadas" value={approvedRegs.length} Icon={Check} delay={0.13} />
              </div>

              {/* About */}
              <div>
                <h2 className="font-display font-bold text-stone-900 dark:text-stone-50 mb-3">{t('myTeam.overview.about')}</h2>
                <div className="bg-stone-50 dark:bg-stone-900 p-5 border-2 border-stone-100 dark:border-stone-800">
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {team.description || <span className="italic text-stone-400">{t('myTeam.overview.noDesc')}</span>}
                  </p>
                  {team.website_url && (
                    <a href={team.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-4 font-medium">
                      <Globe className="h-4 w-4" /> {team.website_url}
                    </a>
                  )}
                </div>
              </div>

              {/* Quick info row */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Team link */}
                <div className="border-2 border-stone-200 dark:border-stone-800 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Enlace del equipo</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-stone-50 dark:bg-stone-900 px-3 py-2 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 truncate font-mono">
                      /teams/{team.id}
                    </code>
                    <button
                      type="button"
                      onClick={copyTeamLink}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-2 border-stone-200 dark:border-stone-700 hover:border-stone-900 dark:hover:border-stone-400 transition-colors text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 shrink-0"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedLink ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* Pending registrations */}
                {pendingRegs.length > 0 && (
                  <div className="border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Inscripciones pendientes
                    </p>
                    <div className="space-y-1.5">
                      {pendingRegs.slice(0, 3).map(r => {
                        const comp = competitions.find(c => c.id === r.competition_id);
                        return (
                          <p key={r.id} className="text-xs text-amber-700 dark:text-amber-300 truncate">
                            · {comp?.title ?? `Competición #${r.competition_id}`}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* ────────────────── CHAT ────────────────── */}
          <TabsContent value="chat">
            <div className="p-6 sm:p-8">
              <TeamChat teamId={team.id} />
            </div>
          </TabsContent>

          {/* ────────────────── MEMBERS ────────────────── */}
          <TabsContent value="members">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-6 sm:p-8 space-y-8">
              {/* Member list */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display font-bold text-stone-900 dark:text-stone-50">{t('myTeam.members.title')}</h2>
                    <p className="text-xs text-stone-500 mt-0.5">{t('myTeam.members.desc')}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{members.length}</Badge>
                </div>
                <div className="border-2 border-stone-200 dark:border-stone-800 overflow-hidden">
                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {members.length === 0 ? (
                      <div className="px-5 py-12 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-stone-300 dark:text-stone-700" />
                        <p className="text-sm text-stone-400">{t('myTeam.members.noMembers')}</p>
                      </div>
                    ) : members.map((m, i) => (
                      <MemberRow key={m.id} member={m} isOwner={isOwner} onRemove={(id) => openConfirmDialog('remove-member', id)} onRoleChange={onRoleChange} t={t} index={i} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Invite section (owner only) */}
              {isOwner && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Invite */}
                  <div className="border-2 border-stone-200 dark:border-stone-800 p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                        <UserPlus className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-stone-900 dark:text-stone-50">{t('myTeam.members.inviteTitle')}</h3>
                        <p className="text-xs text-stone-500">{t('myTeam.members.inviteDesc')}</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Search by username */}
                      <div className="space-y-2">
                        <Label className="text-xs">{t('myTeam.members.searchUser')}</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Username..." className="pl-9" />
                        </div>
                        <AnimatePresence>
                          {candidates.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="border-2 border-stone-200 dark:border-stone-700 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 max-h-36 overflow-y-auto"
                            >
                              {candidates.map(u => (
                                <div key={u.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                  <span className="text-stone-700 dark:text-stone-300 font-medium">{u.username}</span>
                                  <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs text-blue-600 gap-1" onClick={() => onInviteUsername(u.username)}>
                                    <UserPlus className="h-3 w-3" /> {t('myTeam.actions.invite')}
                                  </Button>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Invite by email */}
                      <div className="border-t border-stone-100 dark:border-stone-800 pt-5 space-y-2">
                        <Label className="text-xs">{t('myTeam.members.inviteEmail')}</Label>
                        <form onSubmit={onInviteEmail} className="flex gap-2">
                          <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                            <Input value={emailInvite} onChange={e => setEmailInvite(e.target.value)} placeholder="email@..." className="pl-9" type="email" />
                          </div>
                          <Button type="submit" size="sm" className="shrink-0 h-10 w-10 p-0">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* Join requests */}
                  <div className="border-2 border-stone-200 dark:border-stone-800 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                          <Clock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-sm text-stone-900 dark:text-stone-50">{t('myTeam.members.requestsTitle')}</h3>
                          <p className="text-xs text-stone-500">{t('myTeam.members.requestsDesc')}</p>
                        </div>
                      </div>
                      {requests.length > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs">{requests.length}</Badge>
                      )}
                    </div>
                    <div className="border-2 border-stone-200 dark:border-stone-800 overflow-hidden">
                      <div className="divide-y divide-stone-100 dark:divide-stone-800">
                        {requests.length === 0 ? (
                          <div className="px-5 py-8 text-center">
                            <Check className="h-6 w-6 mx-auto mb-1.5 text-stone-300 dark:text-stone-700" />
                            <p className="text-xs text-stone-400">{t('myTeam.members.noRequests')}</p>
                          </div>
                        ) : requests.map(r => (
                          <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.user_username} size="sm" />
                              <p className="text-sm font-medium text-stone-800 dark:text-stone-200">{r.user_username || `User ${r.user_id}`}</p>
                            </div>
                            {r.status === 'pending' && (
                              <button
                                onClick={() => onApprove(r.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" /> {t('myTeam.actions.approve')}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ────────────────── COMPETITIONS ────────────────── */}
          <TabsContent value="competitions">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-6 sm:p-8 space-y-8">
              {/* Register */}
              {isOwner && (
                <div className="border-2 border-stone-200 dark:border-stone-800 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                      <Zap className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-sm text-stone-900 dark:text-stone-50">{t('myTeam.competitions.registerTitle')}</h2>
                      <p className="text-xs text-stone-500">{t('myTeam.competitions.registerDesc')}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                      <Input
                        className="pl-9"
                        placeholder={t('myTeam.competitions.searchPlaceholder')}
                        value={compSearch}
                        onChange={e => { setCompSearch(e.target.value); setSelectedCompetition(''); }}
                      />
                    </div>
                    <AnimatePresence>
                      {compSearch.trim() && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="border-2 border-stone-200 dark:border-stone-700 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 max-h-52 overflow-y-auto"
                        >
                          {filteredCompetitions.length === 0 ? (
                            <p className="px-4 py-4 text-xs text-stone-400 text-center">{t('myTeam.competitions.noResults')}</p>
                          ) : filteredCompetitions.map(c => {
                            const already = registeredCompIds.has(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  if (!already) {
                                    setSelectedCompetition(String(c.id));
                                    setCompSearch(c.title);
                                  }
                                }}
                                disabled={already}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${
                                  already
                                    ? 'text-stone-400 dark:text-stone-600 cursor-not-allowed bg-stone-50 dark:bg-stone-800/30'
                                    : String(c.id) === selectedCompetition
                                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50'
                                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                                }`}
                              >
                                <span className="truncate font-medium">{c.title}</span>
                                {already && (
                                  <Badge variant="success" className="ml-2 shrink-0 text-xs">
                                    {t('myTeam.competitions.alreadyRegistered')}
                                  </Badge>
                                )}
                                {!already && String(c.id) === selectedCompetition && (
                                  <Check className="h-4 w-4 shrink-0 ml-2 text-stone-900 dark:text-stone-50" />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Button
                      onClick={onRegister}
                      disabled={!selectedCompetition || registeredCompIds.has(Number(selectedCompetition))}
                      className="gap-2 w-full"
                    >
                      <Trophy className="h-4 w-4" /> {t('myTeam.actions.register')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Active registrations */}
              <div>
                <h2 className="font-display font-bold text-stone-900 dark:text-stone-50 mb-4">{t('myTeam.competitions.activeTitle')}</h2>
                {registrations.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-stone-200 dark:border-stone-800">
                    <Trophy className="h-10 w-10 mx-auto mb-3 text-stone-300 dark:text-stone-700" />
                    <p className="text-sm text-stone-400 font-medium">{t('myTeam.competitions.noRegistrations')}</p>
                  </div>
                ) : (
                  <div className="border-2 border-stone-200 dark:border-stone-800 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
                    {registrations.map((r, i) => (
                      <RegistrationRow
                        key={r.id}
                        reg={r}
                        comp={competitions.find(c => c.id === r.competition_id)}
                        isOwner={isOwner}
                        onWithdraw={(id) => openConfirmDialog('withdraw-registration', id)}
                        t={t}
                        index={i}
                        teamId={team.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* ────────────────── FILES ────────────────── */}
          <TabsContent value="files">
            <FilesTab teamId={team.id} api={api} isAdmin={isOwner} />
          </TabsContent>

          {/* ────────────────── ACTIVITY ────────────────── */}
          <TabsContent value="activity">
            <ActivityTab
              team={team}
              members={members}
              registrations={registrations}
              competitions={competitions}
            />
          </TabsContent>

          {/* ────────────────── SETTINGS ────────────────── */}
          {isOwner && (
            <TabsContent value="settings">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="p-6 sm:p-8 space-y-8">
                {/* Edit info */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <Pencil className="h-4.5 w-4.5 text-stone-600 dark:text-stone-400" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-stone-900 dark:text-stone-50">{t('myTeam.settings.editTitle')}</h2>
                      <p className="text-xs text-stone-500">{t('myTeam.settings.editDesc')}</p>
                    </div>
                  </div>

                  <form onSubmit={onSave} className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Label>{t('myTeam.form.name')}</Label>
                      <Input className="mt-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>{t('myTeam.form.city')}</Label>
                      <Input className="mt-2" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div>
                      <Label>{t('myTeam.form.institution')}</Label>
                      <Input className="mt-2" value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} />
                    </div>
                    <div>
                      <Label>{t('myTeam.form.country')}</Label>
                      <div className="mt-2">
                        <CountrySelect
                          value={form.country_id ? String(form.country_id) : 'all'}
                          onValueChange={val => setForm({ ...form, country_id: val === 'all' ? '' : val })}
                          countries={countries}
                          loading={countriesLoading}
                          allLabel={t('myTeam.form.noCountry')}
                          placeholder={t('teams.searchCountry')}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t('myTeam.form.website')}</Label>
                      <Input className="mt-2" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('myTeam.form.description')}</Label>
                      <Textarea className="mt-2 resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" disabled={saving} className="min-w-[140px] gap-2">
                        {saving ? <><Spinner /> {t('buttons.saving')}</> : t('myTeam.form.submitSave')}
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="border-b border-stone-100 dark:border-stone-800" />

                {/* Streaming */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                      <Video className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-stone-900 dark:text-stone-50">{t('myTeam.settings.streamTitle')}</h2>
                      <p className="text-xs text-stone-500">{t('myTeam.settings.streamDesc')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input value={form.stream_url} onChange={e => setForm({ ...form, stream_url: e.target.value })} placeholder="https://twitch.tv/..." className="flex-1" />
                      <Button variant="outline" onClick={onSave} type="button">{t('myTeam.form.saveUrl')}</Button>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-stone-50 dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800">
                      <div className="flex items-center gap-3">
                        {activeStream
                          ? <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-3 h-3 rounded-full bg-red-500" />
                          : <div className="w-3 h-3 bg-stone-300 dark:bg-stone-600" />
                        }
                        <div>
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-50">{t('myTeam.settings.streamStatus')}</p>
                          <p className="text-xs text-stone-500">{activeStream ? 'En directo ahora' : t('myTeam.settings.streamStatusDesc')}</p>
                        </div>
                      </div>
                      <Button
                        onClick={onToggleStream}
                        className={`gap-2 ${activeStream ? '' : 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white'}`}
                      >
                        {activeStream ? <><WifiOff className="h-4 w-4" /> {t('myTeam.actions.stopStream')}</> : <><Wifi className="h-4 w-4" /> {t('myTeam.actions.startStream')}</>}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-b border-stone-100 dark:border-stone-800" />

                {/* Danger zone */}
                <div className="border-2 border-red-200 dark:border-red-900/50 overflow-hidden">
                  <div className="px-6 py-4 bg-red-50 dark:bg-red-950/20 border-b-2 border-red-200 dark:border-red-900/50">
                    <h3 className="font-display font-bold text-red-700 dark:text-red-400 text-sm">{t('myTeam.settings.dangerZone')}</h3>
                  </div>
                  <div className="p-6 flex items-center justify-between gap-4">
                    <p className="text-sm text-stone-600 dark:text-stone-400">{t('myTeam.settings.deleteWarning')}</p>
                    <Button variant="destructive" onClick={() => openConfirmDialog('delete-team')} className="gap-2 shrink-0">
                      <Trash2 className="h-4 w-4" /> {t('myTeam.actions.delete')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          )}
        </div>
      </Tabs>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => { if (!open) closeConfirmDialog(); }}
        title={confirmDialogConfig.title}
        description={confirmDialogConfig.description}
        confirmLabel={confirmDialogConfig.confirmLabel}
        cancelLabel={t('actions.cancel')}
        onConfirm={onConfirmDialogAction}
        loading={confirmLoading}
        confirmVariant="destructive"
      />
    </motion.div>
  );
};

export default MyTeam;
