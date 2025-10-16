"use client";
import React, { useState, useEffect } from "react";
import {
  Heart,
  ArrowRight,
  Star,
  ShoppingCart,
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

// API Configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Hero Slides Data
const HERO_SLIDES = [
  {
    title: "New Season Essentials",
    subtitle: "Curated for modern living",
    cta: "Shop New In",
    theme: "light",
  },
  {
    title: "Timeless Wardrobe",
    subtitle: "Quality pieces that last",
    cta: "Discover More",
    theme: "dark",
  },
  {
    title: "Contemporary Home",
    subtitle: "Transform your space",
    cta: "Shop Home",
    theme: "neutral",
  },
];

// Helper function - UPDATED
const getVariantImageUrl = (variant: any): string | null => {
  if (!variant) return null;

  // Check if variant has a single image object (ForeignKey)
  if (variant.image) {
    const img = variant.image;

    // Try all image fields in order
    if (img.front_image_url) return img.front_image_url;
    if (img.back_image_url) return img.back_image_url;
    if (img.side_image_url) return img.side_image_url;
    if (img.aerial_image_url) return img.aerial_image_url;

    // Fallback for non-URL fields (shouldn't exist with correct serializer)
    if (img.front_image) return img.front_image;
    if (img.back_image) return img.back_image;
    if (img.side_image) return img.side_image;
    if (img.aerial_image) return img.aerial_image;
  }

  return null;
};

// Helper function for products
const getProductImageUrl = (product: any): string | null => {
  if (!product) return null;

  // Check primary_image_url first
  if (product.primary_image_url) return product.primary_image_url;

  // Check variants for images
  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      if (variant.image) {
        if (variant.image.front_image_url) return variant.image.front_image_url;
        if (variant.image.back_image_url) return variant.image.back_image_url;
        if (variant.image.side_image_url) return variant.image.side_image_url;
      }
    }
  }

  // Fallback: no image available
  return null;
};

const LandingPage = () => {
  // UI State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authCheckLoading, setAuthCheckLoading] = useState(true);

  // User State
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  // Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ======================
  // AUTHENTICATION
  // ======================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const userData = JSON.parse(localStorage.getItem("user") || "{}");
          setUser(userData);
          await Promise.all([loadWishlist(token), loadCart(token)]);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setAuthCheckLoading(false);
        setIsVisible(true);
      }
    };

    checkAuth();
  }, []);

  const loadWishlist = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlist-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWishlist(data.map((item) => item.product));
      }
    } catch (error) {
      console.error("Error loading wishlist:", error);
    }
  };

  const loadCart = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  // ======================
  // DATA FETCHING
  // ======================
  useEffect(() => {
    fetchCategories();
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchQuery, selectedCategory, selectedBrand, priceRange]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brands`);
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: "12",
      });

      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory !== "All")
        params.append("category", selectedCategory);
      if (selectedBrand !== "All") params.append("brand", selectedBrand);
      if (priceRange.min > 0)
        params.append("min_price", priceRange.min.toString());
      if (priceRange.max < 10000)
        params.append("max_price", priceRange.max.toString());

      const response = await fetch(
        `${API_BASE_URL}/products/catalog?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data); // Debug log

        const productsData = data.results || data.data || data;
        console.log("Products Data:", productsData); // Debug log

        setProducts(productsData);
        setTotalPages(Math.ceil((data.count || productsData.length) / 12));

        // Set featured products (top 3 by rating)
        const sorted = [...productsData]
          .filter((p) => p.avg_rating > 0)
          .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
          .slice(0, 3);
        setFeaturedProducts(sorted);
      } else {
        console.error("Failed to fetch products:", response.status);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // USER ACTIONS
  // ======================
  const toggleWishlist = async (productId) => {
    if (!user) {
      window.location.href = "/pages/login";
      return;
    }

    const token = localStorage.getItem("token");
    const isInWishlist = wishlist.includes(productId);

    try {
      if (isInWishlist) {
        const items = await fetch(
          `${API_BASE_URL}/wishlist-items?product=${productId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).then((r) => r.json());

        if (items[0]) {
          await fetch(`${API_BASE_URL}/wishlist-items/${items[0].id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        setWishlist(wishlist.filter((id) => id !== productId));
      } else {
        await fetch(`${API_BASE_URL}/wishlist-items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product: productId }),
        });
        setWishlist([...wishlist, productId]);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const addToCart = async (variantId, quantity = 1) => {
    if (!user) {
      window.location.href = "/pages/login";
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/cart-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ variant: variantId, quantity }),
      });

      if (response.ok) {
        await loadCart(token);
        alert("Added to cart!");
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart");
    }
  };

  const navigateToProduct = (productId) => {
    window.location.href = `/products/${productId}`;
  };

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  // ======================
  // CAROUSEL
  // ======================
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // ======================
  // RENDER
  // ======================
  if (authCheckLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-coral-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroSection
        slides={HERO_SLIDES}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        isVisible={isVisible}
        scrollToProducts={scrollToProducts}
      />

      <CategoriesSection
        categories={categories}
        setSelectedCategory={setSelectedCategory}
        scrollToProducts={scrollToProducts}
      />

      {featuredProducts.length > 0 && (
        <FeaturedSection
          products={featuredProducts}
          wishlist={wishlist}
          toggleWishlist={toggleWishlist}
          addToCart={addToCart}
          navigateToProduct={navigateToProduct}
        />
      )}

      <ProductsSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        categories={categories}
        brands={brands}
        loading={loading}
        products={products}
        wishlist={wishlist}
        toggleWishlist={toggleWishlist}
        addToCart={addToCart}
        navigateToProduct={navigateToProduct}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

      <NewsletterSection />
      <TrustSection />

      <style jsx>{`
        .text-coral-500 {
          color: #f87171;
        }
        .bg-coral-500 {
          background-color: #f87171;
        }
        .bg-coral-500\\/10 {
          background-color: rgba(248, 113, 113, 0.1);
        }
        .hover\\:text-coral-500:hover {
          color: #f87171;
        }
        .hover\\:text-coral-600:hover {
          color: #ef4444;
        }
        .fill-coral-500 {
          fill: #f87171;
        }
        .ring-coral-500 {
          --tw-ring-color: #f87171;
        }
        .border-coral-500 {
          border-color: #f87171;
        }
        .focus\\:ring-coral-500:focus {
          --tw-ring-color: #f87171;
        }
        .focus\\:border-coral-500:focus {
          border-color: #f87171;
        }
      `}</style>
    </div>
  );
};

// ======================
// HERO SECTION
// ======================
const HeroSection = ({
  slides,
  currentSlide,
  setCurrentSlide,
  isVisible,
  scrollToProducts,
}) => (
  <section className="relative h-[70vh] overflow-hidden">
    <div className="absolute inset-0">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}>
          <div
            className={`h-full relative ${
              slide.theme === "light"
                ? "bg-stone-50 dark:bg-gray-800"
                : slide.theme === "dark"
                ? "bg-gray-900 dark:bg-black"
                : "bg-neutral-100 dark:bg-gray-700"
            }`}>
            <div className="absolute inset-0 opacity-5">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: "60px 60px",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="relative z-10 h-full flex items-center">
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="max-w-2xl">
          <div
            className={`transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}>
            <h1
              className={`text-5xl lg:text-6xl font-light mb-6 leading-tight tracking-tight ${
                slides[currentSlide].theme === "dark"
                  ? "text-white"
                  : "text-black dark:text-white"
              }`}>
              {slides[currentSlide].title}
            </h1>
            <p
              className={`text-xl mb-8 font-light ${
                slides[currentSlide].theme === "dark"
                  ? "text-gray-300"
                  : "text-gray-600 dark:text-gray-300"
              }`}>
              {slides[currentSlide].subtitle}
            </p>
            <button
              onClick={scrollToProducts}
              className={`group inline-flex items-center gap-3 px-8 py-3 rounded-full font-medium transition-all hover:scale-105 ${
                slides[currentSlide].theme === "dark"
                  ? "bg-white text-black hover:bg-gray-100"
                  : "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              }`}>
              {slides[currentSlide].cta}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
      <div className="flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? "bg-coral-500 w-8"
                : slides[currentSlide].theme === "dark"
                ? "bg-white/40"
                : "bg-black/30 dark:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  </section>
);

// ======================
// CATEGORIES SECTION
// ======================
const CategoriesSection = ({
  categories,
  setSelectedCategory,
  scrollToProducts,
}) => (
  <section className="py-20 bg-white dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-light text-black dark:text-white mb-4 tracking-wide">
          Shop by Category
        </h2>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {categories.slice(0, 4).map((category) => (
          <div
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              scrollToProducts();
            }}
            className="group cursor-pointer">
            <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-800 aspect-[4/5] mb-4 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.category_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-coral-500/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-coral-500 font-light">
                      {category.category_name[0]}
                    </span>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-all flex items-end p-6">
                <div className="w-full text-center">
                  <button className="bg-white dark:bg-gray-800 text-black dark:text-white px-6 py-2 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                    Shop Now
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-medium text-black dark:text-white mb-1">
                {category.category_name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                {category.description || "Explore collection"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ======================
// FEATURED SECTION
// ======================
const FeaturedSection = ({
  products,
  wishlist,
  toggleWishlist,
  addToCart,
  navigateToProduct,
}) => (
  <section className="py-20 bg-stone-50 dark:bg-gray-800">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h2 className="text-3xl font-light text-black dark:text-white mb-2 tracking-wide">
            Featured Products
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-light">
            Top rated this week
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            addToCart={addToCart}
            navigateToProduct={navigateToProduct}
            showBadge={product.avg_rating >= 4.5}
            // Remove compact prop for featured section
          />
        ))}
      </div>
    </div>
  </section>
);

// ======================
// PRODUCTS SECTION
// ======================
const ProductsSection = ({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  priceRange,
  setPriceRange,
  categories,
  brands,
  loading,
  products,
  wishlist,
  toggleWishlist,
  addToCart,
  navigateToProduct,
  currentPage,
  totalPages,
  setCurrentPage,
}) => (
  <section id="products" className="py-20 bg-white dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-12">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-coral-500 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </button>
        </div>

        {showFilters && (
          <FilterPanel
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            categories={categories}
            brands={brands}
          />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-coral-500" />
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid md:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
                addToCart={addToCart}
                navigateToProduct={navigateToProduct}
                compact
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No products found</p>
        </div>
      )}
    </div>
  </section>
);

// ======================
// PRODUCT CARD
// ======================
const ProductCard = ({
  product,
  wishlist,
  toggleWishlist,
  addToCart,
  navigateToProduct,
  showBadge,
  compact,
}) => {
  const imageUrl = getProductImageUrl(product);

  return (
    <div className="group cursor-pointer">
      <div
        className={`relative overflow-hidden bg-white dark:bg-gray-700 ${
          compact ? "aspect-square rounded-lg" : "aspect-[3/4]"
        } mb-${compact ? "3" : "4"} group-hover:shadow-lg transition-all`}>
        {showBadge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-coral-500 text-white">
              Top Rated
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute ${
            compact ? "top-2 right-2" : "top-4 right-4"
          } z-10 ${
            compact ? "bg-white dark:bg-gray-800 p-2 rounded-full" : ""
          }`}>
          <Heart
            className={`h-${compact ? "4" : "5"} w-${
              compact ? "4" : "5"
            } transition-colors ${
              wishlist.includes(product.id)
                ? "fill-coral-500 text-coral-500"
                : "text-gray-400 hover:text-coral-500"
            }`}
          />
        </button>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => navigateToProduct(product.id)}
            onError={(e) => {
              console.error("Image failed to load:", imageUrl);
              const img = e.target as HTMLImageElement;
              img.style.display = "none";

              // Show fallback container
              const fallback =
                img.parentElement?.querySelector("[data-fallback]");
              if (fallback) (fallback as HTMLElement).style.display = "flex";
            }}
          />
        ) : null}

        <div
          data-fallback
          className={`${
            imageUrl ? "hidden" : "flex"
          } h-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700`}>
          <Package
            className={`h-${compact ? "12" : "16"} w-${
              compact ? "12" : "16"
            } text-gray-300 dark:text-gray-500`}
          />
        </div>
        {product.total_stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      <div className={`space-y-${compact ? "1" : "2"}`}>
        <h3
          onClick={() => navigateToProduct(product.id)}
          className={`font-medium ${
            compact ? "text-sm line-clamp-2" : "text-base"
          } text-black dark:text-white group-hover:text-coral-500 transition-colors cursor-pointer`}>
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-black dark:text-white">
              ${product.min_price}
              {product.max_price > product.min_price &&
                ` - $${product.max_price}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {product.avg_rating?.toFixed(1) || "0.0"}
              {!compact && ` (${product.review_count || 0})`}
            </span>
          </div>
        </div>

        {product.variants &&
          product.variants.length > 0 &&
          product.total_stock > 0 && (
            <button
              onClick={() => addToCart(product.variants[0].id)}
              className={`w-full mt-2 py-${
                compact ? "1.5" : "2"
              } bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-${
                compact ? "xs" : "sm"
              } font-medium flex items-center justify-center gap-${
                compact ? "1" : "2"
              }`}>
              <ShoppingCart
                className={`h-${compact ? "3" : "4"} w-${compact ? "3" : "4"}`}
              />
              Add to Cart
            </button>
          )}
      </div>
    </div>
  );
};

// ======================
// FILTER PANEL
// ======================
const FilterPanel = ({
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  priceRange,
  setPriceRange,
  categories,
  brands,
}) => (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
    <div className="grid md:grid-cols-3 gap-6">
      <div>
        <label className="block text-sm font-medium text-black dark:text-white mb-2">
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white">
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.category_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-black dark:text-white mb-2">
          Brand
        </label>
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white">
          <option value="All">All Brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.brand_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-black dark:text-white mb-2">
          Price Range: ${priceRange.min} - ${priceRange.max}
        </label>
        <div className="flex gap-4">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange({ ...priceRange, min: Number(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white"
          />
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange({ ...priceRange, max: Number(e.target.value) })
            }
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white"
          />
        </div>
      </div>
    </div>
  </div>
);

// ======================
// PAGINATION
// ======================
const Pagination = ({ currentPage, totalPages, setCurrentPage }) => (
  <div className="flex justify-center items-center gap-4 mt-12">
    <button
      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
      disabled={currentPage === 1}
      className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
      <ChevronLeft className="h-5 w-5 text-black dark:text-white" />
    </button>

    <span className="text-sm text-gray-600 dark:text-gray-400">
      Page {currentPage} of {totalPages}
    </span>

    <button
      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
      className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
      <ChevronRight className="h-5 w-5 text-black dark:text-white" />
    </button>
  </div>
);

// ======================
// NEWSLETTER SECTION
// ======================
const NewsletterSection = () => (
  <section className="py-20 bg-white dark:bg-gray-900">
    <div className="max-w-2xl mx-auto text-center px-4">
      <h3 className="text-2xl font-light text-black dark:text-white mb-4 tracking-wide">
        Stay Updated
      </h3>
      <p className="text-gray-600 dark:text-gray-400 font-light mb-8">
        New arrivals and exclusive offers, delivered to your inbox
      </p>

      <div className="flex max-w-md mx-auto">
        <input
          type="email"
          placeholder="Your email address"
          className="flex-1 px-4 py-3 border border-r-0 border-gray-200 dark:border-gray-600 rounded-l-full focus:outline-none focus:ring-1 focus:ring-coral-500 focus:border-coral-500 bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-r-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium">
          Subscribe
        </button>
      </div>
    </div>
  </section>
);

// ======================
// TRUST SECTION
// ======================
const TrustSection = () => (
  <section className="py-12 border-t border-gray-100 dark:border-gray-800">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid md:grid-cols-3 gap-8 text-center">
        <TrustItem title="Free Delivery" subtitle="Orders over $50" />
        <TrustItem title="Easy Returns" subtitle="60 day policy" />
        <TrustItem title="Secure Payment" subtitle="Protected checkout" />
      </div>
    </div>
  </section>
);

const TrustItem = ({ title, subtitle }) => (
  <div className="flex flex-col items-center">
    <div className="w-8 h-8 bg-coral-500/10 rounded-full flex items-center justify-center mb-3">
      <div className="w-3 h-3 bg-coral-500 rounded-full"></div>
    </div>
    <h4 className="font-medium text-black dark:text-white text-sm mb-1">
      {title}
    </h4>
    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
      {subtitle}
    </p>
  </div>
);

export default LandingPage;
