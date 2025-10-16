import React, { useState, useEffect } from "react";

// SVG Icons
const Plus = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const X = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const Edit = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const Trash = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
  </svg>
);

const Save = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </svg>
);

const CheckCircle = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <path d="M22 4L12 14.01l-3-3" />
  </svg>
);

const AlertCircle = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const Loader2 = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

const Package = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
  </svg>
);

const Search = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const PlusCircle = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const Upload = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

const ChevronRight = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const ChevronLeft = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const API_BASE = "http://localhost:8000/api";

const productAPI = {
  getShopProducts: async (shopId: number, token: string) => {
    const res = await fetch(`${API_BASE}/products?shop=${shopId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
  },
  getProductVariants: async (productId: number, token: string) => {
    const res = await fetch(
      `${API_BASE}/product-variants?product=${productId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch variants");
    return await res.json();
  },
  getCategories: async () => {
    const res = await fetch(`${API_BASE}/categories`);
    return await res.json();
  },
  getBrands: async () => {
    const res = await fetch(`${API_BASE}/brands`);
    return await res.json();
  },
  getSizes: async () => {
    const res = await fetch(`${API_BASE}/sizes`);
    return await res.json();
  },
  getColors: async () => {
    const res = await fetch(`${API_BASE}/colors`);
    return await res.json();
  },
  createProduct: async (data: any, token: string) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.detail || error.message || "Failed to create product"
      );
    }
    return await res.json();
  },
  updateProduct: async (id: number, data: any, token: string) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.detail || error.message || "Failed to update product"
      );
    }
    return await res.json();
  },
  deleteProduct: async (id: number, token: string) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete product");
    return res;
  },
  createVariant: async (data: any, token: string) => {
    const res = await fetch(`${API_BASE}/product-variants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(JSON.stringify(error) || "Failed to create variant");
    }
    return await res.json();
  },
  updateVariant: async (id: number, data: any, token: string) => {
    const res = await fetch(`${API_BASE}/product-variants/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(JSON.stringify(error) || "Failed to update variant");
    }
    return await res.json();
  },
  uploadProductImages: async (
    productId: number,
    formData: FormData,
    token: string
  ) => {
    const res = await fetch(`${API_BASE}/products/${productId}/upload_images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.detail || error.message || "Failed to upload images"
      );
    }
    return await res.json();
  },
  createBrand: async (data: any, token: string) => {
    const res = await fetch(`${API_BASE}/brands`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to create brand");
    }
    return await res.json();
  },
  createSize: async (data: any, token: string) => {
    const res = await fetch(`${API_BASE}/sizes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to create size");
    }
    return await res.json();
  },
  createColor: async (data: any, token: string) => {
    const res = await fetch(`${API_BASE}/colors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to create color");
    }
    return await res.json();
  },
};

const RadioSelect = ({
  label,
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = "Search...",
  required = false,
  disabled = false,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = options.filter((opt: any) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-3 py-2 border rounded text-left bg-white flex items-center justify-between text-sm disabled:bg-gray-100 disabled:text-gray-500">
          <span className={selectedOption ? "" : "text-gray-400"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <Search />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-hidden">
              <div className="p-2 border-b">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full px-3 py-2 border rounded text-sm"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto max-h-48">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt: any) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer">
                      <input
                        type="radio"
                        name={label}
                        checked={value === opt.value}
                        onChange={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        className="rounded-full"
                      />
                      {opt.color && (
                        <span
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No results found
                  </div>
                )}
              </div>

              {onCreateNew && searchTerm && filteredOptions.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew(searchTerm);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className="w-full px-4 py-2 border-t bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center gap-2 text-sm font-medium">
                  <PlusCircle />
                  Create "{searchTerm}"
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface Variant {
  id?: number;
  size: number | null;
  color: number | null;
  price: string;
  quantity: number;
  sku: string;
  is_active: boolean;
}

interface ProductImage {
  type: "front" | "back" | "side" | "aerial";
  file: File | null;
  preview: string | null;
}

const Step1ProductInfo = ({
  formData,
  setFormData,
  categories,
  brands,
  createNewBrand,
}: any) => {
  const categoryOptions = categories.map((c: any) => ({
    label: c.category_name,
    value: c.id,
  }));
  const brandOptions = brands.map((b: any) => ({
    label: b.brand_name,
    value: b.id,
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2 mb-4">
        1. Product Information
      </h3>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 py-2 border rounded text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full px-3 py-2 border rounded text-sm"
        />
      </div>

      <RadioSelect
        label="Category"
        options={categoryOptions}
        value={formData.category}
        onChange={(value: number) =>
          setFormData({ ...formData, category: value })
        }
        placeholder="Select Category"
        required={true}
      />

      <RadioSelect
        label="Brand"
        options={brandOptions}
        value={formData.brand}
        onChange={(value: number) => setFormData({ ...formData, brand: value })}
        onCreateNew={createNewBrand}
        placeholder="Select or Create Brand"
        required={false}
      />

      <div className="flex items-center pt-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) =>
            setFormData({ ...formData, is_active: e.target.checked })
          }
          className="rounded text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="ml-2 text-sm font-medium">
          Product is Active
        </label>
      </div>
    </div>
  );
};

const Step2ProductVariants = ({
  variants,
  updateVariant,
  addVariant,
  removeVariant,
  sizes,
  colors,
  createNewSize,
  createNewColor,
  productCategory,
  categories,
}: any) => {
  // Get the selected category's size_type
  const selectedCategory = categories.find(
    (c: any) => c.id === productCategory
  );
  const categorySizeType = selectedCategory?.size_type;

  // Filter sizes based on the category's size_type
  const filteredSizes = categorySizeType
    ? sizes.filter((s: any) => s.size_type === categorySizeType)
    : sizes;

  const sizeOptions = filteredSizes.map((s: any) => ({
    label:
      s.numeric_size?.toString() ||
      s.alpha_size ||
      s.custom_size ||
      s.id.toString(),
    value: s.id,
  }));

  const colorOptions = colors.map((c: any) => ({
    label: c.color_name,
    value: c.id,
    color: c.hex_code,
  }));

  // Check if size is optional (for categories like Electronics)
  const sizeIsOptional = !categorySizeType || categorySizeType === "custom";

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2 mb-4">
        2. Product Variants
      </h3>
      {categorySizeType && (
        <p className="text-sm text-gray-600">
          This category requires <strong>{categorySizeType}</strong> sizes.
        </p>
      )}

      <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
        {variants.map((variant: Variant, index: number) => (
          <div
            key={index}
            className="p-4 border rounded-lg bg-gray-50 relative">
            <h4 className="font-medium text-sm mb-3 text-blue-700">
              Variant {index + 1}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RadioSelect
                label="Size"
                options={sizeOptions}
                value={variant.size}
                onChange={(value: number) =>
                  updateVariant(index, "size", value)
                }
                onCreateNew={(value: string) =>
                  createNewSize(value, categorySizeType)
                }
                placeholder={
                  sizeIsOptional ? "Size (Optional)" : "Select or Create Size"
                }
                required={!sizeIsOptional}
                disabled={!categorySizeType}
              />
              <RadioSelect
                label="Color"
                options={colorOptions}
                value={variant.color}
                onChange={(value: number) =>
                  updateVariant(index, "color", value)
                }
                onCreateNew={createNewColor}
                placeholder="Select or Create Color"
                required={true}
              />
              <div>
                <label className="block text-sm font-medium mb-1">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(index, "price", e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={variant.quantity}
                  onChange={(e) =>
                    updateVariant(
                      index,
                      "quantity",
                      parseInt(e.target.value) || 0
                    )
                  }
                  required
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(index, "sku", e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
              </div>
              <div className="flex items-center justify-between pt-5">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`variant_active_${index}`}
                    checked={variant.is_active}
                    onChange={(e) =>
                      updateVariant(index, "is_active", e.target.checked)
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`variant_active_${index}`}
                    className="ml-2 text-sm">
                    Is Active
                  </label>
                </div>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full bg-red-100">
                    <Trash />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addVariant}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm mt-4">
        <PlusCircle />
        Add Another Variant
      </button>
    </div>
  );
};

const ImageUploader = ({ label, image, onChange }: any) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    onChange(file);
  };

  const clearImage = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg">
      <label className="font-medium text-sm mb-3">{label} Image</label>

      {image.preview ? (
        <div className="relative w-full h-32 mb-3 bg-gray-200 rounded-lg overflow-hidden">
          <img
            src={image.preview}
            alt={`${label} preview`}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50">
            <X />
          </button>
        </div>
      ) : (
        <div
          className="w-full h-32 mb-3 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500"
          onClick={() => inputRef.current?.click()}>
          <Upload />
          <span className="text-xs text-gray-500 mt-1">Click to Upload</span>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

const Step3ProductImages = ({ productImages, handleImageChange }: any) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2 mb-4">
        3. Upload Images
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Upload images for your product (optional but recommended).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {productImages.map((image: ProductImage) => (
          <ImageUploader
            key={image.type}
            label={image.type.charAt(0).toUpperCase() + image.type.slice(1)}
            image={image}
            onChange={(file: File | null) =>
              handleImageChange(image.type, file)
            }
          />
        ))}
      </div>
    </div>
  );
};

const ProductManagement = ({
  selectedShopId,
  authToken = "",
}: {
  selectedShopId: number | null;
  authToken?: string;
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(
    new Set()
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brand: null as number | null,
    category: null as number | null,
    is_active: true,
  });

  const [variants, setVariants] = useState<Variant[]>([
    {
      size: null,
      color: null,
      price: "",
      quantity: 0,
      sku: "",
      is_active: true,
    },
  ]);

  const [productImages, setProductImages] = useState<ProductImage[]>([
    { type: "front", file: null, preview: null },
    { type: "back", file: null, preview: null },
    { type: "side", file: null, preview: null },
    { type: "aerial", file: null, preview: null },
  ]);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (selectedShopId && authToken) {
      fetchProducts();
    }
  }, [selectedShopId, authToken]);

  const fetchProducts = async () => {
    if (!selectedShopId || !authToken) return;
    setLoading(true);
    try {
      const data = await productAPI.getShopProducts(selectedShopId, authToken);
      const productsArray = Array.isArray(data) ? data : data.results || [];

      const productsWithVariants = await Promise.all(
        productsArray.map(async (product) => {
          try {
            const variantsData = await productAPI.getProductVariants(
              product.id,
              authToken
            );
            return {
              ...product,
              variants: Array.isArray(variantsData)
                ? variantsData
                : variantsData.results || [],
            };
          } catch (err) {
            return { ...product, variants: [] };
          }
        })
      );

      setProducts(productsWithVariants);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [catsData, brdsData, szsData, clrsData] = await Promise.all([
        productAPI.getCategories(),
        productAPI.getBrands(),
        productAPI.getSizes(),
        productAPI.getColors(),
      ]);
      setCategories(
        Array.isArray(catsData) ? catsData : catsData.results || []
      );
      setBrands(Array.isArray(brdsData) ? brdsData : brdsData.results || []);
      setSizes(Array.isArray(szsData) ? szsData : szsData.results || []);
      setColors(Array.isArray(clrsData) ? clrsData : clrsData.results || []);
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  const createNewBrand = async (name: string) => {
    if (!authToken) {
      setError("Authentication required. Please log in.");
      return;
    }
    try {
      const newBrand = await productAPI.createBrand(
        { brand_name: name, description: "" },
        authToken
      );
      setBrands([...brands, newBrand]);
      setFormData({ ...formData, brand: newBrand.id });
      setSuccess(`Brand "${name}" created!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create brand.");
    }
  };

  const createNewColor = async (name: string) => {
    if (!authToken) {
      setError("Authentication required. Please log in.");
      return;
    }
    try {
      const newColor = await productAPI.createColor(
        { color_name: name, hex_code: "#000000" },
        authToken
      );
      setColors([...colors, newColor]);
      setSuccess(`Color "${name}" created!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create color.");
    }
  };

  const createNewSize = async (value: string, sizeType?: string) => {
    if (!authToken) {
      setError("Authentication required. Please log in.");
      return;
    }
    try {
      // Use the category's size_type if provided, otherwise try to infer
      const detectedSizeType =
        sizeType || (!isNaN(Number(value)) ? "numeric" : "alpha");

      const sizeData =
        detectedSizeType === "numeric"
          ? { size_type: "numeric", numeric_size: parseInt(value) }
          : detectedSizeType === "alpha"
          ? { size_type: "alpha", alpha_size: value.toUpperCase() }
          : { size_type: "custom", custom_size: value };

      const newSize = await productAPI.createSize(sizeData, authToken);
      setSizes([...sizes, newSize]);
      setSuccess(`Size "${value}" created!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create size.");
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        size: null,
        color: null,
        price: "",
        quantity: 0,
        sku: "",
        is_active: true,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleImageChange = (
    type: "front" | "back" | "side" | "aerial",
    file: File | null
  ) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImages((prev) =>
          prev.map((img) =>
            img.type === type
              ? { ...img, file, preview: reader.result as string }
              : img
          )
        );
      };
      reader.readAsDataURL(file);
    } else {
      setProductImages((prev) =>
        prev.map((img) =>
          img.type === type ? { ...img, file: null, preview: null } : img
        )
      );
    }
  };

  const openModal = async (product?: any) => {
    setCurrentStep(1);
    setError("");

    setVariants([
      {
        size: null,
        color: null,
        price: "",
        quantity: 0,
        sku: "",
        is_active: true,
      },
    ]);
    setProductImages([
      { type: "front", file: null, preview: null },
      { type: "back", file: null, preview: null },
      { type: "side", file: null, preview: null },
      { type: "aerial", file: null, preview: null },
    ]);

    if (product) {
      setEditingId(product.id);
      setCreatedProductId(product.id);
      setFormData({
        name: product.name,
        description: product.description || "",
        brand: product.brand || null,
        category: product.category || null,
        is_active: product.is_active,
      });

      if (product.variants && product.variants.length > 0) {
        setVariants(
          product.variants.map((v: any) => ({
            id: v.id,
            size: v.size || null,
            color: v.color || null,
            price: v.price?.toString() || "",
            quantity: v.quantity || 0,
            sku: v.sku || "",
            is_active: v.is_active ?? true,
          }))
        );
      }
    } else {
      setEditingId(null);
      setCreatedProductId(null);
      setFormData({
        name: "",
        description: "",
        brand: null,
        category: null,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStep(1);
    setEditingId(null);
    setCreatedProductId(null);
  };

  // --- MODIFIED FUNCTION: Step 1 now ONLY creates/updates the base product.
  // The logic for updating available_sizes/colors has been removed from here.
  const handleStep1Next = async () => {
    if (!authToken) {
      setError("Authentication required");
      return;
    }
    if (!formData.name || !formData.category) {
      setError("Please fill required fields (Name, Category)");
      return;
    }
    if (!selectedShopId) {
      setError("Please select a shop first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Prepare product data (excluding variant-related fields)
      const productData = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        category: formData.category,
        is_active: formData.is_active,
        shop: selectedShopId,
        // IMPORTANT: available_sizes and available_colors are NOT included here.
        // They will be updated in Step 2 after variant data is gathered.
      };

      let finalProductId: number;

      if (editingId) {
        // Update existing product
        const updated = await productAPI.updateProduct(
          editingId,
          productData,
          authToken
        );
        finalProductId = updated.id || editingId;
      } else {
        // Create new product
        const created = await productAPI.createProduct(productData, authToken);

        // We rely on the created response returning the ID.
        // The previous, risky fallback logic to re-fetch all products is removed.
        finalProductId = created.id || created.pk;
        if (!finalProductId) {
          throw new Error("Product created but no ID was returned from API.");
        }
      }

      // ✅ Always set IDs before moving next
      setEditingId(finalProductId);
      setCreatedProductId(finalProductId);
      setCurrentStep(2);
    } catch (err: any) {
      console.error("Product creation error:", err);
      setError(err.message || "Failed to save product information");
      setCreatedProductId(null);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------

  // --- UNMODIFIED FUNCTION: This function now correctly handles the product update
  // for available_sizes/colors before saving the variants.
  const handleStep2Next = async () => {
    if (!authToken || !createdProductId) {
      setError("Product must be created first");
      return;
    }

    // Get the selected category's size_type
    const selectedCategory = categories.find(
      (c: any) => c.id === formData.category
    );
    const categorySizeType = selectedCategory?.size_type;

    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];

      // Size is only required for non-custom categories
      const sizeRequired = categorySizeType && categorySizeType !== "custom";

      if (
        (sizeRequired && !v.size) ||
        !v.color ||
        !v.price ||
        isNaN(parseFloat(v.price)) ||
        parseFloat(v.price) < 0 ||
        v.quantity < 0
      ) {
        setError(
          `Variant ${i + 1}: Please fill all required fields with valid values.`
        );
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // 1. Collect unique sizes and colors from the new variants
      const uniqueSizes = [
        ...new Set(variants.map((v) => v.size).filter((s) => s !== null)),
      ];
      const uniqueColors = [
        ...new Set(variants.map((v) => v.color).filter((c) => c !== null)),
      ];

      // 2. Update the product with available_sizes and available_colors
      await productAPI.updateProduct(
        createdProductId,
        { available_sizes: uniqueSizes, available_colors: uniqueColors },
        authToken
      );

      // 3. Create/update variants
      const allVariantPromises = variants.map(async (variant) => {
        const variantData: any = {
          product: createdProductId,
          size: variant.size, // CAN BE NULL for custom categories
          color: variant.color, // REQUIRED
          price: parseFloat(variant.price),
          quantity: variant.quantity,
          sku:
            variant.sku ||
            `${formData.name.toUpperCase().slice(0, 3)}-${
              variant.size || "NOSIZ"
            }-${variant.color}-${Date.now()}`,
          is_active: variant.is_active,
        };

        // CRITICAL: Remove size if it's null to avoid validation errors
        if (variantData.size === null) {
          delete variantData.size;
        }

        if (variant.id) {
          return productAPI.updateVariant(variant.id, variantData, authToken);
        } else {
          return productAPI.createVariant(variantData, authToken);
        }
      });

      await Promise.all(allVariantPromises);
      setCurrentStep(3);
    } catch (err: any) {
      console.error("Variant creation error:", err);
      setError(
        `Failed to save variants. ${err.message || "Check console for details"}`
      );
    } finally {
      setLoading(false);
    }
  };
  const handleStep3Complete = async () => {
    if (!authToken || !createdProductId) {
      setError("Product must be created first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get the created variants for this product
      const variantsData = await productAPI.getProductVariants(
        createdProductId,
        authToken
      );
      const createdVariants = Array.isArray(variantsData)
        ? variantsData
        : variantsData.results || [];

      if (createdVariants.length === 0) {
        throw new Error("No variants found for this product");
      }

      // Upload images if any are provided
      // Use the FIRST variant as the target for images
      const primaryVariant = createdVariants[0];

      const imagesToUpload = productImages.filter((img) => img.file);

      if (imagesToUpload.length > 0) {
        const formData = new FormData();

        // Add variant_id to link images to the variant
        formData.append("variant_id", primaryVariant.id.toString());

        // Add is_primary flag (first variant gets primary images)
        formData.append("is_primary", "true");

        // Add all image files
        imagesToUpload.forEach((img) => {
          if (img.file) {
            formData.append(`${img.type}_image`, img.file);
          }
        });

        // Upload images
        await productAPI.uploadProductImages(
          createdProductId,
          formData,
          authToken
        );
      }

      setSuccess(`Product ${editingId ? "updated" : "created"} successfully!`);
      await fetchProducts();
      closeModal();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Image upload error:", err);
      setError(
        err.message ||
          "Failed to complete product creation. Product and variants saved, but images may have failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setLoading(true);
    try {
      await productAPI.deleteProduct(id, authToken);
      setSuccess("Product deleted successfully!");
      await fetchProducts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductExpansion = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const getCategoryName = (id: number) =>
    categories.find((c) => c.id === id)?.category_name || "N/A";
  const getBrandName = (id: number) =>
    brands.find((b) => b.id === id)?.brand_name || "N/A";
  const getSizeName = (id: number) => {
    const size = sizes.find((s) => s.id === id);
    return size
      ? size.numeric_size?.toString() ||
          size.alpha_size ||
          size.custom_size ||
          "N/A"
      : "N/A";
  };
  const getColorName = (id: number) =>
    colors.find((c) => c.id === id)?.color_name || "N/A";
  const getColorHex = (id: number) =>
    colors.find((c) => c.id === id)?.hex_code || "#cccccc";

  if (!selectedShopId) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block mb-4 text-gray-400">
          <Package />
        </div>
        <h3 className="text-lg font-medium mb-2">No Shop Selected</h3>
        <p className="text-gray-600">Please select a shop to manage products</p>
      </div>
    );
  }

  if (!authToken) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block mb-4 text-red-400">
          <AlertCircle />
        </div>
        <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
        <p className="text-gray-600">Please log in to manage products</p>
      </div>
    );
  }

  const steps = [
    { id: 1, name: "Product Info" },
    { id: 2, name: "Variants" },
    { id: 3, name: "Images" },
  ];

  const handleNext = () => {
    if (currentStep === 1) handleStep1Next();
    if (currentStep === 2) handleStep2Next();
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="p-4">
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-[100]">
          <div className="flex items-center gap-2">
            <CheckCircle />
            <p className="text-sm font-medium">{success}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-[100] max-w-md">
          <div className="flex items-start gap-2">
            <AlertCircle />
            <div className="flex flex-col">
              <p className="text-sm font-medium">Error:</p>
              <pre className="text-xs whitespace-pre-wrap mt-1">{error}</pre>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Package /> Product Management
        </h2>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium">
          <Plus /> Add New Product
        </button>
      </div>

      {loading && products.length === 0 ? (
        <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
          <Loader2 /> Loading Products...
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No products found for this shop.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4 font-medium text-sm text-gray-600 border-b pb-2">
            <span className="col-span-2">Name</span>
            <span>Category</span>
            <span>Brand</span>
            <span>Active</span>
            <span className="text-right">Actions</span>
          </div>

          {products.map((product) => (
            <div key={product.id} className="border rounded-lg shadow-sm">
              <div
                className="grid grid-cols-6 gap-4 items-center p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleProductExpansion(product.id)}>
                <div className="col-span-2 text-sm font-medium">
                  {product.name}
                </div>
                <div className="text-sm">
                  {getCategoryName(product.category)}
                </div>
                <div className="text-sm">{getBrandName(product.brand)}</div>
                <div className="text-sm">
                  {product.is_active ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <AlertCircle className="text-red-500" />
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(product);
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50">
                    <Edit />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProduct(product.id);
                    }}
                    className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50">
                    <Trash />
                  </button>
                  {expandedProducts.has(product.id) ? (
                    <ChevronRight className="rotate-90" />
                  ) : (
                    <ChevronRight />
                  )}
                </div>
              </div>

              {expandedProducts.has(product.id) && (
                <div className="bg-gray-100 p-4 border-t">
                  <h4 className="font-semibold text-sm mb-3">
                    Variants ({product.variants.length})
                  </h4>
                  {product.variants.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-6 gap-2 text-xs font-medium text-gray-600 pb-1 border-b">
                        <span>Size</span>
                        <span>Color</span>
                        <span>SKU</span>
                        <span>Price</span>
                        <span>Qty</span>
                        <span>Active</span>
                      </div>
                      {product.variants.map((variant: Variant) => (
                        <div
                          key={variant.id}
                          className="grid grid-cols-6 gap-2 text-xs items-center py-1">
                          <span>{getSizeName(variant.size)}</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full border"
                              style={{
                                backgroundColor: getColorHex(variant.color),
                              }}
                            />
                            {getColorName(variant.color)}
                          </span>
                          <span>{variant.sku || "N/A"}</span>
                          <span>${variant.price}</span>
                          <span>{variant.quantity}</span>
                          <span>
                            {variant.is_active ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      No variants defined.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {editingId ? "Edit Product" : "Create New Product"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600">
                <X />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              <div className="flex justify-between items-center mb-8">
                {steps.map((step) => (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          currentStep === step.id
                            ? "bg-blue-600 text-white"
                            : currentStep > step.id
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}>
                        {currentStep > step.id ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <span
                        className={`ml-2 text-sm hidden sm:inline ${
                          currentStep >= step.id
                            ? "font-medium"
                            : "text-gray-500"
                        }`}>
                        {step.name}
                      </span>
                    </div>
                    {step.id < steps.length && (
                      <div
                        className={`flex-auto border-t-2 mx-2 ${
                          currentStep > step.id
                            ? "border-green-500"
                            : "border-gray-200"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {currentStep === 1 && (
                  <Step1ProductInfo
                    formData={formData}
                    setFormData={setFormData}
                    categories={categories}
                    brands={brands}
                    createNewBrand={createNewBrand}
                  />
                )}

                {currentStep === 2 && (
                  <Step2ProductVariants
                    variants={variants}
                    updateVariant={updateVariant}
                    addVariant={addVariant}
                    removeVariant={removeVariant}
                    sizes={sizes}
                    colors={colors}
                    createNewSize={createNewSize}
                    createNewColor={createNewColor}
                    productCategory={formData.category}
                    categories={categories}
                  />
                )}

                {currentStep === 3 && (
                  <Step3ProductImages
                    productImages={productImages}
                    handleImageChange={handleImageChange}
                  />
                )}

                <div className="flex justify-between gap-3 mt-8 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                    Cancel
                  </button>

                  <div className="flex gap-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={loading}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1 text-sm">
                        <ChevronLeft /> Back
                      </button>
                    )}

                    {currentStep < steps.length && (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-1 text-sm">
                        {loading ? (
                          <Loader2 />
                        ) : (
                          <>
                            Next <ChevronRight />
                          </>
                        )}
                      </button>
                    )}

                    {currentStep === steps.length && (
                      <button
                        type="button"
                        onClick={handleStep3Complete}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center gap-2 text-sm">
                        {loading ? (
                          <>
                            <Loader2 /> Finishing...
                          </>
                        ) : (
                          <>
                            <Save /> Finish {editingId ? "Update" : "Creation"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
