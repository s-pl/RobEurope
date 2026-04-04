import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Users, Trophy, Info, X, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const ICON_MAP = {
  team_invite: { Icon: Users,  bg: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400' },
  competition: { Icon: Trophy, bg: 'bg-amber-100 dark:bg-amber-900/30',   color: 'text-amber-600 dark:text-amber-400' },
  info:        { Icon: Info,   bg: 'bg-cyan-100 dark:bg-cyan-900/30',     color: 'text-cyan-600 dark:text-cyan-400' },
  default:     { Icon: Bell,   bg: 'bg-stone-100 dark:bg-stone-800',      color: 'text-stone-500 dark:text-stone-400' },
};

const PAGE_SIZE = 15;

const NotificationIcon = ({ type }) => {
  const { Icon, bg, color } = ICON_MAP[type] || ICON_MAP.default;
  return (
    <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
  );
};

const formatTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const Notifications = () => {
  const { t } = useTranslation();
  const api = useApi();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const data = await api(
          `/notifications?page=${pageNum}&limit=${PAGE_SIZE}`
        );

        const items = Array.isArray(data) ? data : data.notifications || [];
        const total = data.total ?? null;

        if (append) {
          setNotifications((prev) => [...prev, ...items]);
        } else {
          setNotifications(items);
        }

        if (total !== null) {
          setHasMore(pageNum * PAGE_SIZE < total);
        } else {
          setHasMore(items.length === PAGE_SIZE);
        }
      } catch {
        // silently handle — empty state will show
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [api]
  );

  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  // Real-time updates
  useEffect(() => {
    if (!socket || !user) return;
    const channel = `notification:${user.id}`;
    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    socket.on(channel, handler);
    return () => socket.off(channel, handler);
  }, [socket, user]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const markAsRead = async (id) => {
    try {
      await api(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  const handleInviteAction = async (notificationId, action) => {
    try {
      await api(`/notifications/${notificationId}/${action}`, {
        method: 'POST',
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, invite_status: action === 'accept' ? 'accepted' : 'declined' }
            : n
        )
      );
    } catch {
      // ignore
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filterTabs = [
    { key: 'all', label: t('notifications.all') || 'All' },
    { key: 'unread', label: t('notifications.unread') || 'Unread' },
    { key: 'read', label: t('notifications.read') || 'Read' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
            {t('notifications.title') || 'Notifications'}
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {unreadCount} {t('notifications.unreadCount') || 'unread'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-2 border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t('notifications.markAllRead') || 'Mark all read'}
            </span>
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-stone-200 dark:border-stone-700">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-2 text-sm font-medium transition-colors relative ${
              filter === tab.key
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            {tab.label}
            {filter === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <Bell className="h-7 w-7 text-stone-400 dark:text-stone-500" />
          </div>
          <p className="text-stone-500 dark:text-stone-400 font-medium">
            {t('notifications.empty') || 'No notifications'}
          </p>
          <p className="text-stone-400 dark:text-stone-500 text-sm mt-1">
            {t('notifications.emptyDesc') || "You're all caught up."}
          </p>
        </div>
      ) : (
        /* Notification list */
        <div>
          <AnimatePresence initial={false}>
            {filtered.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !notification.read)
                      markAsRead(notification.id);
                  }}
                  className={`group flex items-start gap-3 py-3.5 px-3 -mx-3 cursor-pointer transition-colors border-l-2 ${
                    !notification.read
                      ? notification.type === 'team_invite'
                        ? 'border-l-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                        : notification.type === 'competition'
                        ? 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-l-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20'
                      : 'border-l-transparent hover:bg-stone-50 dark:hover:bg-stone-800/50'
                  }`}
                >
                  <NotificationIcon type={notification.type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={`text-sm leading-snug ${
                            !notification.read
                              ? 'font-semibold text-stone-900 dark:text-stone-100'
                              : 'font-medium text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-stone-400 dark:text-stone-500 whitespace-nowrap">
                          {formatTimeAgo(notification.created_at || notification.createdAt)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 rounded text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={t('notifications.delete') || 'Delete'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Team invite actions */}
                    {notification.type === 'team_invite' &&
                      !notification.invite_status && (
                        <div className="flex items-center gap-2 mt-2.5">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInviteAction(notification.id, 'accept');
                            }}
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {t('notifications.accept') || 'Accept'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInviteAction(notification.id, 'decline');
                            }}
                            className="h-7 text-xs border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400"
                          >
                            <X className="h-3 w-3 mr-1" />
                            {t('notifications.decline') || 'Decline'}
                          </Button>
                        </div>
                      )}

                    {notification.type === 'team_invite' &&
                      notification.invite_status && (
                        <Badge
                          variant={
                            notification.invite_status === 'accepted'
                              ? 'success'
                              : 'secondary'
                          }
                          className="mt-2"
                        >
                          {notification.invite_status === 'accepted'
                            ? t('notifications.accepted') || 'Accepted'
                            : t('notifications.declined') || 'Declined'}
                        </Badge>
                      )}

                    {/* Read indicator */}
                    {!notification.read && (
                      <span className={`inline-block w-2 h-2 rounded-full absolute top-4 right-3 sm:hidden ${
                        notification.type === 'team_invite' ? 'bg-violet-500' :
                        notification.type === 'competition' ? 'bg-amber-500' : 'bg-cyan-500'
                      }`} />
                    )}
                  </div>
                </div>

                <div className="border-b border-stone-100 dark:border-stone-800" />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-6 pb-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                {loadingMore
                  ? t('notifications.loading') || 'Loading...'
                  : t('notifications.loadMore') || 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
