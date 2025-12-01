import { useEffect, useState } from 'react';
import { useEditMode } from '../context/EditModeContext';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Image as ImageIcon, Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2, Pin } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { resolveMediaUrl } from '../lib/apiClient';
import { useToast } from '../hooks/useToast';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import DOMPurify from 'dompurify';
import { useSocket } from '../context/SocketContext';

const Posts = () => {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { editMode } = useEditMode();
  const api = useApi();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', image: null });
  
  // New state for comments
  const [activePostId, setActivePostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await api(`/posts?q=${search}`);
      setPosts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search]);

  // Realtime subscriptions
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
    };
    socket.on('post_created', onCreated);
    socket.on('post_updated', onUpdated);
    socket.on('post_deleted', onDeleted);
    socket.on('post_pinned', onPinned);
    socket.on('post_liked', onLiked);
    socket.on('comment_added', onComment);
    return () => {
      socket.off('post_created', onCreated);
      socket.off('post_updated', onUpdated);
      socket.off('post_deleted', onDeleted);
      socket.off('post_pinned', onPinned);
      socket.off('post_liked', onLiked);
      socket.off('comment_added', onComment);
    };
  }, [socket]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('content', newPost.content);
      formData.append('author_id', user.id);
      if (newPost.image) {
        formData.append('image', newPost.image);
      }

      await api('/posts', {
        method: 'POST',
        body: formData,
        formData: true
      });

      setCreateOpen(false);
      setNewPost({ title: '', content: '', image: null });
      fetchPosts();
      toast({ title: t('posts.created'), variant: 'success' });
    } catch (error) {
      toast({ title: t('posts.error'), description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('posts.confirmDelete'))) return;
    try {
      await api(`/posts/${id}`, { method: 'DELETE' });
      setPosts(posts.filter(p => p.id !== id));
      toast({ title: t('posts.deleted'), variant: 'success' });
    } catch (error) {
      toast({ title: t('posts.error'), description: error.message, variant: 'destructive' });
    }
  };

  const handleLike = async (post) => {
    if (!isAuthenticated) {
        toast({ title: t('auth.required') || 'Login required', description: t('auth.loginToInteract') || 'Please login to interact', variant: 'default' });
        return;
    }
    try {
      const res = await api(`/posts/${post.id}/like`, { method: 'POST' });
      setPosts(posts.map(p => {
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

  const handlePin = async (post) => {
      try {
          const res = await api(`/posts/${post.id}/pin`, { method: 'POST' });
          setPosts(posts.map(p => p.id === post.id ? { ...p, is_pinned: res.is_pinned } : p));
          toast({ title: res.is_pinned ? t('posts.pinned') : t('posts.unpinned'), variant: 'success' });
      } catch (error) {
          toast({ title: t('posts.error'), description: error.message, variant: 'destructive' });
      }
  };

  const openComments = async (post) => {
      setActivePostId(post.id);
      setCommentsOpen(true);
      setComments([]); // Clear previous comments
      try {
          const data = await api(`/posts/${post.id}/comments`);
          setComments(data);
      } catch (error) {
          console.error(error);
      }
  };

  const handleAddComment = async (e) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      try {
          const comment = await api(`/posts/${activePostId}/comments`, {
              method: 'POST',
              body: { content: newComment }
          });
          setComments([...comments, comment]);
          setNewComment('');
           setPosts(posts.map(p => {
                if (p.id === activePostId) {
                    return { ...p, Comments: [...(p.Comments || []), { id: comment.id }] };
                }
                return p;
           }));
      } catch (error) {
          console.error(error);
      }
  };

  const handleShare = async (post) => {
    const shareData = {
      title: post.title,
      text: post.content,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${post.title}\n\n${post.content}`);
        toast({ title: 'Copiado al portapapeles', variant: 'success' });
      } catch (err) {
        toast({ title: 'Error al copiar', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="container mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">{t('posts.title')}{editMode && <span className="ml-3 text-xs px-2 py-1 rounded bg-amber-200 text-amber-800 align-top">EDIT MODE</span>}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('posts.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder={t('posts.search')} 
              className="pl-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin') && editMode && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> {t('posts.create')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('posts.createTitle')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePost} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">{t('posts.form.title')}</Label>
                    <Input 
                      id="title" 
                      value={newPost.title} 
                      onChange={e => setNewPost({...newPost, title: e.target.value})}
                      required 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">{t('posts.form.content')}</Label>
                    <div className="mt-1">
                      <RichTextEditor 
                        value={newPost.content} 
                        onChange={val => setNewPost({...newPost, content: val})}
                        placeholder={t('posts.form.content')}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="image">{t('posts.form.image')}</Label>
                    <Input 
                      id="image" 
                      type="file" 
                      accept="image/*"
                      onChange={e => setNewPost({...newPost, image: e.target.files[0]})}
                      className="mt-1"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={creating}>
                      {creating ? t('common.saving') : t('common.save')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            {t('posts.empty')}
          </div>
        ) : (
          posts.map(post => (
            <Card key={post.id} className={`overflow-hidden border-slate-200 dark:border-slate-800 ${post.is_pinned ? 'border-blue-500 dark:border-blue-500 ring-1 ring-blue-500' : ''} ${post._isNew ? 'animate-pulse border-amber-400' : ''}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                    {post.User?.profile_photo_url ? (
                      <img src={resolveMediaUrl(post.User.profile_photo_url)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold">
                        {post.User?.first_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {post.User ? `${post.User.first_name} ${post.User.last_name}` : 'Unknown User'}
                        </p>
                        {post.is_pinned && <Pin className="h-3 w-3 text-blue-500 fill-blue-500" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                    {user?.role === 'admin' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500" onClick={() => handlePin(post)}>
                            <Pin className={`h-4 w-4 ${post.is_pinned ? 'fill-blue-500 text-blue-500' : ''}`} />
                        </Button>
                    )}
                    {(user?.id === post.author_id || user?.role === 'admin') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete') }
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{post.title}</h3>
                <div 
                  className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 [&_img]:rounded-lg [&_img]:max-h-[500px] [&_img]:w-auto [&_img]:mx-auto"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                />
                
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img 
                      src={resolveMediaUrl(post.media_urls[0])} 
                      alt={post.title} 
                      className="w-full h-auto max-h-[500px] object-cover"
                    />
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-4 w-full">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`gap-2 ${post.PostLikes?.some(l => l.user_id === user?.id) ? 'text-red-500' : 'text-slate-500 hover:text-red-500 dark:text-slate-400'}`}
                    onClick={() => handleLike(post)}
                  >
                    <Heart className={`h-4 w-4 ${post.PostLikes?.some(l => l.user_id === user?.id) ? 'fill-current' : ''}`} />
                    <span>{post.PostLikes?.length || 0}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-slate-500 hover:text-blue-500 dark:text-slate-400"
                    onClick={() => openComments(post)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.Comments?.length || 0}</span>
                  </Button>
                  <div className="flex-1" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500"
                    onClick={() => handleShare(post)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{t('posts.comments')}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {comments.length === 0 ? (
                    <p className="text-center text-slate-500">{t('posts.noComments')}</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0">
                                {comment.User?.profile_photo_url ? (
                                    <img src={resolveMediaUrl(comment.User.profile_photo_url)} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-bold">
                                        {comment.User?.first_name?.[0]}
                                    </div>
                                )}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg flex-1">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-semibold text-sm">{comment.User?.first_name} {comment.User?.last_name}</span>
                                    <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {isAuthenticated && (
                <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                    <Input 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('posts.writeComment')}
                        className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={!newComment.trim()}>
                        {t('common.send')}
                    </Button>
                </form>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Posts;
