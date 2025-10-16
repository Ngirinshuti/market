// lib/delivererApi.ts

import axios from "axios";
// Import types from the dedicated types file
import { Delivery, OrderAvailable, DelivererStats } from "./delivererTypes";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// --- API Helper ---
const getAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: getAuthHeaders(), // Initial headers setup
});

// Add interceptor to dynamically set token on every request
api.interceptors.request.use((config) => {
  config.headers.Authorization = getAuthHeaders().Authorization || "";
  return config;
});

export const delivererAPI = {
  // ✅ FIXED: Removed trailing slash
  getAvailableOrders: async (lat: number, lng: number, radius: number) => {
    const response = await fetch(
      `${API_BASE_URL}/deliveries/available?lat=${lat}&lng=${lng}&radius=${radius}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch orders");
    }

    const data = await response.json();
    return data.data || [];
  },

  // ✅ FIXED: Removed trailing slash
  acceptOrder: async (orderId: number, estimatedTime: number) => {
    const response = await fetch(`${API_BASE_URL}/deliveries/accept_order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        estimated_time: estimatedTime,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  },

  // ✅ FIXED: Removed trailing slashes
  getMyDeliveries: async (status?: string) => {
    const url = status
      ? `${API_BASE_URL}/deliveries/my_deliveries?status=${status}`
      : `${API_BASE_URL}/deliveries/my_deliveries`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch deliveries");
    }

    const data = await response.json();
    return data.data || [];
  },

  // ✅ FIXED: Removed trailing slash
  updateDeliveryStatus: async (deliveryId: number, newStatus: string) => {
    const response = await fetch(
      `${API_BASE_URL}/deliveries/${deliveryId}/update_status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    return await response.json();
  },

  // ✅ FIXED: Removed trailing slash
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/deliveries/statistics`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch statistics");
    }

    return await response.json();
  },
};
