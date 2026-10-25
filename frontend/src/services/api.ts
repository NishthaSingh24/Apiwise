const formatApiUrl = (raw?: string | null): string => {
  if (!raw || raw === 'undefined' || raw === 'null') return '';
  let url = raw.trim().replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
};

export const getApiBaseUrl = (): string => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('apiwise_api_url') : null;
  if (customUrl) return formatApiUrl(customUrl);
  const envUrl = (import.meta as any)?.env?.VITE_API_BASE_URL;
  return formatApiUrl(envUrl);
};

export const getFullApiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  return base ? `${base}/api/v1${endpoint}` : `/api/v1${endpoint}`;
};

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('apiwise_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const requestUrl = getFullApiUrl(endpoint);

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    localStorage.removeItem('apiwise_token');
    localStorage.removeItem('apiwise_user');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new ApiError(json.message || 'An unexpected error occurred', response.status, json.data);
    }
    return json.data as T;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(text || 'Network request failed', response.status);
  }

  return {} as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  downloadBlob: async (endpoint: string): Promise<Blob> => {
    const token = localStorage.getItem('apiwise_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(getFullApiUrl(endpoint), { method: 'GET', headers });
    if (!response.ok) {
      throw new ApiError('Failed to download file', response.status);
    }
    return response.blob();
  },
};
