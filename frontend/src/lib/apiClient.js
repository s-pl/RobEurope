/**
 * @fileoverview
 * Frontend HTTP client utilities.
 *
 * All API requests are routed through `VITE_API_BASE_URL` (configured in `frontend/.env`).
 * The application uses cookie-based sessions, so requests are sent with `credentials: 'include'`.
 *
 * GET requests are cached in memory for `DEFAULT_TTL` ms and deduplicated:
 * parallel calls to the same URL share one in-flight fetch.
 * Pass `ttl: 0` to skip the cache for a specific call.
 * Call `invalidateCache(pathPattern)` to bust stale entries (e.g. after a mutation).
 */

import { mockApiRequest } from './mockBackend';

// Auth0 token getter — set by AuthContext after Auth0 initialises
let _getToken = null;
export function setTokenGetter(fn) { _getToken = fn; }

// ─── Cache ────────────────────────────────────────────────────────────────────

const DEFAULT_TTL = 30_000; // 30 s — adjust per endpoint via ttl option

/** key → { data, exp } */
const _cache = new Map();
/** key → Promise (in-flight deduplication) */
const _inflight = new Map();

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) { _cache.delete(key); return null; }
  return entry.data;
}

function setCached(key, data, ttl) {
  _cache.set(key, { data, exp: Date.now() + ttl });
}

/**
 * Removes all cache entries whose key contains `pattern`.
 * Call after mutations to invalidate stale GET responses.
 *
 * @param {string} pattern Substring to match against cache keys.
 */
export function invalidateCache(pattern) {
  for (const key of _cache.keys()) {
    if (key.includes(pattern)) _cache.delete(key);
  }
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

/**
 * Normalizes a base URL into an API base ending with `/api`.
 */
const normalizeBase = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.replace(/\/$/, '');
  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
};

export const isBackendActive = (() => {
  const raw = import.meta.env.VITE_IS_BACKEND_ACTIVE ?? import.meta.env.IS_BACKEND_ACTIVE;
  if (raw === undefined || raw === null || raw === '') return true;
  if (typeof raw === 'boolean') return raw;
  const normalized = String(raw).trim().toLowerCase();
  return !['false', '0', 'no', 'off'].includes(normalized);
})();

const requireApiBaseUrl = () => {
  if (!isBackendActive) return '';
  const envBase = normalizeBase(import.meta.env.VITE_API_BASE_URL || '');
  if (!envBase) {
    throw new Error(
      'Falta VITE_API_BASE_URL. Configúralo en frontend/.env (ej: VITE_API_BASE_URL=http://localhost:85)'
    );
  }
  return envBase;
};

const getApiBaseUrl = () => requireApiBaseUrl();

/**
 * Returns the backend origin (without the `/api` suffix).
 * Used for Socket.IO and static asset URLs.
 */
export const getApiOrigin = () => {
  const base = getApiBaseUrl();
  if (!base) return '';
  return base.replace(/\/?api\/?$/, '');
};

// ─── Response parsing ─────────────────────────────────────────────────────────

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) return response.json();
  return response.text();
};

// ─── Main request function ────────────────────────────────────────────────────

/**
 * Executes an API request against the configured backend.
 *
 * - `path` must start with `/` (e.g. `/teams`, `/auth/login`).
 * - Session cookies are automatically included.
 * - GET requests are cached for `ttl` ms and deduplicated across parallel calls.
 * - Throws an Error when the response is not OK.
 *
 * @param {string} path API path.
 * @param {object} [options]
 * @param {string}  [options.method='GET']
 * @param {any}     [options.body]
 * @param {Record<string,string>} [options.headers={}]
 * @param {boolean} [options.formData=false]
 * @param {number}  [options.ttl] Cache TTL in ms. Defaults to 30 s. Pass 0 to bypass cache.
 * @returns {Promise<any>}
 */
export async function apiRequest(path, { method = 'GET', body, headers = {}, formData = false, ttl = DEFAULT_TTL } = {}) {
  if (!isBackendActive) {
    return mockApiRequest(path, { method, body, headers, formData });
  }

  const cacheKey = `${method}:${path}`;
  const cacheable = method === 'GET' && ttl > 0;

  if (cacheable) {
    const cached = getCached(cacheKey);
    if (cached !== null) return cached;
    // Deduplicate: if the same GET is already in flight, share its promise
    if (_inflight.has(cacheKey)) return _inflight.get(cacheKey);
  }

  const execute = async () => {
    const finalHeaders = { ...headers };

    // Attach Auth0 access token if available
    if (_getToken) {
      try {
        const token = await _getToken();
        if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
      } catch { /* unauthenticated — continue without token */ }
    }

    const options = { method, headers: finalHeaders };

    if (body) {
      if (formData || (typeof FormData !== 'undefined' && body instanceof FormData)) {
        options.body = body;
        delete finalHeaders['Content-Type'];
      } else {
        finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
        options.body = JSON.stringify(body);
      }
    }

    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}${path}`, options);
    const payload = await parseResponse(response);

    if (!response.ok) {
      const error = typeof payload === 'string' ? { message: payload } : payload;
      throw new Error(error?.error || error?.message || 'Request failed');
    }

    if (cacheable) setCached(cacheKey, payload, ttl);
    return payload;
  };

  const promise = execute();

  if (cacheable) {
    _inflight.set(cacheKey, promise);
    promise.finally(() => _inflight.delete(cacheKey));
  }

  return promise;
}

/**
 * Resolves a backend-served media path to a fully qualified URL.
 */
export const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const origin = getApiOrigin();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
};

export { getApiBaseUrl };
