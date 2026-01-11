/**
 * @fileoverview
 * Frontend HTTP client utilities.
 *
 * All API requests are routed through `VITE_API_BASE_URL` (configured in `frontend/.env`).
 * The application uses cookie-based sessions, so requests are sent with `credentials: 'include'`.
 */

/**
 * Normalizes a base URL into an API base ending with `/api`.
 *
 * Examples:
 * - `http://localhost:85` -> `http://localhost:85/api`
 * - `http://localhost:85/api/` -> `http://localhost:85/api`
 *
 * @param {string} url Raw base URL.
 * @returns {string} Normalized API base URL or empty string.
 */
const normalizeBase = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.replace(/\/$/, '');
  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
};

const requireApiBaseUrl = () => {
  const envBase = normalizeBase(import.meta.env.VITE_API_BASE_URL || '');
  if (!envBase) {
    throw new Error(
      'Falta VITE_API_BASE_URL. Configúralo en frontend/.env (ej: VITE_API_BASE_URL=http://localhost:85 o http://localhost:85/api)'
    );
  }
  return envBase;
};

const getApiBaseUrl = () => requireApiBaseUrl();

/**
 * Returns the backend origin (without the `/api` suffix).
 *
 * This is primarily used for Socket.IO and for serving static assets.
 *
 * @returns {string} Origin URL, e.g. `http://localhost:85`.
 */
export const getApiOrigin = () => getApiBaseUrl().replace(/\/?api\/?$/, '');

/**
 * Parses a fetch Response into JSON (when possible) or plain text.
 * @param {Response} response Fetch response.
 * @returns {Promise<any>} Parsed payload.
 */
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

/**
 * Executes an API request against the configured backend.
 *
 * Notes:
 * - `path` must be an API path starting with `/` (e.g. `/teams`, `/auth/login`).
 * - Session cookies are automatically included.
 * - Throws an Error when the response is not OK.
 *
 * @param {string} path API path (prefixed automatically by `VITE_API_BASE_URL`).
 * @param {object} [options]
 * @param {string} [options.method='GET'] HTTP method.
 * @param {any} [options.body] JSON body (object) or FormData.
 * @param {Record<string,string>} [options.headers={}] Extra headers.
 * @param {boolean} [options.formData=false] When true, forces FormData behavior.
 * @returns {Promise<any>} Parsed response body.
 */
export async function apiRequest(path, { method = 'GET', body, headers = {}, formData = false } = {}) {
  const finalHeaders = { ...headers };

  // Session based auth - no token needed
  // if (token) {
  //   finalHeaders.Authorization = `Bearer ${token}`;
  // }

  const options = { 
    method, 
    headers: finalHeaders,
    credentials: 'include'
  };

  if (body) {
    if (formData || (typeof FormData !== 'undefined' && body instanceof FormData)) {
      options.body = body;
      // Let browser set Content-Type with boundary
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

  return payload;
}

/**
 * Resolves a backend-served media path to a fully qualified URL.
 *
 * - Absolute URLs are returned unchanged.
 * - Relative paths are resolved against the API origin.
 *
 * @param {string} path Backend media path, e.g. `/uploads/file.jpg`.
 * @returns {string} Fully qualified URL.
 */
export const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const origin = getApiOrigin();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
};

export { getApiBaseUrl };
