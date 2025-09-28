// components/SearchAndFilter.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { productAPI } from "../../lib/sellerApi";

interface SearchAndFilterProps {
  onSearch: (query: string, filters: FilterState) => void;
  searchPlaceholder?: string;
  enableCategoryFilter?: boolean;
  enableStatusFilter?: boolean;
  enableDateFilter?: boolean;
  enablePriceFilter?: boolean;
  enableLocationFilter?: boolean;
  customFilters?: FilterOption[];
  debounceMs?: number;
}

interface FilterOption {
  key: string;
  label: string;
  type: "select" | "checkbox" | "range";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

interface FilterState {
  [key: string]: any;
  category?: string;
  status?: string;
  dateRange?: string;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  verified?: boolean;
  active?: boolean;
}

interface Category {
  id: number;
  category_name: string;
}

interface Brand {
  id: number;
  brand_name: string;
}

// Debounced search hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearch,
  searchPlaceholder = "Search...",
  enableCategoryFilter = false,
  enableStatusFilter = false,
  enableDateFilter = false,
  enablePriceFilter = false,
  enableLocationFilter = false,
  customFilters = [],
  debounceMs = 300,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    category: "All",
    status: "All",
    dateRange: "All",
    priceMin: undefined,
    priceMax: undefined,
    location: "All",
    verified: false,
    active: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, debounceMs);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    if (!enableCategoryFilter) return;

    setLoading(true);
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        productAPI.getCategories(),
        productAPI.getBrands(),
      ]);

      setCategories(
        categoriesRes.data.data ||
          categoriesRes.data.results ||
          categoriesRes.data
      );
      setBrands(
        brandsRes.data.data || brandsRes.data.results || brandsRes.data
      );
    } catch (err) {
      console.error("Failed to load filter options:", err);
    } finally {
      setLoading(false);
    }
  }, [enableCategoryFilter]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Trigger search when query or filters change
  useEffect(() => {
    onSearch(debouncedSearchQuery, filters);
  }, [debouncedSearchQuery, filters, onSearch]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: "All",
      status: "All",
      dateRange: "All",
      priceMin: undefined,
      priceMax: undefined,
      location: "All",
      verified: false,
      active: true,
    });
    setSearchQuery("");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category && filters.category !== "All") count++;
    if (filters.status && filters.status !== "All") count++;
    if (filters.dateRange && filters.dateRange !== "All") count++;
    if (filters.priceMin !== undefined || filters.priceMax !== undefined)
      count++;
    if (filters.location && filters.location !== "All") count++;
    if (filters.verified) count++;
    if (!filters.active) count++;

    // Count custom filters
    customFilters.forEach((filter) => {
      if (
        filters[filter.key] &&
        filters[filter.key] !== "All" &&
        filters[filter.key] !== false
      ) {
        count++;
      }
    });

    return count;
  }, [filters, customFilters]);

  const statusOptions = [
    { value: "All", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const dateRangeOptions = [
    { value: "All", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
  ];

  const locationOptions = [
    { value: "All", label: "All Locations" },
    { value: "nearby", label: "Nearby (5km)" },
    { value: "city", label: "Same City" },
    { value: "region", label: "Same Region" },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters || activeFiltersCount > 0
                ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}>
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-3 rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 transition-colors flex items-center gap-2">
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Category Filter */}
            {enableCategoryFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category || "All"}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}>
                  <option value="All">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            {enableStatusFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || "All"}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Filter */}
            {enableDateFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  value={filters.dateRange || "All"}
                  onChange={(e) =>
                    handleFilterChange("dateRange", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                  {dateRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Range Filter */}
            {enablePriceFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "priceMin",
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "priceMax",
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Location Filter */}
            {enableLocationFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <select
                  value={filters.location || "All"}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                  {locationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Filters */}
            {customFilters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {filter.label}
                </label>
                {filter.type === "select" ? (
                  <select
                    value={filters[filter.key] || "All"}
                    onChange={(e) =>
                      handleFilterChange(filter.key, e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                    <option value="All">All</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === "checkbox" ? (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters[filter.key] || false}
                      onChange={(e) =>
                        handleFilterChange(filter.key, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {filter.label}
                    </label>
                  </div>
                ) : filter.type === "range" ? (
                  <input
                    type="range"
                    min={filter.min}
                    max={filter.max}
                    step={filter.step || 1}
                    value={filters[filter.key] || filter.min}
                    onChange={(e) =>
                      handleFilterChange(filter.key, parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                ) : null}
              </div>
            ))}
          </div>

          {/* Common Boolean Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.verified || false}
                  onChange={(e) =>
                    handleFilterChange("verified", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Verified only
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.active !== false}
                  onChange={(e) =>
                    handleFilterChange("active", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Active only
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
