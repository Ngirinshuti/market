"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authUtils } from "../../../lib/auth";
import dynamic from "next/dynamic";
import axios from "axios";
import { MapPin, Mail, Phone, Home, FileText } from "lucide-react"; // Import icons for better visual cues

// Dynamically import the Google Maps MapPicker component
const MapPicker = dynamic(() => import("../../../components/shop/MapPicker"), {
  ssr: false,
});

// This should match your backend API URL
const SHOP_API_URL = "http://localhost:8000/api/shops";

const NewShopPage: React.FC = () => {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
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

  const handleLocationChange = useCallback(
    (lat: number | null, lng: number | null) => {
      if (lat !== null && lng !== null) {
        setFormData((prev) => ({ ...prev, location: { lat, lng } }));
      } else {
        setFormData((prev) => ({ ...prev, location: null }));
      }
      setError("");
    },
    []
  );

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
          parseFloat(formData.location.lng as any),
          parseFloat(formData.location.lat as any),
        ], // GeoDjango expects [lng, lat]
      };

      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        description: formData.description,
        location: locationData,
      };

      const response = await axios.post(SHOP_API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setSuccess("Shop created successfully! You will now be redirected...");
      // Clear form fields
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        description: "",
        location: null,
      });

      // Optional: Redirect user after success
      setTimeout(() => {
        router.push("/pages/seller/dashboard"); // Replace with your desired redirect path
      }, 2000);
    } catch (err: any) {
      console.error("API Error:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Common input classes for consistency
  const inputClass =
    "mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out bg-gray-50";

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-8 sm:p-12">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-10 border border-gray-100">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-2 text-center">
          🛍️ Register Your New Shop
        </h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">
          Provide accurate information to quickly set up your shop's profile and
          location.
        </p>

        {/* --- Alerts --- */}
        {success && (
          <div
            className="flex items-center bg-green-50 border border-green-300 text-green-700 p-4 rounded-lg relative mb-6"
            role="alert">
            <svg
              className="w-5 h-5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"></path>
            </svg>
            <span className="font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div
            className="flex items-center bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg relative mb-6"
            role="alert">
            <svg
              className="w-5 h-5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"></path>
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}
        {/* --- End Alerts --- */}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1: Basic Information - Using a Grid */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-500" /> Shop Details
            </h2>

            {/* Two-Column Grid for fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shop Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., The Corner Bookstore"
                  className={inputClass}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number*
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., +1 555 123 4567"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., info@shopname.com"
                  className={inputClass}
                />
              </div>

              {/* Address (Smaller on grid) */}
              <div className="md:col-span-2">
                {" "}
                {/* Takes full width on mobile, but spanning 2 cols on desktop */}
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Address*
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  placeholder="Street Address, City, Postal Code"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Description (Full Width) */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="A brief summary of your shop and what you sell (optional)."
                className={inputClass}
              />
            </div>
          </div>

          {/* Section 2: Location Picker */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-indigo-500" /> Shop Location*
            </h2>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-sm text-gray-700 font-medium">
              <span className="text-indigo-700">Coordinates:</span>
              <span className="ml-2 font-mono text-gray-800">
                {formData.location
                  ? `${formData.location.lat.toFixed(
                      6
                    )}, ${formData.location.lng.toFixed(6)}`
                  : "Click map or search to select location"}
              </span>
            </div>

            {/* Map Component */}
            <div className="h-96 w-full rounded-lg shadow-inner border border-gray-200 overflow-hidden">
              <MapPicker onLocationChange={handleLocationChange} />
            </div>

            {!formData.location && (
              <p className="text-red-500 text-sm italic">
                A location must be selected on the map to proceed.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              !formData.name ||
              !formData.location ||
              !formData.phone ||
              !formData.email ||
              !formData.address
            }
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out">
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-white"
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
                Creating Shop...
              </>
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
