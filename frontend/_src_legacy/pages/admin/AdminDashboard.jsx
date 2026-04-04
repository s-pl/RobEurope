import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { motion } from 'framer-motion';
import {
  Users, Trophy, FileText, ClipboardList,
  Database, Radio, Activity,
} from 'lucide-react';

/* ── Helpers ── */
const fmtBytes = (b) => {
  if (!b) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0, v = b;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${units[i]}`;
};

const pct = (used, total) => (total ? Math.round((used / total) * 100) : 0);

/* ── Stat card ── */
const STAT_ACCENTS = [
  'border-l-blue-500',
  'border-l-violet-500',
  'border-l-emerald-500',
  'border-l-amber-500',
];

const StatCard = ({ label, value, Icon, accentClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.25 }}
    className={`bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 border-l-4 ${accentClass} p-5`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">{label}</p>
        <p className="text-4xl font-black font-display tracking-tight text-stone-900 dark:text-stone-50 leading-none">
          {value ?? '—'}
        </p>
      </div>
      <Icon className="h-5 w-5 text-stone-300 dark:text-stone-600 mt-1 shrink-0" />
    </div>
  </motion.div>
);

/* ── Bar gauge ── */
const Gauge = ({ label, used, total, formatFn = String }) => {
  const p = pct(used, total);
  const barColor = p >= 90 ? 'bg-red-500' : p >= 70 ? 'bg-amber-400' : 'bg-emerald-500';
  const textColor = p >= 90 ? 'text-red-600 dark:text-red-400' : p >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${textColor}`}>{p}%</span>
      </div>
      <div className="h-1.5 bg-stone-100 dark:bg-stone-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(p, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full ${barColor}`}
        />
      </div>
      <div className="text-[11px] text-stone-400 tabular-nums">
        {formatFn(used)} / {formatFn(total)}
      </div>
    </div>
  );
};

/* ── Service row ── */
const ServiceRow = ({ up, label }) => (
  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800 last:border-0">
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${up ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <span className="text-sm text-stone-700 dark:text-stone-300">{label}</span>
    </div>
    <span className={`text-[11px] font-bold tracking-widest uppercase ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
      {up ? 'UP' : 'DOWN'}
    </span>
  </div>
);

/* ── Main ── */
export default function AdminDashboard() {
  const { t } = useTranslation();
  const api = useApi();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/admin/stats/overview')
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-black tracking-tighter text-stone-900 dark:text-stone-50">{t('admin.dashboard.title')}</h1>
          <div className="h-1 w-12 bg-stone-900 dark:bg-stone-50" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-stone-100 dark:bg-stone-800 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <div key={i} className="h-44 bg-stone-100 dark:bg-stone-800 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) return <p className="text-red-500 text-sm">Error: {error}</p>;

  const sys = stats?.system;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display text-4xl font-black tracking-tighter text-stone-900 dark:text-stone-50">
          {t('admin.dashboard.title')}
        </h1>
        <div className="h-1 w-12 bg-stone-900 dark:bg-stone-50" />
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {t('admin.dashboard.subtitle')}
          {stats?.timestamp && (
            <span className="ml-2 text-stone-400 dark:text-stone-500">
              · {new Date(stats.timestamp).toLocaleString()}
            </span>
          )}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('admin.dashboard.stats.users')}         value={stats?.users}         Icon={Users}         accentClass={STAT_ACCENTS[0]} delay={0}    />
        <StatCard label={t('admin.dashboard.stats.competitions')}  value={stats?.competitions}  Icon={Trophy}        accentClass={STAT_ACCENTS[1]} delay={0.05} />
        <StatCard label={t('admin.dashboard.stats.posts')}         value={stats?.posts}         Icon={FileText}      accentClass={STAT_ACCENTS[2]} delay={0.1}  />
        <StatCard label={t('admin.dashboard.stats.registrations')} value={stats?.registrations} Icon={ClipboardList} accentClass={STAT_ACCENTS[3]} delay={0.15} />
      </div>

      {/* System */}
      {sys && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 p-5 space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b-2 border-stone-100 dark:border-stone-800">
              <Activity className="h-4 w-4 text-stone-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                {t('admin.dashboard.server.title')}
              </h2>
            </div>
            <div className="space-y-4">
              <Gauge label={t('admin.dashboard.server.cpu')}  used={sys.cpu.load}         total={100}              formatFn={(v) => `${v.toFixed(1)}%`} />
              {sys.memory && <Gauge label={t('admin.dashboard.server.ram')}  used={sys.memory.used}      total={sys.memory.total} formatFn={fmtBytes} />}
              {sys.disk   && <Gauge label={t('admin.dashboard.server.disk')} used={sys.disk.used}        total={sys.disk.size}    formatFn={fmtBytes} />}
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 p-5 space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b-2 border-stone-100 dark:border-stone-800">
              <Database className="h-4 w-4 text-stone-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                {t('admin.dashboard.services.title')}
              </h2>
            </div>
            <div>
              <ServiceRow up={sys.mysql === 'up'} label={t('admin.dashboard.services.mysql')} />
              <ServiceRow up={sys.redis === 'up'} label={t('admin.dashboard.services.redis')} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <Radio className="h-3.5 w-3.5" />
                <span>{t('admin.dashboard.sessions')}</span>
              </div>
              <span className="text-2xl font-black font-display text-stone-900 dark:text-stone-50 leading-none">
                {stats?.activeSessions ?? 0}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
