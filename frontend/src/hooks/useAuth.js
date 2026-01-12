/**
 * @fileoverview Convenience hook for accessing the AuthContext.
 */

import { useAuthContext } from '../context/AuthContext';

/**
 * Shortcut to `useAuthContext()`.
 * @returns {any}
 */
export const useAuth = () => useAuthContext();
