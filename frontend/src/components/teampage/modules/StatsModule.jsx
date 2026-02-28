import { Users, Trophy, Star, Activity } from 'lucide-react';

export default function StatsModule({ team, stats = {}, accentColor }) {
  const accent = accentColor || '#2563eb';

  const items = [
    {
      label: 'Miembros',
      value: stats.memberCount ?? team?.memberCount ?? 0,
      Icon: Users,
      color: '#2563eb'
    },
    {
      label: 'Competiciones',
      value: stats.competitionCount ?? 0,
      Icon: Trophy,
      color: '#16a34a'
    },
    {
      label: 'Aprobadas',
      value: stats.approvedCount ?? 0,
      Icon: Star,
      color: '#d97706'
    },
    {
      label: 'Activas',
      value: stats.activeCount ?? 0,
      Icon: Activity,
      color: '#dc2626'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {items.map(({ label, value, Icon, color }) => (
        <div
          key={label}
          className="flex flex-col gap-2 rounded-xl p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow"
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${color}18` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
