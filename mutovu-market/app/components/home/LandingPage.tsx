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

// --- CLOUDINARY FIX ---
const CLOUDINARY_DSN =
  process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL ||
  "cloudinary://-:-@your-cloud-name";

/**
 * Parses the cloud name from a Cloudinary DSN (cloudinary://API_KEY:API_SECRET@CLOUD_NAME).
 * @param dsn The Cloudinary DSN string.
 * @returns The extracted cloud name.
 */
const parseCloudinaryDsn = (dsn: string): string => {
  const match = dsn.match(/@([^?]+)/);
  if (match && match[1]) {
    return match[1].split("/")[0]; // Extract the cloud name before any path segment
  }
  return "your-cloud-name"; // Default fallback
};

const CLOUDINARY_CLOUD_NAME = parseCloudinaryDsn(CLOUDINARY_DSN);

// Construct the correct HTTPS base URL for asset delivery
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/`;
// --- END CLOUDINARY FIX ---

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
  address?: string;
  phone?: string;
  email?: string;
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
  shop?: {
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
      front_image_url?: string;
      front_image?: string;
      back_image_url?: string;
      back_image?: string;
      side_image_url?: string;
      side_image?: string;
      aerial_image_url?: string;
      aerial_image?: string;
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
      front_image_url?: string;
      front_image?: string;
      back_image_url?: string;
      back_image?: string;
      side_image_url?: string;
      side_image?: string;
      primary_image_url?: string;
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
    primary_image?: {
      front_image_url?: string;
      front_image?: string;
      back_image_url?: string;
    };
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

/**
 * FIX: Sanitizes a Cloudinary URL to remove duplicate 'image/upload' segments,
 * which causes the 400 Bad Request error.
 */
const sanitizeCloudinaryUrl = (url: string): string => {
  // Find the pattern '/image/upload/' followed immediately by another 'image/upload/'
  // e.g., '...cloudinary.com/mycloud/image/upload/image/upload/v1234/myimage.jpg'
  // and replace it with a single '/image/upload/'
  const duplicateSegment = /\/image\/upload\/(image\/upload)\//gi;
  return url.replace(duplicateSegment, "/image/upload/");
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

  // Logic to handle Cloudinary Public IDs (if base URL is available)
  // Check if it's a relative path (i.e., a Public ID) and that the cloud name is not the default fallback
  if (
    CLOUDINARY_BASE_URL &&
    CLOUDINARY_CLOUD_NAME !== "your-cloud-name" &&
    !imageUrl.startsWith("http")
  ) {
    const baseUrl = CLOUDINARY_BASE_URL.replace(/\/$/, "");
    const publicId = imageUrl.startsWith("/")
      ? imageUrl.substring(1)
      : imageUrl;
    return `${baseUrl}/${publicId}`;
  }

  // FIX: Apply sanitization to fix the known Cloudinary URL duplication issue for full URLs.
  if (imageUrl.includes("cloudinary.com")) {
    return sanitizeCloudinaryUrl(imageUrl);
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

  const directionsUrl = `http://google.com/maps/search/?api=1&query=${latitude},${longitude}`;

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
const EcommerceShop: React.FC = () => {
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
  const [loadingProductDetails, setLoadingProductDetails] = useState(false);

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
          title: "Mutovu Shopping Mall",
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
      (total, item) =>
        total + (item.variant_details?.price || 0) * item.quantity,
      0
    );
  }, [cartItems]);

  const grandTotal = useMemo(() => {
    return cartTotal + deliveryCost;
  }, [cartTotal, deliveryCost]);

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchProducts(1);
  }, [selectedCategory, fetchProducts]);

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
  // RENDER COMPONENTS (Completed)
  // ========================================

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const isWishlisted = wishlist.includes(product.id);
    const primaryVariant = product.variants?.[0];

    const getProductImageUrl = (): string => {
      if (primaryVariant?.images && primaryVariant.images.length > 0) {
        const firstImage = primaryVariant.images[0];
        if (firstImage.primary_image_url) return firstImage.primary_image_url;
        if (firstImage.front_image_url) return firstImage.front_image_url;
        if (firstImage.front_image) return firstImage.front_image;
      }
      if (product.primary_image_url) return product.primary_image_url;
      return getImageUrl(undefined, product.name);
    };

    const imageUrl = getImageUrl(getProductImageUrl(), product.name); // Use the utility function to process the URL

    const getStockStatus = () => {
      if (product.total_stock === 0) {
        return { status: "out-of-stock", color: "red", text: "Out of Stock" };
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

    const handleQuickView = async () => {
      setLoadingProductDetails(true);
      setSelectedProduct(product);
      setShowProductModal(true);
      try {
        const response = await apiCall(`/products/${product.id}`, {}, false);
        if (response.ok) {
          const productData = await response.json();
          setSelectedProduct(productData);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoadingProductDetails(false);
      }
    };

    return (
      <div
        className="group relative bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        onMouseEnter={() => setHoveredProduct(product.id)}
        onMouseLeave={() => setHoveredProduct(null)}>
        <div className="relative aspect-square overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-0 right-0 p-3">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-2 rounded-full shadow-md transition-colors ${
                isWishlisted
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}>
              <Heart
                className="h-5 w-5"
                fill={isWishlisted ? "white" : "none"}
              />
            </button>
          </div>
          {(hoveredProduct === product.id || stockInfo.urgent) && (
            <button
              onClick={handleQuickView}
              className="absolute inset-0 m-auto flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Eye className="h-6 w-6 mr-2" />
              Quick View
            </button>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {product.category?.name || "Uncategorized"}
          </div>
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {product.name}
          </h3>
          <p className="text-sm font-semibold text-gray-700">
            ${product.min_price.toFixed(2)}{" "}
            {product.min_price !== product.max_price &&
              `- $${product.max_price.toFixed(2)}`}
          </p>

          <div className="flex items-center text-sm">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="ml-1 font-medium text-gray-900">
              {(product.avg_rating || 0).toFixed(1)}
            </span>
            <span className="ml-2 text-gray-500">
              ({product.review_count || 0} reviews)
            </span>
          </div>

          <div
            className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${
              stockInfo.status === "in-stock"
                ? "bg-green-100 text-green-800"
                : stockInfo.status === "low-stock"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}>
            {stockInfo.text}
          </div>

          <button
            onClick={() => handleAddToCart(product)}
            disabled={product.total_stock === 0}
            className="w-full mt-3 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
            <ShoppingCart className="h-5 w-5 mr-2" />
            {product.total_stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    );
  };

  // ========================================
  // MISSING MODAL/SIDEBAR DEFINITIONS (Minimally Implemented)
  // ========================================

  const CartSidebar: React.FC = () => {
    if (!showCart) return null;
    // const primaryVariant = selectedProduct?.variants?.[0];

    // Inside EcommerceShop or CartSidebar definition
    const getCartItemImageUrl = (item: CartItem): string => {
      // 1. Check for images attached to the specific variant in the cart item
      const variantImages = item.variant_details?.images;
      const variantPrimaryImageUrl = variantImages?.[0]?.primary_image_url;

      // 2. Fallback to the product's primary image URL (if the variant details include the full product)
      const productPrimaryImageUrl =
        item.variant_details?.product?.primary_image_url;

      // 3. Fallback to a top-level primary image field (if the API structures it this way)
      const genericPrimaryImageUrl =
        item.variant_details?.primary_image?.front_image_url;

      const rawUrl =
        variantPrimaryImageUrl ||
        productPrimaryImageUrl ||
        genericPrimaryImageUrl;

      // FIX: If no valid URL is found, return a robust fallback URL,
      // or an empty string, to prevent the browser from trying to load a malformed URL.
      // Using a known, simple placeholder is safest if an image is required.
      if (!rawUrl) {
        // You must use a known, reliable URL here.
        // This example uses a reliable external placeholder or an image on your own server.
        return "/images/placeholder-product.png"; // <-- RECOMMENDED: Use a local fallback image path
      }

      // Use your global function to sanitize/prefix the URL
      return getImageUrl(rawUrl, item.product_name);
    };

    // const imageUrl = getImageUrl(getCartItemImageUrl(), selectedProduct?.name); // Use the utility function

    return (
      <div className="fixed inset-0 z-40">
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setShowCart(false)}
        />
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
              Your Cart ({cartItems.length})
            </h2>
            <button
              onClick={() => setShowCart(false)}
              className="p-2 rounded-full hover:bg-gray-100">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Your cart is empty.
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-center border-b pb-4">
                  <img
                    src={getCartItemImageUrl(item)}
                    alt={item.product_name}
                    className="w-16 h-16 object-cover rounded-lg mr-4"
                  />
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-800">
                      {item.product_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.variant_details?.size?.display
                        ? `Size: ${item.variant_details.size.display}`
                        : ""}
                      {item.variant_details?.color?.name
                        ? (item.variant_details?.size?.display ? " | " : "") +
                          `Color: ${item.variant_details.color.name}`
                        : ""}
                    </p>
                    <p className="font-bold text-blue-600">
                      ${(item.variant_details?.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQuantity(item.id, -1)}
                      disabled={item.quantity <= 1}
                      className="p-1 border rounded hover:bg-gray-100">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, 1)}
                      disabled={
                        item.quantity >= (item.variant_details?.quantity || 999)
                      }
                      className="p-1 border rounded hover:bg-gray-100">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-4 text-red-500 hover:text-red-700">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="p-5 border-t space-y-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ModalWrapper: React.FC<{
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }> = ({ onClose, title, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow p-6">{children}</div>
      </div>
    </div>
  );

  const ProductModal: React.FC<{ productId: string; onClose: () => void }> = ({
    productId,
    onClose,
  }) => {
    const product = selectedProduct;
    const isLoading = loadingProductDetails;
    const isWishlisted = product ? wishlist.includes(product.id) : false;

    if (!product && !isLoading) return null;

    const primaryVariant = product.variants?.[0];

    const getProductImageUrl = (): string => {
      if (primaryVariant?.images && primaryVariant.images.length > 0) {
        const firstImage = primaryVariant.images[0];
        if (firstImage.primary_image_url) return firstImage.primary_image_url;
        if (firstImage.front_image_url) return firstImage.front_image_url;
        if (firstImage.front_image) return firstImage.front_image;
      }
      if (product.primary_image_url) return product.primary_image_url;
      return getImageUrl(undefined, product.name);
    };

    const imageUrl = getImageUrl(getProductImageUrl(), product.name); // Use the utility function

    return (
      <ModalWrapper
        title={product?.name || "Product Details"}
        onClose={onClose}>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-80 object-cover rounded-lg shadow-md"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-gray-900">
                {product.name}
              </h2>
              <p className="text-xl font-bold text-blue-600">
                ${product.min_price.toFixed(2)}{" "}
                {product.min_price !== product.max_price &&
                  `- $${product.max_price.toFixed(2)}`}
              </p>
              <p className="text-gray-600">
                {product.description || "No description provided."}
              </p>
              <div className="flex items-center text-sm">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="ml-1 font-medium text-gray-900">
                  {(product.avg_rating || 0).toFixed(1)}
                </span>
                <span className="ml-2 text-gray-500">
                  ({product.review_count || 0} reviews)
                </span>
                <button
                  onClick={() => {
                    onClose();
                    setShowRatingModal(true);
                  }}
                  className="ml-4 text-sm text-blue-600 hover:underline">
                  Write a Review
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Stock: {product.total_stock}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => product && handleAddToCart(product)}
                  disabled={product.total_stock === 0}
                  className="flex-grow flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.total_stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3 rounded-lg shadow-md transition-colors ${
                    isWishlisted
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  title={
                    isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"
                  }>
                  <Heart
                    className="h-5 w-5"
                    fill={isWishlisted ? "white" : "none"}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalWrapper>
    );
  };

  const CheckoutModal: React.FC = () => {
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const step1Content = (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold border-b pb-2">
          1. Delivery Method
        </h4>
        <div className="flex space-x-4">
          <label
            className={`flex-1 p-4 border rounded-lg cursor-pointer ${
              deliveryOption === "delivery"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300"
            }`}>
            <input
              type="radio"
              name="deliveryOption"
              value="delivery"
              checked={deliveryOption === "delivery"}
              onChange={(e) => setDeliveryOption(e.target.value)}
              className="mr-2"
            />
            <span className="font-medium flex items-center gap-2">
              <Truck className="h-5 w-5" /> Home Delivery
            </span>
          </label>
          <label
            className={`flex-1 p-4 border rounded-lg cursor-pointer ${
              deliveryOption === "pickup"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300"
            }`}>
            <input
              type="radio"
              name="deliveryOption"
              value="pickup"
              checked={deliveryOption === "pickup"}
              onChange={(e) => setDeliveryOption(e.target.value)}
              className="mr-2"
            />
            <span className="font-medium flex items-center gap-2">
              <Store className="h-5 w-5" /> Store Pickup (Free)
            </span>
          </label>
        </div>

        {deliveryOption === "delivery" && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">
              Select Delivery Location:
            </h4>
            <GoogleMapPicker
              onLocationChange={handleLocationChange}
              initialLocation={{ lat: mapLat, lng: mapLng }}
              height="300px"
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleNextStep}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Next: Contact Info <ChevronRight className="h-5 w-5 inline ml-1" />
          </button>
        </div>
      </div>
    );

    const step2Content = (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold border-b pb-2">
          2. Recipient Information
        </h4>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Recipient Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="email"
            placeholder="Recipient Email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <input
            type="tel"
            placeholder="Recipient Phone (10 digits)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          {deliveryOption === "delivery" && (
            <textarea
              placeholder="Delivery Notes (Optional)"
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              disabled={!deliveryAddress.startsWith("Location:")}
            />
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePreviousStep}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5 inline mr-1" /> Back
          </button>
          <button
            onClick={handleNextStep}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Next: Payment <ChevronRight className="h-5 w-5 inline ml-1" />
          </button>
        </div>
      </div>
    );

    const step3Content = (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold border-b pb-2">
          3. Summary & Payment
        </h4>
        <div className="border p-4 rounded-lg space-y-2 bg-gray-50">
          <div className="flex justify-between">
            <span className="font-medium">Items Total:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Delivery Fee:</span>
            <span>
              {deliveryCost > 0 ? `$${deliveryCost.toFixed(2)}` : "FREE"}
            </span>
          </div>
          <div className="flex justify-between font-bold text-xl border-t pt-2">
            <span>Grand Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="font-semibold text-gray-700">
            Select Payment Method:
          </h5>
          <div className="flex space-x-4">
            <label
              className={`flex-1 p-4 border rounded-lg cursor-pointer ${
                paymentMethod === "E-Payment"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="E-Payment"
                checked={paymentMethod === "E-Payment"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              <span className="font-medium flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> E-Payment (Card/Mobile Money)
              </span>
            </label>
            <label
              className={`flex-1 p-4 border rounded-lg cursor-pointer ${
                paymentMethod === "cash_on_delivery"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300"
              }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cash_on_delivery"
                checked={paymentMethod === "cash_on_delivery"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              <span className="font-medium flex items-center gap-2">
                <House className="h-5 w-5" /> Cash on Delivery
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePreviousStep}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5 inline mr-1" /> Back
          </button>
          <button
            onClick={handleFinalizeOrder}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {paymentMethod === "E-Payment" ? "Pay Now" : "Place Order"}
          </button>
        </div>
      </div>
    );

    return (
      <ModalWrapper
        title={`Checkout (${totalItems} items)`}
        onClose={() => setShowCheckout(false)}>
        <div className="w-full">
          <div className="mb-6 flex justify-between">
            <div
              className={`p-3 rounded-full font-bold ${
                checkoutStep === 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}>
              1
            </div>
            <div
              className={`p-3 rounded-full font-bold ${
                checkoutStep === 2
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}>
              2
            </div>
            <div
              className={`p-3 rounded-full font-bold ${
                checkoutStep === 3
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}>
              3
            </div>
          </div>
          {checkoutStep === 1 && step1Content}
          {checkoutStep === 2 && step2Content}
          {checkoutStep === 3 && step3Content}
        </div>
      </ModalWrapper>
    );
  };

  const BillModal: React.FC = () => (
    <ModalWrapper title="Confirm Cash Order" onClose={() => setShowBill(false)}>
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
        <p className="text-lg font-semibold">
          You have selected Cash on Delivery.
        </p>
        <p className="text-gray-600">
          Please confirm your order for ${grandTotal.toFixed(2)}. You will pay
          cash upon delivery.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => setShowBill(false)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => {
              confirmCashOrder();
              setShowBill(false);
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Confirm Order
          </button>
        </div>
      </div>
    </ModalWrapper>
  );

  const RatingModal: React.FC<{ product: Product }> = ({ product }) => {
    const handleStarClick = (rating: number) => setRatingInput(rating);
    return (
      <ModalWrapper
        title={`Rate & Review: ${product.name}`}
        onClose={() => setShowRatingModal(false)}>
        <div className="space-y-4">
          <h5 className="font-semibold">Your Rating:</h5>
          <div className="flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer transition-colors ${
                  star <= ratingInput
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
                onClick={() => handleStarClick(star)}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Selected: {ratingInput} star{ratingInput !== 1 ? "s" : ""}
          </p>
          <h5 className="font-semibold">Your Review:</h5>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your thoughts on the product (optional)"
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <button
            onClick={submitRating}
            disabled={ratingInput === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
            Submit Review
          </button>
        </div>
      </ModalWrapper>
    );
  };

  const VariantModal: React.FC<{ cartItem: CartItem; product: Product }> = ({
    cartItem,
    product,
  }) => {
    const [selectedVariant, setSelectedVariant] = useState<
      NonNullable<Product["variants"]>[number] | null
    >(product.variants?.find((v) => v.id === cartItem.variant) || null);

    const handleVariantSelect = (
      variant: NonNullable<Product["variants"]>[number]
    ) => {
      setSelectedVariant(variant);
    };

    const isCurrentVariant = (
      variant: NonNullable<Product["variants"]>[number]
    ) => variant.id === cartItem.variant;

    return (
      <ModalWrapper
        title={`Change Variant for: ${product.name}`}
        onClose={() => setShowVariantModal(false)}>
        <div className="space-y-6">
          <p className="font-semibold">
            Current Variant:{" "}
            <span className="text-blue-600">
              {cartItem.variant_details?.size?.display || "N/A"} -{" "}
              {cartItem.variant_details?.color?.name || "N/A"}
            </span>
          </p>

          <h5 className="font-semibold text-gray-700">Available Variants:</h5>
          <div className="grid grid-cols-2 gap-4">
            {product.variants?.map((variant) => (
              <div
                key={variant.id}
                onClick={() => handleVariantSelect(variant)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedVariant?.id === variant.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:bg-gray-50"
                } ${
                  variant.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}>
                <p className="font-medium">
                  Size: {variant.size?.display || "N/A"}
                </p>
                <p className="font-medium">
                  Color: {variant.color?.name || "N/A"}
                </p>
                <p className="text-sm text-blue-600 font-bold">
                  ${variant.price.toFixed(2)}
                </p>
                <p
                  className={`text-xs ${
                    variant.quantity > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                  {variant.quantity > 0
                    ? `${variant.quantity} in stock`
                    : "Out of Stock"}
                </p>
                {isCurrentVariant(variant) && (
                  <span className="text-xs text-blue-600 font-bold">
                    {" "}
                    (Current)
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => selectedVariant && changeVariant(selectedVariant)}
            disabled={
              !selectedVariant ||
              isCurrentVariant(selectedVariant) ||
              selectedVariant.quantity === 0
            }
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
            Confirm Change to Variant
          </button>
        </div>
      </ModalWrapper>
    );
  };

  const OrdersModal: React.FC = () => (
    <ModalWrapper title="Your Orders" onClose={() => setShowOrders(false)}>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            You have no orders.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-4 border rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg">
                    Order #{order.order_number}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Placed on: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    order.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : order.status === "shipped"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <p className="text-xl font-bold pt-2">
                ${order.total_price.toFixed(2)}
              </p>
              <ul className="mt-2 text-sm text-gray-600 border-t pt-2 space-y-1">
                {order.items.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{item.product_name}</span>
                    <span>
                      {item.quantity} x ${item.price.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </ModalWrapper>
  );

  const Header: React.FC = () => (
    <header className="sticky top-0 z-30 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">MUTOVU SHOP</div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full w-64 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="font-medium hidden sm:inline">
                  {user?.username || "Profile"}
                </span>
              </button>
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-40 border border-gray-100">
                  <a
                    onClick={handleProfile}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                    <User className="h-4 w-4 mr-2" /> Profile
                  </a>
                  <a
                    onClick={handleViewOrders}
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" /> Orders
                  </a>
                  <div className="border-t my-1" />
                  <a
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </a>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              <span className="font-medium hidden sm:inline">Login</span>
            </button>
          )}

          <button
            onClick={() => setShowCart(!showCart)}
            className="relative p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          Featured Products
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4 bg-white p-6 rounded-xl shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Filters</h2>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Category</h3>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg">
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg">
                <option value="featured">Featured</option>
                <option value="new-arrivals">New Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Average Rating</option>
              </select>
            </div>
          </div>

          <div className="md:w-3/4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <span className="ml-3 text-lg text-gray-600">
                  Loading products...
                </span>
              </div>
            ) : error ? (
              <div className="p-6 text-red-700 bg-red-100 border border-red-200 rounded-xl text-center">
                <AlertCircle className="h-6 w-6 inline mr-2" />
                {error}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-6 text-gray-700 bg-gray-100 border border-gray-200 rounded-xl text-center">
                <span className="text-lg">
                  No products found matching your criteria.
                </span>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredProducts.length} of {totalCount} results.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {!loading &&
          !error &&
          filteredProducts.length > 0 &&
          totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
      </main>

      <CartSidebar />
      {showProductModal && selectedProduct && (
        <ProductModal
          productId={selectedProduct.id}
          onClose={() => setShowProductModal(false)}
        />
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

export default EcommerceShop;
