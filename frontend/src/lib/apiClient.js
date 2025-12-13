const FALLBACK_BASES = [
  'https://api.robeurope.samuelponce.es/api',
  'http://localhost:85/api'
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
  const storedBase = normalizeBase(readStoredBase());
  if (storedBase) return storedBase;

  const envBase = normalizeBase(import.meta.env.VITE_API_BASE_URL || '');
  if (envBase) return envBase;

  return 'https://api.robeurope.samuelponce.es/api';
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
  const origin = getApiOrigin();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
};

export { getApiBaseUrl };
