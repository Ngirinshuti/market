"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Navigation,
  Package,
  Clock,
  DollarSign,
  Star,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Truck,
  User,
  Phone,
  Mail,
  Route,
  Timer,
  Zap,
  TrendingUp,
  Filter,
  Search,
} from "lucide-react";
import { authUtils } from "../../../../app/lib/auth";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const DelivererDashboard = () => {
  const router = useRouter();
  const [authCheckLoading, setAuthCheckLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [selectedRadius, setSelectedRadius] = useState(5); // km
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Statistics
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedToday: 0,
    totalEarnings: 0,
    avgRating: 0,
    pendingDeliveries: 0,
  });

  useEffect(() => {
    const initializeDelivererDashboard = async () => {
      try {
        const isAuthenticated = authUtils.isAuthenticated();

        if (!isAuthenticated) {
          router.push("/pages/login");
          return;
        }

        const userData = authUtils.getUser();

        if (userData?.role?.toLowerCase() !== "deliverer") {
          router.push("/");
          return;
        }

        setUser(userData);
        await requestLocationPermission();
      } catch (error) {
        console.error("Initialization error:", error);
        setError("Failed to initialize dashboard");
      } finally {
        setAuthCheckLoading(false);
      }
    };

    initializeDelivererDashboard();
  }, [router]);

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        loadNearbyShops(location);
        loadAvailableOrders(location);
        loadMyDeliveries();
        loadStatistics();
      },
      (error) => {
        setLocationError(
          "Failed to get your location. Please enable location services."
        );
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const loadNearbyShops = async (location) => {
    setLoading(true);
    try {
      const accessToken = authUtils.getAccessToken();
      const response = await axios.get(
        `${API_BASE_URL}/shops/nearby/?lat=${location.lat}&lng=${location.lng}&radius=${selectedRadius}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setNearbyShops(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error loading nearby shops:", error);
      setError("Failed to load nearby shops");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableOrders = async (location) => {
    try {
      const accessToken = authUtils.getAccessToken();
      const response = await axios.get(
        `${API_BASE_URL}/orders/available-for-delivery/?lat=${location.lat}&lng=${location.lng}&radius=${selectedRadius}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setAvailableOrders(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error loading available orders:", error);
    }
  };

  const loadMyDeliveries = async () => {
    try {
      const accessToken = authUtils.getAccessToken();
      const response = await axios.get(
        `${API_BASE_URL}/deliveries/my-deliveries/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setMyDeliveries(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error loading my deliveries:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      const accessToken = authUtils.getAccessToken();
      const response = await axios.get(
        `${API_BASE_URL}/deliverers/statistics/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleAcceptDelivery = async (orderId) => {
    try {
      const accessToken = authUtils.getAccessToken();
      await axios.post(
        `${API_BASE_URL}/orders/${orderId}/accept-delivery/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Refresh data
      await loadAvailableOrders(userLocation);
      await loadMyDeliveries();
      alert("Delivery accepted successfully!");
    } catch (error) {
      console.error("Error accepting delivery:", error);
      alert("Failed to accept delivery");
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId, status) => {
    try {
      const accessToken = authUtils.getAccessToken();
      await axios.patch(
        `${API_BASE_URL}/deliveries/${deliveryId}/`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      await loadMyDeliveries();
      alert("Delivery status updated successfully!");
    } catch (error) {
      console.error("Error updating delivery status:", error);
      alert("Failed to update delivery status");
    }
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_transit":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const filteredDeliveries = myDeliveries.filter((delivery) => {
    const matchesSearch =
      delivery.order?.product?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      delivery.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || delivery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authCheckLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading deliverer dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Location Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {locationError}
          </p>
          <button
            onClick={requestLocationPermission}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
            <Navigation className="h-5 w-5" />
            Enable Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Deliverer Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user?.first_name} {user?.last_name}
              </p>
              {userLocation && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  Location: {userLocation.lat.toFixed(4)},{" "}
                  {userLocation.lng.toFixed(4)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedRadius}
                onChange={(e) => {
                  const newRadius = parseInt(e.target.value);
                  setSelectedRadius(newRadius);
                  if (userLocation) {
                    loadNearbyShops(userLocation);
                    loadAvailableOrders(userLocation);
                  }
                }}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value={2}>2km radius</option>
                <option value={5}>5km radius</option>
                <option value={10}>10km radius</option>
                <option value={20}>20km radius</option>
              </select>

              <button
                onClick={() => {
                  if (userLocation) {
                    loadNearbyShops(userLocation);
                    loadAvailableOrders(userLocation);
                    loadMyDeliveries();
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-sm text-green-600 font-medium">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalDeliveries || 0}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Deliveries</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Today</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.completedToday || 0}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Completed</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <span className="text-sm text-orange-600 font-medium">
                Active
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.pendingDeliveries || 0}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Pending</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <span className="text-sm text-green-600 font-medium">+15%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              £{stats.totalEarnings || 0}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Earnings</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-8 w-8 text-purple-600" />
              <span className="text-sm text-gray-500">
                {stats.totalReviews || 0} reviews
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.avgRating || 0}/5
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Rating</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Available Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Available Orders ({availableOrders.length})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Orders ready for pickup within {selectedRadius}km
              </p>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Loading orders...
                  </p>
                </div>
              ) : availableOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No orders available
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Check back later or try increasing your radius
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {order.product?.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Order #{order.id} • {order.shop?.name}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}>
                          {order.status?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {userLocation &&
                          order.shop?.latitude &&
                          order.shop?.longitude
                            ? `${calculateDistance(
                                userLocation.lat,
                                userLocation.lng,
                                order.shop.latitude,
                                order.shop.longitude
                              )}km away`
                            : "Distance unknown"}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />£
                          {order.delivery_fee || "5.00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {order.quantity} item(s)
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {order.estimated_time || "30"} mins
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Delivery Address:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.delivery_address ||
                            "Address will be provided after acceptance"}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAcceptDelivery(order.id)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Accept Delivery
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* My Deliveries */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-500" />
                  My Deliveries ({myDeliveries.length})
                </h3>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search deliveries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="all">All Status</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {filteredDeliveries.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {myDeliveries.length === 0
                      ? "No deliveries yet"
                      : "No deliveries found"}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {myDeliveries.length === 0
                      ? "Accept your first delivery to get started"
                      : "Try adjusting your search or filter criteria"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {delivery.order?.product?.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Order #{delivery.order?.id} • {delivery.shop?.name}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            delivery.status
                          )}`}>
                          {delivery.status?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {delivery.customer?.name || "Customer"}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />£
                          {delivery.delivery_fee || "5.00"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {delivery.customer?.phone || "N/A"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          {new Date(delivery.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Delivery Address:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {delivery.delivery_address || "Address not provided"}
                        </p>
                      </div>

                      {/* Action buttons based on status */}
                      {delivery.status === "accepted" && (
                        <button
                          onClick={() =>
                            handleUpdateDeliveryStatus(
                              delivery.id,
                              "in_transit"
                            )
                          }
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                          <Route className="h-4 w-4" />
                          Start Delivery
                        </button>
                      )}

                      {delivery.status === "in_transit" && (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() =>
                              handleUpdateDeliveryStatus(
                                delivery.id,
                                "delivered"
                              )
                            }
                            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Mark Delivered
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateDeliveryStatus(
                                delivery.id,
                                "cancelled"
                              )
                            }
                            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      )}

                      {delivery.status === "delivered" && (
                        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Delivery completed
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nearby Shops */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Nearby Shops ({nearbyShops.length})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Shops within {selectedRadius}km of your location
            </p>
          </div>

          <div className="p-6">
            {nearbyShops.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No nearby shops found
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Try increasing your search radius or check back later
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyShops.map((shop) => (
                  <div
                    key={shop.id}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {shop.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {shop.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {userLocation && shop.latitude && shop.longitude
                          ? `${calculateDistance(
                              userLocation.lat,
                              userLocation.lng,
                              shop.latitude,
                              shop.longitude
                            )}km away`
                          : "Distance unknown"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {shop.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {shop.email}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p className="line-clamp-2">{shop.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelivererDashboard;
