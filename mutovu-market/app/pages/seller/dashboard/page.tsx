// Updated Dashboard Layout Component with Fixed Sidebar and Header
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  BarChart3,
  MapPin,
  Settings,
  Menu,
  X,
  Package,
  ChevronDown,
  Layers3,
  ListOrdered,
  PlusCircle,
} from "lucide-react";
import { authUtils } from "../../../lib/auth";
import { shopAPI, Shop } from "../../../lib/sellerApi";
import MyShops from "../../../components/seller/myShops";
import ShopStatistics from "../../../components/seller/shopStatistics";
import ProductManagement from "../../../components/seller/productManagement";
import OrderManagement from "../../../components/seller/productOrders";
import NearbyShops from "../../../components/seller/nearByShops";

interface Tab {
  id: string;
  name: string;
  icon: React.ReactElement;
  component: (props: {
    selectedShopId: number | null;
    authToken?: string;
    onShopSelect?: (id: number | null) => void;
    onCreateShopClick?: (openFn: () => void) => void;
  }) => React.ReactElement;
  requiresShop?: boolean;
}

const TABS: Tab[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: <BarChart3 />,
    component: ShopStatistics,
    requiresShop: true,
  },
  {
    id: "products",
    name: "Products",
    icon: <Package />,
    component: ProductManagement,
    requiresShop: true,
  },
  {
    id: "orders",
    name: "Orders",
    icon: <ListOrdered />,
    component: OrderManagement,
    requiresShop: true,
  },
  {
    id: "shops",
    name: "My Shops",
    icon: <Store />,
    component: (props) => {
      console.log(
        "Shops component wrapper - received props:",
        Object.keys(props)
      );
      return (
        <MyShops
          selectedShopId={props.selectedShopId}
          onShopSelect={props.onShopSelect || (() => {})}
          onCreateShopClick={props.onCreateShopClick}
        />
      );
    },
  },
  {
    id: "nearby",
    name: "Nearby Shops",
    icon: <MapPin />,
    component: NearbyShops,
    requiresShop: true,
  },
  {
    id: "settings",
    name: "Settings",
    icon: <Settings />,
    component: () => (
      <div className="p-4 md:p-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Settings
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-400">
            Settings and configuration options will be available here.
          </p>
        </div>
      </div>
    ),
  },
];

const UserAvatar = () => {
  const [userInitial, setUserInitial] = useState("U");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = authUtils.getUser();
    if (user) {
      const initial =
        user.first_name?.charAt(0) || user.username?.charAt(0) || "U";
      setUserInitial(initial.toUpperCase());
    }
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <div className="text-blue-600 dark:text-blue-400 font-semibold">U</div>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
      <div className="text-blue-600 dark:text-blue-400 font-semibold">
        {userInitial}
      </div>
    </div>
  );
};

const ShopSelector = ({
  selectedShopId,
  setSelectedShopId,
  shops,
}: {
  selectedShopId: number | null;
  setSelectedShopId: (id: number | null) => void;
  shops: Shop[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedShop = shops.find((s) => s.id === selectedShopId);

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center items-center w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition duration-150"
          onClick={() => setIsOpen(!isOpen)}>
          <Store className="w-5 h-5 mr-2 text-blue-500" />
          <span className="truncate max-w-[120px] md:max-w-none">
            {selectedShop ? selectedShop.name : "Select a Shop..."}
          </span>
          <ChevronDown
            className={`-mr-1 ml-2 h-5 w-5 transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
          <div className="py-1">
            {shops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => {
                  setSelectedShopId(shop.id);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full text-left px-4 py-2 text-sm transition duration-100 ${
                  shop.id === selectedShopId
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-700 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}>
                <span
                  className={`inline-block h-2 w-2 rounded-full mr-2 ${
                    shop.is_active ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {shop.name}
              </button>
            ))}
            {shops.length > 0 && (
              <hr className="my-1 border-gray-100 dark:border-gray-700" />
            )}
            <button
              onClick={() => {
                setSelectedShopId(null);
                setIsOpen(false);
              }}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-4 h-4 mr-2 text-red-500" />
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  currentTab,
  setCurrentTab,
  tabs,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentTab: Tab | null;
  setCurrentTab: (tab: Tab) => void;
  tabs: Tab[];
}) => (
  <>
    {sidebarOpen && (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />
    )}

    <div
      className={`fixed inset-y-0 left-0 z-20 flex w-80 flex-col transition-transform duration-300 ease-in-out transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl lg:shadow-none`}>
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <Layers3 className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Seller Dashboard
          </span>
        </div>
        <button
          type="button"
          className="-m-2 p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors lg:hidden"
          onClick={() => setSidebarOpen(false)}>
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Management
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setCurrentTab(tab);
              setSidebarOpen(false);
            }}
            className={`flex w-full items-center p-3 rounded-lg text-left transition duration-150 ${
              currentTab?.id === tab.id
                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}>
            {React.cloneElement(tab.icon, {
              className: "mr-3 h-5 w-5 flex-shrink-0",
            })}
            <span className="font-medium">{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  </>
);

const MainHeader = ({
  shops,
  selectedShopId,
  setSelectedShopId,
  currentTab,
  sidebarOpen,
  setSidebarOpen,
}: {
  shops: Shop[];
  selectedShopId: number | null;
  setSelectedShopId: (id: number | null) => void;
  currentTab: Tab | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => (
  <>
    <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3">
          {currentTab?.requiresShop && shops.length > 0 && (
            <ShopSelector
              shops={shops}
              selectedShopId={selectedShopId}
              setSelectedShopId={setSelectedShopId}
            />
          )}
          <UserAvatar />
        </div>
      </div>
    </div>

    <div className="hidden lg:block fixed w-[calc(100%-20rem)] left-80 right-0 top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-20 px-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          {React.cloneElement(currentTab?.icon || <Store />, {
            className: "h-6 w-6 mr-3 text-blue-600 dark:text-blue-400",
          })}
          {currentTab?.name}
        </h1>

        <div className="flex items-center space-x-4">
          {currentTab?.requiresShop && shops.length > 0 && (
            <ShopSelector
              shops={shops}
              selectedShopId={selectedShopId}
              setSelectedShopId={setSelectedShopId}
            />
          )}
          <UserAvatar />
        </div>
      </div>
    </div>
  </>
);

const DashboardLayout = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<Tab>(TABS[0]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);

  // Use ref to store the modal opener function - refs persist across re-renders
  const openCreateModalRef = useRef<(() => void) | null>(null);
  // Track if we need to open modal after component mounts
  const pendingModalOpenRef = useRef(false);

  const fetchShops = useCallback(async () => {
    setLoadingShops(true);
    setError("");

    try {
      const isAuthenticated = authUtils.isAuthenticated();
      if (!isAuthenticated) {
        router.push("/pages/login");
        return;
      }

      const response = await shopAPI.getMyShops();
      let shopsData = [];

      if (
        response.data.data &&
        response.data.data.type === "FeatureCollection"
      ) {
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
          is_active: feature.properties.is_active ?? true,
          is_verified: feature.properties.is_verified ?? false,
          owner: feature.properties.owner,
        }));
      } else {
        shopsData =
          response.data.data || response.data.results || response.data || [];
      }

      const validatedShops = Array.isArray(shopsData) ? shopsData : [];
      setShops(validatedShops);

      if (validatedShops.length > 0) {
        if (
          selectedShopId === null ||
          !validatedShops.some((s) => s.id === selectedShopId)
        ) {
          const activeShop =
            validatedShops.find((s) => s.is_active) || validatedShops[0];
          setSelectedShopId(activeShop.id);
        }
      } else {
        setSelectedShopId(null);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        authUtils.clearAuthData();
        router.push("/pages/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch shops. Please check your connection and try again."
      );
      setShops([]);
    } finally {
      setLoadingShops(false);
    }
  }, [router, selectedShopId]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Check if there's a pending modal open request after each render
  useEffect(() => {
    if (pendingModalOpenRef.current && openCreateModalRef.current) {
      console.log("DashboardLayout: Opening modal via useEffect");
      const timer = setTimeout(() => {
        if (openCreateModalRef.current) {
          openCreateModalRef.current();
          pendingModalOpenRef.current = false;
          setIsCreatingShop(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  });

  // Handle the create shop button click
  const handleCreateShopClick = () => {
    setIsModelOpen(true);
    // Prevent multiple rapid clicks
    if (isCreatingShop) {
      console.log("Already processing, ignoring click");
      return;
    }

    console.log("Create Shop button clicked!");
    const shopsTab = TABS.find((t) => t.id === "shops");

    if (!shopsTab) {
      console.error("ERROR: 'shops' tab not found");
      return;
    }

    setIsCreatingShop(true);

    // Switch to shops tab if not already there
    if (currentTab.id !== "shops") {
      console.log("Switching to shops tab...");
      setCurrentTab(shopsTab);
      pendingModalOpenRef.current = true; // Mark that we need to open modal
    } else {
      // Already on shops tab, try to open modal immediately
      if (openCreateModalRef.current) {
        console.log("Opening modal immediately");
        openCreateModalRef.current();
        // Reset flag after modal opens
        setTimeout(() => {
          setIsCreatingShop(false);
        }, 1000);
      } else {
        console.log("Modal opener not ready, marking as pending");
        pendingModalOpenRef.current = true;
      }
    }
  };

  // Callback to receive the modal opener from MyShops
  const setModalOpenCallback = useCallback((fn: () => void) => {
    console.log("Received modal opener function from MyShops");
    openCreateModalRef.current = fn;

    // If there's a pending request, execute it now
    if (pendingModalOpenRef.current) {
      console.log("Executing pending modal open request immediately");
      setTimeout(() => {
        if (openCreateModalRef.current) {
          openCreateModalRef.current();
          pendingModalOpenRef.current = false;
          setIsCreatingShop(false);
        }
      }, 100);
    }
  }, []); // Remove isCreatingShop from dependencies

  const CurrentComponent = currentTab.component;

  const token = authUtils.getAccessToken();

  const componentProps = {
    selectedShopId: selectedShopId,
    authToken: token || "",
    ...(currentTab.id === "shops"
      ? {
          onShopSelect: (id: number | null) => {
            console.log("onShopSelect called with:", id);
            setSelectedShopId(id);
          },
          onCreateShopClick: setModalOpenCallback,
        }
      : {}),
  };

  console.log(
    "DashboardLayout render - currentTab:",
    currentTab.id,
    "componentProps has onCreateShopClick:",
    !!(componentProps as any).onCreateShopClick,
    "onCreateShopClick value:",
    (componentProps as any).onCreateShopClick
  );

  const hasNoShops = !loadingShops && shops.length === 0 && !error;
  const isShopRequiredAndMissing =
    currentTab.requiresShop &&
    selectedShopId === null &&
    shops.length > 0 &&
    !loadingShops &&
    !error;

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden py-20">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        tabs={TABS}
      />

      <MainHeader
        shops={shops}
        selectedShopId={selectedShopId}
        setSelectedShopId={setSelectedShopId}
        currentTab={currentTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main
        className="lg:ml-80 pt-16 lg:pt-20 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 "
        style={{
          paddingTop: "0rem",
          height: "100vh",
        }}>
        <div className="min-h-full">
          {loadingShops ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading dashboard...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5" />
                  <p className="font-medium">Error: {error}</p>
                </div>
                <div className="mt-2">
                  <button
                    onClick={fetchShops}
                    className="text-sm underline hover:no-underline font-semibold">
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : isModelOpen ? (
            <MyShops />
          ) : hasNoShops ? (
            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-6 py-8 rounded-lg text-center max-w-2xl mx-auto mt-20">
                <PlusCircle className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold mb-2">
                  Welcome, Start Your Shop!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  It looks like you haven't created any shops yet. Create your
                  first shop to get started.
                </p>
                <button
                  type="button"
                  onClick={handleCreateShopClick}
                  // disabled={isCreatingShop}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create Your First Shop
                </button>
              </div>
            </div>
          ) : isShopRequiredAndMissing ? (
            <div className="p-6">
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg max-w-2xl mx-auto mt-10">
                <div className="flex items-start gap-3">
                  <Store className="h-5 w-5 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Shop Selection Required</p>
                    <p className="text-sm mt-1">
                      Please select a shop from the dropdown menu in the header
                      to view your {currentTab.name}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <CurrentComponent key={currentTab.id} {...componentProps} />
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
