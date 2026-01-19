import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';

const Archive = () => {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
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
      const url = selectedCompetition
        ? `archives?competition_id=${selectedCompetition}`
        : 'archives';
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
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[visibility] || styles.hidden}`}>
        {t(`archives.visibility.${visibility}`) || visibility}
      </span>
    );
  };

  const getContentTypeBadge = (contentType) => {
    const styles = {
      file: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      text: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      mixed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[contentType] || styles.text}`}>
        {t(`archives.contentType.${contentType}`) || contentType}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-blue-900 sm:text-4xl lg:text-5xl dark:text-blue-100">
          {t('archives.title')}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
          {t('archives.description')}
        </p>
      </header>

      {/* Filtro por competición */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('archives.fields.competition')}:
        </label>
        <select
          value={selectedCompetition}
          onChange={(e) => setSelectedCompetition(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <option value="">{t('archives.filters.competitionAll')}</option>
          {competitions.map((comp) => (
            <option key={comp.id} value={comp.id}>{comp.title}</option>
          ))}
        </select>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6 lg:p-8">
        {status.loading && (
          <p className="text-sm text-slate-500">{t('common.loading') || 'Cargando...'}</p>
        )}

        {status.error && (
          <p className="text-sm text-red-600" role="alert">{status.error}</p>
        )}

        {!status.loading && !status.error && items.length === 0 && (
          <p className="text-sm text-slate-500">{t('archives.empty') || 'No hay archivos'}</p>
        )}

        {!status.loading && !status.error && items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {item.title}
                  </h3>
                  {getVisibilityBadge(item.visibility)}
                  {getContentTypeBadge(item.content_type)}
                </div>

                {item.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {item.Competition?.title && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h2" />
                      </svg>
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
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {item.file_name || t('archives.actions.download')}
                    </a>
                  )}
                  <span>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Archive;
