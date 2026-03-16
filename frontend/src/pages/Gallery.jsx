import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Heart, LogIn, X } from 'lucide-react';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
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
    const [activeIndex, setActiveIndex] = useState(-1);
    const [uploadOpen, setUploadOpen] = useState(false);
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

    const inputClass = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50';

    return (
        <div className="space-y-10">
            <ScrollReveal>
                <PageHeader title={t('gallery.galleryTitle')} description={t('gallery.galleryDescription')} />
            </ScrollReveal>

            {/* Admin upload -- collapsible */}
            {isAuthenticated && isAdmin && (
                <ScrollReveal>
                    <div>
                        <button
                            type="button"
                            onClick={() => setUploadOpen((v) => !v)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 dark:text-stone-50 hover:text-blue-600 transition-colors duration-200"
                        >
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${uploadOpen ? 'rotate-180' : ''}`} />
                            {t('gallery.adminUploadTitle') || 'Subir foto a la galeria'}
                        </button>

                        <AnimatePresence>
                            {uploadOpen && (
                                <motion.form
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                    onSubmit={handleUpload}
                                    className="overflow-hidden mt-4"
                                >
                                    <div className="border-t border-stone-200 dark:border-stone-700 pt-5 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                                    {t('gallery.uploadImage') || 'Imagen'}
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-900 hover:file:bg-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:file:bg-stone-800 dark:file:text-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                                    onChange={(ev) => setForm((p) => ({ ...p, file: ev.target.files?.[0] || null }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                                    {t('gallery.uploadTitle') || 'Titulo (opcional)'}
                                                </label>
                                                <input type="text" value={form.title} className={inputClass} onChange={(ev) => setForm((p) => ({ ...p, title: ev.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                                    {t('gallery.uploadDescription') || 'Descripcion (opcional)'}
                                                </label>
                                                <input type="text" value={form.description} className={inputClass} onChange={(ev) => setForm((p) => ({ ...p, description: ev.target.value }))} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                            <button
                                                type="submit"
                                                disabled={uploadStatus.loading}
                                                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                                            >
                                                {uploadStatus.loading ? (t('gallery.uploading') || 'Subiendo...') : (t('gallery.uploadCta') || 'Subir')}
                                            </button>

                                            {uploadStatus.error && (
                                                <span className="text-sm text-red-600 dark:text-red-400">{uploadStatus.error}</span>
                                            )}
                                            {!uploadStatus.error && uploadStatus.ok && (
                                                <span className="text-sm text-emerald-600 dark:text-emerald-400">{uploadStatus.ok}</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollReveal>
            )}

            {/* Login prompt for non-auth users */}
            {!isAuthenticated && (
                <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                    <LogIn className="h-4 w-4" />
                    <span>{t('gallery.loginForFavorites') || 'Inicia sesion para guardar favoritos'}</span>
                </div>
            )}

            {/* Loading skeleton -- masonry-like */}
            {status.loading && (
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                    {[180, 240, 160, 220, 200, 260, 180, 210].map((h, i) => (
                        <div key={i} className="break-inside-avoid">
                            <Skeleton className="w-full rounded-lg" style={{ height: h }} />
                        </div>
                    ))}
                </div>
            )}

            {!status.loading && status.error && (
                <Alert variant="destructive">
                    <AlertDescription>{status.error}</AlertDescription>
                </Alert>
            )}

            {/* Masonry gallery grid */}
            {!status.loading && !status.error && (
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                    {items.map((item, index) => {
                        const isFav = favorites.includes(item.id);
                        return (
                            <ScrollReveal key={item.id} delay={(index % 8) * 0.04}>
                                <div className="break-inside-avoid group relative rounded-lg overflow-hidden cursor-pointer">
                                    <img
                                        src={resolveMediaUrl(item.url)}
                                        alt={item.title || item.original_name || 'Imagen'}
                                        className="w-full block transition-transform duration-250 group-hover:scale-[1.02]"
                                        loading="lazy"
                                        onClick={() => setActiveIndex(index)}
                                    />

                                    {/* Hover overlay with title */}
                                    <div
                                        className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/40 transition-colors duration-250 pointer-events-none"
                                        onClick={() => setActiveIndex(index)}
                                    />
                                    {item.title && (
                                        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none">
                                            <p className="text-sm font-medium text-white truncate">{item.title}</p>
                                        </div>
                                    )}

                                    {/* Favorite heart -- only on hover (or if already fav) */}
                                    {isAuthenticated && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                            className={`absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full transition-opacity duration-200 ${isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} bg-white/90 dark:bg-stone-800/90 text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-800`}
                                            aria-label={isFav ? (t('gallery.unfavorite') || 'Quitar favorito') : (t('gallery.favorite') || 'Anadir favorito')}
                                        >
                                            <Heart className={`h-4 w-4 ${isFav ? 'fill-current text-rose-500' : ''}`} />
                                        </button>
                                    )}

                                    {/* Admin delete */}
                                    {isAuthenticated && isAdmin && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            disabled={deleteStatus.loadingId === item.id}
                                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium text-white bg-red-600/80 hover:bg-red-600 disabled:opacity-50"
                                        >
                                            {deleteStatus.loadingId === item.id ? (t('gallery.deleting') || 'Eliminando...') : (t('gallery.delete') || 'Eliminar')}
                                        </button>
                                    )}
                                </div>
                            </ScrollReveal>
                        );
                    })}
                </div>
            )}

            {deleteStatus.error && (
                <div className="text-sm text-red-600 dark:text-red-400" role="alert">{deleteStatus.error}</div>
            )}

            {/* Lightbox -- full-screen dark overlay */}
            <AnimatePresence>
                {activeItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90"
                        onClick={() => setActiveIndex(-1)}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setActiveIndex(-1)}
                            className="absolute top-5 right-5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:text-white transition-colors duration-200"
                            aria-label={t('common.close') || 'Cerrar'}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Counter */}
                        <span className="absolute top-6 left-6 text-sm text-white/50 font-medium">
                            {activeIndex + 1} / {items.length}
                        </span>

                        {/* Previous */}
                        <button
                            type="button"
                            disabled={activeIndex <= 0}
                            onClick={(e) => { e.stopPropagation(); setActiveIndex((prev) => Math.max(0, prev - 1)); }}
                            className="absolute left-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:text-white disabled:opacity-30 transition-colors duration-200"
                            aria-label={t('common.previous') || 'Anterior'}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>

                        {/* Image */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeItem.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-5xl w-full px-16 flex flex-col items-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={resolveMediaUrl(activeItem.url)}
                                    alt={activeItem.title || activeItem.original_name || 'Imagen'}
                                    className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
                                />
                                {(activeItem.title || activeItem.description) && (
                                    <div className="mt-4 text-center max-w-lg">
                                        {activeItem.title && (
                                            <p className="text-base font-medium text-white">{activeItem.title}</p>
                                        )}
                                        {activeItem.description && (
                                            <p className="mt-1 text-sm text-white/60">{activeItem.description}</p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Next */}
                        <button
                            type="button"
                            disabled={activeIndex >= items.length - 1}
                            onClick={(e) => { e.stopPropagation(); setActiveIndex((prev) => Math.min(items.length - 1, prev + 1)); }}
                            className="absolute right-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:text-white disabled:opacity-30 transition-colors duration-200"
                            aria-label={t('common.next') || 'Siguiente'}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Gallery;
