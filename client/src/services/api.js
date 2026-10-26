import axios from 'axios';

const resolvedBackendUrl = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_BACKEND_URL) || (typeof process !== 'undefined' ? process.env?.VITE_BACKEND_URL : '') || '';

/**
 * Resolves the token refresh endpoint consistently with the configured backend URL.
 * Never prints tokens or secrets.
 */
export function getRefreshUrl(backendUrl = resolvedBackendUrl) {
  const base = backendUrl ? backendUrl.replace(/\/+$/, '') : '';
  return `${base}/api/auth/refresh`;
}

// Create customized Axios instance
const api = axios.create({
  baseURL: resolvedBackendUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error) {
  refreshSubscribers.forEach((callback) => callback(null, error));
  refreshSubscribers = [];
}

function clearAuthSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// Response Interceptor: Auto refresh token on 401 with loop protection and queueing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh if no config exists or if error comes from refresh endpoint itself
    const isRefreshCall = originalRequest?.url && originalRequest.url.includes('/api/auth/refresh');
    if (error.response?.status === 401 && !originalRequest?._retry && !isRefreshCall) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue concurrent requests until refresh completes
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken, refreshErr) => {
            if (refreshErr) {
              return reject(refreshErr);
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshUrl = getRefreshUrl();
        const res = await axios.post(refreshUrl, { refreshToken });

        if (res.data?.success && res.data.accessToken) {
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken || refreshToken;

          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          onRefreshed(newAccessToken);

          return api(originalRequest);
        } else {
          throw new Error('Invalid token refresh response shape');
        }
      } catch (refreshError) {
        // Redact secrets: never log access/refresh tokens
        console.error('Authentication session expired: Unable to refresh token.');
        onRefreshFailed(refreshError);
        clearAuthSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
