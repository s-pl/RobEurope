import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Download, FileText, FileArchive, File, Calendar, Lock, Globe, EyeOff } from 'lucide-react';

const fileTypeIcon = (name) => {
  if (!name) return File;
  const ext = name.split('.').pop()?.toLowerCase();
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FileArchive;
  if (['pdf', 'doc', 'docx', 'txt', 'odt'].includes(ext)) return FileText;
  return File;
};

const visibilityConfig = {
  public: {
    icon: Globe,
    style: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  },
  restricted: {
    icon: Lock,
    style: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  hidden: {
    icon: EyeOff,
    style: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

const Archive = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'center_admin';

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

  const handleDownload = (item) => {
    if (item.file_url) {
      const link = document.createElement('a');
      link.href = resolveMediaUrl(item.file_url);
      link.download = item.file_name || 'download';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader title={t('archives.title')} description={t('archives.description')} />

      {/* Inline filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
          {t('archives.fields.competition')}:
        </span>
        <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
          <SelectTrigger className="w-56 rounded-xl border-stone-200 dark:border-stone-700">
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

      {/* Loading skeleton rows */}
      {status.loading && (
        <div className="space-y-0 divide-y divide-stone-200 dark:divide-stone-800">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {!status.loading && status.error && (
        <Alert variant="destructive">
          <AlertDescription>{status.error}</AlertDescription>
        </Alert>
      )}

      {!status.loading && !status.error && items.length === 0 && (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <FileText className="h-7 w-7 text-stone-400" />
          </div>
          <p className="font-display font-medium text-stone-900 dark:text-stone-50">
            {t('archives.empty') || 'No hay archivos'}
          </p>
        </div>
      )}

      {/* File list as clean rows */}
      {!status.loading && !status.error && items.length > 0 && (
        <div className="divide-y divide-stone-200 dark:divide-stone-800">
          {items.map((item) => {
            const Icon = fileTypeIcon(item.file_name);
            const visCfg = visibilityConfig[item.visibility] || visibilityConfig.hidden;
            const VisIcon = visCfg.icon;
            return (
              <div key={item.id} className="flex items-center gap-4 py-4 group">
                {/* File type icon */}
                <div className="h-10 w-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-stone-500 dark:text-stone-400" />
                </div>

                {/* Title + description + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-semibold text-stone-900 dark:text-stone-50 truncate">
                      {item.title}
                    </h3>

                    {/* Competition badge - use lowercase 'competition' alias */}
                    {(item.competition?.title || item.Competition?.title) && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        {item.competition?.title || item.Competition?.title}
                      </span>
                    )}

                    {/* Visibility badge - only show to admin users */}
                    {isAdmin && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${visCfg.style}`}>
                        <VisIcon className="h-3 w-3" />
                        {t(`archives.visibility.${item.visibility}`) || item.visibility}
                      </span>
                    )}

                    {/* Restricted indicator for regular users */}
                    {!isAdmin && item.visibility === 'restricted' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Lock className="h-3 w-3" />
                        {t('archives.visibility.restricted') || 'Restringido'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-0.5">
                    {item.description && (
                      <p className="text-sm text-stone-500 dark:text-stone-400 truncate max-w-md">
                        {item.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Download button */}
                {item.file_url && (
                  <button
                    onClick={() => handleDownload(item)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 hover:text-blue-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-200 shrink-0"
                    aria-label={item.file_name || t('archives.actions.download')}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Archive;
