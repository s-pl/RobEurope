import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { AdaptiveModal, AdaptiveModalContent, AdaptiveModalFooter } from '../../components/ui/adaptive-modal';
import { Textarea } from '../../components/ui/textarea';
import { Trophy, Search, Edit, Calendar, MapPin, Users, Check, Loader2, Save, Globe } from 'lucide-react';

const fmt = (d) => d ? new Date(d).toLocaleDateString('es-ES') : '—';
const fmtInput = (d) => d ? new Date(d).toISOString().slice(0, 10) : '';

const STATUS_COLORS = {
  draft:     'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  archived:  'bg-stone-50 text-stone-400 border-stone-200 dark:bg-stone-900 dark:text-stone-500 dark:border-stone-800',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${STATUS_COLORS[status] ?? STATUS_COLORS.draft}`}>
    {status}
  </span>
);

/* ── Edit modal ── */
const EditModal = ({ comp, onClose, onSave, saving }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title:              comp.title ?? '',
    description:        comp.description ?? '',
    status:             comp.status ?? 'draft',
    location:           comp.location ?? '',
    max_teams:          comp.max_teams ?? '',
    registration_start: fmtInput(comp.registration_start),
    registration_end:   fmtInput(comp.registration_end),
    start_date:         fmtInput(comp.start_date),
    end_date:           fmtInput(comp.end_date),
    rules_url:          comp.rules_url ?? '',
    is_active:          comp.is_active ?? false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const field = (label, key, type = 'text', opts = {}) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-stone-600 dark:text-stone-400">{label}</label>
      <Input type={type} value={form[key]} onChange={e => set(key, e.target.value)} {...opts} />
    </div>
  );

  return (
    <AdaptiveModal open onOpenChange={onClose}>
      <AdaptiveModalContent title={`${t('admin.competitions.form.editPrefix')}: ${comp.title}`} description={`ID #${comp.id}`}>
        <div className="space-y-4 py-1 max-h-[60vh] overflow-y-auto pr-1">
          {field(t('admin.competitions.form.title'), 'title')}
          <div className="space-y-1">
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400">{t('admin.competitions.form.description')}</label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600 dark:text-stone-400">{t('admin.competitions.form.status')}</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 px-3 py-2 text-sm focus:outline-none">
                <option value="draft">{t('admin.competitions.status.draft')}</option>
                <option value="published">{t('admin.competitions.status.published')}</option>
                <option value="archived">{t('admin.competitions.status.archived')}</option>
              </select>
            </div>
            {field(t('admin.competitions.form.location'), 'location')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field(t('admin.competitions.form.maxTeams'), 'max_teams', 'number', { min: 1 })}
            {field(t('admin.competitions.form.rulesUrl'), 'rules_url')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field(t('admin.competitions.form.registrationStart'), 'registration_start', 'date')}
            {field(t('admin.competitions.form.registrationEnd'), 'registration_end', 'date')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field(t('admin.competitions.form.startDate'), 'start_date', 'date')}
            {field(t('admin.competitions.form.endDate'), 'end_date', 'date')}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
              className="h-4 w-4 accent-stone-900" />
            <label htmlFor="is_active" className="text-sm text-stone-700 dark:text-stone-300">{t('admin.competitions.form.isActive')}</label>
          </div>
        </div>
        <AdaptiveModalFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
          <Button onClick={() => onSave(form)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            {t('common.save')}
          </Button>
        </AdaptiveModalFooter>
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
};

/* ── Main ── */
export default function AdminCompetitions() {
  const { t } = useTranslation();
  const api = useApi();
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api('/admin/competitions').then(setComps).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return comps.filter(c => !q || (c.title || '').toLowerCase().includes(q));
  }, [comps, search]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      await api(`/admin/competitions/${editing.id}`, { method: 'PATCH', body: form });
      setEditing(null);
      load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-4xl font-black tracking-tighter text-stone-900 dark:text-stone-50">{t('admin.competitions.title')}</h1>
        <div className="h-1 w-12 bg-stone-900 dark:bg-stone-50" />
        <p className="text-sm text-stone-500 dark:text-stone-400">{t('admin.competitions.count', { n: comps.length })}</p>
      </div>
      <div className="h-px bg-stone-200 dark:bg-stone-800" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
        <Input className="pl-8 h-8 text-sm" placeholder={t('admin.competitions.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-stone-100 dark:bg-stone-800 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((c, i) => {
              const regs = c.registrations ?? [];
              const pending  = regs.filter(r => r.status === 'pending').length;
              const approved = regs.filter(r => r.status === 'approved').length;

              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 p-5">
                  <div className="flex flex-wrap gap-4 items-start justify-between">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-lg text-stone-900 dark:text-stone-50">{c.title}</span>
                        <StatusBadge status={c.status} />
                        {c.is_active && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400">
                            <Check className="h-2.5 w-2.5" />{t('admin.competitions.activeBadge')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-stone-500">
                        {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>}
                        {c.start_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmt(c.start_date)} → {fmt(c.end_date)}</span>}
                        {c.max_teams && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t('admin.competitions.maxTeams', { n: c.max_teams })}</span>}
                        {c.rules_url && <a href={c.rules_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline"><Globe className="h-3 w-3" />{t('admin.competitions.rulesLink')}</a>}
                      </div>
                      {/* Registration summary */}
                      {regs.length > 0 && (
                        <div className="flex gap-3 text-xs">
                          <span className="text-stone-500">{t('admin.competitions.registrations', { n: regs.length })}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">{t('admin.competitions.approved', { n: approved })}</span>
                          {pending > 0 && <span className="text-amber-600 font-medium">{t('admin.competitions.pending', { n: pending })}</span>}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                      <Edit className="h-3.5 w-3.5 mr-1" />{t('common.edit')}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-stone-400">
              <Trophy className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>{t('admin.competitions.empty')}</p>
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditModal comp={editing} onClose={() => setEditing(null)} onSave={handleSave} saving={saving} />
      )}
    </div>
  );
}
