"use client";

// ============================================================================
// IMPORTS
// ============================================================================
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

// Lucide Icons
import {
  Heart,
  ShoppingCart,
  Star,
  Search,
  Eye,
  X,
  Minus,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  Truck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  LogIn,
  House,
  Navigation,
  Loader2,
  FileText,
  Store,
  Package,
  Clock,
  ShoppingBasketIcon,
  ShoppingBagIcon,
} from "lucide-react";

// ============================================================================
// CONFIGURATION
// ============================================================================
const API_BASE = "http://localhost:8000/api";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const FLUTTERWAVE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ||
  "FLWPUBK-your-public-key-here";

// Script loading state management
let scriptLoadingState: "idle" | "loading" | "loaded" | "error" = "idle";
let scriptLoadPromise: Promise<void> | null = null;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
declare global {
  interface Window {
    google: typeof google;
    googleMapsInitCallbacks?: (() => void)[];
    FlutterwaveCheckout?: any;
  }
}

interface Shop {
  id: string;
  display: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface Product {
  id: string;
  name: string;
  description?: string;
  min_price: number;
  max_price: number;
  total_stock: number;
  avg_rating?: number;
  review_count?: number;
  primary_image_url?: string;
  category?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  shop_details?: {
    id: string;
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
  };
  variants?: Array<{
    id: string;
    price: number;
    quantity: number;
    size?: {
      display: string;
    };
    color?: {
      name: string;
      hex_code: string;
    };
    images?: Array<{
      front_image_url: string;
      back_image_url?: string;
      side_image_url?: string;
      aerial_image_url?: string;
      primary_image_url?: string;
    }>;
    shop?: Shop;
  }>;
}

interface CartItem {
  id: string;
  variant: string;
  quantity: number;
  product_name: string;
  total_price?: number;
  variant_details?: {
    id: string;
    price: number;
    quantity: number;
    images?: Array<{
      front_image_url: string;
      back_image_url?: string;
    }>;
    size?: {
      display: string;
    };
    color?: {
      name: string;
      hex_code: string;
    };
    product?: {
      id: string;
      name: string;
      primary_image_url?: string;
    };
    shop?: Shop;
  };
  size_details?: {
    alpha_size?: string;
    numeric_size?: string;
  };
  color_details?: {
    color_name: string;
    hex_code: string;
  };
}

interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone_number: string;
  recipient_address: string;
  total_price: number;
  unit_price: number;
  delivery_fee: number;
  quantity: number;
  variant_details: number;
  delivery_cost: number;
  created_at: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

interface Category {
  id: string;
  name: string;
}

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

interface GoogleMapPickerProps {
  onLocationChange: (lat: number | null, lng: number | null) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
}

interface ShopLocationMapProps {
  latitude: number;
  longitude: number;
  shopName: string;
  height?: string;
}

type AuthAction = "add to cart" | "add to wishlist" | "checkout";

interface HandleAuthRequiredProps {
  action: AuthAction;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const loadGoogleMapsScript = (): Promise<void> => {
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  if (window.google?.maps) {
    scriptLoadingState = "loaded";
    return Promise.resolve();
  }

  const existingScript = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  );

  if (existingScript) {
    scriptLoadingState = "loading";
    scriptLoadPromise = new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          scriptLoadingState = "loaded";
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.google?.maps) {
          scriptLoadingState = "error";
          reject(new Error("Google Maps script load timeout"));
        }
      }, 10000);
    });
    return scriptLoadPromise;
  }

  scriptLoadingState = "loading";
  scriptLoadPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      scriptLoadingState = "error";
      reject(new Error("Google Maps API key is missing"));
      return;
    }

    window.googleMapsInitCallbacks = window.googleMapsInitCallbacks || [];

    const callbackName = "initGoogleMaps";
    (window as any)[callbackName] = () => {
      scriptLoadingState = "loaded";
      window.googleMapsInitCallbacks?.forEach((cb) => cb());
      window.googleMapsInitCallbacks = [];
      resolve();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      scriptLoadingState = "error";
      reject(new Error("Failed to load Google Maps script"));
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
};

const loadFlutterwaveScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.FlutterwaveCheckout) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load E-Payment script"));
    document.head.appendChild(script);
  });
};

const getImageUrl = (
  imageUrl?: string,
  fallbackText: string = "No Image"
): string => {
  if (!imageUrl) {
    return `https://via.placeholder.com/600x400?text=${encodeURIComponent(
      fallbackText
    )}`;
  }
  return imageUrl;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";
  const Icon =
    type === "success"
      ? CheckCircle
      : type === "error"
      ? AlertCircle
      : AlertCircle;

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}>
      <Icon className="h-6 w-6" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded p-1">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ShopLocationMap: React.FC<ShopLocationMapProps> = ({
  latitude,
  longitude,
  shopName,
  height = "300px",
}) => {
  const [imageError, setImageError] = useState(false);

  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=600x400&maptype=satellite&markers=color:red%7C${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          Shop Location
        </h4>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 underline">
          Get Directions
        </a>
      </div>

      {imageError ? (
        <div className="p-4 text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Failed to load satellite image</span>
        </div>
      ) : (
        <div
          className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm"
          style={{ height }}>
          <img
            src={staticMapUrl}
            alt={`Satellite view of ${shopName}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      )}

      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <span className="font-medium">Coordinates:</span> {latitude.toFixed(6)},{" "}
        {longitude.toFixed(6)}
      </div>

      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
        <MapPin className="h-4 w-4" />
        Open in Google Maps
      </a>
    </div>
  );
};

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  onLocationChange,
  initialLocation = { lat: -1.9441, lng: 30.0588 },
  height = "400px",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(initialLocation);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    try {
      const center = selectedLocation || { lat: -1.9441, lng: 30.0588 };
      const mapOptions: google.maps.MapOptions = {
        center: center,
        zoom: 14,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        gestureHandling: "greedy",
      };

      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        position: center,
        map: map,
        draggable: true,
      });
      markerRef.current = marker;

      map.addListener("click", (mapsMouseEvent: google.maps.MapMouseEvent) => {
        const newPos = mapsMouseEvent.latLng!.toJSON();
        setSelectedLocation(newPos);
        onLocationChange(newPos.lat, newPos.lng);
        marker.setPosition(newPos);
      });

      marker.addListener("dragend", () => {
        const newPos = marker.getPosition()!.toJSON();
        setSelectedLocation(newPos);
        onLocationChange(newPos.lat, newPos.lng);
      });

      if (searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(
          searchInputRef.current,
          {
            types: ["geocode"],
            componentRestrictions: { country: ["rw"] },
          }
        );
        autocompleteRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const newPos = place.geometry.location.toJSON();
            setSelectedLocation(newPos);
            onLocationChange(newPos.lat, newPos.lng);
            map.setCenter(newPos);
            marker.setPosition(newPos);
            map.setZoom(16);
          }
        });
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Map initialization error:", err);
      setError("Failed to initialize map");
      setIsLoading(false);
    }
  }, [onLocationChange, selectedLocation]);

  useEffect(() => {
    let mounted = true;

    const loadAndInitMap = async () => {
      try {
        if (!GOOGLE_MAPS_API_KEY) {
          setError(
            "Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file."
          );
          setIsLoading(false);
          return;
        }

        await loadGoogleMapsScript();

        if (mounted && !mapInstanceRef.current) {
          initMap();
        }
      } catch (err) {
        if (mounted) {
          console.error("Error loading Google Maps:", err);
          setError(
            err instanceof Error ? err.message : "Failed to load Google Maps"
          );
          setIsLoading(false);
        }
      }
    };

    loadAndInitMap();

    return () => {
      mounted = false;
    };
  }, [initMap]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSelectedLocation(newPos);
          onLocationChange(newPos.lat, newPos.lng);

          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setCenter(newPos);
            markerRef.current.setPosition(newPos);
            mapInstanceRef.current.setZoom(16);
          }
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation Error:", error);
          setError(
            "Could not retrieve your location. Please ensure location services are enabled."
          );
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-red-700 bg-red-100 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="flex space-x-2">
        <div className="relative flex-grow">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location (e.g., Kigali, Rwanda)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || !!error}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={handleGetCurrentLocation}
          disabled={isLocating || isLoading || !!error}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md disabled:bg-gray-400 flex items-center justify-center w-12 h-12 flex-shrink-0"
          title="Get Current Location">
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Navigation className="h-5 w-5" />
          )}
        </button>
      </div>

      {isLoading && !error && (
        <div
          style={{ height }}
          className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-600">Loading Map...</span>
        </div>
      )}

      {selectedLocation && (
        <div className="border border-blue-300 bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              Selected Location:
            </span>
            <span className="text-sm font-mono text-gray-800">
              {selectedLocation.lat.toFixed(6)},{" "}
              {selectedLocation.lng.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      <div className="relative rounded-lg overflow-hidden border border-gray-200">
        <div ref={mapRef} style={{ height }} className="w-full" />

        {!isLoading && !error && (
          <div className="absolute top-3 left-3 bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Click on map or drag marker to select location
            </p>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Click anywhere on the map to place a marker</p>
        <p>• Drag the marker to fine-tune the location</p>
        <p>• Use the search bar to jump to a city or address</p>
        <p>
          • Click the <Navigation className="h-3 w-3 inline align-middle" />{" "}
          button to use your current location
        </p>
      </div>
    </div>
  );
};

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
        <ChevronLeft className="h-5 w-5" />
      </button>

      {currentPage > 3 && totalPages > 5 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50">
            1
          </button>
          {currentPage > 4 && <span className="px-2">...</span>}
        </>
      )}

      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg border ${
            page === currentPage
              ? "bg-blue-500 text-white border-blue-500"
              : "hover:bg-gray-50"
          }`}>
          {page}
        </button>
      ))}

      {currentPage < totalPages - 2 && totalPages > 5 && (
        <>
          {currentPage < totalPages - 3 && <span className="px-2">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50">
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const DashBoardPage: React.FC = () => {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [categories, setCategories] = useState<Category[]>([
    { id: "All", name: "All" },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCartItem, setSelectedCartItem] = useState<CartItem | null>(
    null
  );

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [ratingInput, setRatingInput] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [checkoutStep, setCheckoutStep] = useState(1);
  const [deliveryOption, setDeliveryOption] = useState("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [mapLat, setMapLat] = useState(-1.9441);
  const [mapLng, setMapLng] = useState(30.0588);
  const [paymentMethod, setPaymentMethod] = useState("E-Payment");
  const [deliveryCost, setDeliveryCost] = useState(0);

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Utility functions
  const getToken = useCallback(() => localStorage.getItem("access_token"), []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info"): void => {
      const id = Date.now();
      setToasts((prev: Toast[]) => [...prev, { id, message, type }]);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const apiCall = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      requireAuth: boolean = true
    ) => {
      const token = getToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (requireAuth && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        const response = await fetch(`${API_BASE}${url}`, {
          ...options,
          headers,
        });

        if (!response.ok && response.status === 401) {
          if (requireAuth) {
            console.log("401 error on authenticated request - clearing auth");
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
          }
        }

        return response;
      } catch (error) {
        console.error("API call error:", error);
        throw error;
      }
    },
    [getToken]
  );

  const handleAuthRequired = useCallback(
    ({ action }: HandleAuthRequiredProps): void => {
      showToast(`Please login to ${action}`, "error");
    },
    [showToast]
  );

  // Delivery cost calculation
  const calculateDeliveryCost = useCallback(() => {
    if (deliveryOption === "pickup") {
      setDeliveryCost(0);
      return;
    }

    if (!mapLat || !mapLng || cartItems.length === 0) {
      setDeliveryCost(0);
      return;
    }

    const shopGroups: { [key: string]: CartItem[] } = {};
    cartItems.forEach((item) => {
      const shopId = item.variant_details?.shop?.id || "unknown";
      if (!shopGroups[shopId]) {
        shopGroups[shopId] = [];
      }
      shopGroups[shopId].push(item);
    });

    const shopIds = Object.keys(shopGroups);

    if (shopIds.length === 1) {
      const shop = cartItems[0].variant_details?.shop;
      if (shop?.location) {
        const distance = calculateDistance(
          shop.location.lat,
          shop.location.lng,
          mapLat,
          mapLng
        );
        setDeliveryCost(Math.round(distance * 1000));
      } else {
        setDeliveryCost(1000);
      }
    } else {
      const shopLocations = shopIds
        .map((id) => shopGroups[id][0].variant_details?.shop)
        .filter((shop) => shop?.location);

      let shopsNearby = true;
      if (shopLocations.length > 1) {
        for (let i = 0; i < shopLocations.length - 1; i++) {
          for (let j = i + 1; j < shopLocations.length; j++) {
            const dist = calculateDistance(
              shopLocations[i]!.location!.lat,
              shopLocations[i]!.location!.lng,
              shopLocations[j]!.location!.lat,
              shopLocations[j]!.location!.lng
            );
            if (dist > 2) {
              shopsNearby = false;
              break;
            }
          }
          if (!shopsNearby) break;
        }
      }

      let totalDistance = 0;
      shopLocations.forEach((shop) => {
        if (shop?.location) {
          totalDistance += calculateDistance(
            shop.location.lat,
            shop.location.lng,
            mapLat,
            mapLng
          );
        }
      });
      const avgDistance = totalDistance / (shopLocations.length || 1);

      if (shopsNearby) {
        setDeliveryCost(Math.round(avgDistance * 1000));
      } else {
        setDeliveryCost(Math.round(avgDistance * 500));
      }
    }
  }, [deliveryOption, mapLat, mapLng, cartItems]);

  useEffect(() => {
    calculateDeliveryCost();
  }, [calculateDeliveryCost]);

  // Authentication handlers
  const handleLogout = async () => {
    try {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setShowUserDropdown(false);
      showToast("Logged out successfully", "info");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLogin = () => {
    window.location.href = "/pages/login";
    setShowUserDropdown(false);
  };

  const handleProfile = () => {
    window.location.href = "/pages/profile";
    setShowUserDropdown(false);
  };

  const handleViewOrders = async () => {
    if (!isAuthenticated) {
      handleAuthRequired({ action: "checkout" });
      return;
    }
    setShowUserDropdown(false);
    setShowOrders(true);

    try {
      const response = await apiCall("/orders", {}, true);
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      const data = await response.json();
      const ordersList = Array.isArray(data) ? data : data.results || [];
      setOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showToast("Failed to load orders", "error");
    }
  };

  // Data fetching
  const fetchProducts = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: pageSize.toString(),
        });
        if (selectedCategory !== "All") {
          params.append("category", selectedCategory);
        }

        const productsRes = await apiCall(
          `/products/catalog?${params.toString()}`,
          {},
          false
        );
        const productsData = await productsRes.json();
        setProducts(productsData.results || []);
        setFilteredProducts(productsData.results || []);
        setTotalCount(productsData.count || 0);
        setTotalPages(Math.ceil((productsData.count || 0) / pageSize));
        setCurrentPage(page);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    },
    [apiCall, selectedCategory]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const userData = JSON.parse(localStorage.getItem("user") || "null");
      setIsAuthenticated(!!token);
      setUser(userData);

      const categoriesRes = await apiCall("/categories", {}, false);
      const categoriesData = await categoriesRes.json();
      setCategories([
        { id: "All", name: "All" },
        ...(categoriesData.results || categoriesData).map((cat: any) => ({
          id: cat.id,
          name: cat.category_name,
        })),
      ]);

      const params = new URLSearchParams({
        page: "1",
        page_size: pageSize.toString(),
      });

      const productsRes = await apiCall(
        `/products/catalog?${params.toString()}`,
        {},
        false
      );
      const productsData = await productsRes.json();
      setProducts(productsData.results || []);
      setFilteredProducts(productsData.results || []);
      setTotalCount(productsData.count || 0);
      setTotalPages(Math.ceil((productsData.count || 0) / pageSize));
      setCurrentPage(1);

      if (token) {
        try {
          const cartRes = await apiCall("/cart-items", {}, true);
          const cartData = await cartRes.json();
          setCartItems(cartData.results || cartData);

          const wishlistRes = await apiCall("/wishlist-items", {}, true);
          const wishlistData = await wishlistRes.json();
          setWishlist(
            (wishlistData.results || wishlistData).map(
              (item: any) => item.product
            )
          );
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load products. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [apiCall, getToken]);

  // Cart & Wishlist handlers
  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      handleAuthRequired({ action: "add to cart" });
      return;
    }
    const availableVariant = product.variants?.find((v) => v.quantity > 0);
    if (!availableVariant) {
      showToast("No available variants", "error");
      return;
    }
    const existingItem = cartItems.find(
      (item) => item.variant === availableVariant.id
    );
    if (existingItem) {
      showToast("This item is already in your cart", "info");
      return;
    }
    try {
      const response = await apiCall("/cart-items", {
        method: "POST",
        body: JSON.stringify({ variant: availableVariant.id, quantity: 1 }),
      });
      if (response.ok) {
        showToast(`Added "${product.name}" to cart!`, "success");
        const cartRes = await apiCall("/cart-items");
        const cartData = await cartRes.json();
        setCartItems(cartData.results || cartData);
      }
    } catch (error) {
      console.error("Cart error:", error);
      showToast("Failed to add to cart", "error");
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      handleAuthRequired({ action: "add to wishlist" });
      return;
    }
    try {
      await apiCall("/wishlist-items", {
        method: "POST",
        body: JSON.stringify({ product: productId }),
      });
      showToast("Wishlist updated!", "success");
      const wishlistRes = await apiCall("/wishlist-items");
      const wishlistData = await wishlistRes.json();
      setWishlist(
        (wishlistData.results || wishlistData).map((item: any) => item.product)
      );
    } catch (error) {
      console.error("Wishlist error:", error);
      showToast("Failed to update wishlist", "error");
    }
  };

  const updateCartQuantity = async (itemId: string, change: number) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(
      1,
      Math.min(item.variant_details?.quantity || 999, item.quantity + change)
    );
    try {
      const response = await apiCall(`/cart-items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: newQty }),
      });
      if (response.ok) {
        setCartItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
        );
        showToast("Cart updated", "success");
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      showToast("Failed to update cart", "error");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await apiCall(`/cart-items/${itemId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCartItems((prev) => prev.filter((item) => item.id !== itemId));
        showToast("Item removed from cart", "success");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      showToast("Failed to remove item", "error");
    }
  };

  const openVariantSelector = (cartItem: CartItem) => {
    setSelectedCartItem(cartItem);
    const prod = products.find(
      (p) => p.id === cartItem.variant_details?.product?.id
    );
    setSelectedProduct(prod || null);
    setShowVariantModal(true);
  };

  const changeVariant = async (
    newVariant: NonNullable<Product["variants"]>[number]
  ) => {
    if (!selectedCartItem) return;

    const existingItem = cartItems.find(
      (item) =>
        item.variant === newVariant.id && item.id !== selectedCartItem.id
    );
    if (existingItem) {
      showToast("This variant is already in your cart", "info");
      return;
    }
    try {
      const response = await apiCall(`/cart-items/${selectedCartItem.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          variant: newVariant.id,
          quantity: Math.min(selectedCartItem.quantity, newVariant.quantity),
        }),
      });
      if (response.ok) {
        const cartRes = await apiCall("/cart-items");
        const cartData = await cartRes.json();
        setCartItems(cartData.results || cartData);
        setShowVariantModal(false);
        showToast("Variant changed successfully", "success");
      }
    } catch (error) {
      console.error("Error changing variant:", error);
      showToast("Failed to change variant", "error");
    }
  };

  // Review handlers
  const submitRating = async () => {
    if (!selectedProduct || ratingInput === 0) {
      showToast("Please select a rating", "error");
      return;
    }
    try {
      const response = await apiCall("/reviews", {
        method: "POST",
        body: JSON.stringify({
          product: selectedProduct.id,
          rating: ratingInput,
          comment: reviewText || "",
        }),
      });
      if (response.ok) {
        showToast("Rating submitted!", "success");
        setShowRatingModal(false);
        setRatingInput(0);
        setReviewText("");
        fetchProducts(currentPage);
      }
    } catch (error) {
      console.error("Review error:", error);
      showToast("Failed to submit rating", "error");
    }
  };

  // Checkout handlers
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      handleAuthRequired({ action: "checkout" });
      return;
    }
    if (cartItems.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    setShowCart(false);
    setShowCheckout(true);
    setCheckoutStep(1);
  };

  const handleLocationChange = (lat: number | null, lng: number | null) => {
    if (lat !== null && lng !== null) {
      setMapLat(lat);
      setMapLng(lng);
      setDeliveryAddress(`Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleNextStep = () => {
    if (checkoutStep === 1) {
      if (deliveryOption === "delivery" && !deliveryAddress.trim()) {
        showToast("Please select a delivery location on the map", "error");
        return;
      }
      setCheckoutStep(2);
    } else if (checkoutStep === 2) {
      const nameValid = customerName && customerName.trim().length > 0;
      const emailValid =
        customerEmail &&
        customerEmail.trim().length > 0 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
      const phoneDigits = customerPhone.replace(/\D/g, "");
      const phoneValid = phoneDigits.length === 10;

      if (!nameValid) {
        showToast("Please enter a valid recipient name", "error");
        return;
      }
      if (!emailValid) {
        showToast("Please enter a valid email address", "error");
        return;
      }
      if (!phoneValid) {
        showToast("Please enter a valid 10-digit phone number", "error");
        return;
      }
      setCheckoutStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (checkoutStep > 1) {
      setCheckoutStep(checkoutStep - 1);
    }
  };

  const handlePaymentComplete = async () => {
    try {
      const orderPromises = cartItems.map(async (item) => {
        const orderData = {
          variant: item.variant,
          quantity: item.quantity,
          unit_price: item.variant_details?.price || 0,
          total_price: (item.variant_details?.price || 0) * item.quantity,
          status: "pending",
          delivery_option:
            deliveryOption === "delivery" ? "home_delivery" : "store_pickup",
          delivery_address: deliveryAddress,
          delivery_fee: Math.round(deliveryCost / cartItems.length),
          payment_method: paymentMethod,
          recipient_name: customerName,
          recipient_phone: customerPhone,
          recipient_address_text: deliveryAddress,
          ...(deliveryOption === "delivery" && {
            recipient_address_lat: parseFloat(mapLat.toFixed(8)),
            recipient_address_lng: parseFloat(mapLng.toFixed(8)),
          }),
        };

        const orderResponse = await apiCall("/orders", {
          method: "POST",
          body: JSON.stringify(orderData),
        });

        if (orderResponse.ok) {
          const variantId = item.variant;
          const newQuantity =
            (item.variant_details?.quantity || 0) - item.quantity;

          await apiCall(`/product-variants/${variantId}`, {
            method: "PATCH",
            body: JSON.stringify({ quantity: Math.max(0, newQuantity) }),
          });
        }

        return orderResponse;
      });

      const responses = await Promise.all(orderPromises);
      const allSuccessful = responses.every((response) => response.ok);

      if (allSuccessful) {
        showToast("Orders placed successfully!", "success");

        try {
          await Promise.all(
            cartItems.map((item) =>
              apiCall(`/cart-items/${item.id}`, { method: "DELETE" })
            )
          );
        } catch (error) {
          console.error("Error clearing cart:", error);
        }

        setCartItems([]);
        setShowCheckout(false);
        setShowBill(false);
        setCheckoutStep(1);
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setDeliveryAddress("");
      } else {
        const errors = await Promise.all(
          responses.map(async (response) => {
            if (!response.ok) {
              try {
                const errorData = await response.json();
                return errorData;
              } catch {
                return { error: "Unknown error" };
              }
            }
            return null;
          })
        );

        const errorMessages = errors
          .filter((e) => e)
          .map((e) => JSON.stringify(e));
        showToast(`Failed to place some orders: ${errorMessages[0]}`, "error");
      }
    } catch (err) {
      console.error("Order placement error:", err);
      showToast("Failed to place order.", "error");
    }
  };

  const initiateFlutterwavePayment = async () => {
    try {
      await loadFlutterwaveScript();

      const modal = window.FlutterwaveCheckout({
        public_key: FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: `MUTOVU-${Date.now()}`,
        amount: grandTotal,
        currency: "RWF",
        payment_options: "card, mobilemoney, ussd",
        customer: {
          email: customerEmail,
          phone_number: customerPhone,
          name: customerName,
        },
        customizations: {
          title: "MUTOVU MALL",
          description: "Payment for order",
          logo: "https://via.placeholder.com/150?text=MUTOVU",
        },
        callback: function (data: any) {
          if (data.status === "successful") {
            showToast("Payment successful!", "success");
            handlePaymentComplete();
          } else {
            showToast("Payment failed. Please try again.", "error");
          }
          modal.close();
        },
        onclose: function () {
          showToast("Payment cancelled", "info");
        },
      });
    } catch (error) {
      console.error("E-Payment error:", error);
      showToast("Failed to initialize payment. Please try again.", "error");
    }
  };

  const handleFinalizeOrder = () => {
    if (paymentMethod === "E-Payment") {
      initiateFlutterwavePayment();
    } else if (paymentMethod === "cash_on_delivery") {
      setShowBill(true);
    }
  };

  const confirmCashOrder = () => {
    handlePaymentComplete();
  };

  const onPageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchProducts(page);
    }
  };

  // Computed values
  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + (item.total_price || 0) * item.quantity,
      0
    );
  }, [cartItems]);

  const grandTotal = useMemo(() => {
    return cartTotal + deliveryCost;
  }, [cartTotal, deliveryCost]);

  // Effects
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [selectedCategory]);

  useEffect(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.min_price - b.min_price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.max_price - a.max_price);
        break;
      case "rating":
        filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
      case "new-arrivals":
        filtered.sort((a, b) => {
          const aId = parseInt(a.id) || 0;
          const bId = parseInt(b.id) || 0;
          return bId - aId;
        });
        break;
      default:
        break;
    }
    setFilteredProducts(filtered);
  }, [searchQuery, sortBy, products]);

  // ========================================
  // RENDER COMPONENTS
  // ========================================

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const isWishlisted = wishlist.includes(product.id);
    const primaryVariant = product.variants?.[0];

    const getStockStatus = () => {
      if (product.total_stock === 0) {
        return {
          status: "out-of-stock",
          color: "red",
          text: "Out of Stock",
        };
      } else if (product.total_stock <= 5) {
        return {
          status: "low-stock",
          color: "yellow",
          text: `Only ${product.total_stock} left`,
          urgent: true,
        };
      } else {
        return {
          status: "in-stock",
          color: "green",
          text: `${product.total_stock} in stock`,
        };
      }
    };

    const stockInfo = getStockStatus();

    const handleQuickView = () => {
      setSelectedProduct(product);
      setShowProductModal(true);
    };

    const imageUrl = getImageUrl(
      primaryVariant?.images?.[0]?.front_image_url || product.primary_image_url,
      product.name
    );

    return (
      <div
        className="bg-white rounded-xl shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl relative group w-full"
        onMouseEnter={() => setHoveredProduct(product.id)}
        onMouseLeave={() => setHoveredProduct(null)}>
        <div className="relative h-32 overflow-hidden bg-gray-100 w-full">
          <img
            src={imageUrl}
            alt={product.name}
            className=" h-full min-w-full object-fit transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(
                product.name
              )}`;
            }}
          />
          <button
            onClick={() => toggleWishlist(product.id)}
            className={`absolute top-3 right-1 rounded-full ${
              isWishlisted
                ? "bg-red-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            } transition-colors duration-200 shadow-md`}>
            <Heart className="h-5 w-5" fill={isWishlisted ? "white" : "none"} />
          </button>

          <div
            className={`absolute top-3 left-3 px-3 py-1 rounded-full font-semibold text-xs ${
              stockInfo.color === "red"
                ? "bg-red-100 text-red-800"
                : stockInfo.color === "yellow"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}>
            {stockInfo.text}
          </div>

          {hoveredProduct === product.id && (
            <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center transition-opacity duration-300">
              <button
                onClick={handleQuickView}
                className="p-3 bg-white text-blue-600 rounded-full shadow-lg hover:bg-blue-50 transition-transform duration-300 transform hover:scale-110">
                <Eye className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-gray-600 font-extrabold capitalize truncate">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600">{product.max_price} RWF</p>
          </div>
          {/* <p className="text-sm text-gray-500 my-1">
            {product.category?.name || "Uncategorized"}
          </p> */}
          <div className="flex items-center gap-2 mb-3">
            <Store className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm text-gray-600 font-light">
              {product.shop_details?.name || "Unknown Shop"}
            </h3>
          </div>
          {/* <div className="flex items-center mt-2">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    (product.avg_rating || 0) >= i ? "fill-current" : ""
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              ({product.review_count || 0})
            </span>
          </div> */}

          <button
            onClick={() => handleAddToCart(product)}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400"
            disabled={product.total_stock === 0 || !isAuthenticated}>
            <ShoppingCart className="h-5 w-5" />
            {product.total_stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    );
  };

  const ProductModal: React.FC<{ product: Product }> = ({ product }) => {
    if (!product) return null;
    const isWishlisted = wishlist.includes(product.id);
    const [selectedVariant, setSelectedVariant] = useState(
      product.variants?.[0] || null
    );
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const allImages = selectedVariant?.images || [];

    const getStockStatus = () => {
      if (!selectedVariant)
        return {
          status: "unknown",
          color: "gray",
          text: "No stock info",
        };

      if (selectedVariant.quantity === 0) {
        return { status: "out-of-stock", color: "red", text: "Out of Stock" };
      } else if (selectedVariant.quantity <= 5) {
        return {
          status: "low-stock",
          color: "yellow",
          text: `Only ${selectedVariant.quantity} left`,
          urgent: true,
        };
      } else {
        return {
          status: "in-stock",
          color: "green",
          text: `${selectedVariant.quantity} in stock`,
        };
      }
    };

    const stockInfo = getStockStatus();

    const nextImage = () => {
      if (allImages.length > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
      }
    };

    const prevImage = () => {
      if (allImages.length > 0) {
        setCurrentImageIndex((prev) =>
          prev - 1 < 0 ? allImages.length - 1 : prev - 1
        );
      }
    };

    const currentImage = allImages[currentImageIndex];
    const displayImageUrl = getImageUrl(
      currentImage?.front_image_url ||
        currentImage?.back_image_url ||
        currentImage?.side_image_url ||
        currentImage?.aerial_image_url ||
        currentImage?.primary_image_url,
      product.name
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative p-6">
          <button
            onClick={() => setShowProductModal(false)}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10">
            <X className="h-6 w-6 text-gray-600" />
          </button>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div
                className="relative bg-gray-100 rounded-lg overflow-hidden mb-4"
                style={{ height: "400px" }}>
                <img
                  src={displayImageUrl}
                  alt={`Product view ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(
                      product.name
                    )}`;
                  }}
                />

                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>

              {allImages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    All Views
                  </h4>
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {allImages.map((img, index) => {
                      const thumbUrl = getImageUrl(
                        img.front_image_url ||
                          img.back_image_url ||
                          img.side_image_url ||
                          img.aerial_image_url ||
                          img.primary_image_url,
                        `${product.name} - View ${index + 1}`
                      );
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden transition bg-gray-100 ${
                            currentImageIndex === index
                              ? "border-blue-500 ring-2 ring-blue-300"
                              : "border-gray-200 hover:border-blue-300"
                          }`}>
                          <img
                            src={thumbUrl}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://via.placeholder.com/100x100?text=View+${
                                index + 1
                              }`;
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {product.name} {allImages.length}
              </h2>
              <p className="text-sm text-gray-500 my-1">
                {product.category?.name || "Uncategorized"}
              </p>

              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold mb-4 mt-2 ${
                  stockInfo.color === "red"
                    ? "bg-red-100 text-red-800"
                    : stockInfo.color === "yellow"
                    ? "bg-yellow-100 text-yellow-800"
                    : stockInfo.color === "green"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                <div
                  className={`w-2 h-2 rounded-full ${
                    stockInfo.color === "red"
                      ? "bg-red-600"
                      : stockInfo.color === "yellow"
                      ? "bg-yellow-600"
                      : "bg-green-600"
                  }`}
                />
                {stockInfo.text}
                {stockInfo.urgent && <AlertCircle className="h-4 w-4" />}
              </div>

              <div className="flex items-center mt-3">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        (product.avg_rating || 0) >= i ? "fill-current" : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">
                  {product.avg_rating?.toFixed(1) || "0.0"} (
                  {product.review_count || 0} reviews)
                </span>
              </div>

              <p className="text-2xl font-bold text-blue-600 mt-4">
                {selectedVariant?.price || product.min_price} RWF
              </p>

              <p className="text-gray-700 mt-4">{product.description}</p>

              {selectedVariant?.shop && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Store className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-lg text-gray-800">
                      {selectedVariant.shop.display}
                    </h3>
                  </div>

                  {selectedVariant.shop.location && (
                    <ShopLocationMap
                      latitude={selectedVariant.shop.location.lat}
                      longitude={selectedVariant.shop.location.lng}
                      shopName={selectedVariant.shop.display}
                      height="250px"
                    />
                  )}
                </div>
              )}

              {product.variants?.some((v) => v.color) && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Color:</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.variants
                      ?.filter(
                        (v, i, arr) =>
                          arr.findIndex(
                            (t) => t.color?.hex_code === v.color?.hex_code
                          ) === i
                      )
                      .map((variant) => (
                        <div
                          key={variant.id}
                          onClick={() => {
                            setSelectedVariant(variant);
                            setCurrentImageIndex(0);
                          }}
                          title={variant.color?.name || "Color"}
                          className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all ${
                            selectedVariant?.color?.hex_code ===
                            variant.color?.hex_code
                              ? "ring-2 ring-offset-2 ring-blue-500 scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{
                            backgroundColor: variant.color?.hex_code || "#ccc",
                          }}
                        />
                      ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={selectedVariant?.quantity === 0 || !isAuthenticated}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                  <ShoppingCart className="h-6 w-6" />
                  Add to Cart
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  disabled={!isAuthenticated}
                  className={`p-3 rounded-lg text-lg border-2 transition-all ${
                    isWishlisted
                      ? "bg-red-500 text-white border-red-500"
                      : "text-red-500 border-red-500 hover:bg-red-50"
                  } disabled:bg-gray-400 disabled:border-gray-400`}>
                  <Heart
                    className="h-6 w-6"
                    fill={isWishlisted ? "white" : "none"}
                  />
                </button>
              </div>

              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(product);
                  setShowRatingModal(true);
                }}
                disabled={!isAuthenticated}
                className="mt-4 w-full text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400">
                Write a Review
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CartSidebar: React.FC = () => (
    <div
      className={`fixed top-0 right-0 w-full md:w-96 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ${
        showCart ? "translate-x-0" : "translate-x-full"
      }`}>
      <div className="flex flex-col h-full">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" /> My Cart
          </h2>
          <button onClick={() => setShowCart(false)} className="p-2">
            <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Your cart is empty.</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const variant = item.variant_details;
              const imageUrl = getImageUrl(
                variant?.images?.[0]?.front_image_url ||
                  variant?.images?.[0]?.back_image_url ||
                  variant?.product?.primary_image_url,
                item.product_name
              );

              return (
                <div
                  key={item.id}
                  className="flex items-start p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <img
                    src={imageUrl}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded-lg mr-4 border border-gray-200 bg-gray-100"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/100x100?text=${encodeURIComponent(
                        item.product_name
                      )}`;
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {item.product_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.size_details?.alpha_size &&
                        `Size: ${item.size_details.alpha_size} | `}
                      {item.color_details?.color_name &&
                        `Color: ${item.color_details.color_name}`}
                    </p>
                    {variant?.shop && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Store className="h-3 w-3" />
                        <span>{variant.shop.display}</span>
                      </div>
                    )}
                    <p className="text-md font-bold text-blue-600 mt-1">
                      {(item.total_price || 0) * item.quantity} RWF
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          disabled={item.quantity >= (variant?.quantity || 999)}
                          className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-5 border-t">
          <div className="flex justify-between text-xl font-bold mb-4 text-gray-800">
            <span>Total:</span>
            <span className="text-blue-600">{cartTotal.toFixed(2)} RWF</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors disabled:bg-gray-400">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );

  const CheckoutModal: React.FC = () => {
    const [nameBuffer, setNameBuffer] = useState(customerName);
    const [emailBuffer, setEmailBuffer] = useState(customerEmail);
    const [phoneBuffer, setPhoneBuffer] = useState(customerPhone);

    useEffect(() => {
      setNameBuffer(customerName);
      setEmailBuffer(customerEmail);
      setPhoneBuffer(customerPhone);
    }, [showCheckout]);

    useEffect(() => {
      const timer = setTimeout(() => {
        setCustomerName(nameBuffer);
      }, 1200);
      return () => clearTimeout(timer);
    }, [nameBuffer]);

    useEffect(() => {
      const timer = setTimeout(() => {
        setCustomerEmail(emailBuffer);
      }, 1200);
      return () => clearTimeout(timer);
    }, [emailBuffer]);

    useEffect(() => {
      const timer = setTimeout(() => {
        setCustomerPhone(phoneBuffer);
      }, 1200);
      return () => clearTimeout(timer);
    }, [phoneBuffer]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
          <button
            onClick={() => setShowCheckout(false)}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X className="h-6 w-6 text-gray-600" />
          </button>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h2>

          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  checkoutStep >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}>
                1
              </div>
              <p className="text-xs mt-1">Delivery</p>
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${
                checkoutStep > 1 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  checkoutStep >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}>
                2
              </div>
              <p className="text-xs mt-1">Details</p>
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${
                checkoutStep > 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  checkoutStep >= 3
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}>
                3
              </div>
              <p className="text-xs mt-1">Payment</p>
            </div>
          </div>

          <div className="min-h-[400px]">
            {checkoutStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">
                  1. Select Delivery Option
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDeliveryOption("delivery")}
                    className={`flex-1 p-4 border-2 rounded-lg text-left transition-all ${
                      deliveryOption === "delivery"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
                    }`}>
                    <Truck className="h-6 w-6 mb-2 text-blue-600" />
                    <p className="font-bold">Home Delivery</p>
                    <p className="text-sm text-gray-600">
                      Get your order delivered to your specified location.
                    </p>
                  </button>
                  <button
                    onClick={() => setDeliveryOption("pickup")}
                    className={`flex-1 p-4 border-2 rounded-lg text-left transition-all ${
                      deliveryOption === "pickup"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
                    }`}>
                    <MapPin className="h-6 w-6 mb-2 text-blue-600" />
                    <p className="font-bold">Store Pickup</p>
                    <p className="text-sm text-gray-600">
                      Pick up your order at a nearby location.
                    </p>
                  </button>
                </div>

                {deliveryOption === "delivery" && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold border-b pb-2">
                      Select Location
                    </h3>
                    <GoogleMapPicker
                      onLocationChange={handleLocationChange}
                      initialLocation={{ lat: mapLat, lng: mapLng }}
                    />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter detailed delivery address"
                      className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
            {checkoutStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">
                  2. Contact & Delivery Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name of Recipient * (At least 1 character)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., John Doe"
                      value={nameBuffer}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 100) {
                          setNameBuffer(value);
                        }
                      }}
                      maxLength={100}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors ${
                        nameBuffer.length > 0 && nameBuffer.trim().length === 0
                          ? "border-red-500 bg-red-50"
                          : nameBuffer.trim().length > 0
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    {nameBuffer.length > 0 &&
                      nameBuffer.trim().length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          Name cannot be only spaces
                        </p>
                      )}
                    {nameBuffer.trim().length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Name is valid
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={emailBuffer}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 100) {
                          setEmailBuffer(value);
                        }
                      }}
                      maxLength={100}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors ${
                        emailBuffer.length > 0 &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBuffer)
                          ? "border-red-500 bg-red-50"
                          : emailBuffer.length > 0 &&
                            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBuffer)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    {emailBuffer.length > 0 &&
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBuffer) && (
                        <p className="text-xs text-red-500 mt-1">
                          Please enter a valid email
                        </p>
                      )}
                    {emailBuffer.length > 0 &&
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBuffer) && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Email is valid
                        </p>
                      )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number * (Exactly 10 digits)
                    </label>
                    <input
                      type="tel"
                      placeholder="+250 XXX XXX XXX"
                      value={phoneBuffer}
                      onChange={(e) => {
                        const value = e.target.value;
                        const digitsOnly = value.replace(/\D/g, "");

                        if (digitsOnly.length > 10) {
                          return;
                        }

                        setPhoneBuffer(value);
                      }}
                      maxLength={20}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors ${
                        phoneBuffer.length > 0 &&
                        phoneBuffer.replace(/\D/g, "").length !== 10
                          ? "border-red-500 bg-red-50"
                          : phoneBuffer.length > 0 &&
                            phoneBuffer.replace(/\D/g, "").length === 10
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    <div className="flex justify-between items-start mt-1">
                      <div>
                        {phoneBuffer.length > 0 &&
                          phoneBuffer.replace(/\D/g, "").length !== 10 && (
                            <p className="text-xs text-red-500">
                              Phone must have exactly 10 digits
                            </p>
                          )}
                        {phoneBuffer.length > 0 &&
                          phoneBuffer.replace(/\D/g, "").length === 10 && (
                            <p className="text-xs text-green-600">
                              ✓ Phone is valid
                            </p>
                          )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {phoneBuffer.replace(/\D/g, "").length}/10 digits
                      </span>
                    </div>
                  </div>
                </div>

                {deliveryOption === "delivery" && (
                  <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Delivery Address:
                    </h4>
                    <p className="text-gray-700">
                      {deliveryAddress || "No location selected"}
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>
                        Coordinates: {mapLat.toFixed(6)}, {mapLng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}

                {deliveryOption === "pickup" && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
                      <Store className="h-5 w-5" />
                      Store Pickup Selected
                    </h4>
                    <p className="text-sm text-blue-700">
                      You will pick up your order from the shop location. Shop
                      details will be provided after order confirmation.
                    </p>
                  </div>
                )}
              </div>
            )}
            {checkoutStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">
                  3. Payment Method
                </h3>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setPaymentMethod("E-Payment")}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-all ${
                      paymentMethod === "E-Payment"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
                    }`}>
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <p className="font-bold">Pay with E-Payment</p>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("cash_on_delivery")}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg text-left transition-all ${
                      paymentMethod === "cash_on_delivery"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                    disabled={deliveryOption === "pickup"}>
                    <Truck className="h-6 w-6 text-blue-600" />
                    <p className="font-bold">Cash on Delivery</p>
                    {deliveryOption === "pickup" && (
                      <span className="text-sm text-red-500 ml-auto">
                        (Not available for Pickup)
                      </span>
                    )}
                  </button>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-lg text-blue-800">
                    Order Summary
                  </h4>
                  <div className="flex justify-between mt-2">
                    <span>Subtotal:</span>
                    <span className="font-bold">
                      {cartTotal.toFixed(2)} RWF
                    </span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Delivery Cost:</span>
                    <span className="font-bold">
                      {deliveryCost.toFixed(2)} RWF
                    </span>
                  </div>
                  <div className="flex justify-between border-t mt-2 pt-2 text-xl font-extrabold">
                    <span>Grand Total:</span>
                    <span>{grandTotal.toFixed(2)} RWF</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between border-t pt-4">
            <button
              onClick={handlePreviousStep}
              disabled={checkoutStep === 1}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50">
              <ChevronLeft className="h-5 w-5 inline-block mr-2" /> Back
            </button>
            {checkoutStep < 3 ? (
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Next Step <ChevronRight className="h-5 w-5 inline-block ml-2" />
              </button>
            ) : (
              <button
                onClick={handleFinalizeOrder}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                {paymentMethod === "E-Payment" ? "Pay Now" : "Generate Bill"} (
                {grandTotal.toFixed(2)} RWF)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BillModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-6">
        <button
          onClick={() => setShowBill(false)}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <X className="h-6 w-6 text-gray-600" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">MUTOVU MALL</h2>
          <p className="text-gray-600">Invoice</p>
          <p className="text-sm text-gray-500">Order #MUTOVU-{Date.now()}</p>
        </div>

        <div className="border-t border-b py-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700">Customer Details:</h3>
              <p className="text-sm">{customerName}</p>
              <p className="text-sm">{customerEmail}</p>
              <p className="text-sm">{customerPhone}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Delivery Details:</h3>
              <p className="text-sm">
                {deliveryOption === "delivery"
                  ? "Home Delivery"
                  : "Store Pickup"}
              </p>
              {deliveryOption === "delivery" && (
                <p className="text-sm">{deliveryAddress}</p>
              )}
            </div>
          </div>
        </div>

        <table className="w-full mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Product</th>
              <th className="text-center p-3 text-sm font-semibold">Qty</th>
              <th className="text-right p-3 text-sm font-semibold">
                Unit Price
              </th>
              <th className="text-right p-3 text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3 text-sm">{item.product_name}</td>
                <td className="p-3 text-sm text-center">{item.quantity}</td>
                <td className="p-3 text-sm text-right">
                  {(item.total_price || 0).toFixed(2)} RWF
                </td>
                <td className="p-3 text-sm text-right font-semibold">
                  {((item.total_price || 0) * item.quantity).toFixed(2)} RWF
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-lg">
            <span>Subtotal:</span>
            <span className="font-semibold">{cartTotal.toFixed(2)} RWF</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Delivery Cost:</span>
            <span className="font-semibold">{deliveryCost.toFixed(2)} RWF</span>
          </div>
          <div className="flex justify-between text-2xl font-bold border-t pt-2">
            <span>Grand Total:</span>
            <span className="text-blue-600">{grandTotal.toFixed(2)} RWF</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-semibold text-yellow-800">
            Payment Method:
          </p>
          <p className="text-sm text-yellow-700">Cash on Delivery</p>
          <p className="text-xs text-yellow-600 mt-2">
            Please have exact change ready when your order arrives.
          </p>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2">
            <FileText className="h-5 w-5" />
            Print Bill
          </button>
          <button
            onClick={confirmCashOrder}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );

  const RatingModal: React.FC<{ product: Product }> = ({ product }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full relative p-6">
        <button
          onClick={() => setShowRatingModal(false)}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <X className="h-6 w-6 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Rate {product.name}
        </h2>
        <div className="flex items-center mb-6">
          <span className="mr-3 font-medium">Your Rating:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer transition-colors duration-150 ${
                  star <= ratingInput
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
                onClick={() => setRatingInput(star)}
              />
            ))}
          </div>
        </div>
        <textarea
          placeholder="Optional: Write a short review..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-6"></textarea>
        <button
          onClick={submitRating}
          disabled={ratingInput === 0}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400">
          Submit Review
        </button>
      </div>
    </div>
  );

  const VariantModal: React.FC<{ cartItem: CartItem; product: Product }> = ({
    cartItem,
    product,
  }) => {
    const [tempVariant, setTempVariant] = useState(
      product.variants?.find((v) => v.id === cartItem.variant) || null
    );

    if (!product || !tempVariant) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full relative p-6">
          <button
            onClick={() => setShowVariantModal(false)}
            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X className="h-6 w-6 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Change Variant for {product.name}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Current: {tempVariant.size?.display || ""}{" "}
            {tempVariant.color?.name || ""} ({tempVariant.price} RWF)
          </p>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {product.variants?.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setTempVariant(variant)}
                className={`w-full p-3 border rounded-lg text-left transition-all flex justify-between items-center ${
                  tempVariant.id === variant.id
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
                disabled={variant.quantity === 0}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2"
                    style={{
                      backgroundColor: variant.color?.hex_code || "#ccc",
                    }}
                  />
                  <div>
                    <p className="font-semibold">
                      Size: {variant.size?.display}
                    </p>
                    <p className="text-sm text-gray-600">
                      Color: {variant.color?.name}
                    </p>
                    <p className="text-sm text-red-500">
                      Stock: {variant.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {variant.price} RWF
                </p>
              </button>
            ))}
          </div>
          <button
            onClick={() => changeVariant(tempVariant)}
            disabled={
              tempVariant.id === cartItem.variant || tempVariant.quantity === 0
            }
            className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400">
            Confirm Change
          </button>
        </div>
      </div>
    );
  };

  const OrdersModal: React.FC = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6">
        <button
          onClick={() => setShowOrders(false)}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <X className="h-6 w-6 text-gray-600" />
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h2>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg">Order #{order.id}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(order.created_at).toLocaleDateString()} at{" "}
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "confirmed" ||
                          order.status === "processing"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>

                <div className="border-t pt-3 mb-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-medium">
                      {parseFloat(order.total_price.toString()).toFixed(2)} RWF
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Address:</span>
                    <span className="font-medium">
                      {order.recipient_address}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => (window.location.href = "./")}
            className="flex items-center text-3xl font-extrabold text-blue-400 italic hover:scale-105 transition-transform cursor-pointer hover:bg-gray-100 px-3 py-1 rounded-lg">
            <House className="h-8 w-8 text-blue-400" />
            MUTOVU MALL
          </button>
          <div className="flex items-center">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-96"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <div className="space-x-4 ml-6 flex items-center">
              <div className="relative">
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Bell className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              <button
                onClick={() => setShowCart(true)}
                disabled={!isAuthenticated}
                className="relative p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                <ShoppingCart className="h-6 w-6" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItems.length}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <User className="h-6 w-6 text-gray-600" />
                  <span className="hidden sm:inline text-gray-600 font-medium">
                    {isAuthenticated ? user?.username || "User" : "Guest"}
                  </span>
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    {isAuthenticated ? (
                      <>
                        <button
                          onClick={handleProfile}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Profile
                        </button>
                        <button
                          onClick={handleViewOrders}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          My Orders
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2">
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleLogin}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Login
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`uppercase text-lg px-4 py-2 hover:transform hover:scale-105 rounded-md font-extrabold cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="sort" className="text-gray-600 text-sm font-medium">
              Sort By:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="featured">Featured</option>
              <option value="new-arrivals">New Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Average Rating</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
            Loading products...
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 bg-red-100 border border-red-300 rounded-lg">
            <AlertCircle className="h-6 w-6 inline-block mr-2" />
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            No products found for your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </main>

      <CartSidebar />
      {showProductModal && selectedProduct && (
        <ProductModal product={selectedProduct} />
      )}
      {showCheckout && <CheckoutModal />}
      {showBill && <BillModal />}
      {showRatingModal && selectedProduct && (
        <RatingModal product={selectedProduct} />
      )}
      {showVariantModal && selectedCartItem && selectedProduct && (
        <VariantModal cartItem={selectedCartItem} product={selectedProduct} />
      )}
      {showOrders && <OrdersModal />}

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DashBoardPage;
