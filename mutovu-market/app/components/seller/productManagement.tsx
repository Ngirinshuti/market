// components/ProductManagement.tsx - Enhanced with Variant Management
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Settings,
  ShoppingCart,
  DollarSign,
  Palette,
  Ruler,
  Save,
  ArrowLeft,
} from "lucide-react";
import {
  productAPI,
  Product,
  ProductVariant,
  Size,
  Color,
  Category,
  Brand,
} from "../../lib/sellerApi";

interface ProductManagementProps {
  selectedShopId: number | null;
}

interface ProductFormData {
  name: string;
  shop: number;
  description: string;
  brand: number | null;
  category: number | null;
  is_active: boolean;
  available_sizes: number[];
  available_colors: number[];
}

interface VariantFormData {
  size: number;
  color: number;
  price: string;
  quantity: number;
  sku: string;
  description: string;
  is_active: boolean;
}

const ProductManagement: React.FC<ProductManagementProps> = ({
  selectedShopId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "variants">("list");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Options data
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);

  // Variants data
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantToEdit, setVariantToEdit] = useState<ProductVariant | null>(
    null
  );

  // Form states
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    shop: selectedShopId || 0,
    description: "",
    brand: null,
    category: null,
    is_active: true,
    available_sizes: [],
    available_colors: [],
  });

  const [variantFormData, setVariantFormData] = useState<VariantFormData>({
    size: 0,
    color: 0,
    price: "",
    quantity: 0,
    sku: "",
    description: "",
    is_active: true,
  });

  // Auto-generated variants for creating multiple variants at once
  const [autoGenerateVariants, setAutoGenerateVariants] = useState(false);
  const [basePrice, setBasePrice] = useState("");
  const [baseQuantity, setBaseQuantity] = useState(10);

  // Search states for sizes and colors
  const [sizeSearch, setSizeSearch] = useState("");
  const [colorSearch, setColorSearch] = useState("");
  const [showNewSizeForm, setShowNewSizeForm] = useState(false);
  const [showNewColorForm, setShowNewColorForm] = useState(false);

  // New size/color form data
  const [newSizeData, setNewSizeData] = useState({
    size_type: "numeric" as "numeric" | "alpha" | "custom",
    numeric_size: "",
    alpha_size: "",
    custom_size: "",
  });

  const [newColorData, setNewColorData] = useState({
    color_name: "",
    hex_code: "",
  });

  const fetchProducts = async () => {
    if (!selectedShopId) return;
    setLoading(true);
    setError("");

    try {
      const response = await productAPI.getShopProducts(selectedShopId);
      const productsData =
        response.data.data || response.data.results || response.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
      setSuccess("Products loaded successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [categoriesRes, brandsRes, sizesRes, colorsRes] = await Promise.all(
        [
          productAPI.getCategories(),
          productAPI.getBrands(),
          productAPI.getSizes(),
          productAPI.getColors(),
        ]
      );

      setCategories(
        categoriesRes.data.data ||
          categoriesRes.data.results ||
          categoriesRes.data
      );
      setBrands(
        brandsRes.data.data || brandsRes.data.results || brandsRes.data
      );
      setSizes(sizesRes.data.data || sizesRes.data.results || sizesRes.data);
      setColors(
        colorsRes.data.data || colorsRes.data.results || colorsRes.data
      );
    } catch (err: any) {
      console.error("Failed to load options:", err);
    }
  };

  const fetchVariants = async (productId: number) => {
    try {
      setLoading(true);
      const response = await productAPI.getProductVariants(productId);
      const variantsData =
        response.data.data || response.data.results || response.data;
      setVariants(Array.isArray(variantsData) ? variantsData : []);
    } catch (err: any) {
      setError("Failed to fetch product variants");
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedShopId) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [selectedShopId]);

  useEffect(() => {
    fetchOptions();
  }, []);

  // Get compatible sizes based on selected category
  const compatibleSizes = useMemo(() => {
    if (!formData.category) return sizes;
    const selectedCategory = categories.find((c) => c.id === formData.category);
    if (!selectedCategory) return sizes;
    return sizes.filter((s) => s.size_type === selectedCategory.size_type);
  }, [formData.category, categories, sizes]);

  // Filtered sizes and colors based on search
  const filteredSizes = useMemo(() => {
    if (!sizeSearch) return compatibleSizes;
    return compatibleSizes.filter((size) =>
      getSizeName(size.id).toLowerCase().includes(sizeSearch.toLowerCase())
    );
  }, [compatibleSizes, sizeSearch]);

  const filteredColors = useMemo(() => {
    if (!colorSearch) return colors;
    return colors.filter((color) =>
      color.color_name.toLowerCase().includes(colorSearch.toLowerCase())
    );
  }, [colors, colorSearch]);

  const openProductModal = (product: Product | null = null) => {
    setProductToEdit(product);
    setFormData(
      product
        ? {
            name: product.name,
            shop: product.shop,
            description: product.description || "",
            brand: product.brand,
            category: product.category,
            is_active: product.is_active,
            available_sizes: product.available_sizes || [],
            available_colors: product.available_colors || [],
          }
        : {
            name: "",
            shop: selectedShopId || 0,
            description: "",
            brand: null,
            category: null,
            is_active: true,
            available_sizes: [],
            available_colors: [],
          }
    );
    setIsModalOpen(true);
    setError("");
    setSuccess("");
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
    setAutoGenerateVariants(false);
    setBasePrice("");
    setBaseQuantity(10);
  };

  const openVariantModal = (variant: ProductVariant | null = null) => {
    setVariantToEdit(variant);
    setVariantFormData(
      variant
        ? {
            size: variant.size,
            color: variant.color,
            price: variant.price,
            quantity: variant.quantity,
            sku: variant.sku || "",
            description: variant.description || "",
            is_active: variant.is_active,
          }
        : {
            size: 0,
            color: 0,
            price: "",
            quantity: 0,
            sku: "",
            description: "",
            is_active: true,
          }
    );
    setIsVariantModalOpen(true);
    setError("");
    setSuccess("");
  };

  const closeVariantModal = () => {
    setIsVariantModalOpen(false);
    setVariantToEdit(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopId) return;

    setModalLoading(true);

    try {
      const productData = {
        ...formData,
        shop: selectedShopId,
      };

      let savedProduct: Product;

      if (productToEdit) {
        const response = await productAPI.updateProduct(
          productToEdit.id,
          productData
        );
        savedProduct = response.data;
        setProducts((prev) =>
          prev.map((p) => (p.id === productToEdit.id ? savedProduct : p))
        );
        setSuccess(`Product "${formData.name}" updated successfully`);
      } else {
        const response = await productAPI.createProduct(productData);
        savedProduct = response.data;
        setProducts((prev) => [...prev, savedProduct]);
        setSuccess(`Product "${formData.name}" created successfully`);
      }

      // Auto-generate variants if enabled
      if (
        autoGenerateVariants &&
        !productToEdit &&
        basePrice &&
        formData.available_sizes.length > 0 &&
        formData.available_colors.length > 0
      ) {
        await generateVariants(savedProduct.id);
      }

      closeProductModal();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setModalLoading(false);
    }
  };

  const generateVariants = async (productId: number) => {
    try {
      const variants: Partial<ProductVariant>[] = [];

      for (const sizeId of formData.available_sizes) {
        for (const colorId of formData.available_colors) {
          variants.push({
            product: productId,
            size: sizeId,
            color: colorId,
            price: basePrice,
            quantity: baseQuantity,
            is_active: true,
          });
        }
      }

      await productAPI.createMultipleVariants(variants);
      setSuccess(`Created ${variants.length} product variants automatically`);
    } catch (err: any) {
      console.error("Failed to generate variants:", err);
    }
  };

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setModalLoading(true);

    try {
      const variantData = {
        ...variantFormData,
        product: selectedProduct.id,
      };

      if (variantToEdit) {
        const response = await productAPI.updateProductVariant(
          variantToEdit.id,
          variantData
        );
        setVariants((prev) =>
          prev.map((v) => (v.id === variantToEdit.id ? response.data : v))
        );
        setSuccess("Variant updated successfully");
      } else {
        const response = await productAPI.createProductVariant(variantData);
        setVariants((prev) => [...prev, response.data]);
        setSuccess("Variant created successfully");
      }

      closeVariantModal();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save variant");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async (
    productId: number,
    productName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${productName}" and all its variants?`
      )
    ) {
      return;
    }

    try {
      await productAPI.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setSuccess(`Product "${productName}" deleted successfully`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!window.confirm("Are you sure you want to delete this variant?")) {
      return;
    }

    try {
      await productAPI.deleteProductVariant(variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      setSuccess("Variant deleted successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete variant");
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const response = await productAPI.updateProduct(product.id, {
        ...product,
        is_active: !product.is_active,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? response.data : p))
      );
      setSuccess(
        `Product ${
          !product.is_active ? "activated" : "deactivated"
        } successfully`
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to update product status"
      );
    }
  };

  const handleToggleVariantStatus = async (variant: ProductVariant) => {
    try {
      const response = await productAPI.updateProductVariant(variant.id, {
        ...variant,
        is_active: !variant.is_active,
      });
      setVariants((prev) =>
        prev.map((v) => (v.id === variant.id ? response.data : v))
      );
      setSuccess(
        `Variant ${
          !variant.is_active ? "activated" : "deactivated"
        } successfully`
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to update variant status"
      );
    }
  };

  const createNewSize = async () => {
    try {
      setModalLoading(true);

      // Determine the size type based on selected category
      const selectedCategory = categories.find(
        (c) => c.id === formData.category
      );
      const sizeType = selectedCategory?.size_type || "numeric";

      const sizeData = {
        size_type: sizeType,
        numeric_size:
          sizeType === "numeric"
            ? parseInt(newSizeData.numeric_size) || null
            : null,
        alpha_size: sizeType === "alpha" ? newSizeData.alpha_size : null,
        custom_size: sizeType === "custom" ? newSizeData.custom_size : null,
      };

      const response = await productAPI.createSize(sizeData);
      const createdSize = response.data;

      // Add to sizes list and select it
      setSizes((prev) => [...prev, createdSize]);
      setFormData((prev) => ({
        ...prev,
        available_sizes: [...prev.available_sizes, createdSize.id],
      }));

      // Reset form and close
      setNewSizeData({
        size_type: "numeric",
        numeric_size: "",
        alpha_size: "",
        custom_size: "",
      });
      setShowNewSizeForm(false);
      setSuccess(`Size "${getSizeName(createdSize.id)}" created successfully`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create size");
    } finally {
      setModalLoading(false);
    }
  };

  const createNewColor = async () => {
    try {
      setModalLoading(true);

      const colorData = {
        color_name: newColorData.color_name,
        hex_code: newColorData.hex_code || null,
      };

      const response = await productAPI.createColor(colorData);
      const createdColor = response.data;

      // Add to colors list and select it
      setColors((prev) => [...prev, createdColor]);
      setFormData((prev) => ({
        ...prev,
        available_colors: [...prev.available_colors, createdColor.id],
      }));

      // Reset form and close
      setNewColorData({
        color_name: "",
        hex_code: "",
      });
      setShowNewColorForm(false);
      setSuccess(`Color "${createdColor.color_name}" created successfully`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create color");
    } finally {
      setModalLoading(false);
    }
  };

  const resetNewSizeForm = () => {
    setNewSizeData({
      size_type: "numeric",
      numeric_size: "",
      alpha_size: "",
      custom_size: "",
    });
    setShowNewSizeForm(false);
  };

  const resetNewColorForm = () => {
    setNewColorData({
      color_name: "",
      hex_code: "",
    });
    setShowNewColorForm(false);
  };

  const showVariants = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView("variants");
    fetchVariants(product.id);
  };

  const backToProducts = () => {
    setCurrentView("list");
    setSelectedProduct(null);
    setVariants([]);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "brand" || name === "category"
          ? value
            ? parseInt(value)
            : null
          : value,
    }));
  };

  const handleVariantFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setVariantFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "size" || name === "color" || name === "quantity"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleMultiSelect = (name: string, value: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked
        ? [...(prev[name as keyof typeof prev] as number[]), value]
        : (prev[name as keyof typeof prev] as number[]).filter(
            (id) => id !== value
          ),
    }));
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          (p.description && p.description.toLowerCase().includes(lowerSearch))
      );
    }

    if (categoryFilter !== "All") {
      const categoryId = parseInt(categoryFilter);
      filtered = filtered.filter((p) => p.category === categoryId);
    }

    if (statusFilter !== "All") {
      const isActive = statusFilter === "Active";
      filtered = filtered.filter((p) => p.is_active === isActive);
    }

    return filtered;
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const getSizeName = (sizeId: number) => {
    const size = sizes.find((s) => s.id === sizeId);
    if (!size) return `Size ${sizeId}`;

    if (size.size_type === "numeric" && size.numeric_size)
      return size.numeric_size.toString();
    if (size.size_type === "alpha" && size.alpha_size) return size.alpha_size;
    if (size.size_type === "custom" && size.custom_size)
      return size.custom_size;
    return `Size ${sizeId}`;
  };

  const getColorName = (colorId: number) => {
    const color = colors.find((c) => c.id === colorId);
    return color?.color_name || `Color ${colorId}`;
  };

  if (!selectedShopId) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Shop Selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a shop to manage its products
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {currentView === "list" ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Product Catalogue ({filteredProducts.length} Items)
            </h2>
            <button
              onClick={() => openProductModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition">
              <Plus className="w-5 h-5 mr-2" />
              New Product
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center">
              <button
                onClick={backToProducts}
                className="mr-4 p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedProduct?.name} - Variants ({variants.length})
              </h2>
            </div>
            <button
              onClick={() => openVariantModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition">
              <Plus className="w-5 h-5 mr-2" />
              New Variant
            </button>
          </>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {success}
          <button
            onClick={() => setSuccess("")}
            className="ml-auto text-green-700 dark:text-green-300 hover:text-green-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-700 dark:text-red-300 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content based on current view */}
      {currentView === "list" ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.category_name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500">
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">
                  Loading products...
                </p>
              </div>
            </div>
          )}

          {/* Products Table */}
          {!loading && filteredProducts.length > 0 && (
            <div className="overflow-x-auto shadow-lg rounded-xl border dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Variants
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {product.description || "No description"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {categories.find((c) => c.id === product.category)
                          ?.category_name || "Uncategorized"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}>
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => showVariants(product)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition text-sm font-medium">
                          Manage Variants
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition p-1"
                            title={
                              product.is_active ? "Deactivate" : "Activate"
                            }>
                            {product.is_active ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openProductModal(product)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition p-1"
                            title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(product.id, product.name)
                            }
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition p-1"
                            title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        // Variants View
        <>
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">
                  Loading variants...
                </p>
              </div>
            </div>
          )}

          {!loading && variants.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Variants Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create variants by specifying size, color, and pricing
                combinations
              </p>
              <button
                onClick={() => openVariantModal()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                Create First Variant
              </button>
            </div>
          )}

          {!loading && variants.length > 0 && (
            <div className="overflow-x-auto shadow-lg rounded-xl border dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {variants.map((variant) => (
                    <tr
                      key={`variant-${variant.id}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getSizeName(variant.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getColorName(variant.color)}
                          </span>
                          {colors.find((c) => c.id === variant.color)
                            ?.hex_code && (
                            <span
                              className="ml-2 w-4 h-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: colors.find(
                                  (c) => c.id === variant.color
                                )?.hex_code,
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        £{parseFloat(variant.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            variant.quantity === 0
                              ? "text-red-600 dark:text-red-400"
                              : variant.quantity <= 10
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-green-600 dark:text-green-400"
                          }`}>
                          {variant.quantity} units
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {variant.sku || "No SKU"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            variant.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}>
                          {variant.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleVariantStatus(variant)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition p-1"
                            title={
                              variant.is_active ? "Deactivate" : "Activate"
                            }>
                            {variant.is_active ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openVariantModal(variant)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition p-1"
                            title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition p-1"
                            title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {productToEdit ? "Edit Product" : "Create New Product"}
                </h3>
                <button
                  onClick={closeProductModal}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                {/* Basic Product Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category || ""}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option
                          key={`category-${category.id}`}
                          value={category.id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand
                    </label>
                    <select
                      name="brand"
                      value={formData.brand || ""}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select Brand</option>
                      {brands.map((brand) => (
                        <option key={`brand-${brand.id}`} value={brand.id}>
                          {brand.brand_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Available Sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Sizes
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
                    {/* Search and Add New Size Header */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search sizes..."
                            value={sizeSearch}
                            onChange={(e) => setSizeSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNewSizeForm(!showNewSizeForm)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          New Size
                        </button>
                      </div>
                    </div>

                    {/* New Size Form */}
                    {showNewSizeForm && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900 border-b border-gray-200 dark:border-gray-600">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Create New Size
                          </div>
                          {formData.category && (
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              Size type:{" "}
                              {categories.find(
                                (c) => c.id === formData.category
                              )?.size_type || "numeric"}
                            </div>
                          )}

                          {(() => {
                            const selectedCategory = categories.find(
                              (c) => c.id === formData.category
                            );
                            const sizeType =
                              selectedCategory?.size_type || "numeric";

                            return (
                              <div className="flex gap-2 items-end">
                                {sizeType === "numeric" && (
                                  <div className="flex-1">
                                    <input
                                      type="number"
                                      placeholder="Size number (e.g., 42)"
                                      value={newSizeData.numeric_size}
                                      onChange={(e) =>
                                        setNewSizeData((prev) => ({
                                          ...prev,
                                          numeric_size: e.target.value,
                                        }))
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                )}

                                {sizeType === "alpha" && (
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      placeholder="Size (e.g., XL)"
                                      value={newSizeData.alpha_size}
                                      onChange={(e) =>
                                        setNewSizeData((prev) => ({
                                          ...prev,
                                          alpha_size: e.target.value,
                                        }))
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                )}

                                {sizeType === "custom" && (
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      placeholder="Custom size"
                                      value={newSizeData.custom_size}
                                      onChange={(e) =>
                                        setNewSizeData((prev) => ({
                                          ...prev,
                                          custom_size: e.target.value,
                                        }))
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={createNewSize}
                                  disabled={modalLoading}
                                  className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 flex items-center gap-1">
                                  {modalLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  Create
                                </button>
                                <button
                                  type="button"
                                  onClick={resetNewSizeForm}
                                  className="px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                                  Cancel
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Sizes List */}
                    <div className="p-4 max-h-40 overflow-y-auto">
                      {filteredSizes.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {filteredSizes.map((size) => (
                            <label
                              key={`available-size-${size.id}`}
                              className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.available_sizes.includes(
                                  size.id
                                )}
                                onChange={(e) =>
                                  handleMultiSelect(
                                    "available_sizes",
                                    size.id,
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {getSizeName(size.id)}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : sizeSearch ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No sizes found matching "{sizeSearch}"
                          </p>
                          <button
                            type="button"
                            onClick={() => setSizeSearch("")}
                            className="text-blue-600 hover:text-blue-700 text-sm mt-1">
                            Clear search
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          {formData.category
                            ? "No sizes available for selected category"
                            : "Select a category first"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Available Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Colors
                  </label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
                    {/* Search and Add New Color Header */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search colors..."
                            value={colorSearch}
                            onChange={(e) => setColorSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNewColorForm(!showNewColorForm)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          New Color
                        </button>
                      </div>
                    </div>

                    {/* New Color Form */}
                    {showNewColorForm && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900 border-b border-gray-200 dark:border-gray-600">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            Create New Color
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Color name (e.g., Ocean Blue)"
                                value={newColorData.color_name}
                                onChange={(e) =>
                                  setNewColorData((prev) => ({
                                    ...prev,
                                    color_name: e.target.value,
                                  }))
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                            <div className="w-24">
                              <div className="flex items-center gap-1">
                                <input
                                  type="color"
                                  value={newColorData.hex_code || "#000000"}
                                  onChange={(e) =>
                                    setNewColorData((prev) => ({
                                      ...prev,
                                      hex_code: e.target.value,
                                    }))
                                  }
                                  className="w-8 h-6 rounded border border-gray-300 dark:border-gray-600"
                                />
                                <input
                                  type="text"
                                  placeholder="#FFFFFF"
                                  value={newColorData.hex_code}
                                  onChange={(e) =>
                                    setNewColorData((prev) => ({
                                      ...prev,
                                      hex_code: e.target.value,
                                    }))
                                  }
                                  className="w-16 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={createNewColor}
                              disabled={
                                modalLoading || !newColorData.color_name.trim()
                              }
                              className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 flex items-center gap-1">
                              {modalLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Create
                            </button>
                            <button
                              type="button"
                              onClick={resetNewColorForm}
                              className="px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Colors List */}
                    <div className="p-4 max-h-40 overflow-y-auto">
                      {filteredColors.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {filteredColors.map((color) => (
                            <label
                              key={`available-color-${color.id}`}
                              className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.available_colors.includes(
                                  color.id
                                )}
                                onChange={(e) =>
                                  handleMultiSelect(
                                    "available_colors",
                                    color.id,
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex items-center space-x-2">
                                {color.hex_code && (
                                  <span
                                    className="w-4 h-4 rounded-full border border-gray-300"
                                    style={{ backgroundColor: color.hex_code }}
                                  />
                                )}
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {color.color_name}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : colorSearch ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No colors found matching "{colorSearch}"
                          </p>
                          <button
                            type="button"
                            onClick={() => setColorSearch("")}
                            className="text-purple-600 hover:text-purple-700 text-sm mt-1">
                            Clear search
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                            No colors available
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowNewColorForm(true)}
                            className="text-purple-600 hover:text-purple-700 text-sm">
                            Create your first color
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auto-generate Variants Option */}
                {!productToEdit && (
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="autoGenerate"
                        checked={autoGenerateVariants}
                        onChange={(e) =>
                          setAutoGenerateVariants(e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="autoGenerate"
                        className="ml-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                        Auto-generate variants for all size/color combinations
                      </label>
                    </div>

                    {autoGenerateVariants && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            Base Price (£) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={basePrice}
                            onChange={(e) => setBasePrice(e.target.value)}
                            required={autoGenerateVariants}
                            className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 bg-white dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            Base Quantity
                          </label>
                          <input
                            type="number"
                            value={baseQuantity}
                            onChange={(e) =>
                              setBaseQuantity(parseInt(e.target.value) || 0)
                            }
                            className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 bg-white dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {autoGenerateVariants &&
                      formData.available_sizes.length > 0 &&
                      formData.available_colors.length > 0 && (
                        <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800 rounded text-sm text-blue-800 dark:text-blue-200">
                          This will create{" "}
                          {formData.available_sizes.length *
                            formData.available_colors.length}{" "}
                          variants automatically.
                        </div>
                      )}
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Product is Active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeProductModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg"
                    disabled={modalLoading}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center">
                    {modalLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {modalLoading
                      ? "Saving..."
                      : productToEdit
                      ? "Update Product"
                      : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {variantToEdit ? "Edit Variant" : "Create New Variant"}
                </h3>
                <button
                  onClick={closeVariantModal}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVariant} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Size *
                    </label>
                    <select
                      name="size"
                      value={variantFormData.size || ""}
                      onChange={handleVariantFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select Size</option>
                      {selectedProduct?.available_sizes?.map((sizeId) => {
                        const size = sizes.find((s) => s.id === sizeId);
                        return size ? (
                          <option key={`size-${size.id}`} value={size.id}>
                            {getSizeName(size.id)}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Color *
                    </label>
                    <select
                      name="color"
                      value={variantFormData.color || ""}
                      onChange={handleVariantFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select Color</option>
                      {selectedProduct?.available_colors?.map((colorId) => {
                        const color = colors.find((c) => c.id === colorId);
                        return color ? (
                          <option key={`color-${color.id}`} value={color.id}>
                            {color.color_name}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price (£) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      value={variantFormData.price}
                      onChange={handleVariantFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={variantFormData.quantity}
                      onChange={handleVariantFormChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU (Optional)
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={variantFormData.sku}
                    onChange={handleVariantFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., PROD-M-RED-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Variant Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={variantFormData.description}
                    onChange={handleVariantFormChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes for this variant..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={variantFormData.is_active}
                    onChange={handleVariantFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Variant is Active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeVariantModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg"
                    disabled={modalLoading}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg flex items-center">
                    {modalLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {modalLoading
                      ? "Saving..."
                      : variantToEdit
                      ? "Update Variant"
                      : "Create Variant"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Empty States for filtered products */}
      {!loading && filteredProducts.length === 0 && products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Products Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by adding your first product to the catalogue
          </p>
          <button
            onClick={() => openProductModal()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add First Product
          </button>
        </div>
      )}

      {!loading && filteredProducts.length === 0 && products.length > 0 && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Products Match Your Search
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
