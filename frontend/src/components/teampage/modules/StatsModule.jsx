import { Users, Trophy, CheckCircle2, Clock } from 'lucide-react';

const ITEMS = [
  { key: 'memberCount',     label: 'Miembros',      Icon: Users },
  { key: 'competitionCount',label: 'Competiciones', Icon: Trophy },
  { key: 'approvedCount',   label: 'Aprobadas',     Icon: CheckCircle2 },
  { key: 'activeCount',     label: 'Pendientes',    Icon: Clock },
];

export default function StatsModule({ team, stats = {}, accentColor }) {
  const accent = accentColor || '#18181b';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ITEMS.map(({ key, label, Icon }) => {
        const val = stats[key] ?? team?.[key] ?? 0;
        return (
          <div
            key={key}
            className="rounded-xl border border-zinc-200 bg-white p-4"
            style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
          >
            <Icon className="h-4 w-4 text-zinc-400 mb-2" />
            <p className="text-2xl font-mono font-bold text-zinc-900 tabular-nums">{val}</p>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">{label}</p>
          </div>
        );
      })}
    </div>
  );
}
