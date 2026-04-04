import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStreams } from '../hooks/useStreams';
import { useAuth } from '../hooks/useAuth';
import { Eye, Building2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Streams = () => {
  const { t } = useTranslation();
  const { streams, loading, error } = useStreams();
  const { isAuthenticated } = useAuth();

  // Group streams by educational center
  const streamsByCenter = useMemo(() => {
    const grouped = {};
    const noCenter = { name: t('streams.noCenter') || 'Sin centro educativo', id: null };

    streams.forEach(stream => {
      const center = stream.team?.educationalCenter || stream.team?.EducationalCenter;
      const centerName = center?.name || noCenter.name;
      const centerId = center?.id || 'none';

      if (!grouped[centerId]) {
        grouped[centerId] = {
          center: { name: centerName, id: centerId === 'none' ? null : centerId },
          streams: []
        };
      }
      grouped[centerId].streams.push(stream);
    });

    return Object.values(grouped);
  }, [streams, t]);

  const statusConfig = {
    live:      { dot: 'bg-cyan-500',   label: t('streams.status.live'),      pulse: true },
    offline:   { dot: 'bg-stone-400',  label: t('streams.status.offline'),   pulse: false },
    scheduled: { dot: 'bg-amber-500',  label: t('streams.status.scheduled'), pulse: false },
  };

  const getStatus = (status) => statusConfig[status] || statusConfig.offline;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="pt-2 pb-8">
          <div className="h-8 w-48 bg-stone-100 dark:bg-stone-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="py-5 border-b border-stone-200 dark:border-stone-800">
              <div className="h-5 w-64 bg-stone-100 dark:bg-stone-800 rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto pt-2">
        <p className="text-center text-red-600 dark:text-red-400 py-12">{t('streams.error')} {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="pt-2 pb-8">
        <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">
          {t('streams.title')}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
          {t('streams.subtitle')}
        </p>
      </div>

      {streamsByCenter.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-400 text-sm">{t('streams.noStreams') || 'No hay streams disponibles.'}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {streamsByCenter.map((group, gi) => (
            <motion.div
              key={group.center.id || 'none'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: gi * 0.05 }}
            >
              {/* Center section header */}
              <div className="flex items-center gap-2 pb-3 mb-0 border-b border-stone-200 dark:border-stone-800">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-wider">
                  {group.center.name}
                </h2>
                <span className="text-xs text-stone-400 ml-1">
                  {group.streams.length} {group.streams.length === 1 ? 'stream' : 'streams'}
                </span>
              </div>

              {/* Stream rows */}
              <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                {group.streams.map((stream, si) => {
                  const status = getStatus(stream.status);
                  return (
                    <div
                      key={stream.id}
                      className="flex items-center gap-4 py-4 group"
                    >
                      {/* Status dot */}
                      <div className="shrink-0 relative">
                        <span className={`block w-2.5 h-2.5 rounded-full ${status.dot}`} />
                        {status.pulse && (
                          <span className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${status.dot} animate-ping opacity-75`} />
                        )}
                      </div>

                      {/* Stream info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-stone-900 dark:text-stone-50 truncate">
                            {stream.title}
                          </h3>
                          <span className="text-xs text-stone-400 shrink-0">
                            {status.label}
                          </span>
                        </div>
                        {stream.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                            {stream.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                          <span>{t('streams.team')}: {stream.team?.name || 'N/A'}</span>
                          {stream.competition && (
                            <>
                              <span className="text-stone-300 dark:text-stone-700">|</span>
                              <span>{stream.competition.title}</span>
                            </>
                          )}
                          <span className="text-stone-300 dark:text-stone-700">|</span>
                          <span>{new Date(stream.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Watch link or locked overlay */}
                      <div className="shrink-0">
                        {isAuthenticated ? (
                          stream.stream_url ? (
                            <a
                              href={stream.stream_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {t('streams.watch')}
                            </a>
                          ) : (
                            <span className="text-xs text-stone-400">{t('streams.status.offline')}</span>
                          )
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-400 bg-stone-100 dark:bg-stone-800 dark:text-stone-500">
                            <Lock className="w-3 h-3" />
                            {t('streams.registerToWatch') || 'Register to watch'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Streams;
