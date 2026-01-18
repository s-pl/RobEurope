import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStreams } from '../hooks/useStreams';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Eye, Building2 } from 'lucide-react';

const Streams = () => {
  const { t } = useTranslation();
  const { streams, loading, error } = useStreams();

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

  const getStatusBadge = (status) => {
    const variants = {
      live: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
      offline: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
      scheduled: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    };

    const labels = {
      live: t('streams.status.live'),
      offline: t('streams.status.offline'),
      scheduled: t('streams.status.scheduled'),
    };

    return (
      <Badge variant="outline" className={variants[status] || variants.offline}>
        {labels[status] || t('streams.status.offline')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-slate-600 dark:text-slate-400">{t('streams.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600 dark:text-red-400">{t('streams.error')} {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">{t('streams.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">{t('streams.subtitle')}</p>
        </div>
      </div>

      {streamsByCenter.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('streams.noStreams') || 'No hay streams disponibles.'}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {streamsByCenter.map((group) => (
            <div key={group.center.id || 'none'} className="space-y-4">
              {/* Center Header */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {group.center.name}
                </h2>
                <Badge variant="outline" className="ml-2">
                  {group.streams.length} {group.streams.length === 1 ? 'stream' : 'streams'}
                </Badge>
              </div>

              {/* Streams Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {group.streams.map((stream) => (
                  <Card key={stream.id} className="hover:shadow-lg transition-shadow border-blue-200 dark:border-slate-700">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-blue-900 dark:text-blue-100">{stream.title}</CardTitle>
                          <div className="mt-2">
                            {getStatusBadge(stream.status)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stream.description && (
                        <p className="text-slate-600 dark:text-slate-400 mb-4">{stream.description}</p>
                      )}

                      <div className="mb-4">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{t('streams.team')}:</span> {stream.team?.name || 'N/A'}
                        </p>
                        {stream.competition && (
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span className="font-semibold">{t('streams.competition')}:</span> {stream.competition.title}
                          </p>
                        )}
                      </div>

                      {stream.stream_url && (
                        <div className="mb-4">
                          <a
                            href={stream.stream_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            {t('streams.watch')}
                          </a>
                        </div>
                      )}

                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        <p>{t('streams.created') || 'Creado'}: {new Date(stream.created_at).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Streams;