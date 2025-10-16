// Header.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Heart,
  User,
  ShoppingBag,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  LogIn,
  X,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import { authUtils } from "../../../app/lib/auth";

const NextProHeader = () => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showWelcomeNotification, setShowWelcomeNotification] = useState(false);
  const [authCheckLoading, setAuthCheckLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Theme State: 'light' or 'dark'
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // Function to apply theme class and save to localStorage
  const applyTheme = (newTheme) => {
    if (typeof window !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", newTheme);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Handle theme initialization after component mounts
  useEffect(() => {
    setMounted(true);

    // Only access localStorage after component is mounted
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    setIsVisible(true);
    checkAuthStatus();

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Fetch cart item count
  const fetchCartItemCount = async () => {
    if (!authUtils.isAuthenticated()) {
      setCartItemCount(0);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/cart-items", {
        headers: {
          Authorization: `Bearer ${authUtils.getToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Sum up quantities from all cart items
        const totalCount = data.results
          ? data.results.reduce(
              (sum: number, item: any) => sum + item.quantity,
              0
            )
          : 0;
        setCartItemCount(totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  // Fetch cart count when auth status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartItemCount();

      // Poll for cart updates every 10 seconds
      const interval = setInterval(fetchCartItemCount, 10000);
      return () => clearInterval(interval);
    } else {
      setCartItemCount(0);
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const authenticated = authUtils.isAuthenticated();
      if (authenticated) {
        const userData = authUtils.getUser();
        setIsAuthenticated(true);
        setUser(userData);

        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          if (
            urlParams.get("welcome") ||
            localStorage.getItem("show_welcome")
          ) {
            setShowWelcomeNotification(true);
            localStorage.removeItem("show_welcome");

            setTimeout(() => {
              setShowWelcomeNotification(false);
            }, 30000);
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setAuthCheckLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authUtils.logout();
      setIsAuthenticated(false);
      setUser(null);
      setShowUserDropdown(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLogin = () => {
    router.push("/pages/login");
    setShowUserDropdown(false);
  };

  const handleSettings = () => {
    if (isAuthenticated) {
      router.push("/pages/dashboard");
    } else {
      router.push("/pages/signup");
    }
    setShowUserDropdown(false);
  };

  const closeWelcomeNotification = () => {
    setShowWelcomeNotification(false);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <div>
      {/* Welcome Notification */}
      {showWelcomeNotification && isAuthenticated && user && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 shadow-lg max-w-sm animate-slide-in">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                Welcome back, {user.first_name} {user.last_name}!
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Great to see you again. Happy shopping!
              </p>
            </div>
            <button
              onClick={closeWelcomeNotification}
              className="text-green-400 hover:text-green-600 dark:hover:text-green-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-1 focus:ring-coral-500 focus:border-coral-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Logo */}
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-[0.3em] text-black dark:text-white">
                MUTOVU MALL
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-coral-500 dark:hover:text-coral-400 cursor-pointer transition-colors focus:outline-none"
                aria-label={
                  theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }>
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {/* Icons with dark mode coloring */}
              <Heart className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-coral-500 dark:hover:text-coral-400 cursor-pointer transition-colors" />
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-coral-500 dark:hover:text-coral-400 cursor-pointer transition-colors" />
              <div className="relative">
                <ShoppingBag className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-coral-500 dark:hover:text-coral-400 cursor-pointer transition-colors" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-coral-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-medium">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-coral-500 dark:hover:text-coral-400 cursor-pointer transition-colors focus:outline-none">
                  <User className="h-5 w-5" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    {isAuthenticated && user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                        <button
                          onClick={handleSettings}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleLogin}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          Login
                        </button>
                        <button
                          onClick={handleSettings}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Settings
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Navigation */}
        <nav className="border-t border-gray-50 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center space-x-12 py-3">
              {["Home", "Women", "Men", "Children", "Sale"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors tracking-wide">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
};

export default NextProHeader;
