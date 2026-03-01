import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Users, Globe, Plus, UserPlus, LogIn, Check, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useTeams } from '../hooks/useTeams';
import { useCountries } from '../hooks/useCountries';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { StaggerContainer, StaggerItem } from '../components/ui/PageTransition';
import { PageHeader } from '../components/ui/PageHeader';

// 3D tilt card with glare effect on hover
// Uses a DOM ref for the glare so no React re-renders on mousemove
const TiltCard = ({ children }) => {
  const glareRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 150, damping: 20, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 150, damping: 20, mass: 0.5 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    mouseX.set(x - 0.5);
    mouseY.set(y - 0.5);
    if (glareRef.current) {
      glareRef.current.style.opacity = '1';
      glareRef.current.style.backgroundImage = `radial-gradient(circle at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgba(255,255,255,0.2) 0%, transparent 55%)`;
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    if (glareRef.current) glareRef.current.style.opacity = '0';
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="h-full"
    >
      <div className="relative h-full">
        {children}
        <div
          ref={glareRef}
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
        />
      </div>
    </motion.div>
  );
};

// Per-card join button with success animation
const JoinButton = ({ teamId, onJoin, disabled, label, successLabel }) => {
  const [state, setState] = useState('idle'); // idle | loading | success

  const handleClick = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      await onJoin(teamId);
      setState('success');
      setTimeout(() => setState('idle'), 3000);
    } catch {
      setState('idle');
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      disabled={disabled || state !== 'idle'}
      className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
        state === 'success'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
          : state === 'loading'
          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-wait dark:bg-slate-800 dark:border-slate-700'
          : disabled
          ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-700'
          : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'success' ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="flex items-center gap-1.5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500"
            >
              <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                <motion.path
                  d="M2 6l3 3 5-5"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
              </svg>
            </motion.div>
            {successLabel}
          </motion.span>
        ) : state === 'loading' ? (
          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full"
            />
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

const Teams = () => {
  const { isAuthenticated } = useAuth();
  const { list, create, requestJoin, getMembers } = useTeams();
  const { countries, status: countriesStatus } = useCountries();
  const api = useApi();
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [teams, setTeams] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [status, setStatus] = useState({ ownsTeam: false, ownedTeamId: null, memberOfTeamId: null });
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', country_id: '', description: '', website_url: '' });

  const reload = async () => {
    try {
      const cId = countryFilter === 'all' ? '' : countryFilter;
      const data = await list(q, cId);
      setTeams(Array.isArray(data) ? data : []);
      const memberPromises = (Array.isArray(data) ? data : []).map(t =>
        getMembers(t.id).then(m => [t.id, m]).catch(() => [t.id, []])
      );
      const results = await Promise.all(memberPromises);
      setMembersMap(Object.fromEntries(results));
    } catch {
      setTeams([]);
    }
  };

  useEffect(() => { reload(); }, [countryFilter]); // eslint-disable-line

  useEffect(() => {
    let alive = true;
    if (isAuthenticated) {
      api('/teams/status').then(st => {
        if (!alive) return;
        setStatus({
          ownsTeam: Boolean(st?.ownedTeamId),
          ownedTeamId: st?.ownedTeamId ?? null,
          memberOfTeamId: st?.memberOfTeamId ?? null
        });
      }).catch(() => {});
    }
    return () => { alive = false; };
  }, [isAuthenticated, api]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setCreating(true);
    try {
      const payload = { name: form.name.trim() };
      if (form.country_id) payload.country_id = Number(form.country_id);
      if (form.description) payload.description = form.description.trim();
      if (form.website_url) payload.website_url = form.website_url.trim();
      await create(payload);
      setForm({ name: '', country_id: '', description: '', website_url: '' });
      setCreateSuccess(true);
      await reload();
      setTimeout(() => {
        setCreateSuccess(false);
        setCreateDialogOpen(false);
      }, 1800);
    } catch {
      // error handled by api
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (teamId) => {
    await requestJoin(teamId);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('teams.title')}
        description={t('teams.subtitle')}
        action={isAuthenticated && !status.ownedTeamId && !status.memberOfTeamId && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4" /> {t('teams.create')}
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">{t('teams.createTitle')}</DialogTitle>
              </DialogHeader>

              <AnimatePresence mode="wait">
                {createSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="flex flex-col items-center gap-4 py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
                      className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 stroke-emerald-500" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }} />
                      </svg>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="text-base font-medium text-slate-900 dark:text-slate-100"
                    >
                      {t('teams.feedback.created')}
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={onCreate}
                    className="space-y-4 mt-2"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="create-name">{t('teams.form.name')} *</Label>
                      <Input
                        id="create-name"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="Robotics Club EU..."
                        className="transition-shadow focus:shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="create-country">{t('teams.form.country')}</Label>
                      <Select
                        value={form.country_id}
                        onValueChange={val => setForm({ ...form, country_id: val })}
                        disabled={countriesStatus?.loading}
                      >
                        <SelectTrigger id="create-country">
                          <SelectValue placeholder={countriesStatus?.loading ? t('general.countriesLoading') : t('teams.allCountries')} />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="create-desc">{t('teams.form.description')}</Label>
                      <Textarea
                        id="create-desc"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        placeholder={t('myTeam.overview.noDesc') + '...'}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="create-web">{t('teams.form.website')}</Label>
                      <Input
                        id="create-web"
                        value={form.website_url}
                        onChange={e => setForm({ ...form, website_url: e.target.value })}
                        placeholder="https://..."
                        type="url"
                      />
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                        {t('actions.cancel')}
                      </Button>
                      <motion.div whileTap={{ scale: 0.96 }}>
                        <Button type="submit" disabled={creating} className="min-w-[120px]">
                          {creating ? (
                            <span className="flex items-center gap-2">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                              {t('buttons.creating')}
                            </span>
                          ) : t('teams.create')}
                        </Button>
                      </motion.div>
                    </DialogFooter>
                  </motion.form>
                )}
              </AnimatePresence>
            </DialogContent>
          </Dialog>
        )}
      />

      {/* Search / Filter */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="flex gap-2 flex-wrap"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('teams.searchPlaceholder')}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && reload()}
            className="pl-9"
          />
        </div>
        <div className="w-[180px]">
          <Select value={countryFilter} onValueChange={setCountryFilter} disabled={countriesStatus?.loading}>
            <SelectTrigger>
              <SelectValue placeholder={t('teams.allCountries')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('teams.allCountries')}</SelectItem>
              {countries.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="secondary" onClick={reload}>{t('teams.searchButton')}</Button>
      </motion.div>

      {/* Team grid with stagger */}
      <StaggerContainer className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.07}>
        {teams.map(team => {
          const memberCount = membersMap[team.id]?.length || 0;
          const isMyTeam = status.ownedTeamId === team.id || status.memberOfTeamId === team.id;
          const isMember = Boolean(status.ownedTeamId || status.memberOfTeamId);
          return (
            <StaggerItem key={team.id}>
              <TiltCard>
              <div className="group flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700">
                {/* Card top accent */}
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-5 flex-1 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-base">{team.name}</h3>
                      {team.city && (
                        <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" /> {team.city}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {memberCount}
                    </Badge>
                  </div>

                  {/* Description */}
                  {team.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-1">{team.description}</p>
                  )}

                  {/* Website */}
                  {team.website_url && (
                    <a
                      href={team.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400 w-fit"
                    >
                      <Globe className="h-3 w-3" /> Website
                    </a>
                  )}
                </div>

                {/* Footer action */}
                <div className="px-5 pb-5">
                  {isAuthenticated ? (
                    isMyTeam ? (
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="outline" className="w-full" asChild>
                          <Link to="/my-team">
                            <Check className="h-4 w-4 mr-2 text-emerald-500" />
                            {t('teams.manage')}
                          </Link>
                        </Button>
                      </motion.div>
                    ) : (
                      <JoinButton
                        teamId={team.id}
                        onJoin={handleJoin}
                        disabled={isMember}
                        label={t('teams.requestJoin')}
                        successLabel={t('teams.feedback.requestSent')}
                      />
                    )
                  ) : (
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="ghost" className="w-full gap-2" asChild>
                        <Link to="/login">
                          <LogIn className="h-4 w-4" /> {t('teams.loginToJoin')}
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
              </TiltCard>
            </StaggerItem>
          );
        })}

        {teams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-full text-center py-16 text-slate-400 dark:text-slate-500"
          >
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{t('teams.noTeams')}</p>
          </motion.div>
        )}
      </StaggerContainer>
    </div>
  );
};

export default Teams;
