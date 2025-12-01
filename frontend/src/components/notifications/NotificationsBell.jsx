import { useEffect, useMemo, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { getApiBaseUrl } from '../../lib/apiClient';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { requestNotificationPermission, showNotification } from '../../lib/notifications';

const NotificationsBell = () => {
  const { user } = useAuth();
  const api = useApi();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const socketUrl = useMemo(() => {
    const apiBase = getApiBaseUrl();
    return apiBase.replace(/\/api$/i, '');
  }, []);

  const fetchNotifications = async () => {
    try {
      const list = await api(`/notifications?user_id=${encodeURIComponent(user.id)}&limit=20`);
      setItems(Array.isArray(list) ? list : []);
      setUnread(list.filter(n => !n.is_read).length);
    } catch (_) {}
  };

  useEffect(() => {
    let socket;
    let alive = true;

    const bootstrap = async () => {
      await fetchNotifications();
      await requestNotificationPermission();

      try {
        socket = io(socketUrl, { transports: ['websocket', 'polling'] });
        const channel = `notification:${user.id}`;
        socket.on(channel, (notif) => {
          setItems((prev) => [notif, ...prev].slice(0, 20));
          setUnread((x) => x + 1);
          // Web notification
          showNotification(notif.title || 'Nueva notificación', { body: notif.message || '', tag: `notif-${notif.id}` });
        });
      } catch (_) {}
    };

    if (user?.id) bootstrap();
    return () => {
      alive = false;
      if (socket) socket.disconnect();
    };
  }, [user?.id, socketUrl, api]);

  const markAsRead = async (id) => {
    try {
      await api(`/notifications/${id}`, { method: 'PUT', body: { is_read: true } });
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = items.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(unreadIds.map(id => api(`/notifications/${id}`, { method: 'PUT', body: { is_read: true } })));
      
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (_) {}
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          {unread > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
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
