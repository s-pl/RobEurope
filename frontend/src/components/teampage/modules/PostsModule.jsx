import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/apiClient';
import { FileText, Calendar, User, ArrowRight } from 'lucide-react';

export default function PostsModule({ team, config = {}, accentColor }) {
  const { limit = 5, sortBy = 'newest', showAuthor = true, showDate = true } = config;
  const accent    = accentColor || '#18181b';
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team?.id) { setLoading(false); return; }
    const order = sortBy === 'oldest' ? 'asc' : 'desc';
    apiRequest(`/posts?team_id=${team.id}&limit=${limit}&order=${order}`)
      .then(data => setPosts(Array.isArray(data) ? data : data?.items || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [team?.id, limit, sortBy]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center gap-2">
        <FileText className="h-4 w-4 text-zinc-400" />
        <h3 className="font-semibold text-zinc-900 text-sm">Publicaciones</h3>
      </div>

      <div className="divide-y divide-zinc-100">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2 animate-pulse">
              <div className="h-3.5 bg-zinc-100 rounded w-3/4" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Sin publicaciones todavía</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-4 hover:bg-zinc-50 transition-colors group cursor-default">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm text-zinc-900 line-clamp-1">
                  {post.title}
                </h4>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-300 flex-shrink-0 mt-0.5 group-hover:text-zinc-400 transition-colors" />
              </div>
              {post.excerpt && (
                <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                {showDate && post.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {showAuthor && post.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.author?.username || post.author?.first_name || 'Autor'}
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
