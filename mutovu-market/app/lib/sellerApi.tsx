// lib/sellerApi.tsx - Fixed version
"use client";
import axios from "axios";

// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth interceptor - FIXED: Use correct token key
apiClient.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token") // Fixed: Changed from "accessToken" to "access_token"
        : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling - FIXED: Use correct token keys
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refresh_token")
            : null;

        if (refreshToken) {
          // Try to refresh the token using the same endpoint as auth.js
          const response = await axios.post(
            `${
              process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
            }/user/api/auth/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          localStorage.setItem("access_token", access);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/pages/login";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface Shop {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  owner?: number;
}

export interface Product {
  id: number;
  name: string;
  shop: number;
  brand?: number;
  category?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_sizes?: ProductSize[];
  product_colors?: ProductColor[];
  images?: ProductImage[];
}

export interface ProductSize {
  id: number;
  product: number;
  size: number;
  price: number;
  quantity: number;
  description?: string;
}

export interface ProductColor {
  id: number;
  product: number;
  color: number;
  price_modifier: number;
  is_available: boolean;
}

export interface ProductImage {
  id: number;
  product: number;
  color?: number;
  front_image?: string;
  back_image?: string;
  side_image?: string;
  aerial_image?: string;
  is_primary: boolean;
}

export interface Order {
  id: number;
  user: number;
  product: number;
  size: number;
  color: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  delivery_address?: string;
  delivery_fee: number;
  deliverer?: number;
  created_at: string;
  updated_at: string;
}

export interface ShopStatistics {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  avgRating: number;
  recentOrders: number;
  recentRevenue: number;
  totalReviews: number;
}

// API service functions
// Updated sellerApi.tsx - Fixed URL handling
export const shopAPI = {
  // Get user's shops - FIXED: Consistent URL structure
  getMyShops: () => apiClient.get("/shops/my_shops"),

  // Get single shop
  getShop: (id) => apiClient.get(`/shops/${id}`),

  // Create shop
  createShop: (data) => apiClient.post("/shops/create_shop", data),

  // Update shop
  updateShop: (id, data) => apiClient.put(`/shops/${id}`, data),

  // Delete shop
  deleteShop: (id) => apiClient.delete(`/shops/${id}`),

  // Get shop statistics
  getShopStatistics: (id) => apiClient.get(`/shops/${id}/statistics`),

  // Get nearby shops
  getNearbyShops: (lat, lng, radius = 5, filters = {}) => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      ...filters,
    });
    return apiClient.get(`/shops/nearby?${params}`);
  },
};

export const productAPI = {
  // Get products for a shop
  getShopProducts: (shopId: number, params = {}) => {
    const searchParams = new URLSearchParams({
      shop: shopId.toString(),
      ...params,
    });
    return apiClient.get(`/products?${searchParams}`);
  },

  // Create product
  createProduct: (data: any) => apiClient.post("/products/", data),

  // Update product
  updateProduct: (id: number, data: any) =>
    apiClient.put(`/products/${id}/`, data),

  // Delete product
  deleteProduct: (id: number) => apiClient.delete(`/products/${id}/`),

  // Search products
  searchProducts: (query: string, filters = {}) => {
    const params = new URLSearchParams({
      search: query,
      ...filters,
    });
    return apiClient.get(`/products/?${params}`);
  },

  // Get categories
  getCategories: () => apiClient.get("/categories"),

  // Get brands
  getBrands: () => apiClient.get("/brands"),

  // Get sizes
  getSizes: () => apiClient.get("/sizes"),

  // Get colors
  getColors: () => apiClient.get("/colors"),
};

export const orderAPI = {
  // Get orders for a shop
  getShopOrders: (shopId: number, params = {}) => {
    const searchParams = new URLSearchParams({
      shop: shopId.toString(),
      ...params,
    });
    return apiClient.get(`/orders?${searchParams}`);
  },

  // Get user's orders
  getMyOrders: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiClient.get(`/orders?${searchParams}`);
  },

  // Create order
  createOrder: (data: any) => apiClient.post("/orders", data),

  // Update order status
  updateOrderStatus: (id: number, status: string) =>
    apiClient.patch(`/orders/${id}`, { status }),
};

export default apiClient;
