import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/apiClient';

function pad(n) { return String(n).padStart(2, '0'); }

function getCountdown(targetDate) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60
  };
}

export default function CountdownModule({ team, config = {}, accentColor }) {
  const accent = accentColor || '#2563eb';
  const [nextComp, setNextComp] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team?.id) { setLoading(false); return; }
    apiRequest(`/registrations?team_id=${team.id}&status=approved`)
      .then(data => {
        const regs = Array.isArray(data) ? data : [];
        // Find the next upcoming competition
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
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mx-auto mb-4" />
        <div className="flex gap-4 justify-center">
          {[0,1,2,3].map(i => <div key={i} className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!nextComp || !countdown) {
    return (
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-400">
        <p className="text-3xl mb-2">⏳</p>
        <p className="text-sm">Sin próximas competiciones</p>
      </div>
    );
  }

  const units = [
    { value: countdown.days, label: 'días' },
    { value: countdown.hours, label: 'horas' },
    { value: countdown.minutes, label: 'min' },
    { value: countdown.seconds, label: 'seg' }
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent}15 0%, ${accent}30 100%)`,
        border: `1px solid ${accent}40`
      }}
    >
      <div className="p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: accent }}>
          ⏳ {config.label || 'Próxima competición'}
        </p>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 text-lg">
          {nextComp.title}
        </h3>

        <div className="flex gap-3 justify-center">
          {units.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
                style={{ background: accent }}
              >
                {pad(value)}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {nextComp.start_date && (
          <p className="mt-4 text-xs text-slate-500">
            {new Date(nextComp.start_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  );
}
