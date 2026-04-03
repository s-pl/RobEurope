/* eslint-disable react-refresh/only-export-components */

/**
 * @fileoverview
 * Realtime context — previously Socket.IO, now Supabase Realtime.
 *
 * Exposes `{ supabase }` (the shared Supabase client) via React context.
 * Components subscribe to Postgres Changes or Broadcast channels directly.
 */

import { createContext, useContext, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const RealtimeContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const value = useMemo(() => ({ supabase }), []);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

/**
 * Returns `{ supabase }` — the shared Supabase client for Realtime subscriptions.
 */
export const useSocket = () => {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
