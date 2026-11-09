import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject the token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // When the body is FormData, delete the default Content-Type so the
    // browser can set it automatically with the correct multipart boundary.
    // Without this, the global 'application/json' header overrides it,
    // causing the server to return 406 Not Acceptable.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh queue state to manage concurrent requests when the access token expires
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const handleLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentMode');
    sessionStorage.removeItem('auth_account_mode');

    // Avoid infinite redirect loop if already on authentication screens
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith('/login') && !currentPath.startsWith('/signup') && !currentPath.startsWith('/auth')) {
      window.location.href = '/login';
    }
  }
};

// Response interceptor with transparent JWT rotation & request queuing
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 Unauthorized errors and ensure the request hasn't been retried already
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If the 401 came from authentication endpoints, immediately logout to prevent loops
      if (
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/personal/login') ||
        originalRequest.url?.includes('/auth/business/login')
      ) {
        handleLogout();
        return Promise.reject(error);
      }

      if (typeof window === 'undefined') {
        return Promise.reject(error);
      }

      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        handleLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Enqueue concurrent requests while the single refresh request is in flight
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use a clean Axios call without interceptors to prevent circular loops
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const data = refreshResponse.data?.data;
        const newAccessToken = data?.tokens?.accessToken || data?.accessToken;
        const newRefreshToken = data?.tokens?.refreshToken || data?.refreshToken;

        if (!newAccessToken) {
          throw new Error('Missing access token in refresh response');
        }

        // Persist newly rotated credentials
        localStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Release all queued requests with the new valid token
        processQueue(null, newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
