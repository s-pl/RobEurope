import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, UserPlus, Trophy, Trash2, CheckCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { getApiOrigin, isBackendActive } from '../../lib/apiClient';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { requestNotificationPermission, showNotification } from '../../lib/notifications';
import { registerServiceWorker, subscribeToPush } from '../../lib/push';

// ── Type metadata (icon + colour per notification type) ────────────────────────

const TYPE_META = {
  team_invite: {
    Icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  registration: {
    Icon: Trophy,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  default: {
    Icon: Info,
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
  },
};

// ── Single notification row ────────────────────────────────────────────────────
// Supports swipe-left-to-delete gesture and animated entrance/exit.

const NotifItem = ({ item, onMarkRead, onDelete, onInviteAction, busyId }) => {
  const { t } = useTranslation();
  const isDragging = useRef(false);
  const { Icon, color, bg } = TYPE_META[item.type] ?? TYPE_META.default;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: 32, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -90, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="relative overflow-hidden"
    >
      {/* Delete-action layer revealed on swipe */}
      <div className="absolute inset-y-0 right-0 w-16 flex items-center justify-center bg-red-500 pointer-events-none">
        <Trash2 className="h-4 w-4 text-white" />
      </div>

      {/* Draggable content layer */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -64, right: 0 }}
        dragElastic={{ left: 0.06, right: 0 }}
        style={{ touchAction: 'pan-y' }}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={(_, info) => {
          // dismiss on long drag OR fast flick
          const shouldDismiss = info.offset.x < -46 || info.velocity.x < -350;
          setTimeout(() => { isDragging.current = false; }, 80);
          if (shouldDismiss) onDelete(item.id);
        }}
        whileHover={{ backgroundColor: item.is_read ? 'rgba(0,0,0,0.018)' : undefined }}
        className={`relative flex items-start gap-3 p-4 cursor-grab active:cursor-grabbing select-none ${
          !item.is_read ? 'bg-blue-50/60 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-950'
        }`}
        onClick={() => {
          if (!isDragging.current && !item.is_read) onMarkRead(item.id);
        }}
      >
        {/* Type icon */}
        <motion.div
          whileHover={{ scale: 1.12 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${bg}`}
        >
          <Icon className={`h-4 w-4 ${color}`} />
        </motion.div>

        {/* Text content */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className={`text-sm font-medium leading-tight ${
            !item.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
          }`}>
            {item.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
            {item.message}
          </p>

          {/* Invite action buttons */}
          {item.type === 'team_invite' && item?.meta?.invite_token && (
            <div className="flex gap-1.5 pt-2" onClick={e => e.stopPropagation()}>
              <motion.button
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.05, backgroundColor: '#1d4ed8' }}
                disabled={busyId === item.id}
                onClick={() => onInviteAction(item, 'accept')}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50"
              >
                {busyId === item.id
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                  : <><CheckCheck className="h-3 w-3" /> {t('notifications.accept')}</>
                }
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.05 }}
                disabled={busyId === item.id}
                onClick={() => onInviteAction(item, 'decline')}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
              >
                {t('notifications.decline')}
              </motion.button>
            </div>
          )}
        </div>

        {/* Unread dot */}
        {!item.is_read && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
            className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-blue-500"
          />
        )}
      </motion.div>
    </motion.div>
  );
};

// ── Main bell component ────────────────────────────────────────────────────────

/**
 * Notifications bell with:
 * - Animated ring when new notification arrives
 * - Count badge (not just a dot)
 * - Swipe-left-to-delete per notification
 * - Per-type icons
 * - Staggered entrance / smooth exit animations
 * - Accept/Decline invite buttons with loading spinners
 */
const NotificationsBell = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const api = useApi();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const prevUnread = useRef(-1);
  const [bellRinging, setBellRinging] = useState(false);

  const socketUrl = useMemo(() => getApiOrigin(), []);

  // ── Ring the bell whenever unread count increases ────────────────────────
  useEffect(() => {
    const prev = prevUnread.current;
    prevUnread.current = unread;
    if (unread > prev && prev >= 0) {
      setBellRinging(true);
      const timer = setTimeout(() => setBellRinging(false), 700);
      return () => clearTimeout(timer);
    }
  }, [unread]);

  // ── Bootstrap: fetch + socket ─────────────────────────────────────────────
  useEffect(() => {
    let socket;

    const bootstrap = async () => {
      if (!user?.id) return;

      try {
        const list = await api(`/notifications?user_id=${encodeURIComponent(user.id)}&limit=20`);
        const arr = Array.isArray(list) ? list : [];
        setItems(arr);
        setUnread(arr.filter(n => !n.is_read).length);
      } catch {
        // ignore
      }

      if (!isBackendActive) return;

      await requestNotificationPermission();

      try {
        const reg = await registerServiceWorker();
        if (reg) await subscribeToPush(reg);
      } catch {
        // ignore
      }

      try {
        socket = io(socketUrl, { transports: ['websocket', 'polling'] });
        socket.on(`notification:${user.id}`, (notif) => {
          setItems(prev => [notif, ...prev].slice(0, 20));
          setUnread(x => x + 1);
          showNotification(notif.title || 'Nueva notificación', {
            body: notif.message || '',
            tag: `notif-${notif.id}`,
          });
        });
      } catch {
        // ignore
      }
    };

    if (user?.id) bootstrap();
    return () => { if (socket) socket.disconnect(); };
  }, [user?.id, socketUrl, api]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const markAsRead = async (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    try {
      await api(`/notifications/${id}`, { method: 'PUT', body: { is_read: true } });
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = items.filter(n => !n.is_read).map(n => n.id);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await Promise.all(unreadIds.map(id =>
        api(`/notifications/${id}`, { method: 'PUT', body: { is_read: true } })
      ));
    } catch {
      // ignore
    }
  };

  // Optimistic delete — removes from UI immediately, best-effort on backend
  const deleteNotification = (id) => {
    setItems(prev => {
      const item = prev.find(n => n.id === id);
      if (item && !item.is_read) setUnread(u => Math.max(0, u - 1));
      return prev.filter(n => n.id !== id);
    });
    api(`/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const runInviteAction = async (notification, action) => {
    const token = notification?.meta?.invite_token;
    if (!token) return;

    setBusyId(notification.id);
    try {
      if (action === 'accept') {
        await api('/teams/invitations/accept', { method: 'POST', body: { token } });
      } else if (action === 'decline') {
        await api('/teams/invitations/decline', { method: 'POST', body: { token } });
      }
      setItems(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
      try {
        await api(`/notifications/${notification.id}`, { method: 'PUT', body: { is_read: true } });
      } catch {
        // ignore
      }
    } finally {
      setBusyId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative overflow-visible">
          {/* Bell — rings/shakes on new notification */}
          <motion.div
            animate={bellRinging
              ? { rotate: [0, -18, 15, -10, 8, -4, 0] }
              : { rotate: 0 }
            }
            style={{ transformOrigin: 'top center' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </motion.div>

          {/* Unread badge — shows count, pops in/out */}
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key={unread}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950 text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none pointer-events-none"
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="sr-only">{t('notifications.title')}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                {t('notifications.title')}
              </h4>
              <AnimatePresence>
                {unread > 0 && (
                  <motion.span
                    key="hdr-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-1.5"
                  >
                    {unread}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {unread > 0 && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {t('notifications.markAllRead')}
              </motion.button>
            )}
          </div>

          {/* List */}
          <ScrollArea className="h-[340px]">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400 dark:text-slate-500"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Bell className="h-8 w-8" />
                </motion.div>
                <p className="text-sm">{t('notifications.empty')}</p>
              </motion.div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <AnimatePresence initial={false}>
                  {items.map(item => (
                    <NotifItem
                      key={item.id}
                      item={item}
                      onMarkRead={markAsRead}
                      onDelete={deleteNotification}
                      onInviteAction={runInviteAction}
                      busyId={busyId}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>

          {/* Footer hint */}
          {items.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 text-center">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 select-none">
                {t('notifications.hint')}
              </p>
            </div>
          )}
        </motion.div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;

