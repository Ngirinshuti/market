"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authUtils } from "../../lib/auth";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  LogOut,
  Edit,
  Save,
  X,
} from "lucide-react";

interface IUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  role: "admin" | "customer" | "buyer" | "seller" | "deliverer";
  bio: string | null;
  is_verified: boolean;
  date_joined: string;
  last_login: string | null;
}

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<IUser>>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isWelcome, setIsWelcome] = useState(false);

  useEffect(() => {
    loadUserProfile();

    // const urlParams = new URLSearchParams(window.location.search);
    // if (urlParams.get("welcome")) {
    //   setMessage("Welcome! You logged in successfully.");
    //   setIsWelcome(true);
    // }
  }, []);

  const loadUserProfile = async () => {
    try {
      // Validate token first
      const isValid = await authUtils.validateToken();
      if (!isValid) {
        router.push("/pages/login");
        return;
      }

      const data = await authUtils.getProfile();
      setUser(data.user);
      setFormData(data.user);
    } catch (error) {
      setError("Failed to load user profile");
      console.error("Profile load error:", error);
      // Clear any invalid tokens and redirect to login
      authUtils.clearAuthData();
      router.push("/pages/login");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async () => {
    setUpdateLoading(true);
    setError("");

    try {
      const data = await authUtils.updateProfile(formData);
      setUser(data.user);
      setFormData(data.user);
      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleLogout = async () => {
    await authUtils.logout();
  };

  const getRoleColor = (role: IUser["role"]) => {
    const colors: Record<IUser["role"], string> = {
      admin: "bg-purple-100 text-purple-800",
      customer: "bg-blue-100 text-blue-800",
      buyer: "bg-green-100 text-green-800",
      seller: "bg-yellow-100 text-yellow-800",
      deliverer: "bg-indigo-100 text-indigo-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load user data</p>
          <button
            onClick={() => router.push("/pages/login")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message */}
      {message && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <p className="text-sm text-green-800">{message}</p>
            </div>
            <button
              onClick={() => setMessage("")}
              className="text-green-400 hover:text-green-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">
                  Welcome back, {user.first_name}!
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Profile Information
                    </h3>
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdateProfile}
                          disabled={updateLoading}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
                          <Save className="h-4 w-4" />
                          <span>{updateLoading ? "Saving..." : "Save"}</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false);
                            setFormData(user);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={user.username}
                          disabled
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Username cannot be changed
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="mt-1">
                        {editing ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email || ""}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {user.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <div className="mt-1">
                        {editing ? (
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name || ""}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {user.first_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <div className="mt-1">
                        {editing ? (
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name || ""}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {user.last_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <div className="mt-1">
                        {editing ? (
                          <input
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number || ""}
                            onChange={handleInputChange}
                            placeholder="Enter phone number"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {user.phone_number || "Not provided"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <div className="mt-1">
                        {editing ? (
                          <select
                            name="role"
                            value={formData.role || "customer"}
                            onChange={handleInputChange}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                            <option value="deliverer">Deliverer</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                              user.role
                            )}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {user.role?.charAt(0).toUpperCase() +
                              user.role?.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <div className="mt-1">
                      {editing ? (
                        <textarea
                          name="bio"
                          rows={3}
                          value={formData.bio || ""}
                          onChange={handleInputChange}
                          placeholder="Tell us about yourself..."
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          {user.bio || "No bio provided yet."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="space-y-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Account Details
                  </h3>

                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Account Status
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_verified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                          {user.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Member Since
                      </dt>
                      <dd className="mt-1 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(user.date_joined)}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Last Login
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {user.last_login
                          ? formatDate(user.last_login)
                          : "Never"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        User ID
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">
                        #{user.id}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Quick Actions
                  </h3>

                  <div className="space-y-3">
                    <button
                      onClick={() =>
                        router.push(
                          "./auth/reset-password/${user.id}/${token}/"
                        )
                      }
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">
                        Change Password
                      </div>
                      <div className="text-xs text-gray-500">
                        Update your account password
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        alert("File upload dialog would open here")
                      }
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">
                        Upload Profile Picture
                      </div>
                      <div className="text-xs text-gray-500">
                        Add a photo to your profile
                      </div>
                    </button>

                    <button
                      onClick={() => alert("Privacy settings would open here")}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">
                        Privacy Settings
                      </div>
                      <div className="text-xs text-gray-500">
                        Manage your privacy preferences
                      </div>
                    </button>

                    {!user.is_verified && (
                      <button
                        onClick={() =>
                          alert("Account verification would start here")
                        }
                        className="w-full text-left px-4 py-3 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <div className="text-sm font-medium text-blue-900">
                          Verify Account
                        </div>
                        <div className="text-xs text-blue-600">
                          Complete account verification
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
