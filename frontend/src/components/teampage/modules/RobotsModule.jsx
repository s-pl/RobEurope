import { useEffect, useState } from 'react';
import { apiRequest, resolveMediaUrl } from '../../../lib/apiClient';
import { Cpu, Download, FileCode2 } from 'lucide-react';

const FILE_COLORS = {
  pdf:   '#ef4444',
  zip:   '#f59e0b',
  rar:   '#f59e0b',
  py:    '#3b82f6',
  cpp:   '#6366f1',
  ino:   '#10b981',
  c:     '#6366f1',
  h:     '#6366f1',
  json:  '#8b5cf6',
  yaml:  '#8b5cf6',
  yml:   '#8b5cf6',
};

export default function RobotsModule({ team, config = {}, accentColor }) {
  const { limit = 6 } = config;
  const accent    = accentColor || '#18181b';
  const [robots, setRobots]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team?.id) { setLoading(false); return; }
    apiRequest(`/robot-files?team_id=${team.id}&is_public=true&limit=${limit}`)
      .then(data => setRobots(Array.isArray(data) ? data : data?.items || []))
      .catch(() => setRobots([]))
      .finally(() => setLoading(false));
  }, [team?.id, limit]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center gap-2">
        <Cpu className="h-4 w-4 text-zinc-400" />
        <h3 className="font-semibold text-zinc-900 text-sm">Archivos del robot</h3>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 bg-zinc-100 rounded-xl animate-pulse" />
          ))
        ) : robots.length === 0 ? (
          <div className="col-span-2 py-8 text-center">
            <Cpu className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Sin archivos publicados todavía</p>
          </div>
        ) : (
          robots.map((robot) => {
            const ext   = (robot.file_type || robot.file_name?.split('.').pop() || '').toLowerCase();
            const color = FILE_COLORS[ext] || '#71717a';
            return (
              <div
                key={robot.id}
                className="flex gap-3 p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all"
              >
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <FileCode2 className="h-5 w-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-zinc-900 truncate">
                    {robot.name || robot.file_name}
                  </p>
                  {robot.description && (
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{robot.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3">
                    {robot.file_url && (
                      <a
                        href={resolveMediaUrl(robot.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium hover:underline"
                        style={{ color: accent }}
                      >
                        <Download className="h-3 w-3" />
                        Descargar
                      </a>
                    )}
                    {ext && (
                      <span
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{ color, backgroundColor: `${color}15` }}
                      >
                        .{ext}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
