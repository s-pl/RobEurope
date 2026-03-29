import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ScrollText, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

const fmt = (d) => d ? new Date(d).toLocaleString('es-ES') : '—';

const ACTION_COLORS = {
  CREATE:   'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
  UPDATE:   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  DELETE:   'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400',
  LOGIN:    'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400',
  LOGOUT:   'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400',
  REGISTER: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400',
  UPLOAD:   'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  DOWNLOAD: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  ROLE_CHANGED: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300',
};

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER', 'UPLOAD', 'ROLE_CHANGED'];
const ENTITIES = ['User', 'Team', 'Post', 'Competition', 'Registration', 'TeamMember', 'System'];

const ActionBadge = ({ action }) => (
  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium border ${ACTION_COLORS[action] ?? ACTION_COLORS.UPDATE}`}>
    {action}
  </span>
);

export default function AdminLogs() {
  const { t } = useTranslation();
  const api = useApi();
  const [data, setData] = useState({ rows: [], total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page, limit: 50 });
    if (actionFilter) qs.set('action', actionFilter);
    if (entityFilter) qs.set('entity_type', entityFilter);
    api(`/admin/logs?${qs}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, actionFilter, entityFilter]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [actionFilter, entityFilter]);

  const selClass = "border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 px-3 py-1.5 text-sm focus:outline-none focus:border-stone-900 dark:focus:border-stone-50";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-4xl font-black tracking-tighter text-stone-900 dark:text-stone-50">{t('admin.logs.title')}</h1>
        <div className="h-1 w-12 bg-stone-900 dark:bg-stone-50" />
        <p className="text-sm text-stone-500 dark:text-stone-400">{data.total.toLocaleString()} entradas en total</p>
      </div>
      <div className="h-px bg-stone-200 dark:bg-stone-800" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className={selClass}>
          <option value="">{t('admin.logs.filterAllActions')}</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className={selClass}>
          <option value="">{t('admin.logs.filterAllEntities')}</option>
          {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        {(actionFilter || entityFilter) && (
          <button onClick={() => { setActionFilter(''); setEntityFilter(''); }}
            className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-50 underline">
            {t('admin.logs.clearFilters')}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-1">{[...Array(10)].map((_, i) => <div key={i} className="h-12 bg-stone-100 dark:bg-stone-800 animate-pulse" />)}</div>
      ) : (
        <>
          <div className="border-2 border-stone-200 dark:border-stone-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
                  <th className="text-left px-3 py-2.5 font-semibold text-stone-600 dark:text-stone-400">{t('admin.logs.columnAction')}</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-stone-600 dark:text-stone-400">{t('admin.logs.columnEntity')}</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-stone-600 dark:text-stone-400 hidden md:table-cell">{t('admin.logs.columnUser')}</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-stone-600 dark:text-stone-400 hidden lg:table-cell">{t('admin.logs.columnDetail')}</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-stone-600 dark:text-stone-400">{t('admin.logs.columnDate')}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {data.rows.map((log, i) => (
                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/20 transition-colors">
                      <td className="px-3 py-2.5"><ActionBadge action={log.action} /></td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-stone-700 dark:text-stone-300">{log.entity_type}</div>
                        {log.entity_id && <div className="text-stone-400 font-mono">{String(log.entity_id).slice(0, 8)}</div>}
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell text-stone-500">
                        {log.user ? (
                          <div>
                            <div className="font-medium">@{log.user.username}</div>
                            <div className="text-stone-400">{log.ip_address}</div>
                          </div>
                        ) : log.ip_address ? log.ip_address : '—'}
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell text-stone-500 max-w-xs truncate" title={log.details}>
                        {log.details ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-stone-400 whitespace-nowrap">{fmt(log.created_at)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {data.rows.length === 0 && (
              <div className="py-12 text-center text-stone-400">
                <ScrollText className="h-7 w-7 mx-auto mb-2 opacity-40" />
                <p>{t('admin.logs.empty')}</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">Página {data.page} de {data.pages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= data.pages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
