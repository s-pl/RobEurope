import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/apiClient';
import { Award, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react';

const STATUS_META = {
  approved: { label: 'Aprobado', Icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' },
  pending:  { label: 'Pendiente', Icon: Clock,        cls: 'text-amber-600  bg-amber-50'   },
  rejected: { label: 'Rechazado', Icon: XCircle,      cls: 'text-red-600    bg-red-50'     },
};

export default function CompetitionsModule({ team, config = {}, accentColor }) {
  const { limit = 8, statusFilter = 'all', showDate = true } = config;
  const accent = accentColor || '#18181b';
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (!team?.id) { setLoading(false); return; }
    apiRequest(`/registrations?team_id=${team.id}`)
      .then(data => setRegistrations(Array.isArray(data) ? data : []))
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, [team?.id]);

  const displayed = registrations
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .slice(0, limit);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-zinc-400" />
          <h3 className="font-semibold text-zinc-900 text-sm">Competiciones</h3>
        </div>
        {statusFilter !== 'all' && STATUS_META[statusFilter] && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_META[statusFilter].cls}`}>
            {STATUS_META[statusFilter].label}
          </span>
        )}
      </div>

      <div className="divide-y divide-zinc-100">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-3 animate-pulse">
              <div className="w-9 h-9 bg-zinc-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-zinc-100 rounded w-2/3" />
                <div className="h-3 bg-zinc-100 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : displayed.length === 0 ? (
          <div className="p-8 text-center">
            <Award className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">
              Sin competiciones{statusFilter !== 'all' ? ` con estado "${STATUS_META[statusFilter]?.label || statusFilter}"` : ''}
            </p>
          </div>
        ) : (
          displayed.map((reg) => {
            const meta       = STATUS_META[reg.status] || STATUS_META.pending;
            const StatusIcon = meta.Icon;
            return (
              <div key={reg.id} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${accent}18` }}
                >
                  <Award className="h-4 w-4" style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {reg.competition?.title || `Competición #${reg.competition_id}`}
                  </p>
                  {showDate && reg.registration_date && (
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(reg.registration_date).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${meta.cls}`}>
                  <StatusIcon className="h-3 w-3" />
                  {meta.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
