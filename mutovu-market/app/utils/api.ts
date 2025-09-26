// utils/api.ts
import axios, { AxiosResponse } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// Type definitions
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: "admin" | "customer" | "buyer" | "seller" | "deliverer";
  bio: string | null;
  is_verified: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: string;
  bio?: string;
}

export interface LoginResponse {
  message: string;
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  access: string;
  refresh: string;
  user: User;
}

export interface ProfileResponse {
  user: User;
}

export interface AuthUrlResponse {
  auth_url: string;
}

export interface GithubAuthResponse {
  message: string;
  access: string;
  refresh: string;
  user: User;
}

// API Client setup
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// API Client methods
export const apiClient = {
  // Auth methods
  login: async (
    credentials: LoginCredentials
  ): Promise<AxiosResponse<LoginResponse>> => {
    return api.post("/api/auth/login/", credentials);
  },

  register: async (
    userData: RegisterData
  ): Promise<AxiosResponse<RegisterResponse>> => {
    return api.post("/api/auth/register/", userData);
  },

  logout: async (refreshToken: string): Promise<AxiosResponse<any>> => {
    return api.post("/api/auth/logout/", { refresh: refreshToken });
  },

  getProfile: async (): Promise<AxiosResponse<ProfileResponse>> => {
    return api.get("/api/auth/profile/");
  },

  updateProfile: async (
    profileData: Partial<User>
  ): Promise<AxiosResponse<{ user: User; message: string }>> => {
    return api.patch("/api/auth/profile/update/", profileData);
  },

  changePassword: async (passwordData: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<AxiosResponse<{ message: string }>> => {
    return api.post("/api/auth/password/change/", passwordData);
  },

  // OAuth methods
  getGoogleAuthUrl: async (): Promise<AxiosResponse<AuthUrlResponse>> => {
    return api.get("/api/auth/google/");
  },

  getGithubAuthUrl: async (): Promise<AxiosResponse<AuthUrlResponse>> => {
    return api.get("/api/auth/github/");
  },

  handleGoogleCallback: async (
    code: string
  ): Promise<AxiosResponse<LoginResponse>> => {
    return api.post("/api/auth/google/callback/", { code });
  },

  handleGithubCallback: async (
    code: string
  ): Promise<AxiosResponse<GithubAuthResponse>> => {
    return api.post("/api/auth/github/callback/", { code });
  },
};

// Auth utilities
export const authUtils = {
  // Get stored tokens and user data
  getAccessToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  },

  getRefreshToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token");
    }
    return null;
  },

  getUser: (): User | null => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // Store authentication data
  setAuthData: (tokens: { access: string; refresh: string }, user: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      localStorage.setItem("user", JSON.stringify(user));
    }
  },

  // Clear authentication data
  clearAuthData: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!authUtils.getAccessToken();
  },

  // Login
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.login(credentials);
    const { access, refresh, user } = response.data;

    authUtils.setAuthData({ access, refresh }, user);
    return response.data;
  },

  // Register
  register: async (userData: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.register(userData);
    const { access, refresh, user } = response.data;

    authUtils.setAuthData({ access, refresh }, user);
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      const refreshToken = authUtils.getRefreshToken();
      if (refreshToken) {
        await apiClient.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      authUtils.clearAuthData();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },

  // Get user profile
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.getProfile();
    return response.data;
  },

  // Update user profile
  updateProfile: async (
    profileData: Partial<User>
  ): Promise<{ user: User; message: string }> => {
    const response = await apiClient.updateProfile(profileData);

    // Update stored user data
    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  },

  // Change password
  changePassword: async (passwordData: {
    old_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ message: string }> => {
    const response = await apiClient.changePassword(passwordData);
    return response.data;
  },

  // OAuth URLs
  getGoogleAuthUrl: async (): Promise<string> => {
    const response = await apiClient.getGoogleAuthUrl();
    return response.data.auth_url;
  },

  getGithubAuthUrl: async (): Promise<string> => {
    const response = await apiClient.getGithubAuthUrl();
    return response.data.auth_url;
  },

  // OAuth callbacks
  handleGoogleCallback: async (code: string): Promise<LoginResponse> => {
    const response = await apiClient.handleGoogleCallback(code);
    const { access, refresh, user } = response.data;

    authUtils.setAuthData({ access, refresh }, user);
    return response.data;
  },

  handleGithubCallback: async (code: string): Promise<GithubAuthResponse> => {
    const response = await apiClient.handleGithubCallback(code);
    const { access, refresh, user } = response.data;

    authUtils.setAuthData({ access, refresh }, user);
    return response.data;
  },
};

export default api;
