// app/pages/deliverer/dashboard/page.tsx
"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Package,
  Clock,
  DollarSign,
  CheckCircle,
  RefreshCw,
  Truck,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  ThumbsUp,
  XCircle,
  Calendar,
  Zap,
} from "lucide-react";

// Assuming you have an auth utility, ensure the import is correct (e.g., default import)
import { authUtils } from "../../../lib/auth";
import { delivererAPI } from "../../../lib/delivererApi";
import {
  Delivery,
  OrderAvailable,
  DelivererStats,
  User, // Now correctly imported from delivererTypes.ts
  calculateDistance,
  formatPrice,
} from "../../../lib/delivererTypes";

const DelivererDashboard = () => {
  const router = useRouter();
  const [authCheckLoading, setAuthCheckLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [availableOrders, setAvailableOrders] = useState<OrderAvailable[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [selectedRadius, setSelectedRadius] = useState(10); // km
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState<DelivererStats>({
    period: "all",
    total_earnings: 0,
    total_deliveries: 0,
    average_per_delivery: 0,
    daily_breakdown: [],
  });

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "accepted", label: "Accepted (Active)" },
    { value: "picked_up", label: "Picked Up" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // --- Fetching Logic ---
  const fetchStats = useCallback(async () => {
    try {
      const data = await delivererAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchAvailableOrders = useCallback(async () => {
    if (!userLocation) return;
    setLoading(true);
    setError("");
    try {
      const orders = await delivererAPI.getAvailableOrders(
        userLocation.lat,
        userLocation.lng,
        selectedRadius
      );
      setAvailableOrders(orders);
    } catch (err: any) {
      setError("Failed to fetch available orders.");
      setAvailableOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation, selectedRadius]);

  const fetchMyDeliveries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const deliveries = await delivererAPI.getMyDeliveries(statusFilter);
      setMyDeliveries(deliveries);
    } catch (err: any) {
      setError("Failed to fetch assigned deliveries.");
      setMyDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // --- Location and Initial Load ---
  useEffect(() => {
    const checkAuth = async () => {
      // Corrected usage of authUtils
      const authenticatedUser = await authUtils.getCurrentUser();
      if (!authenticatedUser) {
        router.push("/pages/login");
      } else {
        // Cast or assume correct type based on authUtils return
        setUser(authenticatedUser as User);
        setAuthCheckLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user && !userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (err) => {
            setLocationError(
              "Geolocation failed. Orders will not be location-filtered."
            );
            console.error(err);
          }
        );
      } else {
        setLocationError("Geolocation is not supported by this browser.");
      }
    }
  }, [user, userLocation]);

  useEffect(() => {
    if (user) {
      fetchMyDeliveries();
      fetchStats();
    }
  }, [user, fetchMyDeliveries, fetchStats]);

  useEffect(() => {
    if (userLocation) {
      fetchAvailableOrders();
    }
  }, [userLocation, selectedRadius, fetchAvailableOrders]);

  // --- Filtering Logic ---
  const filteredDeliveries = useMemo(() => {
    return myDeliveries.filter((delivery) => {
      const productName =
        delivery.order?.variant_details?.product_details?.name?.toLowerCase() ||
        "";
      const orderId = delivery.order?.id.toString() || "";

      const matchesSearch =
        productName.includes(searchTerm.toLowerCase()) ||
        orderId.includes(searchTerm);

      return matchesSearch;
    });
  }, [myDeliveries, searchTerm]);

  // --- Actions ---
  const handleAcceptOrder = async (order: OrderAvailable) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const estimatedTime = 30;

      await delivererAPI.acceptOrder(order.id, estimatedTime);

      setSuccess(`Order #${order.id} accepted! Ready for pickup.`);

      await fetchAvailableOrders();
      await fetchMyDeliveries();
      await fetchStats();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.order?.[0] ||
        err.response?.data?.detail ||
        "Failed to accept delivery. It may be already assigned.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryStatus = async (
    deliveryId: number,
    newStatus: string
  ) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await delivererAPI.updateDeliveryStatus(deliveryId, newStatus);

      setSuccess(
        `Delivery #${deliveryId} marked as ${newStatus.replace("_", " ")}.`
      );

      await fetchMyDeliveries();
      await fetchStats();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          `Failed to update status to ${newStatus}.`
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Component Rendering (Rest of the UI remains the same) ---
  if (authCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const DeliveryCard: React.FC<{ delivery: Delivery }> = ({ delivery }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Truck className="h-5 w-5 text-purple-500" />
          Delivery #{delivery.id}
        </h4>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            delivery.status === "delivered"
              ? "bg-green-100 text-green-800"
              : delivery.status === "picked_up"
              ? "bg-indigo-100 text-indigo-800"
              : "bg-yellow-100 text-yellow-800"
          }`}>
          {delivery.status.charAt(0).toUpperCase() +
            delivery.status.slice(1).replace("_", " ")}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Order: #{delivery.order.id} | Product:{" "}
        {delivery.order.variant_details.product_details.name}
      </p>
      <p className="text-lg font-bold text-green-600 dark:text-green-400 my-1">
        {formatPrice(delivery.delivery_fee)} Fee
      </p>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <MapPin className="h-4 w-4 mr-2 text-blue-500" />
          <span className="font-medium">Pickup:</span>{" "}
          {delivery.pickup_address.split(",")[0]}...
        </div>
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <MapPin className="h-4 w-4 mr-2 text-red-500" />
          <span className="font-medium">Deliver:</span>{" "}
          {delivery.delivery_address.split(",")[0]}...
        </div>
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <Clock className="h-4 w-4 mr-2 text-gray-500" />
          <span className="font-medium">Est. Time:</span>{" "}
          {delivery.estimated_time} mins
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {delivery.status === "accepted" && (
          <button
            onClick={() => handleUpdateDeliveryStatus(delivery.id, "picked_up")}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white text-sm py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Mark as Picked Up"
            )}
          </button>
        )}
        {delivery.status === "picked_up" && (
          <button
            onClick={() => handleUpdateDeliveryStatus(delivery.id, "delivered")}
            disabled={loading}
            className="flex-1 bg-green-600 text-white text-sm py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Mark as Delivered"
            )}
          </button>
        )}
      </div>
    </div>
  );

  const AvailableOrderCard: React.FC<{ order: OrderAvailable }> = ({
    order,
  }) => (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <p className="text-md font-semibold text-gray-900 dark:text-white flex justify-between items-center">
        Order #{order.id}
        <span className="text-sm font-normal text-blue-600 dark:text-blue-400">
          <MapPin className="h-4 w-4 inline mr-1" />
          {order.distance ? `${order.distance} km` : "Distance unknown"}
        </span>
      </p>
      <p className="text-xl font-bold text-green-600 dark:text-green-400 my-1">
        {formatPrice(order.delivery_fee || 5.0)} Fee
      </p>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p>
          <Package className="h-4 w-4 inline mr-1" />
          {order.variant?.product?.name}
        </p>
        <p>
          <Calendar className="h-4 w-4 inline mr-1" />
          Pickup: {order.variant?.product?.shop?.name}
        </p>
        <p>
          <Truck className="h-4 w-4 inline mr-1" />
          Delivery to: {order.user?.address?.split(",")[0]}...
        </p>
      </div>

      <button
        onClick={() => handleAcceptOrder(order)}
        className="w-full mt-3 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        disabled={loading}>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ThumbsUp className="h-5 w-5" />
        )}
        Accept Delivery
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 dark:bg-gray-900 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
        <Truck className="h-8 w-8 text-blue-600" />
        Deliverer Dashboard
      </h2>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 p-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Deliveries"
          value={stats.total_deliveries.toString()}
          icon={<Truck />}
          color="text-blue-600"
        />
        <StatCard
          title="Total Earnings"
          value={formatPrice(stats.total_earnings)}
          icon={<DollarSign />}
          color="text-green-600"
        />
        <StatCard
          title="Avg. Fee / Delivery"
          value={formatPrice(stats.average_per_delivery)}
          icon={<Zap />}
          color="text-yellow-600"
        />
        <StatCard
          title="Active Deliveries"
          value={myDeliveries
            .filter((d) => d.status === "accepted" || d.status === "picked_up")
            .length.toString()}
          icon={<Clock />}
          color="text-indigo-600"
        />
      </div>

      {/* Assigned Deliveries Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            My Assigned Deliveries ({filteredDeliveries.length})
          </h3>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search delivery..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 dark:text-white text-sm w-32 sm:w-48 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-lg py-1.5 px-3 dark:bg-gray-700 dark:text-white text-sm focus:border-blue-500 focus:ring-blue-500">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={fetchMyDeliveries}
              disabled={loading}
              className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading && myDeliveries.length === 0 ? (
          <div className="text-center py-6">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
          </div>
        ) : filteredDeliveries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeliveries.map((delivery) => (
              <DeliveryCard key={delivery.id} delivery={delivery} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No assigned deliveries matching your filter.
          </div>
        )}
      </div>

      {/* Available Orders Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Available Orders Near You ({availableOrders.length})
        </h3>

        {userLocation ? (
          <div className="flex gap-4 mb-4 items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-red-500" />
              Current Location: {userLocation.lat.toFixed(4)},{" "}
              {userLocation.lng.toFixed(4)}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="h-4 w-4" />
              Radius:
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-700 rounded-lg py-1 px-2 dark:bg-gray-700 dark:text-white text-sm">
                {[5, 10, 20, 50].map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchAvailableOrders}
              disabled={loading}
              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1 disabled:opacity-50">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            {locationError ||
              "Waiting for location access to show nearby orders..."}
          </div>
        )}

        {loading && availableOrders.length === 0 ? (
          <div className="text-center py-6">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
          </div>
        ) : availableOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableOrders.map((order) => (
              <AvailableOrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No orders are currently available for pickup near you (within{" "}
            {selectedRadius}km).
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for statistics display
const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactElement;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
        {value}
      </p>
    </div>
    {React.cloneElement(icon, { className: `h-8 w-8 ${color}` })}
  </div>
);

export default DelivererDashboard;
