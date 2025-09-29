// lib/sellerApi.tsx - Fixed version
"use client";
import axios from "axios";
import { apiClient } from "../utils/api";

// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth interceptor - FIXED: Use correct token key
api.interceptors.request.use(
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
api.interceptors.response.use(
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
          return api(originalRequest);
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

// Updated Product interface
export interface Product {
  id: number;
  name: string;
  shop: number;
  brand: number | null;
  category: number | null;
  description: string;
  is_active: boolean;
  available_sizes: number[];
  available_colors: number[];
  created_at: string;
  updated_at: string;
  // Computed fields from serializer
  min_price?: number;
  max_price?: number;
  total_stock?: number;
  avg_rating?: number;
  review_count?: number;
  variants?: ProductVariant[];
}

// New interfaces for the updated models
export interface Size {
  id: number;
  size_type: "numeric" | "alpha" | "custom";
  numeric_size?: number;
  alpha_size?: string;
  custom_size?: string;
  created_at: string;
  updated_at: string;
}

export interface Color {
  id: number;
  color_name: string;
  hex_code?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product: number;
  size: number;
  color: number;
  price: string;
  quantity: number;
  sku?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Related data
  size_details?: Size;
  color_details?: Color;
}

export interface Category {
  id: number;
  category_name: string;
  description?: string;
  image?: string;
  size_type: "numeric" | "alpha" | "custom";
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: number;
  brand_name: string;
  description?: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user: number;
  variant: number; // This is the main relationship
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  delivery_address?: string;
  delivery_fee: number;
  deliverer?: number;
  created_at: string;
  updated_at: string;

  // Expanded/computed fields from serializer
  user_details?: {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  variant_details?: {
    id: number;
    product: number;
    size: number;
    color: number;
    price: string;
    sku?: string;
    product_details?: {
      id: number;
      name: string;
      shop: number;
    };
    size_details?: {
      id: number;
      size_type: string;
      numeric_size?: number;
      alpha_size?: string;
      custom_size?: string;
    };
    color_details?: {
      id: number;
      color_name: string;
      hex_code?: string;
    };
  };
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
  getMyShops: () => api.get("/shops/my_shops"),

  // Get single shop
  getShop: (id) => api.get(`/shops/${id}`),

  // Create shop
  createShop: (data) => api.post("/shops/create_shop", data),

  // Update shop
  updateShop: (id, data) => api.put(`/shops/${id}`, data),

  // Delete shop
  deleteShop: (id) => api.delete(`/shops/${id}`),

  // Get shop statistics
  getShopStatistics: (id: number) => api.get(`/shops/${id}/statistics`),

  // Get nearby shops
  getNearbyShops: (lat, lng, radius = 5, filters = {}) => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      ...filters,
    });
    return api.get(`/shops/nearby?${params}`);
  },
};

// Add these interfaces and functions to your sellerApi.ts file

// Updated productAPI object with new functions
export const productAPI = {
  // Existing product functions
  createProduct: (data: Partial<Product>) => api.post("/products", data),
  getProducts: () => api.get("/products"),
  getProduct: (id: number) => api.get(`/products/${id}`),
  updateProduct: (id: number, data: Partial<Product>) =>
    api.put(`/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/products/${id}`),
  getShopProducts: (shopId: number) => api.get(`/products?shop=${shopId}`),

  // Size management
  getSizes: () => api.get("/sizes"),
  getSize: (id: number) => api.get(`/sizes/${id}`),
  createSize: (data: Partial<Size>) => api.post("/sizes", data),
  updateSize: (id: number, data: Partial<Size>) =>
    api.put(`/sizes/${id}`, data),
  deleteSize: (id: number) => api.delete(`/sizes/${id}`),

  // Color management
  getColors: () => api.get("/colors"),
  getColor: (id: number) => api.get(`/colors/${id}`),
  createColor: (data: Partial<Color>) => api.post("/colors", data),
  updateColor: (id: number, data: Partial<Color>) =>
    api.put(`/colors/${id}/`, data),
  deleteColor: (id: number) => api.delete(`/colors/${id}`),

  // Category management
  getCategories: () => api.get("/categories"),
  getCategory: (id: number) => api.get(`/categories/${id}`),
  createCategory: (data: Partial<Category>) => api.post("/categories", data),
  updateCategory: (id: number, data: Partial<Category>) =>
    api.put(`/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),

  // Brand management
  getBrands: () => api.get("/brands"),
  getBrand: (id: number) => api.get(`/brands/${id}`),
  createBrand: (data: Partial<Brand>) => api.post("/brands", data),
  updateBrand: (id: number, data: Partial<Brand>) =>
    api.put(`/brands/${id}`, data),
  deleteBrand: (id: number) => api.delete(`/brands/${id}`),

  // NEW: Product Variant management
  getProductVariants: (productId: number) =>
    api.get(`/product-variants?product=${productId}`),
  getAllProductVariants: () => api.get("/product-variants"),
  getProductVariant: (id: number) => api.get(`/product-variants/${id}`),
  createProductVariant: (data: Partial<ProductVariant>) =>
    api.post("/product-variants", data),
  updateProductVariant: (id: number, data: Partial<ProductVariant>) =>
    api.put(`/product-variants/${id}`, data),
  deleteProductVariant: (id: number) => api.delete(`/product-variants/${id}`),

  // Bulk operations for variants
  createMultipleVariants: (variants: Partial<ProductVariant>[]) =>
    Promise.all(
      variants.map((variant) => api.post("/product-variants", variant))
    ),

  // Get variants by specific criteria
  getVariantsBySize: (sizeId: number) =>
    api.get(`/product-variants?size=${sizeId}`),
  getVariantsByColor: (colorId: number) =>
    api.get(`/product-variants?color=${colorId}`),
  getVariantsBySizeAndColor: (sizeId: number, colorId: number) =>
    api.get(`/product-variants?size=${sizeId}&color=${colorId}`),

  // Product-specific variant operations
  addSizeToProduct: (productId: number, sizeId: number) =>
    api.post(`/products/${productId}/add-size`, { size_id: sizeId }),
  removeSizeFromProduct: (productId: number, sizeId: number) =>
    api.post(`/products/${productId}/remove-size`, { size_id: sizeId }),
  addColorToProduct: (productId: number, colorId: number) =>
    api.post(`/products/${productId}/add-color`, { color_id: colorId }),
  removeColorFromProduct: (productId: number, colorId: number) =>
    api.post(`/products/${productId}/remove-color`, { color_id: colorId }),

  // Inventory management
  updateVariantStock: (variantId: number, quantity: number) =>
    api.patch(`/product-variants/${variantId}`, { quantity }),
  getVariantsLowStock: (threshold: number = 10) =>
    api.get(`/product-variants/?low_stock=${threshold}`),

  // Pricing operations
  updateVariantPrice: (variantId: number, price: number) =>
    api.patch(`/product-variants/${variantId}`, { price }),
  bulkUpdatePrices: (updates: { id: number; price: number }[]) =>
    Promise.all(
      updates.map((update) =>
        api.patch(`/product-variants/${update.id}`, { price: update.price })
      )
    ),

  // Analytics and reporting
  getVariantsSummary: (productId: number) =>
    api.get(`/products/${productId}/variants-summary`),
  getTopSellingVariants: (shopId?: number) => {
    const url = shopId
      ? `/variants/top-selling?shop=${shopId}`
      : "/variants/top-selling";
    return api.get(url);
  },

  // Stock alerts
  getStockAlerts: (shopId?: number) => {
    const url = shopId
      ? `/variants/stock-alerts?shop=${shopId}`
      : "/variants/stock-alerts";
    return api.get(url);
  },

  // Search and filtering
  searchVariants: (
    query: string,
    filters?: {
      shop?: number;
      category?: number;
      brand?: number;
      min_price?: number;
      max_price?: number;
      in_stock?: boolean;
    }
  ) => {
    const params = new URLSearchParams({ search: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/product-variants?${params.toString()}`);
  },
};
// Updated orderAPI with better error handling
export const orderAPI = {
  // Get orders for a shop with improved error handling
  getShopOrders: (shopId: number, params = {}) => {
    // Remove undefined values from params
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, value]) => value !== undefined && value !== "undefined"
      )
    );

    const searchParams = new URLSearchParams({
      variant__product__shop: shopId.toString(),
      ...cleanParams,
    });

    const url = `/orders?${searchParams}`;
    console.log(`DEBUG API: Making request to: ${API_BASE_URL}${url}`);

    return api.get(url);
  },

  // Get user's orders
  getMyOrders: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/orders?${searchParams}`);
  },

  // Create order
  createOrder: (data: any) => api.post("/orders", data),

  // Update order status
  updateOrderStatus: (id: number, status: string) =>
    api.patch(`/orders/${id}`, { status }),

  // Get single order with details
  getOrder: (id: number) => api.get(`/orders/${id}`),

  // Get orders with expanded details
  getShopOrdersDetailed: (shopId: number, params = {}) => {
    const searchParams = new URLSearchParams({
      variant__product__shop: shopId.toString(),
      expand: "user,variant,variant__product,variant__size,variant__color", // Request expanded data
      ...params,
    });
    return api.get(`/orders?${searchParams}`);
  },
};

export default apiClient;
