import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';

const Archive = () => {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    const isAdmin = useMemo(() => user?.role === 'admin' || user?.role === 'super_admin', [user?.role]);

    const [items, setItems] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [selectedCompetition, setSelectedCompetition] = useState('');
    const [status, setStatus] = useState({ loading: true, error: '' });
    const [uploadStatus, setUploadStatus] = useState({ loading: false, error: '', ok: '' });
    const [deleteStatus, setDeleteStatus] = useState({ loadingId: null, error: '' });
    const [form, setForm] = useState({ 
        title: '', 
        description: '', 
        content_type: 'text',
        visibility: 'public',
        competition_id: '',
        file: null 
    });

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

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploadStatus({ loading: true, error: '', ok: '' });

        if (!form.title?.trim()) {
            setUploadStatus({ loading: false, error: t('archives.titleRequired') || 'El título es obligatorio', ok: '' });
            return;
        }

        try {
            const fd = new FormData();
            fd.append('title', form.title.trim());
            if (form.description?.trim()) fd.append('description', form.description.trim());
            fd.append('content_type', form.content_type);
            fd.append('visibility', form.visibility);
            if (form.competition_id) fd.append('competition_id', form.competition_id);
            if (form.file) fd.append('file', form.file);

            const created = await apiRequest('/archives', {
                method: 'POST',
                body: fd,
                formData: true
            });

            setItems((prev) => [created, ...prev]);
            setForm({ title: '', description: '', content_type: 'text', visibility: 'public', competition_id: '', file: null });
            setUploadStatus({ loading: false, error: '', ok: t('archives.messages.created') || 'Elemento creado correctamente' });
        } catch (e2) {
            setUploadStatus({ loading: false, error: e2?.message || 'Error', ok: '' });
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        if (!window.confirm(t('actions.confirmDelete') || '¿Estás seguro de eliminar este registro?')) return;
        
        setDeleteStatus({ loadingId: id, error: '' });
        try {
            await apiRequest(`/archives/${id}`, { method: 'DELETE' });
            setItems((prev) => prev.filter((it) => it.id !== id));
        } catch (e) {
            setDeleteStatus({ loadingId: null, error: e?.message || 'Error' });
            return;
        }
        setDeleteStatus({ loadingId: null, error: '' });
    };

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
                {/* Admin upload form */}
                {isAuthenticated && isAdmin && (
                    <form onSubmit={handleUpload} className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50 sm:p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                            {t('archives.actions.create')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('archives.fields.title')} *
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, title: ev.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('archives.fields.competition')}
                                </label>
                                <select
                                    value={form.competition_id}
                                    onChange={(e) => setForm((p) => ({ ...p, competition_id: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                >
                                    <option value="">{t('archives.filters.competitionAll')}</option>
                                    {competitions.map((comp) => (
                                        <option key={comp.id} value={comp.id}>{comp.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('archives.contentType.label') || 'Tipo de contenido'}
                                </label>
                                <select
                                    value={form.content_type}
                                    onChange={(e) => setForm((p) => ({ ...p, content_type: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                >
                                    <option value="text">{t('archives.contentType.text')}</option>
                                    <option value="file">{t('archives.contentType.file')}</option>
                                    <option value="mixed">{t('archives.contentType.mixed')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('archives.fields.visibility')}
                                </label>
                                <select
                                    value={form.visibility}
                                    onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                >
                                    <option value="public">{t('archives.visibility.public')}</option>
                                    <option value="hidden">{t('archives.visibility.hidden')}</option>
                                    <option value="restricted">{t('archives.visibility.restricted')}</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('archives.fields.description')}
                                </label>
                                <textarea
                                    value={form.description}
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, description: ev.target.value }))}
                                />
                            </div>

                            {(form.content_type === 'file' || form.content_type === 'mixed') && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {t('archives.fields.file')}
                                    </label>
                                    <input
                                        type="file"
                                        className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:file:bg-slate-800 dark:file:text-slate-50 dark:hover:file:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                        onChange={(ev) => setForm((p) => ({ ...p, file: ev.target.files?.[0] || null }))}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
                            <button
                                type="submit"
                                disabled={uploadStatus.loading}
                                className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            >
                                {uploadStatus.loading ? (t('common.loading')) : (t('actions.save'))}
                            </button>

                            <div className="text-sm">
                                {uploadStatus.error && <span className="text-red-600" role="alert">{uploadStatus.error}</span>}
                                {!uploadStatus.error && uploadStatus.ok && <span className="text-green-700" role="status">{uploadStatus.ok}</span>}
                            </div>
                        </div>
                    </form>
                )}

                {status.loading && <p className="text-slate-600">{t('common.loading')}</p>}
                {!status.loading && status.error && <p className="text-red-600" role="alert">{status.error}</p>}

                {!status.loading && !status.error && (
                    <div className="space-y-4">
                        {items.length === 0 && (
                            <p className="text-center text-slate-500 py-8">{t('charts.empty')}</p>
                        )}
                        
                        {items.map((item) => (
                            <div 
                                key={item.id} 
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                                                {item.title}
                                            </h3>
                                            {getContentTypeBadge(item.content_type)}
                                            {getVisibilityBadge(item.visibility)}
                                        </div>
                                        
                                        {item.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                {item.description}
                                            </p>
                                        )}
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                            {item.Competition && (
                                                <span className="inline-flex items-center gap-1">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                                    
                                    {isAuthenticated && isAdmin && (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deleteStatus.loadingId === item.id}
                                            className="shrink-0 inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                        >
                                            {deleteStatus.loadingId === item.id ? '...' : t('actions.delete')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {deleteStatus.error && (
                    <p className="mt-4 text-red-600 text-sm" role="alert">{deleteStatus.error}</p>
                )}
            </section>
        </div>
    );
};

export default Archive;
