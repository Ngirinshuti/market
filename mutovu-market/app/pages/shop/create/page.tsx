"use client";

import React, { useState, useEffect, useCallback } from "react"; // 💡 Added useCallback
import { useRouter } from "next/navigation";
import { authUtils } from "../../../lib/auth";
import dynamic from "next/dynamic";
import axios from "axios";

// Dynamically import the Google Maps MapPicker component
const MapPicker = dynamic(() => import("../../../components/shop//MapPicker"), {
  ssr: false,
});

// This should match your backend API URL
const SHOP_API_URL = "http://localhost:8000/api/shops/";

const NewShopPage: React.FC = () => {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "", // RENAMED from phone_number
    email: "", // ADDED
    address: "", // ADDED
    location: null as { lat: number; lng: number } | null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Authentication check on page load
  useEffect(() => {
    const checkAuth = async () => {
      if (!authUtils.isAuthenticated()) {
        router.push("/pages/login");
      } else {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // 💡 FIX: Wrap handleLocationChange in useCallback to prevent infinite render loop.
  const handleLocationChange = useCallback(
    (lat: number | null, lng: number | null) => {
      if (lat !== null && lng !== null) {
        setFormData((prev) => ({ ...prev, location: { lat, lng } }));
      } else {
        setFormData((prev) => ({ ...prev, location: null }));
      }
      setError("");
    },
    [setFormData, setError]
  ); // setFormData and setError are stable, but included for clarity.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    if (!formData.name || !formData.location) {
      setError("Please fill in the shop name and select a location.");
      setLoading(false);
      return;
    }

    try {
      const accessToken = authUtils.getAccessToken();
      if (!accessToken) {
        setError("Authentication token missing. Please log in again.");
        router.push("/pages/login");
        return;
      }

      const locationData = {
        type: "Point",
        coordinates: [
          // 💡 FIX: Explicitly cast to number to satisfy GeoDjango serializer
          parseFloat(formData.location.lng as any),
          parseFloat(formData.location.lat as any),
        ], // GeoDjango expects [lng, lat]
      };

      const payload = {
        name: formData.name,
        phone: formData.phone, // 💡 Now sending 'phone'
        email: formData.email, // 💡 Now sending 'email'
        address: formData.address, // 💡 Now sending 'address'
        description: formData.description,
        location: locationData,
      };

      const response = await axios.post(SHOP_API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setSuccess("Shop created successfully!");
      // Clear form fields
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        description: "",
        location: null,
      });
    } catch (err: any) {
      console.error("API Error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred.";
      setError(`Failed to create shop: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Register a New Shop
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Fill out the details and select the shop's location on the map.
        </p>

        {success && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-4"
            role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
            role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700">
              Shop Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone" // 💡 Changed name to 'phone'
              value={formData.phone}
              onChange={handleInputChange}
              required // Add required to match backend
              className="..."
            />
          </div>

          {/* Email (NEW INPUT) */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email" // 💡 Added
              value={formData.email}
              onChange={handleInputChange}
              required
              className="..."
            />
          </div>

          {/* Address (NEW INPUT) */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700">
              Shop Address
            </label>
            <textarea
              id="address"
              name="address" // 💡 Added
              value={formData.address}
              onChange={handleInputChange}
              required
              rows={2}
              className="..."
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Location Picker */}
          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-2">
              Select Shop Location
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Click on the map, use your current location, or search for an
              address to set the shop's location.
            </p>
            <div className="flex justify-center items-center mb-4 text-sm text-gray-600 p-2 border border-dashed rounded-lg">
              Current Location:
              <span className="ml-2 font-mono">
                {formData.location
                  ? `${formData.location.lat.toFixed(
                      6
                    )}, ${formData.location.lng.toFixed(6)}`
                  : "Not selected"}
              </span>
            </div>
            <MapPicker onLocationChange={handleLocationChange} />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.name || !formData.location}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Create Shop"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewShopPage;
