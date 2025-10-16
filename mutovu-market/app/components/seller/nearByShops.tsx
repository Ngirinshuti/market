"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  Search,
  Phone,
  Mail,
  Store,
  AlertCircle,
  RefreshCw,
  Loader,
  Filter,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { authUtils } from "../../lib/auth";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface Shop {
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
  distance?: number;
}

interface LocationState {
  lat: number;
  lng: number;
  accuracy?: number;
}

declare global {
  interface Window {
    google: typeof google;
    googleMapsScriptLoading?: boolean;
    initNearbyShopsMap?: () => void;
  }
}

const NearbyShops: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState("");

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  const [userLocation, setUserLocation] = useState<LocationState | null>(null);
  const [locationError, setLocationError] = useState("");

  const [searchForm, setSearchForm] = useState({
    latitude: "",
    longitude: "",
    radius: "5",
  });

  const [filters, setFilters] = useState({
    radius: 5,
    verified_only: false,
    active_only: true,
  });

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setMapError("Google Maps API key is missing");
      setMapLoading(false);
      return;
    }

    if (window.google?.maps) {
      setMapLoading(false);
      return;
    }

    if (window.googleMapsScriptLoading) {
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          setMapLoading(false);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    window.googleMapsScriptLoading = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.googleMapsScriptLoading = false;
      setMapLoading(false);
    };

    script.onerror = () => {
      setMapError("Failed to load Google Maps");
      setMapLoading(false);
      window.googleMapsScriptLoading = false;
    };

    document.head.appendChild(script);
  }, []);

  // Initialize map when ready
  useEffect(() => {
    if (mapLoading || mapError || !window.google?.maps || !mapRef.current) {
      return;
    }

    if (mapInstanceRef.current) return;

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: -1.9441, lng: 30.0588 },
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error("Error initializing map:", err);
      setMapError("Failed to initialize map");
    }
  }, [mapLoading, mapError]);

  // Update map with shops
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add user location marker
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }

      userMarkerRef.current = new google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: "Your Location",
      });

      mapInstanceRef.current.setCenter({
        lat: userLocation.lat,
        lng: userLocation.lng,
      });
    }

    // Add shop markers
    const bounds = new google.maps.LatLngBounds();
    let hasValidLocation = false;

    shops.forEach((shop) => {
      if (shop.latitude && shop.longitude) {
        const position = { lat: shop.latitude, lng: shop.longitude };

        const marker = new google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          title: shop.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: shop.is_active ? "#10b981" : "#ef4444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${
                shop.name
              }</h3>
              <p style="margin: 4px 0; font-size: 12px;">${shop.address}</p>
              ${
                shop.distance
                  ? `<p style="margin: 4px 0; font-size: 12px; color: #6b7280;">Distance: ${formatDistance(
                      shop.distance
                    )}</p>`
                  : ""
              }
              <p style="margin: 4px 0; font-size: 12px;">
                <a href="tel:${shop.phone}" style="color: #2563eb;">📞 ${
            shop.phone
          }</a>
              </p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
        hasValidLocation = true;
      }
    });

    // Fit bounds if we have locations
    if (hasValidLocation) {
      if (userLocation) {
        bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      }
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [shops, userLocation]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    setLocationLoading(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(location);
        setSearchForm({
          latitude: location.lat.toFixed(6),
          longitude: location.lng.toFixed(6),
          radius: "5",
        });
        setLocationLoading(false);

        searchNearbyShops(location.lat, location.lng, filters.radius);
      },
      (error) => {
        setLocationError(`Failed to get location: ${error.message}`);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFilters((prev) => ({ ...prev, [name]: checked }));
    } else if (name in filters) {
      setFilters((prev) => ({
        ...prev,
        [name]: name === "radius" ? parseFloat(value) : value,
      }));
    } else {
      setSearchForm((prev) => ({ ...prev, [name]: value }));
    }

    setError("");
    setSuccess("");
  };

  const searchNearbyShops = async (
    lat?: number,
    lng?: number,
    radius?: number
  ) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const searchLat = lat || parseFloat(searchForm.latitude);
      const searchLng = lng || parseFloat(searchForm.longitude);
      const searchRadius = radius || filters.radius;

      if (!searchLat || !searchLng) {
        setError("Please provide valid latitude and longitude coordinates.");
        return;
      }

      const accessToken = authUtils.getAccessToken();
      const headers: any = {};

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await axios.get(`${API_BASE_URL}/api/shops/nearby`, {
        params: {
          lat: searchLat,
          lng: searchLng,
          radius: searchRadius,
          verified_only: filters.verified_only,
          active_only: filters.active_only,
        },
        headers,
      });

      const shopsData =
        response.data.data || response.data.results || response.data;
      setShops(Array.isArray(shopsData) ? shopsData : []);

      setSuccess(
        `Found ${shopsData.length} shops within ${searchRadius}km of your location.`
      );
    } catch (error: any) {
      console.error("Error searching nearby shops:", error);
      setError(
        error.response?.data?.message || "Failed to search for nearby shops."
      );
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchNearbyShops();
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Nearby Shops
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Find shops near your location or any coordinates
                </p>
              </div>
            </div>

            <button
              onClick={requestLocationPermission}
              disabled={locationLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {locationLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              Use My Location
            </button>
          </div>
        </div>

        {/* Location Status */}
        {userLocation && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-200 px-4 py-3 rounded-lg mb-6">
            <p className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Current location: {userLocation.lat.toFixed(4)},{" "}
              {userLocation.lng.toFixed(4)}
              {userLocation.accuracy &&
                ` (±${Math.round(userLocation.accuracy)}m)`}
            </p>
          </div>
        )}

        {locationError && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {locationError}
            </p>
          </div>
        )}

        {/* Map View */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Map View
            </h2>
          </div>
          <div className="p-6">
            {mapLoading ? (
              <div className="h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading map...
                  </p>
                </div>
              </div>
            ) : mapError ? (
              <div className="h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-center text-red-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">{mapError}</p>
                </div>
              </div>
            ) : (
              <div
                ref={mapRef}
                className="h-96 w-full rounded-lg border border-gray-200 dark:border-gray-600"
              />
            )}
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Parameters
          </h2>

          <form onSubmit={handleManualSearch} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={searchForm.latitude}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="e.g., -1.9441"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={searchForm.longitude}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="e.g., 30.0619"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Radius
                </label>
                <select
                  name="radius"
                  value={filters.radius}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value={1}>1 km</option>
                  <option value={2}>2 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="verified_only"
                  checked={filters.verified_only}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Verified shops only
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active_only"
                  checked={filters.active_only}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Active shops only
                </span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search Shops
              </button>

              {userLocation && (
                <button
                  type="button"
                  onClick={() =>
                    searchNearbyShops(
                      userLocation.lat,
                      userLocation.lng,
                      filters.radius
                    )
                  }
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Search Near Me
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-200 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Store className="h-5 w-5" />
              Search Results ({shops.length} shops)
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Searching for nearby shops...
                </p>
              </div>
            ) : shops.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No shops found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try increasing your search radius or adjusting your location
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop) => {
                  const distance = shop.distance;

                  return (
                    <div
                      key={shop.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            {shop.name}
                            {shop.is_verified && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                Verified
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {shop.description || "No description available"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              shop.is_active ? "bg-green-500" : "bg-red-500"
                            }`}></div>
                          <span className="text-xs text-gray-500">
                            {shop.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      {distance && (
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDistance(distance)} away
                          </span>
                        </div>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {shop.phone}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {shop.email}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {shop.address}
                          </span>
                        </div>
                      </div>

                      {shop.latitude && shop.longitude && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Coordinates: {shop.latitude.toFixed(4)},{" "}
                          {shop.longitude.toFixed(4)}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {shop.latitude && shop.longitude && (
                          <a
                            href={`https://maps.google.com/?q=${shop.latitude},${shop.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View on Map
                          </a>
                        )}

                        <button
                          onClick={() =>
                            window.open(`tel:${shop.phone}`, "_self")
                          }
                          className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                          <Phone className="h-3 w-3" />
                        </button>

                        <button
                          onClick={() =>
                            window.open(`mailto:${shop.email}`, "_self")
                          }
                          className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                          <Mail className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyShops;
