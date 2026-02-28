import { useEffect, useState } from 'react';
import { apiRequest, resolveMediaUrl } from '../../../lib/apiClient';
import { X, ZoomIn } from 'lucide-react';

export default function GalleryModule({ team, config = {}, accentColor }) {
  const { limit = 8 } = config;
  const accent = accentColor || '#2563eb';
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    apiRequest(`/gallery?limit=${limit}`)
      .then(data => setImages(Array.isArray(data) ? data : data?.items || []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [limit]);

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
        <span style={{ color: accent }}>🖼️</span>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Galería</h3>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-3xl mb-2">🖼️</p>
            <p className="text-sm">Sin imágenes todavía</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {images.map((img, i) => (
              <button
                key={img.id || i}
                onClick={() => setLightbox(img)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 hover:ring-2 hover:ring-offset-1 focus:outline-none transition-all"
                style={{ '--tw-ring-color': accent }}
              >
                <img
                  src={resolveMediaUrl(img.url || img.file_url)}
                  alt={img.title || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={resolveMediaUrl(lightbox.url || lightbox.file_url)}
            alt={lightbox.title || ''}
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
