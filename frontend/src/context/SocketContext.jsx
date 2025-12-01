import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import { getApiBaseUrl } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const socketUrl = useMemo(() => getApiBaseUrl().replace(/\/api$/i, ''), []);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(socketUrl, { transports: ['websocket', 'polling'] });
      socketRef.current.on('connect', () => setConnected(true));
      socketRef.current.on('disconnect', () => setConnected(false));
    }
    return () => {
      // Do not auto-disconnect to keep global connection; could implement cleanup on unmount of App
    };
  }, [socketUrl]);

  const value = useMemo(() => ({ socket: socketRef.current, connected }), [connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
