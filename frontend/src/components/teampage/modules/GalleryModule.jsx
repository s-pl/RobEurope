import { useEffect, useState } from 'react';
import { apiRequest, resolveMediaUrl } from '../../../lib/apiClient';
import { X, ZoomIn, Image } from 'lucide-react';

export default function GalleryModule({ team, config = {}, accentColor }) {
  const { limit = 12, columns = 3 } = config;
  const accent    = accentColor || '#18181b';
  const [images, setImages]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    apiRequest(`/gallery?limit=${limit}`)
      .then(data => setImages(Array.isArray(data) ? data : data?.items || []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [limit]);

  const colClass = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[columns] || 'grid-cols-2 sm:grid-cols-3';

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center gap-2">
        <Image className="h-4 w-4 text-zinc-400" />
        <h3 className="font-semibold text-zinc-900 text-sm">Galería</h3>
      </div>

      <div className="p-4">
        {loading ? (
          <div className={`grid ${colClass} gap-2`}>
            {Array.from({ length: columns * 2 }).map((_, i) => (
              <div key={i} className="aspect-square bg-zinc-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="py-8 text-center">
            <Image className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Sin imágenes todavía</p>
          </div>
        ) : (
          <div className={`grid ${colClass} gap-2`}>
            {images.map((img, i) => (
              <button
                key={img.id || i}
                onClick={() => setLightbox(img)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 transition-all"
                style={{ '--tw-ring-color': accent }}
              >
                <img
                  src={resolveMediaUrl(img.url || img.file_url)}
                  alt={img.title || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={resolveMediaUrl(lightbox.url || lightbox.file_url)}
            alt={lightbox.title || ''}
            className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.title && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/40 px-4 py-1.5 rounded-full">
              {lightbox.title}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
