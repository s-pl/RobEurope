import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/apiClient';
import { Calendar, MessageCircle, Heart } from 'lucide-react';

export default function PostsModule({ team, config = {}, accentColor }) {
  const { limit = 3 } = config;
  const accent = accentColor || '#2563eb';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team?.id) return;
    apiRequest(`/posts?team_id=${team.id}&limit=${limit}`)
      .then(data => setPosts(Array.isArray(data) ? data : data?.items || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [team?.id, limit]);

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
        <span style={{ color: accent }}>📝</span>
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Publicaciones recientes</h3>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse space-y-2">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">Sin publicaciones todavía</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                {post.title}
              </h4>
              {post.excerpt && (
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{post.excerpt}</p>
              )}
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
                {post.likes_count != null && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {post.likes_count}
                  </span>
                )}
                {post.comments_count != null && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" /> {post.comments_count}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
