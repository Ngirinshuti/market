"use client";
import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Star,
  ShoppingCart,
  Calendar,
  RefreshCw,
  AlertCircle,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
} from "lucide-react";
import { shopAPI, ShopStatistics, Shop } from "../../lib/sellerApi";

interface ShopStatisticsProps {
  selectedShopId: number | null;
}

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "increase" | "decrease" | "neutral";
  icon: React.ElementType;
  color: string;
  description: string;
}

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
);

const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
    <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </button>
    )}
  </div>
);

const ShopStatisticsComponent: React.FC<ShopStatisticsProps> = ({
  selectedShopId,
}) => {
  const [statistics, setStatistics] = useState<ShopStatistics | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatistics = async (shopId: number) => {
    setLoading(true);
    setError("");

    try {
      console.log(`Fetching statistics for shop ${shopId}`);

      // Fetch shop details and statistics
      const [shopResponse, statsResponse] = await Promise.all([
        shopAPI.getShop(shopId),
        shopAPI.getShopStatistics(shopId),
      ]);

      console.log("Shop response:", shopResponse.data);
      console.log("Stats response:", statsResponse.data);

      // Handle different response structures
      const shopData = shopResponse.data.data || shopResponse.data;
      const statsData = statsResponse.data.data || statsResponse.data;

      setShop(shopData);
      setStatistics(statsData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Error fetching statistics:", err);

      // More detailed error handling
      if (err.response?.status === 403) {
        setError(
          "Permission denied. You can only view statistics for your own shops."
        );
      } else if (err.response?.status === 404) {
        setError("Shop not found or statistics unavailable.");
      } else if (err.response?.status === 401) {
        setError("Authentication required. Please log in again.");
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load statistics";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedShopId) {
      fetchStatistics(selectedShopId);
    } else {
      setStatistics(null);
      setShop(null);
      setError("");
    }
  }, [selectedShopId]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? "+" : ""}${num.toFixed(1)}%`;
  };

  const getChangeIcon = (changeType: "increase" | "decrease" | "neutral") => {
    switch (changeType) {
      case "increase":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "decrease":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeType = (
    change: number
  ): "increase" | "decrease" | "neutral" => {
    if (change > 0) return "increase";
    if (change < 0) return "decrease";
    return "neutral";
  };

  const calculateGrowthRate = (recent: number, previous: number): number => {
    if (previous === 0) return recent > 0 ? 100 : 0;
    return ((recent - previous) / previous) * 100;
  };

  if (!selectedShopId) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Shop Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a shop to view its performance statistics
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingState message="Loading shop statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorState
          message={error}
          onRetry={() => fetchStatistics(selectedShopId)}
        />
      </div>
    );
  }

  if (!statistics || !shop) {
    return (
      <div className="p-4 md:p-8">
        <ErrorState
          message="No statistics data available for this shop"
          onRetry={() => fetchStatistics(selectedShopId)}
        />
      </div>
    );
  }

  const avgOrderValue =
    statistics.totalOrders > 0
      ? statistics.totalRevenue / statistics.totalOrders
      : 0;

  const orderGrowth = calculateGrowthRate(
    statistics.recentOrders,
    statistics.totalOrders - statistics.recentOrders
  );

  const revenueGrowth = calculateGrowthRate(
    statistics.recentRevenue,
    statistics.totalRevenue - statistics.recentRevenue
  );

  const statCards: StatCard[] = [
    {
      title: "Total Products",
      value: formatNumber(statistics.totalProducts),
      icon: Package,
      color: "blue",
      description: "Active products in your shop",
    },
    {
      title: "Total Orders",
      value: formatNumber(statistics.totalOrders),
      change: orderGrowth,
      changeType: getChangeType(orderGrowth),
      icon: ShoppingCart,
      color: "green",
      description: "All-time order count",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(statistics.totalRevenue),
      change: revenueGrowth,
      changeType: getChangeType(revenueGrowth),
      icon: DollarSign,
      color: "yellow",
      description: "All-time earnings",
    },
    {
      title: "Average Rating",
      value: `${statistics.avgRating.toFixed(1)}/5.0`,
      icon: Star,
      color: "purple",
      description: `Based on ${formatNumber(statistics.totalReviews)} reviews`,
    },
    {
      title: "Recent Orders",
      value: formatNumber(statistics.recentOrders),
      icon: TrendingUp,
      color: "indigo",
      description: "Orders in the last 30 days",
    },
    {
      title: "Recent Revenue",
      value: formatCurrency(statistics.recentRevenue),
      icon: BarChart3,
      color: "emerald",
      description: "Revenue in the last 30 days",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(avgOrderValue),
      icon: Users,
      color: "orange",
      description: "Average value per order",
    },
    {
      title: "Total Reviews",
      value: formatNumber(statistics.totalReviews),
      icon: Star,
      color: "pink",
      description: "Customer feedback received",
    },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Shop Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Performance metrics for <strong>{shop.name}</strong> • Shop ID:{" "}
            {shop.id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          <button
            onClick={() => fetchStatistics(selectedShopId)}
            disabled={loading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-2 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900`}>
                <card.icon className={`h-6 w-6 text-${card.color}-600`} />
              </div>

              {card.change !== undefined && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(card.changeType!)}
                  <span
                    className={`text-sm font-medium ${
                      card.changeType === "increase"
                        ? "text-green-600 dark:text-green-400"
                        : card.changeType === "decrease"
                        ? "text-red-600 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                    {formatPercentage(card.change)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {card.value}
              </h3>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {card.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Summary and other existing sections remain the same */}
      {/* ... rest of your component remains unchanged ... */}
    </div>
  );
};

export default ShopStatisticsComponent;
