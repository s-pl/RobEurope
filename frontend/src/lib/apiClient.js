const FALLBACK_BASES = [
  'http://localhost:85/api',
  'http://46.101.255.106:85/api',
  'https://robeurope.samuelponce.es:85/api',
  'http://robeurope.samuelponce.es:85/api'
];
const STORAGE_KEY = 'robeurope:apiBaseUrl';

const normalizeBase = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.replace(/\/$/, '');
  if (/\/api$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
};

const readStoredBase = () => {
  try {
    if (typeof window === 'undefined') return '';
    return window.localStorage?.getItem(STORAGE_KEY) || '';
  } catch (error) {
    console.warn('No se pudo leer robeurope:apiBaseUrl', error);
    return '';
  }
};

const resolveDefaultBase = () => {
  const envBase = normalizeBase(import.meta.env.VITE_API_BASE_URL || '');
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL, 'envBase:', envBase);
  if (envBase) return envBase;

  const stored = normalizeBase(readStoredBase());
  console.log('stored:', stored);
  if (stored) return stored;

  if (typeof window !== 'undefined') {
    const { origin } = window.location;
    console.log('origin:', origin);
    if (origin.includes('46.101.255.106')) {
      return normalizeBase(origin);
    }
    if (origin.includes('robeurope.samuelponce.es')) {
      return normalizeBase(origin);
    }
  }

  for (const fallback of FALLBACK_BASES) {
    const normalized = normalizeBase(fallback);
    if (normalized) return normalized;
  }

  return 'http://localhost:85/api';
};

let apiBaseUrl = resolveDefaultBase();

const getApiBaseUrl = () => apiBaseUrl;

export const setApiBaseUrl = (nextBase) => {
  const normalized = normalizeBase(nextBase);
  if (!normalized) return;
  apiBaseUrl = normalized;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.setItem(STORAGE_KEY, normalized);
    } catch (error) {
      console.warn('No se pudo guardar robeurope:apiBaseUrl', error);
    }
  }
};

const getApiOrigin = () => getApiBaseUrl().replace(/\/?api\/?$/, '');

const getCandidateBases = () => {
  const primary = getApiBaseUrl();
  const seen = new Set([primary]);
  const candidates = [primary];
  for (const fallback of FALLBACK_BASES) {
    const normalized = normalizeBase(fallback);
    if (normalized && !seen.has(normalized)) {
      candidates.push(normalized);
      seen.add(normalized);
    }
  }
  return candidates;
};

const fetchWithFallback = async (path, options) => {
  const candidates = getCandidateBases();
  const primary = candidates[0];
  let lastError;

  for (const base of candidates) {
    try {
      const response = await fetch(`${base}${path}`, options);
      if (base !== primary) {
        setApiBaseUrl(base);
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No se pudo conectar con la API configurada');
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

export async function apiRequest(path, { method = 'GET', body, token, headers = {}, formData = false } = {}) {
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

  const response = await fetchWithFallback(path, options);
  const payload = await parseResponse(response);

  if (!response.ok) {
    const error = typeof payload === 'string' ? { message: payload } : payload;
    throw new Error(error?.error || error?.message || 'Request failed');
  }

  return payload;
}

export const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiOrigin()}${path}`;
};

export { getApiBaseUrl };
