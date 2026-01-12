import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';

const Gallery = () => {

    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    const isAdmin = useMemo(() => user?.role === 'admin' || user?.role === 'super_admin', [user?.role]);

    const [items, setItems] = useState([]);
    const [status, setStatus] = useState({ loading: true, error: '' });
    const [uploadStatus, setUploadStatus] = useState({ loading: false, error: '', ok: '' });
    const [deleteStatus, setDeleteStatus] = useState({ loadingId: null, error: '' });
    const [form, setForm] = useState({ title: '', description: '', file: null });

    const load = async () => {
        setStatus({ loading: true, error: '' });
        try {
            const data = await apiRequest('/gallery');
            setItems(Array.isArray(data?.items) ? data.items : []);
        } catch (e) {
            setStatus({ loading: false, error: e?.message || 'Error' });
            return;
        }
        setStatus({ loading: false, error: '' });
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploadStatus({ loading: true, error: '', ok: '' });

        if (!form.file) {
            setUploadStatus({ loading: false, error: t('gallery.uploadMissingFile') || 'Selecciona una imagen', ok: '' });
            return;
        }

        try {
            const fd = new FormData();
            fd.append('image', form.file);
            if (form.title?.trim()) fd.append('title', form.title.trim());
            if (form.description?.trim()) fd.append('description', form.description.trim());

            const created = await apiRequest('/gallery', {
                method: 'POST',
                body: fd,
                formData: true
            });

            setItems((prev) => [created, ...prev]);
            setForm({ title: '', description: '', file: null });
            setUploadStatus({ loading: false, error: '', ok: t('gallery.uploadOk') || 'Subida correcta' });
        } catch (e2) {
            setUploadStatus({ loading: false, error: e2?.message || 'Error', ok: '' });
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        setDeleteStatus({ loadingId: id, error: '' });
        try {
            await apiRequest(`/gallery/${id}`, { method: 'DELETE' });
            setItems((prev) => prev.filter((it) => it.id !== id));
        } catch (e) {
            setDeleteStatus({ loadingId: null, error: e?.message || 'Error' });
            return;
        }
        setDeleteStatus({ loadingId: null, error: '' });
    };

    return (
        <div className="space-y-8">
            <header className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-blue-900 sm:text-4xl lg:text-5xl dark:text-blue-100">
                    {t('gallery.galleryTitle')}
                </h1>
                <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
                    {t('gallery.galleryDescription')}
                </p>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40 sm:p-6 lg:p-8">

                    {isAuthenticated && isAdmin && (
                        <form onSubmit={handleUpload} className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50 sm:p-6 mb-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">{t('gallery.adminUploadTitle') || 'Subir foto a la galería'}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('gallery.uploadImage') || 'Imagen'}</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:file:bg-slate-800 dark:file:text-slate-50 dark:hover:file:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
                                        onChange={(ev) => setForm((p) => ({ ...p, file: ev.target.files?.[0] || null }))}
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('gallery.uploadTitle') || 'Título (opcional)'}</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
                                        onChange={(ev) => setForm((p) => ({ ...p, title: ev.target.value }))}
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('gallery.uploadDescription') || 'Descripción (opcional)'}</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
                                        onChange={(ev) => setForm((p) => ({ ...p, description: ev.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
                                <button
                                    type="submit"
                                    disabled={uploadStatus.loading}
                                    className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
                                >
                                    {uploadStatus.loading ? (t('gallery.uploading') || 'Subiendo...') : (t('gallery.uploadCta') || 'Subir')}
                                </button>

                                <div className="text-sm">
                                    {uploadStatus.error && <span className="text-red-600" role="alert">{uploadStatus.error}</span>}
                                    {!uploadStatus.error && uploadStatus.ok && <span className="text-green-700" role="status">{uploadStatus.ok}</span>}
                                </div>
                            </div>
                        </form>
                    )}

                    {status.loading && <p className="text-slate-600">{t('gallery.loading') || 'Cargando...'}</p>}
                    {!status.loading && status.error && <p className="text-red-600" role="alert">{status.error}</p>}

                    {!status.loading && !status.error && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                            {items.map((item) => (
                                <div key={item.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                                    <div className="aspect-square bg-slate-50 dark:bg-slate-900">
                                        <img
                                            src={resolveMediaUrl(item.url)}
                                            alt={item.title || item.original_name || 'Imagen'}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                    {(item.title || item.description || (isAuthenticated && isAdmin)) && (
                                        <div className="p-3">
                                            {item.title && <p className="font-semibold text-slate-900 truncate dark:text-slate-50">{item.title}</p>}
                                            {item.description && <p className="text-sm text-slate-600 line-clamp-2 dark:text-slate-400">{item.description}</p>}

                                            {isAuthenticated && isAdmin && (
                                                <div className="mt-3 flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={deleteStatus.loadingId === item.id}
                                                        className="inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    >
                                                        {deleteStatus.loadingId === item.id ? (t('gallery.deleting') || 'Eliminando...') : (t('gallery.delete') || 'Eliminar')}
                                                    </button>

                                                    {deleteStatus.error && (
                                                        <span className="text-xs text-red-600" role="alert">{deleteStatus.error}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

            </section>
        </div>
    )
}

export default Gallery