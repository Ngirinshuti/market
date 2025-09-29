// lib/delivererApi.ts

import axios from "axios";
// Import types from the dedicated types file
import { Delivery, OrderAvailable, DelivererStats } from "./delivererTypes"; 

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// --- API Helper ---
const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: getAuthHeaders(), // Initial headers setup
});

// Add interceptor to dynamically set token on every request
api.interceptors.request.use((config) => {
    config.headers.Authorization = getAuthHeaders().Authorization || '';
    return config;
});
// Note: Refresh token logic should be in a dedicated utility, not needed here for brevity.

// --- API Service ---
export const delivererAPI = {
  // Fetches orders that are 'confirmed', 'processing', or 'shipped' and not yet picked up
  getAvailableOrders: async (latitude: number, longitude: number, radius_km: number): Promise<OrderAvailable[]> => {
    const url = `/orders/available_for_delivery`;
    const response = await api.get(url, {
      params: {
        latitude,
        longitude,
        radius_km,
      },
    });
    // CRITICAL SAFETY CHECK: Ensure it always returns an array
    const ordersData = response.data.results || response.data;
    return Array.isArray(ordersData) ? ordersData : [];
  },

  // Fetches deliveries assigned to the current user
  getMyDeliveries: async (statusFilter: string = 'all'): Promise<Delivery[]> => {
    // Use the dedicated my_deliveries endpoint from Django DeliveryViewSet
    const url = `/deliveries/my_deliveries`;
    
    const params = {
      status: statusFilter === 'all' ? undefined : statusFilter,
    };
    
    const response = await api.get(url, {
      params,
    });
    
    // The Django view returns {count, data} structure
    const deliveriesData = response.data.data || response.data.results || response.data;
    return Array.isArray(deliveriesData) ? deliveriesData : [];
  },

  // Creates a new delivery (Accepts an order)
  acceptOrder: async (orderId: number, estimatedTime: number) => {
    const url = `/deliveries`;
    // The backend's DeliveryCreateSerializer expects these fields
    // NOTE: pickup_address, delivery_address, and delivery_fee might need to be sourced from the OrderAvailable object
    // For now, we rely on the backend to source those from the Order ID
    return api.post(url, { 
        order: orderId, 
        estimated_time: estimatedTime,
        // The backend should pull address and fee from the Order object associated with orderId
    });
  },

  // Updates the status of an assigned delivery
  updateDeliveryStatus: (deliveryId: number, newStatus: string) => {
    const url = `/deliveries/${deliveryId}`;
    return api.patch(url, { status: newStatus });
  },
  
  // Fetches deliverer statistics - FIXED: Use correct endpoint
  getStats: async (): Promise<DelivererStats> => {
    const url = `/deliveries/statistics`; // Changed from /deliveries/stats to /deliveries/statistics
    const response = await api.get(url);
    return response.data;
  }
};