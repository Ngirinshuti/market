"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  Eye,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Lock,
  Unlock,
  CornerUpLeft,
  RefreshCw,
  Calendar,
  Tent,
} from "lucide-react";
import { authUtils } from "../../lib/auth";
import { shopAPI, Shop } from "../../lib/sellerApi";

interface MyShopsProps {
  onShopSelect?: (shopId: number) => void;
  selectedShopId?: number | null;
}

interface ShopDetailProps {
  shop: Shop;
  onBack: () => void;
  onUpdate: (shop: Shop) => void;
  onDelete: (shopId: number) => void;
  onStatusChange: (shopId: number, isActive: boolean) => void;
}

interface CreateShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (shop: Shop) => void;
}

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
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
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        <RefreshCw className="h-4 w-4 inline mr-2" />
        Retry
      </button>
    )}
  </div>
);

const CreateShopModal: React.FC<CreateShopModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    latitude: -1.9441, // Default Kigali coordinates
    longitude: 30.0588,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const locationData = {
        type: "Point",
        coordinates: [formData.longitude, formData.latitude], // GeoJSON format
      };

      const payload = {
        ...formData,
        location: locationData,
      };

      const response = await shopAPI.createShop(payload);
      onSuccess(response.data.data || response.data);
      onClose();

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        description: "",
        latitude: -1.9441,
        longitude: 30.0588,
        is_active: true,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Create New Shop
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900 dark:text-white">
              Shop is Active
            </label>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg"
              disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {loading ? "Creating..." : "Create Shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ShopDetail: React.FC<ShopDetailProps> = ({
  shop,
  onBack,
  onUpdate,
  onDelete,
  onStatusChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(shop);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await shopAPI.updateShop(shop.id, editForm);
      onUpdate(response.data.data || response.data);
      setSuccess("Shop updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update shop");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${shop.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await shopAPI.deleteShop(shop.id);
      onDelete(shop.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete shop");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = !shop.is_active;
    const action = newStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} this shop?`)) {
      return;
    }

    try {
      await shopAPI.updateShop(shop.id, { is_active: newStatus });
      onStatusChange(shop.id, newStatus);
      setSuccess(`Shop ${action}d successfully!`);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} shop`);
    }
  };

  const InfoRow = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: string | React.ReactNode;
    icon: React.ElementType;
  }) => (
    <div className="flex items-start space-x-4 py-3 border-b dark:border-gray-700">
      <Icon className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <div className="text-gray-900 dark:text-white font-semibold">
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
        <CornerUpLeft className="w-4 h-4 mr-2" />
        Back to Shops
      </button>

      <div className="flex justify-between items-start">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {shop.name}
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              isEditing
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}>
            <Edit className="w-4 h-4 inline mr-2" />
            {isEditing ? "Cancel Edit" : "Edit Shop"}
          </button>
          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              shop.is_active
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}>
            {shop.is_active ? (
              <Lock className="w-4 h-4 inline mr-2" />
            ) : (
              <Unlock className="w-4 h-4 inline mr-2" />
            )}
            {shop.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-lg">
          <CheckCircle className="w-4 h-4 inline mr-2" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          {error}
        </div>
      )}

      {isEditing ? (
        <form
          onSubmit={handleUpdate}
          className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Shop Name
              </label>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={editForm.phone}
                onChange={handleEditChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={editForm.email}
              onChange={handleEditChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={editForm.address}
              onChange={handleEditChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={editForm.description || ""}
              onChange={handleEditChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg flex items-center">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Shop
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center">
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Shop Information
            </h3>
            <InfoRow
              label="Description"
              value={shop.description || "No description"}
              icon={Store}
            />
            <InfoRow label="Address" value={shop.address} icon={MapPin} />
            <InfoRow label="Phone" value={shop.phone} icon={Phone} />
            <InfoRow label="Email" value={shop.email} icon={Mail} />
            {shop.latitude && shop.longitude && (
              <InfoRow
                label="Coordinates"
                value={`${shop.latitude.toFixed(4)}, ${shop.longitude.toFixed(
                  4
                )}`}
                icon={MapPin}
              />
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Status & History
            </h3>
            <InfoRow
              label="Status"
              value={
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    shop.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  }`}>
                  {shop.is_active ? "Active" : "Inactive"}
                </span>
              }
              icon={CheckCircle}
            />
            <InfoRow
              label="Verified"
              value={
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    shop.is_verified
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}>
                  {shop.is_verified ? "Yes" : "Pending"}
                </span>
              }
              icon={CheckCircle}
            />
            <InfoRow
              label="Created"
              value={new Date(shop.created_at).toLocaleDateString()}
              icon={Calendar}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const MyShops: React.FC<MyShopsProps> = ({ onShopSelect, selectedShopId }) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Fixed fetchShops function for MyShops component (myShops.tsx)
  const fetchShops = async () => {
    console.log("=== MyShops fetchShops called ===");
    setLoading(true);
    setError("");

    try {
      const response = await shopAPI.getMyShops();
      console.log("MyShops API response:", response.data);

      // FIXED: Handle GeoJSON response format
      let shopsData = [];

      if (
        response.data.data &&
        response.data.data.type === "FeatureCollection"
      ) {
        // Convert GeoJSON features to shop objects
        shopsData = response.data.data.features.map((feature) => ({
          id: feature.id,
          name: feature.properties.name,
          phone: feature.properties.phone,
          email: feature.properties.email,
          address: feature.properties.address,
          description: feature.properties.description,
          latitude: feature.properties.latitude,
          longitude: feature.properties.longitude,
          created_at: feature.properties.created_at,
          updated_at:
            feature.properties.updated_at || feature.properties.created_at,
          // Add missing required properties with defaults
          is_active:
            feature.properties.is_active !== undefined
              ? feature.properties.is_active
              : true,
          is_verified:
            feature.properties.is_verified !== undefined
              ? feature.properties.is_verified
              : false,
          owner: feature.properties.owner,
        }));
      } else {
        // Fallback for regular response format
        shopsData = response.data.data || response.data.results || [];
      }

      console.log("MyShops parsed shops:", shopsData);
      setShops(shopsData);
    } catch (err) {
      console.error("MyShops fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch shops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleCreateSuccess = (newShop: Shop) => {
    setShops((prev) => [...prev, newShop]);
    setIsCreateModalOpen(false);
  };

  const handleUpdateShop = (updatedShop: Shop) => {
    setShops((prev) =>
      prev.map((shop) => (shop.id === updatedShop.id ? updatedShop : shop))
    );
    setSelectedShop(updatedShop);
  };

  const handleDeleteShop = (shopId: number) => {
    setShops((prev) => prev.filter((shop) => shop.id !== shopId));
    setSelectedShop(null);
    if (onShopSelect) onShopSelect(null);
  };

  const handleStatusChange = (shopId: number, isActive: boolean) => {
    setShops((prev) =>
      prev.map((shop) =>
        shop.id === shopId ? { ...shop, is_active: isActive } : shop
      )
    );
    if (selectedShop && selectedShop.id === shopId) {
      setSelectedShop((prev) =>
        prev ? { ...prev, is_active: isActive } : null
      );
    }
  };

  if (selectedShop) {
    return (
      <ShopDetail
        shop={selectedShop}
        onBack={() => setSelectedShop(null)}
        onUpdate={handleUpdateShop}
        onDelete={handleDeleteShop}
        onStatusChange={handleStatusChange}
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Shops ({shops.length})
        </h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition">
          <Plus className="w-5 h-5 mr-2" />
          Add New Shop
        </button>
      </div>

      <CreateShopModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {loading && <LoadingState message="Loading your shops..." />}

      {error && <ErrorState message={error} onRetry={fetchShops} />}

      {!loading && !error && shops.length === 0 && (
        <div className="p-10 text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700">
          <Tent className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <p className="text-xl font-medium text-gray-700 dark:text-gray-300">
            No Shops Found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Click "Add New Shop" to create your first shop location.
          </p>
        </div>
      )}

      {!loading && !error && shops.length > 0 && (
        <div className="space-y-4">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition">
              <div className="flex items-center space-x-4">
                <Store className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {shop.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {shop.address}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span
                  className={`py-1 px-3 rounded-full text-xs font-bold ${
                    shop.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                  }`}>
                  {shop.is_active ? "Active" : "Inactive"}
                </span>

                <button
                  onClick={() => setSelectedShop(shop)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                  <Eye className="w-5 h-5" />
                </button>

                {onShopSelect && (
                  <button
                    onClick={() => onShopSelect(shop.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                      selectedShopId === shop.id
                        ? "bg-indigo-600 text-white"
                        : "text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                    }`}>
                    {selectedShopId === shop.id ? "Selected" : "Select"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyShops;
