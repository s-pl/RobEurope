import { useEffect, useState } from 'react';
import { apiRequest, resolveMediaUrl } from '../../../lib/apiClient';
import { Download, FileText } from 'lucide-react';

export default function RobotsModule({ team, config = {}, accentColor }) {
  const { limit = 4 } = config;
  const accent = accentColor || '#2563eb';
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team?.id) return;
    apiRequest(`/robot-files?team_id=${team.id}&is_public=true&limit=${limit}`)
      .then(data => setRobots(Array.isArray(data) ? data : data?.items || []))
      .catch(() => setRobots([]))
      .finally(() => setLoading(false));
  }, [team?.id, limit]);

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
        <span style={{ color: accent }}>🤖</span>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Robots</h3>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))
        ) : robots.length === 0 ? (
          <div className="col-span-2 py-8 text-center text-slate-400">
            <p className="text-3xl mb-2">🤖</p>
            <p className="text-sm">Sin robots publicados todavía</p>
          </div>
        ) : (
          robots.map((robot) => (
            <div
              key={robot.id}
              className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
                style={{ background: `${accent}18` }}
              >
                🤖
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {robot.name || robot.file_name}
                </p>
                {robot.description && (
                  <p className="text-xs text-slate-500 line-clamp-1">{robot.description}</p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  {robot.file_url && (
                    <a
                      href={resolveMediaUrl(robot.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium hover:underline"
                      style={{ color: accent }}
                    >
                      <Download className="h-3 w-3" /> Descargar
                    </a>
                  )}
                  <span className="text-xs text-slate-400">
                    {robot.file_type?.toUpperCase() || 'FILE'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
