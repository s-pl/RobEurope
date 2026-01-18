import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { 
  FileText, Search, Edit, Trash2, Eye, Pin, PinOff, Plus, X, Save, Image
} from 'lucide-react';

const AdminPosts = () => {
  const { t } = useTranslation();
  const api = useApi();
  const { user } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_pinned: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

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
      is_pinned: post.is_pinned || false
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      is_pinned: false
    });
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
          body: JSON.stringify(formData)
        });
      } else {
        await api('/posts', {
          method: 'POST',
          body: JSON.stringify(formData)
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

  const handleDelete = async (postId) => {
    if (!confirm(t('admin.posts.confirmDelete') || '¿Eliminar este post?')) return;
    
    try {
      await api(`/posts/${postId}`, { method: 'DELETE' });
      loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePin = async (post) => {
    try {
      await api(`/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_pinned: !post.is_pinned })
      });
      loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title?.toLowerCase().includes(search.toLowerCase()) ||
    post.content?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-7 w-7 text-amber-600" />
            {t('admin.posts.title') || 'Gestión de Posts'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {t('admin.posts.description') || 'Crea, edita y elimina publicaciones del sistema.'}
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.posts.create') || 'Nuevo Post'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder={t('admin.posts.searchPlaceholder') || 'Buscar posts...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
              <h2 className="text-lg font-semibold">
                {editingPost ? (t('admin.posts.edit') || 'Editar Post') : (t('admin.posts.create') || 'Nuevo Post')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.posts.titleLabel') || 'Título'}</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.posts.contentLabel') || 'Contenido'}</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_pinned" className="text-sm">{t('admin.posts.pinPost') || 'Fijar post'}</label>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t('common.cancel') || 'Cancelar'}
                </Button>
                <Button type="submit" disabled={saving} className="bg-amber-600 hover:bg-amber-700">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? (t('common.saving') || 'Guardando...') : (t('common.save') || 'Guardar')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t('admin.posts.tableTitle') || 'Título'}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300 hidden md:table-cell">
                  {t('admin.posts.tableAuthor') || 'Autor'}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                  <Eye className="h-4 w-4 inline" />
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t('admin.posts.tableStatus') || 'Estado'}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t('admin.posts.tableActions') || 'Acciones'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                    {t('admin.posts.noPosts') || 'No hay posts para mostrar.'}
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {post.is_pinned && <Pin className="h-4 w-4 text-amber-500" />}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{post.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {post.content?.substring(0, 60)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {post.User?.first_name || post.User?.username || 'Anónimo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {post.views_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {post.is_pinned ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          <Pin className="h-3 w-3 mr-1" />
                          {t('admin.posts.pinned') || 'Fijado'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePin(post)}
                          title={post.is_pinned ? 'Desfijar' : 'Fijar'}
                        >
                          {post.is_pinned ? (
                            <PinOff className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Pin className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPosts;
