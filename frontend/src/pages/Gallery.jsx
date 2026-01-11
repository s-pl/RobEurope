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

    return (
        <div>

            <div>
                <h1 className="text-8xl font-bold text-blue-800 mb-2 mt-10 text-center drop-shadow-md">
                    {t("gallery.galleryTitle")}
                </h1>
                <p className="text-blue-600 text-lg mb-10 text-center">
                    {t('gallery.galleryDescription')}
                </p>
            </div>

            <div className="flex justify-center items-start min-h-screen mt-20">

                <div className="bg-blue-200/30 backdrop-blur-md rounded-2xl shadow-lg p-8 md:p-12 w-full max-w-6xl">

                    {isAuthenticated && isAdmin && (
                        <form onSubmit={handleUpload} className="bg-white/80 rounded-xl border border-slate-200 p-4 md:p-6 mb-8">
                            <h2 className="text-xl font-semibold text-blue-800 mb-4">{t('gallery.adminUploadTitle') || 'Subir foto a la galería'}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-sm text-slate-700 mb-1">{t('gallery.uploadImage') || 'Imagen'}</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="block w-full text-sm"
                                        onChange={(ev) => setForm((p) => ({ ...p, file: ev.target.files?.[0] || null }))}
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm text-slate-700 mb-1">{t('gallery.uploadTitle') || 'Título (opcional)'}</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2"
                                        onChange={(ev) => setForm((p) => ({ ...p, title: ev.target.value }))}
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm text-slate-700 mb-1">{t('gallery.uploadDescription') || 'Descripción (opcional)'}</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2"
                                        onChange={(ev) => setForm((p) => ({ ...p, description: ev.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <button
                                    type="submit"
                                    disabled={uploadStatus.loading}
                                    className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold disabled:opacity-60"
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                            {items.map((item) => (
                                <div key={item.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                                    <div className="aspect-square bg-slate-50">
                                        <img
                                            src={resolveMediaUrl(item.url)}
                                            alt={item.title || item.original_name || 'Imagen'}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                    {(item.title || item.description) && (
                                        <div className="p-3">
                                            {item.title && <p className="font-semibold text-slate-900 truncate">{item.title}</p>}
                                            {item.description && <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>

        </div>
    )
}

export default Gallery