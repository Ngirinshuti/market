// components/ProductManagement.tsx
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
} from "lucide-react";
import { productAPI, Product } from "../../lib/sellerApi";

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
}

interface Category {
  id: number;
  category_name: string;
}

interface Brand {
  id: number;
  brand_name: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Form state for modal
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    shop: selectedShopId || 0,
    description: "",
    brand: null,
    category: null,
    is_active: true,
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
    } catch (err: any) {
      console.error("Failed to load options:", err);
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

  const openModal = (product: Product | null = null) => {
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
          }
        : {
            name: "",
            shop: selectedShopId || 0,
            description: "",
            brand: null,
            category: null,
            is_active: true,
          }
    );
    setIsModalOpen(true);
    setError("");
    setSuccess("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
    setFormData({
      name: "",
      shop: selectedShopId || 0,
      description: "",
      brand: null,
      category: null,
      is_active: true,
    });
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

      if (productToEdit) {
        const response = await productAPI.updateProduct(
          productToEdit.id,
          productData
        );
        setProducts((prev) =>
          prev.map((p) => (p.id === productToEdit.id ? response.data : p))
        );
        setSuccess(`Product "${formData.name}" updated successfully`);
      } else {
        const response = await productAPI.createProduct(productData);
        setProducts((prev) => [...prev, response.data]);
        setSuccess(`Product "${formData.name}" created successfully`);
      }

      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async (
    productId: number,
    productName: string
  ) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Product Catalogue ({filteredProducts.length} Items)
        </h2>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition">
          <Plus className="w-5 h-5 mr-2" />
          New Product
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

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

      {/* Empty States */}
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
            onClick={() => openModal()}
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
                  Created
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition p-1"
                        title={product.is_active ? "Deactivate" : "Activate"}>
                        {product.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openModal(product)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {productToEdit ? "Edit Product" : "Create New Product"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <option key={category.id} value={category.id}>
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
                      <option key={brand.id} value={brand.id}>
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
                  onClick={closeModal}
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
                  ) : productToEdit ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {modalLoading
                    ? "Saving..."
                    : productToEdit
                    ? "Save Changes"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
