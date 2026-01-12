/* eslint-disable react-refresh/only-export-components */

/**
 * @fileoverview Socket.IO context provider.
 *
 * Creates a single Socket.IO client pointing at the backend origin derived from
 * `VITE_API_BASE_URL` and exposes `{ socket, connected }` via React context.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import { getApiOrigin } from '../lib/apiClient';

const SocketContext = createContext(null);

/**
 * @typedef {object} SocketContextValue
 * @property {object} socket
 * @property {boolean} connected
 */

/**
 * Provides a Socket.IO client and connection status.
 *
 * @param {object} props
 * @param {any} props.children
 * @returns {JSX.Element}
 */
export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);

  const socketUrl = useMemo(() => getApiOrigin(), []);

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

/**
 * Access the Socket.IO context.
 * @returns {SocketContextValue}
 */
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
