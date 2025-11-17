import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { getApiBaseUrl } from '../../lib/apiClient';

const NotificationsBell = () => {
  const { user } = useAuth();
  const api = useApi();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const socketUrl = useMemo(() => {
    // socket.io server assumed on same origin as API base url (without /api)
    const apiBase = getApiBaseUrl();
    return apiBase.replace(/\/api$/i, '');
  }, []);

  useEffect(() => {
    let socket;
    let alive = true;

    const bootstrap = async () => {
      // initial load via REST (fallback when sockets not available)
      try {
        const list = await api(`/notifications?user_id=${encodeURIComponent(user.id)}&limit=20`);
        if (alive) {
          setItems(Array.isArray(list) ? list : []);
          setUnread(list.filter(n => !n.is_read).length);
        }
      } catch (_) {}

      // live updates via socket.io (if backend emits events like 'notification:{userId}')
      try {
        socket = io(socketUrl, { transports: ['websocket', 'polling'] });
        const channel = `notification:${user.id}`;
        socket.on(channel, (notif) => {
          setItems((prev) => [notif, ...prev].slice(0, 20));
          setUnread((x) => x + 1);
        });
      } catch (_) {}
    };

    if (user?.id) bootstrap();
    return () => {
      alive = false;
      if (socket) socket.disconnect();
    };
  }, [api, socketUrl, user?.id]);

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-700 hover:border-slate-900"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Notificaciones
          </div>
          <ul className="max-h-96 divide-y overflow-auto">
            {items.length === 0 ? (
              <li className="p-3 text-sm text-slate-500">Sin notificaciones</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="p-3 text-sm">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  <p className="text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
