import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { AdaptiveModal, AdaptiveModalContent, AdaptiveModalFooter } from '../../components/ui/adaptive-modal';
import { resolveMediaUrl } from '../../lib/apiClient';
import {
  Users2, Search, Trash2, MapPin, Trophy, Crown,
  User, Calendar, Globe, Building2, ChevronRight,
} from 'lucide-react';

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

const Avatar = ({ src, name, size = 8 }) => {
  const initials = (name || '??').slice(0, 2).toUpperCase();
  return src
    ? <img src={resolveMediaUrl(src)} alt={name} className={`h-${size} w-${size} object-cover shrink-0`} />
    : <div className={`h-${size} w-${size} shrink-0 flex items-center justify-center bg-stone-200 dark:bg-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300`}>{initials}</div>;
};

const StatusBadge = ({ status }) => {
  const map = { draft: 'text-stone-500', published: 'text-emerald-600 dark:text-emerald-400', archived: 'text-stone-400' };
  return <span className={`text-xs font-medium ${map[status] ?? 'text-stone-500'}`}>{status}</span>;
};

/* ── Team detail modal ── */
const TeamDetail = ({ team: tm, onClose, onDelete }) => {
  const { t } = useTranslation();
  const activeMembers = tm.TeamMembers ?? [];

  return (
    <AdaptiveModal open onOpenChange={onClose}>
      <AdaptiveModalContent title={tm.name} description={[tm.city, tm.Country?.name].filter(Boolean).join(' · ')}>
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Avatar src={tm.logo_url} name={tm.name} size={16} />
            <div className="space-y-1">
              {tm.institution && <div className="flex items-center gap-1.5 text-sm text-stone-500"><Building2 className="h-3.5 w-3.5" />{tm.institution}</div>}
              {tm.website_url && <a href={tm.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"><Globe className="h-3.5 w-3.5" />{tm.website_url}</a>}
              <div className="flex items-center gap-1.5 text-xs text-stone-400"><Calendar className="h-3 w-3" />{fmt(tm.created_at)}</div>
            </div>
          </div>

          {tm.description && <p className="text-sm text-stone-500 dark:text-stone-400">{tm.description}</p>}

          {/* Members */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">{t('myTeam.members.title')} ({activeMembers.length})</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {activeMembers.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-1">
                  <Avatar src={m.user?.profile_photo_url} name={m.user?.first_name} size={7} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-stone-900 dark:text-stone-50">{m.user?.first_name} {m.user?.last_name}</span>
                    <span className="ml-1 text-xs text-stone-400">@{m.user?.username}</span>
                  </div>
                  {m.role === 'owner' && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  <span className="text-xs text-stone-400 shrink-0">{m.role}</span>
                </div>
              ))}
              {activeMembers.length === 0 && <p className="text-sm text-stone-400">{t('admin.teams.noMembers')}</p>}
            </div>
          </div>

          {/* Registrations */}
          {tm.registrations?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">{t('nav.competitions')} ({tm.registrations.length})</h3>
              <div className="space-y-1">
                {tm.registrations.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-0.5">
                    <span className="text-stone-700 dark:text-stone-300">{r.Competition?.title ?? `#${r.competition_id}`}</span>
                    <span className={`text-xs font-medium ${
                      r.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400'
                      : r.status === 'rejected' ? 'text-red-500'
                      : 'text-amber-600'
                    }`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <AdaptiveModalFooter>
          <Button variant="outline" size="sm" onClick={onClose}>{t('common.close')}</Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(tm)}
            className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5 mr-1" />{t('common.delete')} {t('nav.teams').toLowerCase().slice(0, -1)}
          </Button>
        </AdaptiveModalFooter>
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
};

/* ── Main ── */
export default function AdminTeams() {
  const { t } = useTranslation();
  const api = useApi();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    api('/admin/teams').then(setTeams).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return teams.filter(t =>
      !q || (t.name || '').toLowerCase().includes(q) || (t.institution || '').toLowerCase().includes(q)
    );
  }, [teams, search]);

  const handleDelete = async () => {
    await api(`/admin/teams/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    setSelected(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-4xl font-black tracking-tighter text-stone-900 dark:text-stone-50">{t('admin.teams.title')}</h1>
        <div className="h-1 w-12 bg-stone-900 dark:bg-stone-50" />
        <p className="text-sm text-stone-500 dark:text-stone-400">{teams.length} equipos registrados</p>
      </div>
      <div className="h-px bg-stone-200 dark:bg-stone-800" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
        <Input className="pl-8 h-8 text-sm" placeholder={t('admin.teams.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-stone-100 dark:bg-stone-800 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence initial={false}>
            {filtered.map((t, i) => {
              const activeMembers = (t.TeamMembers ?? []).filter(m => !m.left_at);
              const registrations = t.registrations ?? [];
              const pending = registrations.filter(r => r.status === 'pending').length;

              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 p-4 cursor-pointer hover:border-stone-400 dark:hover:border-stone-600 transition-colors"
                  onClick={() => setSelected(t)}>
                  <div className="flex items-start gap-3">
                    <Avatar src={t.logo_url} name={t.name} size={10} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-stone-900 dark:text-stone-50 truncate">{t.name}</span>
                        <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />
                      </div>
                      {t.institution && <div className="text-xs text-stone-500 truncate">{t.institution}</div>}
                      <div className="flex items-center gap-3 text-xs text-stone-400">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{activeMembers.length} miembros</span>
                        {registrations.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />{registrations.length} comp.
                            {pending > 0 && <span className="text-amber-500 font-medium">({pending} pend.)</span>}
                          </span>
                        )}
                        {t.Country && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.Country.name}</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="col-span-2 py-16 text-center text-stone-400">
              <Users2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>{t('admin.teams.empty')}</p>
            </div>
          )}
        </div>
      )}

      {selected && (
        <TeamDetail
          team={selected}
          onClose={() => setSelected(null)}
          onDelete={(t) => { setDeleteTarget(t); setSelected(null); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="¿Eliminar equipo?"
        description={`Se eliminará permanentemente "${deleteTarget?.name}" con todos sus datos. Esta acción no se puede deshacer.`}
        confirmText={t('common.delete')}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
