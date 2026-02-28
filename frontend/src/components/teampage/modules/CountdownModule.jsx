import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/apiClient';
import { Clock, MapPin } from 'lucide-react';

function pad(n) { return String(n).padStart(2, '0'); }

function getCountdown(targetDate) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days:    Math.floor(s / 86400),
    hours:   Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function CountdownModule({ team, config = {}, accentColor }) {
  const { label = 'Próxima competición' } = config;
  const accent    = accentColor || '#18181b';
  const [nextComp, setNextComp]   = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!team?.id) { setLoading(false); return; }
    apiRequest(`/registrations?team_id=${team.id}&status=approved`)
      .then(data => {
        const regs = Array.isArray(data) ? data : [];
        const future = regs
          .filter(r => r.competition?.start_date && new Date(r.competition.start_date) > new Date())
          .sort((a, b) => new Date(a.competition.start_date) - new Date(b.competition.start_date));
        setNextComp(future[0]?.competition || null);
      })
      .catch(() => setNextComp(null))
      .finally(() => setLoading(false));
  }, [team?.id]);

  useEffect(() => {
    if (!nextComp?.start_date) return;
    const update = () => setCountdown(getCountdown(nextComp.start_date));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [nextComp]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 animate-pulse">
        <div className="h-3 bg-zinc-100 rounded w-1/3 mx-auto mb-5" />
        <div className="flex gap-3 justify-center">
          {[0,1,2,3].map(i => <div key={i} className="w-16 h-16 bg-zinc-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!nextComp || !countdown) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <Clock className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm text-zinc-500 font-medium">{label}</p>
        <p className="text-xs text-zinc-400 mt-1">Sin próximas competiciones aprobadas</p>
      </div>
    );
  }

  const units = [
    { value: countdown.days,    label: 'días' },
    { value: countdown.hours,   label: 'horas' },
    { value: countdown.minutes, label: 'min' },
    { value: countdown.seconds, label: 'seg' },
  ];

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <div className="p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
          {label}
        </p>
        <h3 className="font-bold text-zinc-900 mb-5 text-base">
          {nextComp.title}
        </h3>

        <div className="flex gap-3 justify-center">
          {units.map(({ value, label: unitLabel }) => (
            <div key={unitLabel} className="flex flex-col items-center gap-1.5">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-mono font-bold text-white shadow-sm tabular-nums"
                style={{ backgroundColor: accent }}
              >
                {pad(value)}
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">{unitLabel}</p>
            </div>
          ))}
        </div>

        {nextComp.start_date && (
          <p className="mt-4 text-xs text-zinc-400">
            {new Date(nextComp.start_date).toLocaleDateString('es-ES', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        )}

        {nextComp.location && (
          <p className="mt-1 text-xs text-zinc-400 flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            {nextComp.location}
          </p>
        )}
      </div>
    </div>
  );
}
