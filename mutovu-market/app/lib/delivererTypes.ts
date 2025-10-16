// lib/delivererTypes.ts

// --- Nested Details for Deliveries ---
interface ShopDetails {
  id: number;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
}

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  shop: ShopDetails;
}

interface SizeDetails {
  id: number;
  size_name: string;
}

interface ColorDetails {
  id: number;
  color_name: string;
  hex_code: string | null;
}

interface VariantDetails {
  id: number;
  sku: string;
  price: number;
  quantity: number;
  size_details: SizeDetails | null;
  color_details: ColorDetails | null;
  product_details: ProductDetails;
}

interface UserDetails {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface OrderDetails {
  id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  created_at: string;
  delivery_option: string;
  payment_method: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  user_details: UserDetails;
  variant_details: VariantDetails;
}

// --- Main Types ---

export interface Delivery {
  id: number;
  order: number; // Order ID
  order_details: OrderDetails; // Full order details
  deliverer: number;
  deliverer_name: string;
  pickup_address: string;
  delivery_address: string;
  pickup_time: string | null;
  delivery_time: string | null;
  delivery_fee: number;
  status:
    | "accepted"
    | "pending"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "failed";
  estimated_time: number;
  actual_time: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderAvailable {
  id: number;
  total_price: number;
  variant: {
    product: {
      name: string;
      shop: {
        name: string;
        address: string;
        latitude: number;
        longitude: number;
      };
    };
  };
  user: {
    address: string;
  };
  delivery_fee: number;
  created_at: string;
  distance?: number;
}

export interface DelivererStats {
  period: string;
  total_earnings: number;
  total_deliveries: number;
  average_per_delivery: number;
  daily_breakdown: Array<{
    delivery_time__date: string;
    earnings: number;
    count: number;
  }>;
}

// NOTE: Assumed type for authenticated user from authUtils.getCurrentUser()
export interface User {
  id: number;
  username: string;
  email: string;
  is_deliverer: boolean;
}

// --- UTILITY FUNCTIONS (MUST have 'export' keyword) ---

// Utility function for calculating distance (used in UI)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};
