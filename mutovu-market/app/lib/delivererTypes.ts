// lib/delivererTypes.ts

// --- Nested Details for Deliveries ---
interface ProductVariantDetails {
    product_details: { name: string; shop: { name: string; latitude: number; longitude: number; }; };
    size_details: { size_name: string };
    color_details: { color_name: string };
}
interface OrderDetails {
    id: number;
    quantity: number;
    total_price: number;
    status: string;
    created_at: string;
    user_details: { username: string; first_name: string; last_name: string; };
    variant_details: ProductVariantDetails;
    distance?: number;
}
// --- Main Types ---

export interface Delivery {
  id: number;
  order: OrderDetails;
  deliverer: number;
  pickup_address: string;
  delivery_address: string;
  delivery_fee: number;
  status: 'accepted' | 'pending' | 'picked_up' | 'delivered' | 'cancelled' | 'failed';
  estimated_time: number;
  distance?: number;
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
    }
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
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};