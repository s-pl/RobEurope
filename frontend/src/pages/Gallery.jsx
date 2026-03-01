import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, X } from 'lucide-react';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { ScrollReveal } from '../components/ui/scroll-reveal';

const FAVORITES_KEY = 'robeurope_gallery_favorites_v1';

const Gallery = () => {

    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    const isAdmin = useMemo(() => user?.role === 'admin' || user?.role === 'super_admin', [user?.role]);

    const [items, setItems] = useState([]);
    const [status, setStatus] = useState({ loading: true, error: '' });
    const [uploadStatus, setUploadStatus] = useState({ loading: false, error: '', ok: '' });
    const [deleteStatus, setDeleteStatus] = useState({ loadingId: null, error: '' });
    const [form, setForm] = useState({ title: '', description: '', file: null });
    const [expandedItems, setExpandedItems] = useState({});
    const [activeIndex, setActiveIndex] = useState(-1);
    const [favorites, setFavorites] = useState(() => {
        try {
            const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

    useEffect(() => {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        if (!activeItem) return;
        const onKey = (event) => {
            if (event.key === 'Escape') {
                setActiveIndex(-1);
            } else if (event.key === 'ArrowRight') {
                setActiveIndex((prev) => Math.min(items.length - 1, prev + 1));
            } else if (event.key === 'ArrowLeft') {
                setActiveIndex((prev) => Math.max(0, prev - 1));
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [activeItem, items.length]);

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

    const toggleFavorite = (id) => {
        setFavorites((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
    };

    return (
        <div className="space-y-8">
            <ScrollReveal>
                <PageHeader title={t('gallery.galleryTitle')} description={t('gallery.galleryDescription')} />
            </ScrollReveal>

            <div>

                    {isAuthenticated && isAdmin && (
                        <ScrollReveal>
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
                                <Button
                                    type="submit"
                                    disabled={uploadStatus.loading}
                                >
                                    {uploadStatus.loading ? (t('gallery.uploading') || 'Subiendo...') : (t('gallery.uploadCta') || 'Subir')}
                                </Button>

                                <div className="text-sm">
                                    {uploadStatus.error && (
                                        <Alert variant="destructive" className="py-2">
                                            <AlertDescription>{uploadStatus.error}</AlertDescription>
                                        </Alert>
                                    )}
                                    {!uploadStatus.error && uploadStatus.ok && (
                                        <Alert variant="success" className="py-2">
                                            <AlertDescription>{uploadStatus.ok}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>
                        </form>
                        </ScrollReveal>
                    )}

                    {status.loading && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-square rounded-xl">
                                    <Skeleton className="h-full w-full rounded-xl" />
                                </div>
                            ))}
                        </div>
                    )}
                    {!status.loading && status.error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{status.error}</AlertDescription>
                        </Alert>
                    )}

                    {!status.loading && !status.error && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                            {items.map((item, index) => {
                                const isFav = favorites.includes(item.id);
                                return (
                                <ScrollReveal key={item.id} delay={(index % 8) * 0.04}>
                                <Card className="overflow-hidden group cursor-pointer p-0 card-hover">
                                    <div className="relative aspect-square bg-slate-50 dark:bg-slate-900">
                                        <img
                                            src={resolveMediaUrl(item.url)}
                                            alt={item.title || item.original_name || 'Imagen'}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                            loading="lazy"
                                            onClick={() => setActiveIndex(index)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleFavorite(item.id)}
                                            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow hover:bg-white dark:bg-slate-900/85 dark:text-slate-100"
                                            aria-label={isFav ? (t('gallery.unfavorite') || 'Quitar favorito') : (t('gallery.favorite') || 'Añadir favorito')}
                                        >
                                            <Heart className={`h-4 w-4 ${isFav ? 'fill-current text-rose-500' : ''}`} />
                                        </button>
                                    </div>
                                    {(item.title || item.description || (isAuthenticated && isAdmin)) && (
                                        <div className="p-3">
                                            {item.title && <p className="font-semibold text-slate-900 truncate dark:text-slate-50">{item.title}</p>}
                                            {item.description && (
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    <p className={expandedItems[item.id] ? '' : 'line-clamp-2'}>
                                                        {item.description}
                                                    </p>
                                                    {item.description.length > 80 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium mt-1"
                                                        >
                                                            {expandedItems[item.id] ? t('gallery.seeLess') : t('gallery.seeMore')}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

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
                                </Card>
                                </ScrollReveal>
                            )})}
                        </div>
                    )}

            </div>

            <Dialog open={Boolean(activeItem)} onOpenChange={(open) => { if (!open) setActiveIndex(-1); }}>
                <DialogContent className="max-w-4xl border-slate-200 bg-white p-0 dark:border-slate-800 dark:bg-slate-950">
                    {activeItem && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setActiveIndex(-1)}
                                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                                aria-label={t('common.close') || 'Cerrar'}
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="relative flex min-h-[300px] items-center justify-center bg-slate-950">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activeItem.id}
                                        initial={{ opacity: 0.2, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0.2, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        src={resolveMediaUrl(activeItem.url)}
                                        alt={activeItem.title || activeItem.original_name || 'Imagen'}
                                        className="max-h-[70vh] w-full object-contain"
                                    />
                                </AnimatePresence>

                                <button
                                    type="button"
                                    disabled={activeIndex <= 0}
                                    onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                                    className="absolute left-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white disabled:opacity-40"
                                    aria-label={t('common.previous') || 'Anterior'}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                <button
                                    type="button"
                                    disabled={activeIndex >= items.length - 1}
                                    onClick={() => setActiveIndex((prev) => Math.min(items.length - 1, prev + 1))}
                                    className="absolute right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white disabled:opacity-40"
                                    aria-label={t('common.next') || 'Siguiente'}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-2 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                                        {activeItem.title || (t('gallery.image') || 'Imagen')}
                                    </p>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {activeIndex + 1}/{items.length}
                                    </span>
                                </div>
                                {activeItem.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{activeItem.description}</p>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Gallery
