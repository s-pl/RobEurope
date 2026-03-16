import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditMode } from '../context/EditModeContext';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Image as ImageIcon, Heart, MessageCircle, Share2,
  MoreVertical, Trash2, Edit2, Pin, ChevronDown, ChevronUp, Lock,
  X, Send, Reply, Eye, Loader2, Upload, GripVertical,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { resolveMediaUrl } from '../lib/apiClient';
import { useToast } from '../hooks/useToast';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import DOMPurify from 'dompurify';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const MAX_CONTENT_BYTES = 200 * 1024;
const MAX_IMAGES = 5;

/* ------------------------------------------------------------------ */
/*  Image Gallery Component                                            */
/* ------------------------------------------------------------------ */
const ImageGallery = ({ urls, onImageClick }) => {
  if (!urls || urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 cursor-pointer" onClick={() => onImageClick(0)}>
        <img src={resolveMediaUrl(urls[0])} alt="" className="w-full h-auto max-h-[500px] object-cover transition-transform hover:scale-[1.01]" loading="lazy" />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800">
        {urls.map((url, i) => (
          <div key={i} className="cursor-pointer aspect-[4/3] overflow-hidden" onClick={() => onImageClick(i)}>
            <img src={resolveMediaUrl(url)} alt="" className="w-full h-full object-cover transition-transform hover:scale-105" loading="lazy" />
          </div>
        ))}
      </div>
    );
  }

  // 3+ images: first large, rest in grid
  return (
    <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800">
      <div className="col-span-2 cursor-pointer aspect-video overflow-hidden" onClick={() => onImageClick(0)}>
        <img src={resolveMediaUrl(urls[0])} alt="" className="w-full h-full object-cover transition-transform hover:scale-105" loading="lazy" />
      </div>
      {urls.slice(1, 5).map((url, i) => (
        <div key={i} className="relative cursor-pointer aspect-[4/3] overflow-hidden" onClick={() => onImageClick(i + 1)}>
          <img src={resolveMediaUrl(url)} alt="" className="w-full h-full object-cover transition-transform hover:scale-105" loading="lazy" />
          {i === 3 && urls.length > 5 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xl font-bold">+{urls.length - 5}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Lightbox Component                                                 */
/* ------------------------------------------------------------------ */
const Lightbox = ({ urls, currentIndex, onClose, onNext, onPrev }) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onNext, onPrev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10">
        <X className="h-6 w-6" />
      </button>
      {urls.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-10">
            <ChevronDown className="h-6 w-6 rotate-90" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-10">
            <ChevronUp className="h-6 w-6 rotate-90" />
          </button>
        </>
      )}
      <img
        src={resolveMediaUrl(urls[currentIndex])}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      {urls.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {urls.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Animated Heart Button                                              */
/* ------------------------------------------------------------------ */
const HeartButton = ({ liked, count, onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
      liked
        ? 'text-red-500'
        : 'text-stone-400 hover:text-red-500 hover:bg-stone-50 dark:hover:bg-stone-800/50'
    }`}
  >
    <motion.div
      whileTap={{ scale: 1.4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
    >
      <Heart className={`h-4 w-4 transition-all duration-200 ${liked ? 'fill-current scale-110' : ''}`} />
    </motion.div>
    <span className="tabular-nums">{count}</span>
  </button>
);

/* ------------------------------------------------------------------ */
/*  Comment Component (supports replies)                               */
/* ------------------------------------------------------------------ */
const CommentItem = ({ comment, user, isAuthenticated, onReply, onDelete, t, depth = 0 }) => {
  const isAuthor = user?.id === comment.author_id;
  const isSuperAdmin = user?.role === 'super_admin';
  const canDelete = isAuthor || isSuperAdmin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 py-3 ${depth > 0 ? 'ml-10 border-l-2 border-stone-100 dark:border-stone-800 pl-4' : ''}`}
    >
      <div className="h-7 w-7 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
        {comment.User?.profile_photo_url ? (
          <img src={resolveMediaUrl(comment.User.profile_photo_url)} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-stone-400 text-xs font-bold">
            {comment.User?.first_name?.[0]}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm text-stone-900 dark:text-stone-50">
            {comment.User?.first_name} {comment.User?.last_name}
          </span>
          <span className="text-xs text-stone-400">{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed break-words">{comment.content}</p>
        <div className="flex items-center gap-2 mt-1">
          {isAuthenticated && depth === 0 && (
            <button
              onClick={() => onReply(comment)}
              className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-blue-600 transition-colors"
            >
              <Reply className="h-3 w-3" />
              {t('posts.reply') || 'Responder'}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              {t('common.delete') || 'Eliminar'}
            </button>
          )}
        </div>
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                user={user}
                isAuthenticated={isAuthenticated}
                onReply={onReply}
                onDelete={onDelete}
                t={t}
                depth={1}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Image Upload Preview                                               */
/* ------------------------------------------------------------------ */
const ImageUploadPreview = ({ images, onRemove }) => {
  if (!images || images.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {images.map((img, i) => (
        <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-stone-100 dark:bg-stone-800">
          <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
            {(img.size / 1024).toFixed(0)} KB
          </div>
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Posts Component                                               */
/* ------------------------------------------------------------------ */
const Posts = () => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { editMode } = useEditMode();
  const api = useApi();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Create post state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [newImages, setNewImages] = useState([]);

  // Edit post state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editData, setEditData] = useState({ title: '', content: '' });
  const [editSaving, setEditSaving] = useState(false);

  // Comments state (inline per post)
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [newCommentText, setNewCommentText] = useState({});
  const [replyTo, setReplyTo] = useState(null); // { postId, commentId, userName }

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDeleteId, setPostToDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Lightbox
  const [lightbox, setLightbox] = useState(null); // { urls, index }

  // Drag/drop
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const usedBytes = (() => {
    try { return new TextEncoder().encode(`${newPost.title}\n${newPost.content || ''}`).length; } catch { return (newPost.title?.length || 0) + (newPost.content?.length || 0); }
  })();

  /* ── Fetch posts ── */
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api(`/posts?q=${search}`);
      setPosts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [api, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /* ── Realtime ── */
  useEffect(() => {
    if (!socket) return;
    const onCreated = (post) => {
      setPosts(prev => {
        const exists = prev.find(p => p.id === post.id);
        if (exists) return prev;
        return [ { ...post, _isNew: true }, ...prev ];
      });
    };
    const onUpdated = (post) => {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...post } : p));
    };
    const onDeleted = ({ id }) => {
      setPosts(prev => prev.filter(p => p.id !== id));
    };
    const onPinned = ({ id, is_pinned }) => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, is_pinned } : p)
        .sort((a,b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at)));
    };
    const onLiked = ({ post_id, user_id, liked }) => {
      setPosts(prev => prev.map(p => {
        if (p.id !== Number(post_id)) return p;
        let likes = p.PostLikes || [];
        const has = likes.some(l => l.user_id === user_id);
        if (liked && !has) likes = [...likes, { user_id }];
        if (!liked && has) likes = likes.filter(l => l.user_id !== user_id);
        return { ...p, PostLikes: likes };
      }));
    };
    const onComment = (comment) => {
      setPosts(prev => prev.map(p => p.id === comment.post_id ? { ...p, Comments: [...(p.Comments||[]), { id: comment.id }] } : p));
      // Also update inline comments if expanded
      if (expandedComments[comment.post_id]) {
        loadComments(comment.post_id);
      }
    };
    const onCommentDeleted = ({ post_id, comment_id }) => {
      setPosts(prev => prev.map(p => p.id === Number(post_id) ? { ...p, Comments: (p.Comments||[]).filter(c => c.id !== Number(comment_id)) } : p));
      if (expandedComments[post_id]) {
        loadComments(post_id);
      }
    };
    socket.on('post_created', onCreated);
    socket.on('post_updated', onUpdated);
    socket.on('post_deleted', onDeleted);
    socket.on('post_pinned', onPinned);
    socket.on('post_liked', onLiked);
    socket.on('comment_added', onComment);
    socket.on('comment_deleted', onCommentDeleted);
    return () => {
      socket.off('post_created', onCreated);
      socket.off('post_updated', onUpdated);
      socket.off('post_deleted', onDeleted);
      socket.off('post_pinned', onPinned);
      socket.off('post_liked', onLiked);
      socket.off('comment_added', onComment);
      socket.off('comment_deleted', onCommentDeleted);
    };
  }, [socket, expandedComments]);

  /* ── Create Post ── */
  const handleImageAdd = (files) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    setNewImages(prev => {
      const combined = [...prev, ...fileArray];
      return combined.slice(0, MAX_IMAGES);
    });
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('content', newPost.content);
      newImages.forEach(img => formData.append('images', img));

      await api('/posts', {
        method: 'POST',
        body: formData,
        formData: true
      });

      setCreateOpen(false);
      setNewPost({ title: '', content: '' });
      setNewImages([]);
      fetchPosts();
      toast({ title: t('posts.created'), variant: 'success' });
    } catch (error) {
      toast({ title: t('posts.error'), description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  /* ── Edit Post ── */
  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditData({ title: post.title, content: post.content });
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditData({ title: '', content: '' });
  };

  const saveEdit = async (postId) => {
    setEditSaving(true);
    try {
      const updated = await api(`/posts/${postId}`, {
        method: 'PUT',
        body: { title: editData.title, content: editData.content }
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updated } : p));
      setEditingPostId(null);
      toast({ title: t('posts.updated') || 'Post actualizado', variant: 'success' });
    } catch (error) {
      toast({ title: t('posts.error'), description: error.message, variant: 'destructive' });
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Delete Post ── */
  const handleDelete = (id) => {
    setPostToDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDeleteId) return;
    setDeleting(true);
    try {
      await api(`/posts/${postToDeleteId}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== postToDeleteId));
      toast({ title: t('posts.deleted'), variant: 'success' });
    } catch (error) {
      toast({ title: t('posts.error'), description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPostToDeleteId(null);
    }
  };

  /* ── Like ── */
  const handleLike = async (post) => {
    if (!isAuthenticated) {
      toast({ title: t('auth.required') || 'Login required', description: t('auth.loginToInteract') || 'Please login to interact', variant: 'default' });
      return;
    }
    try {
      const res = await api(`/posts/${post.id}/like`, { method: 'POST' });
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          const isLiked = res.liked;
          let newLikes = p.PostLikes || [];
          if (isLiked) {
            newLikes = [...newLikes, { user_id: user.id }];
          } else {
            newLikes = newLikes.filter(l => l.user_id !== user.id);
          }
          return { ...p, PostLikes: newLikes };
        }
        return p;
      }));
    } catch (error) {
      console.error(error);
    }
  };

  /* ── Pin ── */
  const handlePin = async (post) => {
    try {
      const res = await api(`/posts/${post.id}/pin`, { method: 'POST' });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_pinned: res.is_pinned } : p));
      toast({ title: res.is_pinned ? t('posts.pinned') : t('posts.unpinned'), variant: 'success' });
    } catch (error) {
      toast({ title: t('posts.error'), description: error.message, variant: 'destructive' });
    }
  };

  /* ── Comments ── */
  const loadComments = async (postId) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const data = await api(`/posts/${postId}/comments`);
      setCommentsByPost(prev => ({ ...prev, [postId]: data }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => {
      const next = { ...prev, [postId]: !prev[postId] };
      if (next[postId] && !commentsByPost[postId]) {
        loadComments(postId);
      }
      return next;
    });
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const text = newCommentText[postId]?.trim();
    if (!text) return;
    try {
      const body = { content: text };
      if (replyTo?.postId === postId && replyTo?.commentId) {
        body.parent_id = replyTo.commentId;
      }
      await api(`/posts/${postId}/comments`, {
        method: 'POST',
        body
      });
      setNewCommentText(prev => ({ ...prev, [postId]: '' }));
      setReplyTo(null);
      loadComments(postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, Comments: [...(p.Comments || []), { id: Date.now() }] };
        }
        return p;
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await api(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
      loadComments(postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, Comments: (p.Comments || []).filter(c => c.id !== commentId) };
        }
        return p;
      }));
    } catch (error) {
      toast({ title: t('posts.error'), description: error.message, variant: 'destructive' });
    }
  };

  /* ── Share ── */
  const handleShare = async (post) => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    const shareData = {
      title: post.title,
      text: post.title,
      url: postUrl
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast({ title: t('posts.linkCopied') || 'Enlace copiado al portapapeles', variant: 'success' });
      } catch {
        toast({ title: 'Error al copiar', variant: 'destructive' });
      }
    }
  };

  /* ── Lightbox ── */
  const openLightbox = (urls, index) => setLightbox({ urls, index });
  const closeLightbox = () => setLightbox(null);

  /* ── Drag & Drop for create form ── */
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleImageAdd(e.dataTransfer.files);
  };

  /* ── Derived ── */
  const filteredPosts = posts.filter(p => activeTab === 'pinned' ? p.is_pinned : true);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="pt-2 pb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">
            {t('posts.title')}
          </h1>
          {editMode && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
              EDIT MODE
            </span>
          )}
        </div>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">{t('posts.subtitle')}</p>
      </div>

      {/* Search + Tabs + Create row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between pb-6 border-b border-stone-200 dark:border-stone-800">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-stone-100 dark:bg-stone-800">
            <TabsTrigger value="all">{t('posts.tabs.all') || 'Todos'}</TabsTrigger>
            <TabsTrigger value="pinned">{t('posts.tabs.pinned') || 'Destacados'}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              placeholder={t('posts.search')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isAuthenticated && user?.role === 'super_admin' && editMode && (
            <Dialog open={createOpen} onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) { setNewPost({ title: '', content: '' }); setNewImages([]); }
            }}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0">
                  <Plus className="h-4 w-4" /> {t('posts.create')}
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto border-stone-200 dark:border-stone-800 sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-stone-900 dark:text-stone-50">{t('posts.createTitle')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePost} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title" className="text-stone-700 dark:text-stone-300">{t('posts.form.title')}</Label>
                    <input
                      id="title"
                      value={newPost.title}
                      onChange={e => setNewPost({...newPost, title: e.target.value})}
                      required
                      className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content" className="text-stone-700 dark:text-stone-300">{t('posts.form.content')}</Label>
                    <div className="mt-1">
                      <RichTextEditor
                        value={newPost.content}
                        onChange={val => setNewPost({...newPost, content: val})}
                        placeholder={t('posts.form.content')}
                      />
                      <div className={`mt-2 text-xs ${usedBytes > MAX_CONTENT_BYTES ? 'text-red-600' : 'text-stone-500'}`}>
                        {usedBytes > MAX_CONTENT_BYTES
                          ? t('posts.form.tooLarge') || `Contenido demasiado grande por ${((usedBytes-MAX_CONTENT_BYTES)/1024).toFixed(1)} KB`
                          : `${(usedBytes/1024).toFixed(1)} KB / ${(MAX_CONTENT_BYTES/1024).toFixed(0)} KB`}
                      </div>
                    </div>
                  </div>

                  {/* Image upload area with drag and drop */}
                  <div>
                    <Label className="text-stone-700 dark:text-stone-300">
                      {t('posts.form.images') || 'Imagenes'} ({newImages.length}/{MAX_IMAGES})
                    </Label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`mt-1 flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                        dragOver
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600'
                      } ${newImages.length >= MAX_IMAGES ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <Upload className="h-6 w-6 text-stone-400" />
                      <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
                        {t('posts.form.dragDrop') || 'Arrastra imagenes aqui o haz clic para seleccionar'}
                      </p>
                      <p className="text-xs text-stone-400">
                        {t('posts.form.maxImages') || `Maximo ${MAX_IMAGES} imagenes`}
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleImageAdd(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <ImageUploadPreview
                      images={newImages}
                      onRemove={(i) => setNewImages(prev => prev.filter((_, idx) => idx !== i))}
                    />
                  </div>

                  <DialogFooter>
                    <button
                      type="submit"
                      disabled={creating || usedBytes > MAX_CONTENT_BYTES}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? t('common.saving') : t('common.save')}
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Post list */}
      <div className="divide-y divide-stone-200 dark:divide-stone-800">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-stone-300 border-t-blue-600 mx-auto"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-stone-400 dark:text-stone-500">
            {t('posts.empty')}
          </div>
        ) : (
          filteredPosts.map(post => {
            const isLiked = post.PostLikes?.some(l => l.user_id === user?.id);
            const likeCount = post.PostLikes?.length || 0;
            const commentCount = post.Comments?.length || 0;
            const isEditing = editingPostId === post.id;
            const commentsExpanded = expandedComments[post.id];
            const postComments = commentsByPost[post.id] || [];
            const isLoadingComments = loadingComments[post.id];

            return (
              <motion.article
                key={post.id}
                initial={post._isNew ? { opacity: 0, y: -8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`group py-6 transition-colors ${post.is_pinned ? 'border-l-2 border-l-blue-600 pl-4 -ml-4' : ''}`}
              >
                {/* Post header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden border border-stone-200 dark:border-stone-700 shrink-0">
                      {post.User?.profile_photo_url ? (
                        <img src={resolveMediaUrl(post.User.profile_photo_url)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-stone-400 font-bold text-sm">
                          {post.User?.first_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-stone-900 dark:text-stone-50 truncate">
                          {post.User ? `${post.User.first_name} ${post.User.last_name}` : 'Unknown User'}
                        </span>
                        {post.is_pinned && <Pin className="h-3 w-3 text-blue-600 fill-blue-600 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                        {post.is_edited && (
                          <span className="text-xs text-stone-400 dark:text-stone-500 italic">
                            ({t('posts.edited') || 'editado'})
                          </span>
                        )}
                        {(post.views_count > 0) && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-stone-400 dark:text-stone-500">
                            <Eye className="h-3 w-3" />
                            {post.views_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {user?.role === 'super_admin' && (
                      <button
                        onClick={() => handlePin(post)}
                        className="p-1.5 rounded-md text-stone-400 hover:text-blue-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <Pin className={`h-4 w-4 ${post.is_pinned ? 'fill-blue-600 text-blue-600' : ''}`} />
                        <span className="sr-only">{post.is_pinned ? t('posts.unpinned') : t('posts.pinned')}</span>
                      </button>
                    )}
                    {(user?.id === post.author_id || user?.role === 'super_admin') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">{t('common.moreOptions') || 'More options'}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-stone-200 dark:border-stone-800">
                          {(user?.id === post.author_id || user?.role === 'super_admin') && (
                            <DropdownMenuItem onClick={() => startEdit(post)}>
                              <Edit2 className="mr-2 h-4 w-4" /> {t('common.edit') || 'Editar'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Post content - editable or display */}
                {isEditing ? (
                  <div className="mt-3 space-y-3">
                    <input
                      value={editData.title}
                      onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                    <RichTextEditor
                      value={editData.content}
                      onChange={val => setEditData(prev => ({ ...prev, content: val }))}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(post.id)}
                        disabled={editSaving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {t('common.save') || 'Guardar'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        {t('common.cancel') || 'Cancelar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50 mt-3">
                      {post.title}
                    </h3>
                    <div
                      className="prose dark:prose-invert prose-stone max-w-none text-stone-600 dark:text-stone-300 text-sm leading-relaxed mt-2 break-words [&_img]:rounded-lg [&_img]:max-h-[500px] [&_img]:w-auto [&_img]:mx-auto"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                    />
                  </>
                )}

                {/* Image gallery */}
                {!isEditing && post.media_urls && post.media_urls.length > 0 && (
                  <ImageGallery
                    urls={post.media_urls}
                    onImageClick={(index) => openLightbox(post.media_urls, index)}
                  />
                )}

                {/* Post actions */}
                <div className="flex items-center gap-1 mt-4">
                  {isAuthenticated ? (
                    <>
                      <HeartButton
                        liked={isLiked}
                        count={likeCount}
                        onClick={() => handleLike(post)}
                      />
                      <button
                        onClick={() => toggleComments(post.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          commentsExpanded
                            ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'text-stone-400 hover:text-blue-600 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                        }`}
                      >
                        <MessageCircle className={`h-4 w-4 ${commentsExpanded ? 'fill-current' : ''}`} />
                        <span className="tabular-nums">{commentCount}</span>
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleShare(post)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-stone-400 hover:text-blue-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
                      <Lock className="h-3.5 w-3.5" />
                      <span>{t('auth.loginToInteract') || 'Login to interact'}</span>
                      <span className="mx-2 text-stone-300 dark:text-stone-700">|</span>
                      <span className="text-stone-400">
                        <Heart className="h-3.5 w-3.5 inline mr-1" />{likeCount}
                      </span>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5 inline mr-1" />{commentCount}
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline comments section */}
                <AnimatePresence>
                  {commentsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                        {isLoadingComments ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
                          </div>
                        ) : postComments.length === 0 ? (
                          <p className="text-center text-stone-400 text-sm py-4">
                            {t('posts.noComments') || 'No hay comentarios aun'}
                          </p>
                        ) : (
                          <div className="space-y-0 divide-y divide-stone-50 dark:divide-stone-800/50">
                            {postComments.map(comment => (
                              <CommentItem
                                key={comment.id}
                                comment={comment}
                                user={user}
                                isAuthenticated={isAuthenticated}
                                onReply={(c) => setReplyTo({ postId: post.id, commentId: c.id, userName: `${c.User?.first_name} ${c.User?.last_name}` })}
                                onDelete={(cId) => handleDeleteComment(post.id, cId)}
                                t={t}
                              />
                            ))}
                          </div>
                        )}

                        {/* Add comment form */}
                        {isAuthenticated && (
                          <form onSubmit={(e) => handleAddComment(e, post.id)} className="mt-3">
                            {replyTo?.postId === post.id && (
                              <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-400">
                                <Reply className="h-3 w-3" />
                                <span>{t('posts.replyingTo') || 'Respondiendo a'} {replyTo.userName}</span>
                                <button
                                  type="button"
                                  onClick={() => setReplyTo(null)}
                                  className="ml-auto text-blue-500 hover:text-blue-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <div className="h-7 w-7 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden border border-stone-200 dark:border-stone-700 shrink-0">
                                {user?.profile_photo_url ? (
                                  <img src={resolveMediaUrl(user.profile_photo_url)} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-stone-400 text-xs font-bold">
                                    {user?.first_name?.[0]}
                                  </div>
                                )}
                              </div>
                              <input
                                value={newCommentText[post.id] || ''}
                                onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder={replyTo?.postId === post.id ? (t('posts.writeReply') || 'Escribe una respuesta...') : (t('posts.writeComment') || 'Escribe un comentario...')}
                                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                              />
                              <button
                                type="submit"
                                disabled={!newCommentText[post.id]?.trim()}
                                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          </form>
                        )}

                        {!isAuthenticated && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
                            <Lock className="h-3.5 w-3.5" />
                            <span>{t('auth.loginToInteract') || 'Login to comment'}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            urls={lightbox.urls}
            currentIndex={lightbox.index}
            onClose={closeLightbox}
            onNext={() => setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.urls.length } : null)}
            onPrev={() => setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + prev.urls.length) % prev.urls.length } : null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setPostToDeleteId(null);
        }}
        title={t('common.delete') || 'Eliminar'}
        description={t('posts.confirmDelete')}
        confirmLabel={t('common.delete') || 'Eliminar'}
        cancelLabel={t('common.cancel') || 'Cancelar'}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default Posts;
