/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import { getApiBaseUrl } from '../lib/apiClient';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);

  const socketUrl = useMemo(() => getApiBaseUrl().replace(/\/api$/i, ''), []);

  const socket = useMemo(() => io(socketUrl, { transports: ['websocket', 'polling'] }), [socketUrl]);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
