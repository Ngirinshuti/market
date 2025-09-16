"use client"
import React, { useState } from 'react';
import { Search, Heart, User, ShoppingBag, ChevronDown, Filter, Star } from 'lucide-react';

const NextFashionPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('New In');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { name: 'New In', color: 'bg-pink-200', image: '🌸' },
    { name: 'Linen', color: 'bg-blue-100', image: '👗' },
    { name: 'Denim', color: 'bg-blue-200', image: '👖' },
    { name: 'Summer', color: 'bg-yellow-100', image: '☀️' },
    { name: 'Occasion', color: 'bg-gray-100', image: '✨' },
    { name: 'Wedding Guest', color: 'bg-yellow-200', image: '💐' },
    { name: 'Mini', color: 'bg-black text-white', image: '👗' },
    { name: 'Midi', color: 'bg-pink-300', image: '👗' },
    { name: 'Maxi', color: 'bg-red-200', image: '👗' },
    { name: 'NEXT', color: 'bg-black text-white', image: 'N' }
  ];

  const products = [
    {
      id: 1,
      name: "Friends Like These Navy Tab Detail Short Sleeve Midi Dress",
      price: "£45",
      image: "/api/placeholder/300/400",
      brand: "Friends Like These",
      isNew: true,
      rating: 5
    },
    {
      id: 2,
      name: "Love & Roses Green Heart Embroidered Ruffle Long Sleeve Midi Dress",
      price: "£69",
      image: "/api/placeholder/300/400",
      brand: "Love & Roses",
      isNew: true,
      rating: 4
    },
    {
      id: 3,
      name: "Friends Like These Black Tab Detail Short Sleeve Midi Dress",
      price: "£45",
      image: "/api/placeholder/300/400",
      brand: "Friends Like These",
      isNew: false,
      rating: 5
    },
    {
      id: 4,
      name: "Lipsy Navy Off The Shoulder Gathered Waist Midi Dress",
      price: "£76",
      image: "/api/placeholder/300/400",
      brand: "Lipsy",
      isNew: true,
      rating: 4
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner */}
      <div className="bg-black text-white text-center py-2 text-sm">
        Next day delivery to home or free to store*
        <div className="absolute right-4 top-2 flex gap-4 text-xs">
          <span>Store Locator</span>
          <span>Help</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light">DRESSES (10333)</h2>
          <p className="text-gray-600 mt-4 max-w-4xl mx-auto">
            From golden-hued garden gatherings to crisp starts in the morning - our collection of stylish women's dresses offers the perfect wardrobe refresh for the coming... 
            <span className="text-black cursor-pointer">+ Read more</span>
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex flex-col items-center p-4 rounded-lg min-w-[80px] transition-all ${
                  selectedCategory === category.name 
                    ? 'ring-2 ring-black' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center mb-2 text-lg`}>
                  {category.image}
                </div>
                <span className="text-xs text-center">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">New In (1545)</span>
            </label>
            
            <div className="flex space-x-4">
              {['Size', 'Colour', 'Brand', 'Length', 'Style'].map((filter) => (
                <button key={filter} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  {filter}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>
              ))}
              
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <Filter className="mr-2 h-4 w-4" />
                MORE
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-sm mr-2">Sort</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>Relevance</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="relative bg-gray-50 rounded-lg overflow-hidden mb-4 aspect-[3/4]">
                {product.isNew && (
                  <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded text-xs font-medium z-10">
                    NEW IN
                  </div>
                )}
                <div className="absolute top-4 right-4 z-10">
                  <Heart className="h-6 w-6 text-gray-600 hover:text-red-500 transition-colors" />
                </div>
                
                {/* Placeholder for product image */}
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-6xl text-gray-400">👗</div>
                </div>
                
                {/* Brand overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded px-3 py-2">
                    <span className="text-sm font-medium">{product.brand}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm line-clamp-2 group-hover:underline">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{product.price}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${
                          i < product.rating 
                            ? 'fill-black text-black' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default NextFashionPage;