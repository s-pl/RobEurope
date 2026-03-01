import { useEffect, useMemo, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  Users, Settings, Trophy, Info,
  LogOut, Trash2, Check, X, Video,
  UserPlus, MessageCircle, Building2,
  Globe, MapPin, Hash, ChevronRight,
  Wifi, WifiOff, Shield, Crown, Search
} from 'lucide-react';
import TeamChat from '../components/teams/TeamChat';
import TeamCompetitionDashboard from '../components/teams/TeamCompetitionDashboard';
import { resolveMediaUrl } from '../lib/apiClient';
import { CountrySelect } from '../components/ui/CountrySelect';
import { useCountries } from '../hooks/useCountries';

// ── Helpers ─────────────────────────────────────────────────────────────────

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

// ── Tab definitions ──────────────────────────────────────────────────────────

const tabs = (t, isOwner) => [
  { id: 'overview',     label: t('myTeam.tabs.overview'),     Icon: Info },
  { id: 'chat',         label: t('team.chat.tab'),            Icon: MessageCircle },
  { id: 'members',      label: t('myTeam.tabs.members'),      Icon: Users },
  { id: 'competitions', label: t('myTeam.tabs.competitions'), Icon: Trophy },
  ...(isOwner ? [{ id: 'settings', label: t('myTeam.tabs.settings'), Icon: Settings }] : []),
];

// ── Member avatar ─────────────────────────────────────────────────────────────

const Avatar = ({ src, name, size = 10 }) => {
  const initials = (name || '??').slice(0, 2).toUpperCase();
  const colors = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className={`h-${size} w-${size} rounded-full overflow-hidden shrink-0 flex items-center justify-center ${!src ? color : 'bg-slate-100 dark:bg-slate-800'}`}>
      {src
        ? <img src={src} alt={name} className="h-full w-full object-cover" />
        : <span className="text-xs font-bold">{initials}</span>
      }
    </div>
  );
};

// ── Creation form ─────────────────────────────────────────────────────────────

const CreateTeamForm = ({ onCreated, t, api, countries = [], countriesLoading = false }) => {
  const { create } = useTeams();
  const { refreshTeamStatus } = useTeamContext();
  const [step, setStep] = useState(0); // 0 = basics, 1 = details, 2 = success
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', institution: '', country_id: '', description: '', website_url: '' });
  const [educationalCenters, setEducationalCenters] = useState([]);
  const [centerId, setCenterId] = useState('');
  const canCreateCenter = false; // simplify: only admins

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

  const steps = [
    {
      title: t('myTeam.createTitle'),
      subtitle: 'Información básica del equipo',
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="cf-name">{t('myTeam.form.name')} *</Label>
            <Input
              id="cf-name"
              className="mt-1.5"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre del equipo..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cf-city">{t('myTeam.form.city')}</Label>
              <Input id="cf-city" className="mt-1.5" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Madrid..." />
            </div>
            <div>
              <Label htmlFor="cf-inst">{t('myTeam.form.institution')}</Label>
              <Input id="cf-inst" className="mt-1.5" value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} placeholder="IES..." />
            </div>
          </div>
          <div>
            <Label>{t('myTeam.form.country')}</Label>
            <div className="mt-1.5">
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
            <Label htmlFor="cf-desc">{t('myTeam.form.description')}</Label>
            <Textarea id="cf-desc" className="mt-1.5 resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      ),
      nextDisabled: !form.name.trim()
    },
    {
      title: 'Detalles adicionales',
      subtitle: 'Opcional — puedes completar esto después',
      content: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="cf-web">{t('myTeam.form.website')}</Label>
            <Input id="cf-web" className="mt-1.5" type="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="cf-center">{t('myTeam.form.selectCenter')}</Label>
            <select
              id="cf-center"
              value={centerId}
              onChange={e => setCenterId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('myTeam.form.noCenter')}</option>
              {educationalCenters.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.city ? ` (${c.city})` : ''}</option>
              ))}
            </select>
          </div>
          {!canCreateCenter && (
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('myTeam.form.onlyAdminsCanCreate')}</p>
          )}
        </div>
      ),
      nextDisabled: false
    }
  ];

  return (
    <div className="max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {step === 2 ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="flex flex-col items-center gap-5 py-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 stroke-emerald-500" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
              </svg>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center">
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('myTeam.feedback.created')}</p>
              <p className="text-sm text-slate-500 mt-1">Redirigiendo a tu equipo...</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                />
              ))}
            </div>

            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{steps[step].title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{steps[step].subtitle}</p>
            </div>

            {/* Content */}
            {steps[step].content}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button type="button" variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">
                  Atrás
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  disabled={steps[step].nextDisabled}
                  className="flex-1 gap-2"
                >
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Creando...
                    </>
                  ) : (
                    <>{t('myTeam.form.submitCreate')} <ChevronRight className="h-4 w-4" /></>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const MyTeam = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refreshTeamStatus } = useTeamContext();
  const api = useApi();
  const { mine, update, invite, remove, listRequests, approveRequest, getMembers, removeMember, leave } = useTeams();
  const { list: listRegistrations, create: createRegistration, remove: removeRegistration } = useRegistrations();
  const { streams, createStream, deleteStream } = useStreams();
  const { countries, loading: countriesLoading } = useCountries();

  const [team, setTeam] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' }); // type: info|success|error
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
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        // Phase 1: kick off independent top-level fetches in parallel
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
          // Phase 2: load team details in parallel
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

  const openConfirmDialog = (type, payload = null) => {
    setConfirmDialog({ open: true, type, payload });
  };

  const closeConfirmDialog = () => {
    if (confirmLoading) return;
    setConfirmDialog({ open: false, type: null, payload: null });
  };

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
      case 'remove-member':
        return {
          title: t('myTeam.members.title'),
          description: t('myTeam.feedback.confirmRemoveMember'),
          confirmLabel: t('actions.delete'),
        };
      case 'leave-team':
        return {
          title: t('myTeam.actions.leave'),
          description: t('myTeam.feedback.confirmLeave'),
          confirmLabel: t('myTeam.actions.leave'),
        };
      case 'delete-team':
        return {
          title: t('myTeam.actions.delete'),
          description: t('myTeam.feedback.confirmDelete'),
          confirmLabel: t('myTeam.actions.delete'),
        };
      case 'withdraw-registration':
        return {
          title: t('myTeam.competitions.withdraw'),
          description: t('myTeam.competitions.confirmWithdraw'),
          confirmLabel: t('myTeam.competitions.withdraw'),
        };
      default:
        return {
          title: '',
          description: '',
          confirmLabel: t('actions.delete'),
        };
    }
  })();

  // ── Render: Not loaded ────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // ── Render: No team ───────────────────────────────────────────────────────
  if (!team) return <Navigate to="/" replace />;


  // ── Render: Has team ──────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-5">

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                : 'bg-white text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
            }`}
          >
            {toast.type === 'success' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}
                className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 shrink-0">
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                  <motion.path d="M2 6l3 3 5-5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
                </svg>
              </motion.div>
            )}
            {toast.type === 'error' && <X className="h-4 w-4 text-red-500 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team header card */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden p-0 rounded-xl">
          {/* Top bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Team logo or initials */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xl shrink-0">
                {team.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{team.name}</h1>
                  <Badge variant={isOwner ? 'default' : 'secondary'} className="text-xs">
                    {isOwner ? <><Crown className="h-3 w-3 mr-1" />{t('myTeam.roles.owner')}</> : t('myTeam.roles.member')}
                  </Badge>
                  {activeStream && (
                    <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full border border-red-200 dark:border-red-800">
                      <Wifi className="h-3 w-3" /> LIVE
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                  {team.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{team.city}</span>}
                  {team.institution && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{team.institution}</span>}
                  <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />{team.id}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {team.website_url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={team.website_url} target="_blank" rel="noreferrer" className="gap-1.5">
                    <Globe className="h-4 w-4" /> Web
                  </a>
                </Button>
              )}
              {!isOwner && (
                <Button variant="outline" size="sm" onClick={() => openConfirmDialog('leave-team')} className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-800">
                  <LogOut className="h-4 w-4" /> {t('myTeam.actions.leave')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Scrollable tab navigation — no more cramped inline-flex */}
        <div className="flex overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 mb-6">
          {tabs(t, isOwner).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`
                relative flex items-center gap-2.5 px-5 py-3.5 text-sm font-medium
                whitespace-nowrap shrink-0 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset
                ${activeTab === id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }
              `}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {activeTab === id && (
                <motion.span
                  layoutId="myteam-tab-indicator"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ────────────────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="grid gap-5 md:grid-cols-3">
            {/* About */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{t('myTeam.overview.about')}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {team.description || <span className="italic text-slate-400">{t('myTeam.overview.noDesc')}</span>}
              </p>
              {team.website_url && (
                <a href={team.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400">
                  <Globe className="h-4 w-4" /> {team.website_url}
                </a>
              )}
            </div>
            {/* Stats */}
            <div className="space-y-3">
              {[
                { label: t('myTeam.overview.membersCount'), value: members.length, Icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { label: t('myTeam.overview.compsCount'), value: registrations.length, Icon: Trophy, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              ].map(({ label, value, Icon, color, bg }) => (
                <motion.div
                  key={label}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── CHAT ────────────────────────────────────────────────────── */}
        <TabsContent value="chat">
          <TeamChat teamId={team.id} />
        </TabsContent>

        {/* ── MEMBERS ─────────────────────────────────────────────────── */}
        <TabsContent value="members">
          <div className="space-y-5">
            {/* Member list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">{t('myTeam.members.title')}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t('myTeam.members.desc')}</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">{t('myTeam.members.noMembers')}</p>
                ) : members.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={resolveMediaUrl(m.user_photo)} name={m.user_username} size={9} />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {m.user_username || `${t('myTeam.members.userPrefix')}${m.user_id}`}
                        </p>
                        <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                          {m.role === 'owner' && <Crown className="h-3 w-3 text-amber-500" />}
                          {m.role === 'admin' && <Shield className="h-3 w-3 text-blue-500" />}
                          {m.role}
                        </p>
                      </div>
                    </div>
                    {isOwner && m.role !== 'owner' && (
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-7 px-2" onClick={() => openConfirmDialog('remove-member', m.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Invite section (owner only) */}
            {isOwner && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t('myTeam.members.inviteTitle')}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t('myTeam.members.inviteDesc')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('myTeam.members.searchUser')}</Label>
                    <div className="relative">
                      <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Username..." className="text-sm" />
                    </div>
                    <AnimatePresence>
                      {candidates.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-36 overflow-y-auto"
                        >
                          {candidates.map(u => (
                            <div key={u.id} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <span className="text-slate-700 dark:text-slate-300">{u.username}</span>
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-blue-600" onClick={() => onInviteUsername(u.username)}>
                                <UserPlus className="h-3 w-3 mr-1" /> {t('myTeam.actions.invite')}
                              </Button>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Label className="text-xs">{t('myTeam.members.inviteEmail')}</Label>
                    <form onSubmit={onInviteEmail} className="flex gap-2">
                      <Input value={emailInvite} onChange={e => setEmailInvite(e.target.value)} placeholder="email@..." className="text-sm" type="email" />
                      <Button type="submit" size="sm" className="shrink-0"><UserPlus className="h-4 w-4" /></Button>
                    </form>
                  </div>
                </div>

                {/* Join requests */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t('myTeam.members.requestsTitle')}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{t('myTeam.members.requestsDesc')}</p>
                    </div>
                    {requests.length > 0 && (
                      <Badge className="bg-blue-600 text-white">{requests.length}</Badge>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {requests.length === 0 ? (
                      <p className="px-5 py-6 text-center text-xs text-slate-400">{t('myTeam.members.noRequests')}</p>
                    ) : requests.map(r => (
                      <div key={r.id} className="flex items-center justify-between px-5 py-3">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.user_username || `User ${r.user_id}`}</p>
                        {r.status === 'pending' && (
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => onApprove(r.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400"
                          >
                            <Check className="h-3.5 w-3.5" /> {t('myTeam.actions.approve')}
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── COMPETITIONS ─────────────────────────────────────────────── */}
        <TabsContent value="competitions">
          <div className="space-y-5">
            {isOwner && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t('myTeam.competitions.registerTitle')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t('myTeam.competitions.registerDesc')}</p>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <Input
                      className="pl-8 text-sm"
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
                        className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto shadow-sm"
                      >
                        {filteredCompetitions.length === 0 ? (
                          <p className="px-3 py-3 text-xs text-slate-400 text-center">{t('myTeam.competitions.noResults')}</p>
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
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors ${
                                already
                                  ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30'
                                  : String(c.id) === selectedCompetition
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                            >
                              <span className="truncate">{c.title}</span>
                              {already && (
                                <Badge className="ml-2 shrink-0 text-xs h-5 px-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-800">
                                  {t('myTeam.competitions.alreadyRegistered')}
                                </Badge>
                              )}
                              {!already && String(c.id) === selectedCompetition && (
                                <Check className="h-3.5 w-3.5 shrink-0 ml-2 text-blue-600" />
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <motion.div whileTap={{ scale: 0.96 }}>
                  <Button
                    onClick={onRegister}
                    disabled={!selectedCompetition || registeredCompIds.has(Number(selectedCompetition))}
                    className="gap-2 w-full"
                  >
                    <Trophy className="h-4 w-4" /> {t('myTeam.actions.register')}
                  </Button>
                </motion.div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{t('myTeam.competitions.activeTitle')}</h3>
              </div>
              {registrations.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm text-slate-400">{t('myTeam.competitions.noRegistrations')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {registrations.map((r, i) => {
                    const displayStatus = r.status === 'pending' ? (r.center_approval_status || 'pending') : r.status;
                    const comp = competitions.find(c => c.id === r.competition_id);
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="flex items-center justify-between px-5 py-4 gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {comp?.title ?? `${t('myTeam.competitions.compPrefix')}${r.competition_id}`}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{new Date(r.registration_date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={displayStatus === 'approved' ? 'default' : displayStatus === 'rejected' ? 'destructive' : 'secondary'}>
                              {t(`myTeam.competitions.status.${displayStatus}`) || displayStatus}
                            </Badge>
                            {isOwner && displayStatus === 'pending' && (
                              <motion.button
                                whileTap={{ scale: 0.94 }}
                                onClick={() => openConfirmDialog('withdraw-registration', r.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                                {t('myTeam.competitions.withdraw')}
                              </motion.button>
                            )}
                          </div>
                        </div>
                        {r.status === 'approved' && (
                          <div className="px-5 pb-4">
                            <TeamCompetitionDashboard competitionId={r.competition_id} teamId={team.id} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── SETTINGS ─────────────────────────────────────────────────── */}
        {isOwner && (
          <TabsContent value="settings">
            <div className="space-y-5">
              {/* Edit info */}
              <Card className="p-0 rounded-xl overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 mb-0">
                  <CardTitle as="h3" className="font-semibold text-slate-900 dark:text-slate-100 text-base">{t('myTeam.settings.editTitle')}</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{t('myTeam.settings.editDesc')}</p>
                </CardHeader>
                <CardContent className="p-0">
                  <form onSubmit={onSave} className="p-6 grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-xs">{t('myTeam.form.name')}</Label>
                      <Input className="mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">{t('myTeam.form.city')}</Label>
                      <Input className="mt-1.5" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">{t('myTeam.form.institution')}</Label>
                      <Input className="mt-1.5" value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">{t('myTeam.form.country')}</Label>
                      <div className="mt-1.5">
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
                      <Label className="text-xs">{t('myTeam.form.website')}</Label>
                      <Input className="mt-1.5" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">{t('myTeam.form.description')}</Label>
                      <Textarea className="mt-1.5 resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <motion.div whileTap={{ scale: 0.96 }}>
                        <Button type="submit" disabled={saving} className="min-w-[120px]">
                          {saving ? (
                            <span className="flex items-center gap-2">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                              {t('buttons.saving')}
                            </span>
                          ) : t('myTeam.form.submitSave')}
                        </Button>
                      </motion.div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Stream */}
              <Card className="p-0 rounded-xl overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 mb-0">
                  <CardTitle as="h3" className="font-semibold text-slate-900 dark:text-slate-100 text-base">{t('myTeam.settings.streamTitle')}</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{t('myTeam.settings.streamDesc')}</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <Input value={form.stream_url} onChange={e => setForm({ ...form, stream_url: e.target.value })} placeholder="https://twitch.tv/..." className="flex-1" />
                    <Button variant="outline" onClick={onSave} type="button">{t('myTeam.form.saveUrl')}</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      {activeStream
                        ? <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        : <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      }
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('myTeam.settings.streamStatus')}</p>
                        <p className="text-xs text-slate-500">{activeStream ? 'En directo ahora' : t('myTeam.settings.streamStatusDesc')}</p>
                      </div>
                    </div>
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={onToggleStream}
                        className={`gap-2 ${activeStream ? 'bg-slate-800 hover:bg-slate-900 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                      >
                        {activeStream ? <><WifiOff className="h-4 w-4" /> {t('myTeam.actions.stopStream')}</> : <><Wifi className="h-4 w-4" /> {t('myTeam.actions.startStream')}</>}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger zone */}
              <div className="border border-red-200 dark:border-red-900/50 rounded-xl overflow-hidden">
                <div className="px-6 py-4 bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-900/50">
                  <h3 className="font-semibold text-red-700 dark:text-red-400">{t('myTeam.settings.dangerZone')}</h3>
                </div>
                <div className="p-6 flex items-center justify-between gap-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('myTeam.settings.deleteWarning')}</p>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button variant="destructive" onClick={() => openConfirmDialog('delete-team')} className="gap-2 shrink-0">
                      <Trash2 className="h-4 w-4" /> {t('myTeam.actions.delete')}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) closeConfirmDialog();
        }}
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
