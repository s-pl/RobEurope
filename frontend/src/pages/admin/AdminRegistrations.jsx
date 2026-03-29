import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ReasonDialog } from '../../components/ui/reason-dialog';
import { Check, X, Clock, ClipboardList, Search, Filter } from 'lucide-react';

/* ── helpers ── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

const StatusBadge = ({ status, t }) => {
  const map = {
    pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', Icon: Clock, label: t('admin.registrations.statusPending') },
    approved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', Icon: Check, label: t('admin.registrations.statusApproved') },
    rejected: { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', Icon: X, label: t('admin.registrations.statusRejected') },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border ${s.cls}`}>
      <s.Icon className="h-3 w-3" />{s.label}
    </span>
  );
};

export default function AdminRegistrations() {
  const { t } = useTranslation();
  const api = useApi();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    api(`/admin/registrations${qs}`).then(setRows).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r =>
      !q ||
      (r.Team?.name || '').toLowerCase().includes(q) ||
      (r.Competition?.title || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const approve = async (id) => {
    setActing(id);
    try {
      await api(`/admin/registrations/${id}/approve`, { method: 'POST' });
      load();
    } finally { setActing(null); }
  };

  const reject = async (reason) => {
    if (!rejectTarget) return;
    setActing(rejectTarget.id);
    try {
      await api(`/admin/registrations/${rejectTarget.id}/reject`, { method: 'POST', body: { reason } });
      setRejectTarget(null);
      load();
    } finally { setActing(null); }
  };

  const tabs = [
    { key: 'all', label: t('admin.registrations.tabAll') },
    { key: 'pending', label: t('admin.registrations.tabPending') },
    { key: 'approved', label: t('admin.registrations.tabApproved') },
    { key: 'rejected', label: t('admin.registrations.tabRejected') },
  ];

  const pending = rows.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-4xl font-black tracking-tighter text-stone-900 dark:text-stone-50">{t('admin.registrations.title')}</h1>
          {pending > 0 && (
            <span className="flex items-center justify-center h-6 min-w-6 px-1.5 text-xs font-bold bg-amber-500 text-white">
              {pending}
            </span>
          )}
        </div>
        <div className="h-1 w-12 bg-stone-900 dark:bg-stone-50" />
        <p className="text-sm text-stone-500 dark:text-stone-400">{t('admin.registrations.counter', { count: rows.length })}</p>
      </div>
      <div className="h-px bg-stone-200 dark:bg-stone-800" />

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setStatusFilter(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === t.key
                  ? 'border-stone-900 dark:border-stone-50 text-stone-900 dark:text-stone-50'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <Input className="pl-8 h-8 text-sm w-48" placeholder={t('admin.registrations.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-stone-100 dark:bg-stone-800 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ delay: i * 0.02 }}
                className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 p-4 flex flex-wrap gap-4 items-start justify-between">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-900 dark:text-stone-50">{r.Team?.name ?? (r.team_id ? `#${r.team_id}` : '—')}</span>
                    <StatusBadge status={r.status} t={t} />
                  </div>
                  <div className="text-sm text-stone-500">
                    {t('admin.registrations.labelCompetition')} <span className="font-medium text-stone-700 dark:text-stone-300">{r.Competition?.title ?? `#${r.competition_id}`}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-stone-400">
                    <span>{t('admin.registrations.labelRegistration')} {fmt(r.registration_date)}</span>
                    {r.Competition?.start_date && <span>{t('admin.registrations.labelCompetitionDate')} {fmt(r.Competition.start_date)}</span>}
                  </div>
                  {r.decision_reason && (
                    <p className="text-xs text-stone-500 italic">"{r.decision_reason}"</p>
                  )}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" disabled={acting === r.id} onClick={() => approve(r.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                      <Check className="h-3.5 w-3.5 mr-1" />{t('admin.registrations.btnApprove')}
                    </Button>
                    <Button size="sm" variant="outline" disabled={acting === r.id} onClick={() => setRejectTarget(r)}
                      className="text-red-600 border-red-200 hover:bg-red-50">
                      <X className="h-3.5 w-3.5 mr-1" />{t('admin.registrations.btnReject')}
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-stone-400">
              <ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>{t('admin.registrations.empty')}</p>
            </div>
          )}
        </div>
      )}

      <ReasonDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title={t('admin.registrations.rejectTitle')}
        description={t('admin.registrations.rejectDescription', { name: rejectTarget?.Team?.name })}
        onConfirm={reject}
      />
    </div>
  );
}
