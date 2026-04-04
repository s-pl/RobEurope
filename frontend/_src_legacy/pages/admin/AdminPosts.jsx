import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import {
  AdaptiveModal,
  AdaptiveModalContent,
  AdaptiveModalFooter,
} from '../../components/ui/adaptive-modal';
import {
  FileText, Search, Edit, Trash2, Eye, Pin, PinOff, Plus, Save, Loader2, Inbox,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  AdminPosts                                                         */
/* ------------------------------------------------------------------ */
const AdminPosts = () => {
  const { t } = useTranslation();
  const api = useApi();
  const { user } = useAuth();

  /* ── state ── */
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_pinned: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDeleteId, setPostToDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── effects ── */
  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const id = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(id);
    }
  }, [successMsg]);

  /* ── api ── */
  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await api('/posts');
      setPosts(Array.isArray(data) ? data : data.posts || []);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      content: post.content || '',
      is_pinned: post.is_pinned || false,
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setFormData({ title: '', content: '', is_pinned: false });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingPost) {
        await api(`/posts/${editingPost.id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        await api('/posts', {
          method: 'POST',
          body: formData,
        });
      }
      setShowForm(false);
      loadPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (postId) => {
    setPostToDeleteId(postId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDeleteId) return;
    setDeleting(true);
    try {
      await api(`/posts/${postToDeleteId}`, { method: 'DELETE' });
      loadPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPostToDeleteId(null);
    }
  };

  const togglePin = async (post) => {
    try {
      await api(`/posts/${post.id}`, {
        method: 'PUT',
        body: { is_pinned: !post.is_pinned },
      });
      loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  /* ── derived ── */
  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(search.toLowerCase()) ||
      post.content?.toLowerCase().includes(search.toLowerCase()),
  );

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  /* ── render ── */
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center bg-blue-100 dark:bg-blue-900/30 shrink-0">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-50">
              {t('admin.posts.title') || 'Gestión de Posts'}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mt-0.5 text-sm">
              {t('admin.posts.description') || 'Crea, edita y elimina publicaciones del sistema.'}
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-stone-900 hover:bg-stone-800 text-white gap-2">
          <Plus className="h-4 w-4" />
          {t('admin.posts.create') || 'Nuevo Post'}
        </Button>
      </div>

      {/* ── Feedback banners ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-2 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 mb-6 text-sm"
          >
            {error}
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 mb-6 text-sm"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search ── */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          type="text"
          placeholder={t('admin.posts.searchPlaceholder') || 'Buscar posts...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-stone-200 dark:border-stone-800 focus:border-blue-300 focus:ring-blue-200"
        />
      </div>

      {/* ── Form Modal (AdaptiveModal) ── */}
      <AdaptiveModal open={showForm} onOpenChange={setShowForm}>
        <AdaptiveModalContent
          title={editingPost ? (t('admin.posts.edit') || 'Editar Post') : (t('admin.posts.create') || 'Nuevo Post')}
          className="sm:max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                {t('admin.posts.titleLabel') || 'Título'}
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-stone-200 dark:border-stone-800 focus:border-blue-300 focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                {t('admin.posts.contentLabel') || 'Contenido'}
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(val) => setFormData({ ...formData, content: val })}
                placeholder={t('admin.posts.contentLabel') || 'Contenido'}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="is_pinned"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="h-4 w-4 border-stone-300 dark:border-stone-700 text-blue-600 focus:ring-blue-200"
              />
              <label htmlFor="is_pinned" className="text-sm text-stone-700 dark:text-stone-300">
                {t('admin.posts.pinPost') || 'Fijar post'}
              </label>
            </div>
            <AdaptiveModalFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                {t('common.cancel') || 'Cancelar'}
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-stone-900 hover:bg-stone-800 text-white gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? (t('common.saving') || 'Guardando...') : (t('common.save') || 'Guardar')}
              </Button>
            </AdaptiveModalFooter>
          </form>
        </AdaptiveModalContent>
      </AdaptiveModal>

      {/* ── Posts Table ── */}
      <div className="bg-white dark:bg-stone-950 border-2 border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {t('admin.posts.tableTitle') || 'Título'}
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider hidden md:table-cell">
                  {t('admin.posts.tableAuthor') || 'Autor'}
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider hidden sm:table-cell">
                  <Eye className="h-4 w-4 inline" />
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {t('admin.posts.tableStatus') || 'Estado'}
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  {t('admin.posts.tableActions') || 'Acciones'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center bg-stone-100 dark:bg-stone-800">
                        <Inbox className="h-6 w-6 text-stone-400" />
                      </div>
                      <p className="text-sm text-stone-400 dark:text-stone-500">
                        {t('admin.posts.noPosts') || 'No hay posts para mostrar.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <motion.tr
                    key={post.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-900/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {post.is_pinned && (
                          <Pin className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                            {post.title}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500 truncate max-w-xs">
                            {(post.content ? new DOMParser().parseFromString(post.content, 'text/html').body.textContent ?? '' : '').substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        {post.User?.first_name || post.User?.username || 'Anónimo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                      <span className="text-sm text-stone-500 dark:text-stone-400 tabular-nums">
                        {post.views_count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {post.is_pinned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-2 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                          <Pin className="h-3 w-3" />
                          {t('admin.posts.pinned') || 'Fijado'}
                        </span>
                      ) : (
                        <span className="text-stone-300 dark:text-stone-600 text-xs">&mdash;</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => togglePin(post)}
                          title={post.is_pinned ? 'Desfijar' : 'Fijar'}
                          className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          {post.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(post)}
                          title={t('common.edit') || 'Editar'}
                          className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          title={t('common.delete') || 'Eliminar'}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setPostToDeleteId(null);
        }}
        title={t('common.delete') || 'Eliminar'}
        description={t('admin.posts.confirmDelete') || '¿Eliminar este post?'}
        confirmLabel={t('common.delete') || 'Eliminar'}
        cancelLabel={t('common.cancel') || 'Cancelar'}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default AdminPosts;
