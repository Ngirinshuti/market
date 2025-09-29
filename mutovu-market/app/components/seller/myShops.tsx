"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
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
  X,
  FileText,
  Home,
} from "lucide-react";
import { authUtils } from "../../lib/auth";
import { shopAPI, Shop } from "../../lib/sellerApi";

// ============================================================================
// DYNAMIC IMPORTS
// ============================================================================

const MapPicker = dynamic(() => import("../shop/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading map...
        </p>
      </div>
    </div>
  ),
});

// ============================================================================
// INTERFACES
// ============================================================================

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

interface ShopFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  is_active: boolean;
}

interface LocationData {
  lat: number;
  lng: number;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
);

const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
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

const EmptyState: React.FC = () => (
  <div className="p-10 text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700">
    <Tent className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
      No Shops Found
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Click "Add New Shop" to create your first shop location.
    </p>
  </div>
);

const AlertMessage: React.FC<{
  type: "success" | "error";
  message: string;
  onDismiss?: () => void;
}> = ({ type, message, onDismiss }) => {
  const styles = {
    success:
      "text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800",
    error:
      "text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800",
  };

  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div
      className={`p-4 rounded-lg border flex items-start justify-between ${styles[type]}`}>
      <div className="flex items-center">
        <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 p-1 hover:bg-black hover:bg-opacity-10 rounded">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// SHOP FORM COMPONENTS
// ============================================================================

const ShopFormFields: React.FC<{
  formData: ShopFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  isEditing?: boolean;
}> = ({ formData, onChange, isEditing = false }) => {
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition";

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Shop Details
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Shop Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            placeholder="e.g., The Corner Store"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            required
            placeholder="e.g., +250 123 456 789"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          required
          placeholder="e.g., info@shopname.com"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Shop Address *
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={onChange}
          required
          rows={3}
          placeholder="Street address, district, city"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onChange}
          rows={3}
          placeholder="Brief description of your shop and what you sell"
          className={inputClass}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={onChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          htmlFor="is_active"
          className="ml-2 block text-sm text-gray-900 dark:text-white">
          Shop is Active
        </label>
      </div>
    </div>
  );
};

const LocationPicker: React.FC<{
  location: LocationData | null;
  onLocationChange: (lat: number | null, lng: number | null) => void;
}> = ({ location, onLocationChange }) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
      <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
        Shop Location *
      </h4>
    </div>

    <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
      <span className="font-medium text-blue-700 dark:text-blue-300 text-sm">
        Selected Coordinates:
      </span>
      <span className="font-mono text-gray-800 dark:text-gray-200 text-sm">
        {location
          ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
          : "Click map or search to select location"}
      </span>
    </div>

    <div className="h-96 w-full rounded-lg shadow-inner border border-gray-200 dark:border-gray-600 overflow-hidden">
      <MapPicker onLocationChange={onLocationChange} />
    </div>

    {!location && (
      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>A location must be selected on the map to proceed</span>
      </div>
    )}
  </div>
);

// ============================================================================
// CREATE SHOP MODAL
// ============================================================================

const CreateShopModal: React.FC<CreateShopModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ShopFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    is_active: true,
  });
  const [location, setLocation] = useState<LocationData | null>({
    lat: -1.9441,
    lng: 30.0588,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      description: "",
      is_active: true,
    });
    setLocation({ lat: -1.9441, lng: 30.0588 });
    setError("");
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
    if (error) setError("");
  };

  const handleLocationChange = useCallback(
    (lat: number | null, lng: number | null) => {
      if (lat !== null && lng !== null) {
        setLocation({ lat, lng });
      } else {
        setLocation(null);
      }
      if (error) setError("");
    },
    [error]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      setError("Please select a location on the map");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        location: {
          type: "Point",
          coordinates: [location.lng, location.lat],
        },
      };

      const response = await shopAPI.createShop(payload);
      const newShop = response.data.data || response.data;

      onSuccess(newShop);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error("Create shop error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create shop. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Create New Shop
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <ShopFormFields formData={formData} onChange={handleChange} />

            <LocationPicker
              location={location}
              onLocationChange={handleLocationChange}
            />

            {error && (
              <AlertMessage
                type="error"
                message={error}
                onDismiss={() => setError("")}
              />
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !location ||
              !formData.name ||
              !formData.phone ||
              !formData.email ||
              !formData.address
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center transition">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Shop
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SHOP DETAIL VIEW
// ============================================================================

const InfoRow: React.FC<{
  label: string;
  value: string | React.ReactNode;
  icon: React.ElementType;
}> = ({ label, value, icon: Icon }) => (
  <div className="flex items-start space-x-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
    <Icon className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </p>
      <div className="text-gray-900 dark:text-white font-semibold break-words">
        {value}
      </div>
    </div>
  </div>
);

const ShopDetail: React.FC<ShopDetailProps> = ({
  shop,
  onBack,
  onUpdate,
  onDelete,
  onStatusChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ShopFormData>({
    name: shop.name,
    phone: shop.phone,
    email: shop.email,
    address: shop.address,
    description: shop.description || "",
    is_active: shop.is_active,
  });
  const [location, setLocation] = useState<LocationData | null>(
    shop.latitude && shop.longitude
      ? { lat: shop.latitude, lng: shop.longitude }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    if (error) setError("");
  };

  const handleLocationChange = useCallback(
    (lat: number | null, lng: number | null) => {
      if (lat !== null && lng !== null) {
        setLocation({ lat, lng });
      } else {
        setLocation(null);
      }
      if (error) setError("");
    },
    [error]
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location) {
      setError("Please select a location on the map");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updateData = {
        ...formData,
        location: {
          type: "Point",
          coordinates: [location.lng, location.lat],
        },
      };

      const response = await shopAPI.updateShop(shop.id, updateData);
      const updatedShop = response.data.data || response.data;

      onUpdate(updatedShop);
      setSuccess("Shop updated successfully!");
      setIsEditing(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Update shop error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update shop. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${shop.name}"?\n\nThis action cannot be undone and will permanently remove the shop and all associated data.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      await shopAPI.deleteShop(shop.id);
      onDelete(shop.id);
    } catch (err: any) {
      console.error("Delete shop error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete shop. Please try again."
      );
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = !shop.is_active;
    const action = newStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${shop.name}"?`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      await shopAPI.updateShop(shop.id, { is_active: newStatus });
      onStatusChange(shop.id, newStatus);
      setSuccess(`Shop ${action}d successfully!`);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Toggle status error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          `Failed to ${action} shop. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: shop.name,
      phone: shop.phone,
      email: shop.email,
      address: shop.address,
      description: shop.description || "",
      is_active: shop.is_active,
    });
    setLocation(
      shop.latitude && shop.longitude
        ? { lat: shop.latitude, lng: shop.longitude }
        : null
    );
    setError("");
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition">
        <CornerUpLeft className="w-4 h-4 mr-2" />
        Back to Shops
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {shop.name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {shop.address}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              isEditing ? handleCancelEdit() : setIsEditing(true)
            }
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center disabled:opacity-50 ${
              isEditing
                ? "bg-gray-500 text-white hover:bg-gray-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}>
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? "Cancel Edit" : "Edit Shop"}
          </button>

          {/* <button
            onClick={handleStatusToggle}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center disabled:opacity-50 ${
              shop.is_active
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}>
            {shop.is_active ? (
              <Lock className="w-4 h-4 mr-2" />
            ) : (
              <Unlock className="w-4 h-4 mr-2" />
            )}
            {shop.is_active ? "Deactivate" : "Activate"}
          </button> */}
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <AlertMessage
          type="success"
          message={success}
          onDismiss={() => setSuccess("")}
        />
      )}

      {error && (
        <AlertMessage
          type="error"
          message={error}
          onDismiss={() => setError("")}
        />
      )}

      {/* Content */}
      {isEditing ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleUpdate} className="space-y-6">
            <ShopFormFields
              formData={formData}
              onChange={handleChange}
              isEditing={true}
            />

            <LocationPicker
              location={location}
              onLocationChange={handleLocationChange}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg flex items-center transition">
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Shop
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  !location ||
                  !formData.name ||
                  !formData.phone ||
                  !formData.email ||
                  !formData.address
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center transition">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shop Information */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Store className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Shop Information
            </h3>

            <div className="space-y-0">
              <InfoRow
                label="Description"
                value={shop.description || "No description provided"}
                icon={FileText}
              />
              <InfoRow label="Address" value={shop.address} icon={Home} />
              <InfoRow label="Phone" value={shop.phone} icon={Phone} />
              <InfoRow label="Email" value={shop.email} icon={Mail} />
              {shop.latitude && shop.longitude && (
                <InfoRow
                  label="Coordinates"
                  value={`${shop.latitude.toFixed(6)}, ${shop.longitude.toFixed(
                    6
                  )}`}
                  icon={MapPin}
                />
              )}
            </div>
          </div>

          {/* Status & History */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Status & History
            </h3>

            <div className="space-y-0">
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
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SHOP LIST ITEM
// ============================================================================

const ShopListItem: React.FC<{
  shop: Shop;
  selectedShopId?: number | null;
  onView: (shop: Shop) => void;
  onSelect?: (shopId: number) => void;
}> = ({ shop, selectedShopId, onView, onSelect }) => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
    <div className="flex items-center space-x-4 flex-1 min-w-0">
      <div className="flex-shrink-0">
        <Store className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {shop.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {shop.address}
        </p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Created: {new Date(shop.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>

    <div className="flex items-center space-x-3 flex-shrink-0">
      <span
        className={`py-1 px-3 rounded-full text-xs font-bold whitespace-nowrap ${
          shop.is_active
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
        }`}>
        {shop.is_active ? "Active" : "Inactive"}
      </span>

      <button
        onClick={() => onView(shop)}
        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        title="View shop details">
        <Eye className="w-5 h-5" />
      </button>

      {onSelect && (
        <button
          onClick={() => onSelect(shop.id)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
            selectedShopId === shop.id
              ? "bg-indigo-600 text-white"
              : "text-indigo-600 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800"
          }`}>
          {selectedShopId === shop.id ? "Selected" : "Select"}
        </button>
      )}
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MyShops: React.FC<MyShopsProps> = ({ onShopSelect, selectedShopId }) => {
  // State management
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch shops data
  const fetchShops = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await shopAPI.getMyShops();

      let shopsData: Shop[] = [];

      // Handle different response formats
      if (
        response.data.data &&
        response.data.data.type === "FeatureCollection"
      ) {
        // GeoJSON format
        shopsData = response.data.data.features.map((feature: any) => ({
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
      } else if (response.data.data) {
        // Standard format
        shopsData = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
      } else if (response.data.results) {
        // Paginated format
        shopsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        shopsData = response.data;
      } else {
        // Single object format
        shopsData = [response.data];
      }

      // Validate and set shops
      const validShops = shopsData.filter((shop) => shop && shop.id);
      setShops(validShops);
    } catch (err: any) {
      console.error("Fetch shops error:", err);

      // Handle different error scenarios
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
        // Could redirect to login here
      } else if (err.response?.status === 403) {
        setError("You don't have permission to view shops.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Failed to load shops. Please check your connection and try again."
        );
      }

      setShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Event handlers
  const handleCreateSuccess = useCallback((newShop: Shop) => {
    setShops((prev) => [newShop, ...prev]);
    setIsCreateModalOpen(false);
  }, []);

  const handleUpdateShop = useCallback((updatedShop: Shop) => {
    setShops((prev) =>
      prev.map((shop) => (shop.id === updatedShop.id ? updatedShop : shop))
    );
    setSelectedShop(updatedShop);
  }, []);

  const handleDeleteShop = useCallback(
    (shopId: number) => {
      setShops((prev) => prev.filter((shop) => shop.id !== shopId));
      setSelectedShop(null);
      if (onShopSelect) onShopSelect(null);
    },
    [onShopSelect]
  );

  const handleStatusChange = useCallback(
    (shopId: number, isActive: boolean) => {
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
    },
    [selectedShop]
  );

  const handleViewShop = useCallback((shop: Shop) => {
    setSelectedShop(shop);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedShop(null);
  }, []);

  // Render shop detail view
  if (selectedShop) {
    return (
      <ShopDetail
        shop={selectedShop}
        onBack={handleBackToList}
        onUpdate={handleUpdateShop}
        onDelete={handleDeleteShop}
        onStatusChange={handleStatusChange}
      />
    );
  }

  // Render main shops list view
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Shops
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {loading
              ? "Loading..."
              : `${shops.length} shop${shops.length === 1 ? "" : "s"} found`}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition flex-shrink-0">
          <Plus className="w-5 h-5 mr-2" />
          Add New Shop
        </button>
      </div>

      {/* Create Shop Modal */}
      <CreateShopModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Content */}
      {loading && <LoadingState message="Loading your shops..." />}

      {error && <ErrorState message={error} onRetry={fetchShops} />}

      {!loading && !error && shops.length === 0 && <EmptyState />}

      {!loading && !error && shops.length > 0 && (
        <div className="space-y-4">
          {shops.map((shop) => (
            <ShopListItem
              key={shop.id}
              shop={shop}
              selectedShopId={selectedShopId}
              onView={handleViewShop}
              onSelect={onShopSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyShops;
