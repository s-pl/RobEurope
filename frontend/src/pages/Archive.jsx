import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';
import { PageHeader } from '../components/ui/PageHeader';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Download, Trophy as TrophyIcon, Calendar } from 'lucide-react';

const Archive = () => {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [status, setStatus] = useState({ loading: true, error: '' });

  const loadCompetitions = async () => {
    try {
      const data = await apiRequest('/competitions');
      setCompetitions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading competitions:', e);
    }
  };

  const load = async () => {
    setStatus({ loading: true, error: '' });
    try {
      const url = selectedCompetition && selectedCompetition !== 'all'
        ? `/archives?competition_id=${selectedCompetition}`
        : '/archives';
      const data = await apiRequest(url);
      setItems(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
    } catch (e) {
      setStatus({ loading: false, error: e?.message || 'Error' });
      return;
    }
    setStatus({ loading: false, error: '' });
  };

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompetition]);

  const getVisibilityBadge = (visibility) => {
    const styles = {
      public: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      hidden: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
      restricted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    };
    return (
      <Badge variant="outline" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border-0 ${styles[visibility] || styles.hidden}`}>
        {t(`archives.visibility.${visibility}`) || visibility}
      </Badge>
    );
  };

  const getContentTypeBadge = (contentType) => {
    const styles = {
      file: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      text: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      mixed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    };
    return (
      <Badge variant="outline" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border-0 ${styles[contentType] || styles.text}`}>
        {t(`archives.contentType.${contentType}`) || contentType}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t('archives.title')} description={t('archives.description')} />

      {/* Filtro por competición */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('archives.fields.competition')}:
        </label>
        <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={t('archives.filters.competitionAll')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('archives.filters.competitionAll')}</SelectItem>
            {competitions.map((comp) => (
              <SelectItem key={comp.id} value={String(comp.id)}>{comp.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        {status.loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-0">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-48 rounded" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-2/3 rounded mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!status.loading && status.error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {!status.loading && !status.error && items.length === 0 && (
          <p className="text-sm text-slate-500">{t('archives.empty') || 'No hay archivos'}</p>
        )}

        {!status.loading && !status.error && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-0 overflow-hidden">
                <CardHeader className="pb-2 px-5 pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle as="h3" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {item.title}
                    </CardTitle>
                    {getVisibilityBadge(item.visibility)}
                    {getContentTypeBadge(item.content_type)}
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-5 space-y-3">
                  {item.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {item.Competition?.title && (
                      <span className="inline-flex items-center gap-1">
                        <TrophyIcon className="h-4 w-4" />
                        {item.Competition.title}
                      </span>
                    )}
                    {item.file_url && (
                      <a
                        href={resolveMediaUrl(item.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Download className="h-4 w-4" />
                        {item.file_name || t('archives.actions.download')}
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
