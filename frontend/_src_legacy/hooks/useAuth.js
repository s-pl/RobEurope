/**
 * @fileoverview
 * Convenience hook for accessing the AuthContext.
 * @module hooks/useAuth
 */

import { useAuthContext } from '../context/AuthContext';

/**
 * Custom hook providing access to authentication state and methods.
 * Shortcut to `useAuthContext()`.
 * 
 * @returns {Object} Authentication context value.
 * @property {Object|null} user - Current authenticated user or null.
 * @property {boolean} loading - Whether authentication state is being loaded.
 * @property {Function} login - Function to log in a user.
 * @property {Function} logout - Function to log out the current user.
 * @property {Function} register - Function to register a new user.
 * @property {Function} refresh - Function to refresh user data from the server.
 * @example
 * const { user, login, logout } = useAuth();
 */
export const useAuth = () => useAuthContext();
