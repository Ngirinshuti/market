"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { orderAPI, Order, Shop } from "../../lib/sellerApi";

interface OrderManagementProps {
  selectedShopId: number | null;
}

interface OrderWithDetails extends Order {
  customer_name?: string;
  product_name?: string;
  size_name?: string;
  color_name?: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({
  selectedShopId,
}) => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
    null
  );
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const statusOptions = [
    { value: "All", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "returned", label: "Returned" },
  ];

  const dateFilterOptions = [
    { value: "All", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
  ];

  const fetchOrders = async () => {
    if (!selectedShopId) return;

    setLoading(true);
    setError("");

    try {
      const response = await orderAPI.getShopOrders(selectedShopId, {
        status: statusFilter !== "All" ? statusFilter : undefined,
        date_filter: dateFilter !== "All" ? dateFilter : undefined,
      });

      const ordersData =
        response.data.data || response.data.results || response.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setSuccess("Orders loaded successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedShopId) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [selectedShopId, statusFilter, dateFilter]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await orderAPI.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      setSuccess(`Order #${orderId} status updated to ${newStatus}`);

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "processing":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
      case "returned":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
      case "returned":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(lowerSearch) ||
          (order.customer_name &&
            order.customer_name.toLowerCase().includes(lowerSearch)) ||
          (order.product_name &&
            order.product_name.toLowerCase().includes(lowerSearch))
      );
    }

    return filtered;
  }, [orders, searchTerm]);

  const orderStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.total_price,
      0
    );
    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;
    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered"
    ).length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }, [orders]);

  if (!selectedShopId) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Shop Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a shop to view and manage its orders
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Order Management ({filteredOrders.length} Orders)
        </h2>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Orders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orderStats.totalOrders}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                £{orderStats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Pending Orders
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orderStats.pendingOrders}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Delivered
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orderStats.deliveredOrders}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Avg Order Value
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                £{orderStats.avgOrderValue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders, customers, products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
          {dateFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading orders...
            </p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Orders Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {orders.length === 0
              ? "This shop hasn't received any orders yet"
              : "No orders match your current search and filter criteria"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-xl border dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {order.customer_name || `User ${order.user}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {order.product_name || `Product ${order.product}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Qty: {order.quantity} •{" "}
                      {order.size_name || `Size ${order.size}`} •{" "}
                      {order.color_name || `Color ${order.color}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      £{order.total_price.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      £{order.unit_price.toFixed(2)} each
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${getStatusColor(
                        order.status
                      )}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition p-1"
                        title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>

                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "confirmed")
                          }
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition p-1"
                          title="Confirm Order">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {(order.status === "confirmed" ||
                        order.status === "processing") && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "shipped")}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition p-1"
                          title="Mark as Shipped">
                          <Truck className="w-4 h-4" />
                        </button>
                      )}

                      {order.status === "shipped" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "delivered")
                          }
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition p-1"
                          title="Mark as Delivered">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "cancelled")
                          }
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition p-1"
                          title="Cancel Order">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Order Details #{selectedOrder.id}
              </h3>
              <button
                onClick={() => {
                  setShowOrderDetails(false);
                  setSelectedOrder(null);
                }}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Current Status
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium gap-2 ${getStatusColor(
                    selectedOrder.status
                  )}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status.charAt(0).toUpperCase() +
                    selectedOrder.status.slice(1)}
                </span>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Customer Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {selectedOrder.customer_name ||
                        `User ID: ${selectedOrder.user}`}
                    </span>
                  </div>
                  {selectedOrder.delivery_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {selectedOrder.delivery_address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Product Details
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedOrder.product_name ||
                          `Product ID: ${selectedOrder.product}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Size: {selectedOrder.size_name || selectedOrder.size} •
                        Color: {selectedOrder.color_name || selectedOrder.color}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Quantity
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedOrder.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="border-t dark:border-gray-600 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Unit Price:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        £{selectedOrder.unit_price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Delivery Fee:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        £{selectedOrder.delivery_fee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-medium text-lg">
                      <span className="text-gray-900 dark:text-white">
                        Total:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        £{selectedOrder.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Order Timeline
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Created:{" "}
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Last Updated:{" "}
                      {new Date(selectedOrder.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t dark:border-gray-600">
                {selectedOrder.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, "confirmed");
                        setShowOrderDetails(false);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Confirm Order
                    </button>
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, "cancelled");
                        setShowOrderDetails(false);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Cancel Order
                    </button>
                  </>
                )}

                {(selectedOrder.status === "confirmed" ||
                  selectedOrder.status === "processing") && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "shipped");
                      setShowOrderDetails(false);
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Mark as Shipped
                  </button>
                )}

                {selectedOrder.status === "shipped" && (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "delivered");
                      setShowOrderDetails(false);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
