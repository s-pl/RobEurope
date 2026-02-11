import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
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

/**
 * Notifications dropdown (bell icon).
 *
 * Responsibilities:
 * - Fetches latest notifications for the current user.
 * - Connects to Socket.IO to receive realtime notifications.
 * - Handles marking notifications as read (single/all).
 * - Renders actionable invite notifications when `notification.meta.invite_token` is present.
 * - Uses lightweight CSS-only animations for smooth open/close and a responsive feel.
 *
 * @returns {JSX.Element}
 */

const NotificationsBell = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const api = useApi();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const socketUrl = useMemo(() => {
    return getApiOrigin();
  }, []);

  useEffect(() => {
    let socket;

    const bootstrap = async () => {
      if (!user?.id) return;

      try {
        const list = await api(`/notifications?user_id=${encodeURIComponent(user.id)}&limit=20`);
        const arr = Array.isArray(list) ? list : [];
        setItems(arr);
        setUnread(arr.filter((n) => !n.is_read).length);
      } catch {
        // ignore
      }
      if (!isBackendActive) return;

      await requestNotificationPermission();

      try {
        // Push registration
        const reg = await registerServiceWorker();
        if (reg) await subscribeToPush(reg);
      } catch {
        // ignore
      }

      try {
        socket = io(socketUrl, { transports: ['websocket', 'polling'] });
        const channel = `notification:${user.id}`;
        socket.on(channel, (notif) => {
          setItems((prev) => [notif, ...prev].slice(0, 20));
          setUnread((x) => x + 1);
          // Web notification
          showNotification(notif.title || 'Nueva notificación', { body: notif.message || '', tag: `notif-${notif.id}` });
        });
      } catch {
        // ignore
      }
    };

    if (user?.id) bootstrap();
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user?.id, socketUrl, api]);

  const markAsRead = async (id) => {
    try {
      await api(`/notifications/${id}`, { method: 'PUT', body: { is_read: true } });
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = items.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(unreadIds.map(id => api(`/notifications/${id}`, { method: 'PUT', body: { is_read: true } })));
      
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
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

      // Mark as read locally to keep UX snappy
      setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
      setUnread((prev) => Math.max(0, prev - 1));
      // Best-effort persist read state
      try {
        await api(`/notifications/${notification.id}`, { method: 'PUT', body: { is_read: true } });
      } catch {
        // ignore
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          {unread > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
          )}
          <span className="sr-only">{t('nav.notifications') || 'Notifications'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        align="end"
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Notificaciones</h4>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-2 text-xs" onClick={markAllAsRead}>
              Marcar todo leído
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {items.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              No tienes notificaciones
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 ${
                    !item.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => !item.is_read && markAsRead(item.id)}
                >
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-medium leading-none ${!item.is_read ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.message}
                    </p>

                    {item.type === 'team_invite' && item?.meta?.invite_token && (
                      <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={busyId === item.id}
                          onClick={() => runInviteAction(item, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={busyId === item.id}
                          onClick={() => runInviteAction(item, 'decline')}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                    
                  </div>
                  {!item.is_read && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
