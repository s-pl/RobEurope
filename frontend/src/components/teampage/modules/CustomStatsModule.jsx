import {
  Trophy, Calendar, Star, Target, Zap, Heart, Flag, Clock,
  Medal, Award, TrendingUp, Users, Cpu, BookOpen, Globe
} from 'lucide-react';

const ICON_MAP = {
  Trophy, Calendar, Star, Target, Zap, Heart, Flag, Clock,
  Medal, Award, TrendingUp, Users, Cpu, BookOpen, Globe,
};

export default function CustomStatsModule({ config = {}, accentColor }) {
  const { items = [] } = config;
  const accent = accentColor || '#18181b';

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
        <Trophy className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm text-zinc-400">Sin cifras configuradas</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <div
        className={`grid gap-px bg-zinc-100 ${
          items.length <= 2 ? 'grid-cols-2' :
          items.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 sm:grid-cols-4'
        }`}
      >
        {items.map((item, i) => {
          const Icon = ICON_MAP[item.icon] || Trophy;
          return (
            <div key={i} className="bg-white px-5 py-5 flex flex-col gap-1">
              <Icon className="h-4 w-4 mb-1" style={{ color: accent }} />
              <p className="text-2xl font-mono font-bold text-zinc-900 tabular-nums leading-none">
                {item.value || '—'}
              </p>
              <p className="text-xs text-zinc-500 font-medium">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
