import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Navigation, Loader2, AlertCircle } from "lucide-react";

interface MapPickerProps {
  onLocationChange: (lat: number | null, lng: number | null) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
}

// Get API key from environment variable
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const defaultCenter = { lat: -1.9441, lng: 30.0588 }; // Kigali, Rwanda

// Script loading state management (shared across all instances)
let scriptLoadingState: "idle" | "loading" | "loaded" | "error" = "idle";
let scriptLoadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    google: typeof google;
    googleMapsInitCallbacks?: (() => void)[];
  }
}

// Function to load Google Maps script (only once)
const loadGoogleMapsScript = (): Promise<void> => {
  // Return existing promise if already loading
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  // If already loaded, return resolved promise
  if (window.google?.maps) {
    scriptLoadingState = "loaded";
    return Promise.resolve();
  }

  // Check if script tag already exists
  const existingScript = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  );

  if (existingScript) {
    // Script exists, wait for it to load
    scriptLoadingState = "loading";
    scriptLoadPromise = new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInterval);
          scriptLoadingState = "loaded";
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
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

  // Load new script
  scriptLoadingState = "loading";
  scriptLoadPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      scriptLoadingState = "error";
      reject(new Error("Google Maps API key is missing"));
      return;
    }

    // Create callback array for multiple component instances
    window.googleMapsInitCallbacks = window.googleMapsInitCallbacks || [];

    const callbackName = "initGoogleMaps";
    (window as any)[callbackName] = () => {
      scriptLoadingState = "loaded";
      // Call all registered callbacks
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

const GoogleMapPicker: React.FC<MapPickerProps> = ({
  onLocationChange,
  initialLocation = defaultCenter,
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

  // Function to initialize the map instance
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    try {
      const center = selectedLocation || defaultCenter;
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

      // Initialize Marker
      const marker = new window.google.maps.Marker({
        position: center,
        map: map,
        draggable: true,
      });
      markerRef.current = marker;

      // Set up event listeners
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

      // Initialize Autocomplete
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

  // Load Google Maps script and initialize map
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

        // Wait for script to load
        await loadGoogleMapsScript();

        // Initialize map if component is still mounted
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

  // Handle location update from parent
  useEffect(() => {
    if (
      initialLocation &&
      (initialLocation.lat !== selectedLocation?.lat ||
        initialLocation.lng !== selectedLocation?.lng)
    ) {
      setSelectedLocation(initialLocation);
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setCenter(initialLocation);
        markerRef.current.setPosition(initialLocation);
      }
    }
  }, [initialLocation, selectedLocation]);

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
        <div className="p-3 text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Search and Locate Bar */}
      <div className="flex space-x-2">
        <div className="relative flex-grow">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location (e.g., Kigali, Rwanda)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading || !!error}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
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
          className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-300">
            Loading Map...
          </span>
        </div>
      )}

      {selectedLocation && (
        <div className="border border-blue-300 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Selected Location:
            </span>
            <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
              {selectedLocation.lat.toFixed(6)},{" "}
              {selectedLocation.lng.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
        <div ref={mapRef} style={{ height }} className="w-full" />

        {!isLoading && !error && (
          <div className="absolute top-3 left-3 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Click on map or drag marker to select location
            </p>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
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

export default GoogleMapPicker;
