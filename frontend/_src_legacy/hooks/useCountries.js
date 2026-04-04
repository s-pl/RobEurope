/**
 * @fileoverview Countries hook.
 *
 * Fetches `/api/countries` and returns list + loading/error state.
 */

import { useState, useEffect } from 'react';
import { useApi } from './useApi';

/**
 * @returns {{ countries: any[], loading: boolean, error: string|null }}
 */
export const useCountries = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const data = await api('/countries');
        setCountries(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [api]);

  return { countries, loading, error };
};
