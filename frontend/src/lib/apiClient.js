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
      'Falta VITE_API_BASE_URL. Configúralo en frontend/.env (ej: VITE_API_BASE_URL=http://localhost:85/api)'
    );
  }
  return envBase;
};

const getApiBaseUrl = () => requireApiBaseUrl();

export const getApiOrigin = () => getApiBaseUrl().replace(/\/?api\/?$/, '');

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

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, options);
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
