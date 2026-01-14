/* eslint-disable react-refresh/only-export-components */

/**
 * @fileoverview
 * Socket.IO context provider for real-time communication.
 * 
 * Creates a single Socket.IO client pointing at the backend origin derived from
 * `VITE_API_BASE_URL` and exposes `{ socket, connected }` via React context.
 * @module context/SocketContext
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import { getApiOrigin } from '../lib/apiClient';

/**
 * React context for Socket.IO client.
 * @type {React.Context<SocketContextValue|null>}
 */
const SocketContext = createContext(null);

/**
 * @typedef {Object} SocketContextValue
 * @property {Object} socket - Socket.IO client instance.
 * @property {boolean} connected - Whether the socket is currently connected.
 */

/**
 * Socket.IO provider component.
 * Manages a single Socket.IO connection for real-time features.
 * 
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components.
 * @returns {JSX.Element} Provider component.
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
