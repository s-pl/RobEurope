import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/apiClient';
import { Trophy, CheckCircle, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  approved: { label: 'Aprobado', icon: CheckCircle, cls: 'text-green-600 bg-green-50 dark:bg-green-950' },
  pending:  { label: 'Pendiente', icon: Clock,       cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950' },
  rejected: { label: 'Rechazado', icon: XCircle,     cls: 'text-red-600 bg-red-50 dark:bg-red-950' }
};

export default function CompetitionsModule({ team, config = {}, accentColor }) {
  const { limit = 5 } = config;
  const accent = accentColor || '#2563eb';
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team?.id) return;
    apiRequest(`/registrations?team_id=${team.id}`)
      .then(data => setRegistrations(Array.isArray(data) ? data.slice(0, limit) : []))
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, [team?.id, limit]);

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
        <span style={{ color: accent }}>🥇</span>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Competiciones</h3>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin competiciones todavía</p>
          </div>
        ) : (
          registrations.map((reg) => {
            const status = STATUS_CONFIG[reg.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            return (
              <div key={reg.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${accent}18` }}
                >
                  🏁
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {reg.competition?.title || `Competición #${reg.competition_id}`}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(reg.registration_date).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.cls}`}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
