// lib/auth.js - Updated with proper authentication validation
import api from "./api";

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

  getUser: () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // NEW: Get current authenticated user (validates token and returns user)
  getCurrentUser: async () => {
    try {
      // First check if we have basic auth data
      if (!authUtils.isAuthenticated()) {
        return null;
      }

      // Try to validate the token by fetching fresh profile data
      const profile = await authUtils.getProfile();

      // Update stored user data with fresh data
      if (profile && typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(profile));
      }

      return profile;
    } catch (error) {
      // Token is invalid or expired
      console.error("getCurrentUser error:", error);
      authUtils.clearAuthData();
      return null;
    }
  },

  // Store authentication data
  setAuthData: (tokens, user) => {
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

  // Check if user is authenticated (basic token check)
  isAuthenticated: () => {
    return !!(authUtils.getAccessToken() && authUtils.getUser());
  },

  // Validate token by making an authenticated request
  validateToken: async () => {
    try {
      if (!authUtils.isAuthenticated()) {
        return false;
      }

      // Try to fetch profile to validate token
      await authUtils.getProfile();
      return true;
    } catch (error) {
      // Token is invalid or expired
      authUtils.clearAuthData();
      return false;
    }
  },

  // Login
  login: async (credentials) => {
    const response = await api.post("/user/api/auth/login/", credentials);
    const { access, refresh, user } = response.data;

    authUtils.setAuthData({ access, refresh }, user);
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post("/user/api/auth/register/", userData);
    const { access, refresh, user } = response.data;

    authUtils.setAuthData({ access, refresh }, user);
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      const refreshToken = authUtils.getRefreshToken();
      if (refreshToken) {
        await api.post("/user/api/auth/logout/", { refresh: refreshToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      authUtils.clearAuthData();
      if (typeof window !== "undefined") {
        window.location.href = "/pages/login";
      }
    }
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get("/user/api/auth/profile/");
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.patch(
      "/user/api/auth/profile/update/",
      profileData
    );

    // Update stored user data
    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post(
      "/user/api/auth/password/change/",
      passwordData
    );
    return response.data;
  },

  //Request password reset

  requestPasswordReset: async (email) => {
    const response = await api.post("/user/api/auth/password/request-reset/", {
      email,
    });
    return response.data;
  },

  // confirm password reset

  confirmPasswordReset: async (uid, token, new_password, confirm_password) => {
    const response = await api.post("/user/api/auth/password/reset-confirm/", {
      uid,
      token,
      new_password,
      confirm_password,
    });
    return response.data;
  },

  // OAuth URLs
  getGoogleAuthUrl: async () => {
    const response = await api.get("/user/api/auth/google/");
    return response.data.auth_url;
  },

  getGithubAuthUrl: async () => {
    const response = await api.get("/user/api/auth/github/");
    return response.data.auth_url;
  },

  // OAuth callbacks
  handleGoogleCallback: async (code) => {
    const response = await api.post("/user/api/auth/google/callback/", {
      code,
    });
    const { access, refresh, user } = response.data;

    authUtils.setAuthData({ access, refresh }, user);
    return response.data;
  },

  handleGithubCallback: async (code) => {
    const response = await api.post("/user/api/auth/github/callback/", {
      code,
    });
    const { access, refresh, user } = response.data;

    authUtils.setAuthData({ access, refresh }, user);
    return response.data;
  },
};
