"use client"
import React, { useState, useEffect } from 'react';
import { Search, Heart, User, ShoppingBag, ArrowRight, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const heroImages = [
    {
      title: "New Season Essentials",
      subtitle: "Curated for modern living",
      cta: "Shop New In",
      theme: "light"
    },
    {
      title: "Timeless Wardrobe",
      subtitle: "Quality pieces that last",
      cta: "Discover More",
      theme: "dark"
    },
    {
      title: "Contemporary Home",
      subtitle: "Transform your space",
      cta: "Shop Home",
      theme: "neutral"
    }
  ];

  const categories = [
    { name: "Women", href: "/women", count: "2.3k items" },
    { name: "Men", href: "/men", count: "1.8k items" },
    { name: "Children", href: "/children", count: "1.2k items" },
    { name: "Home", href: "/home", count: "900 items" }
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "Signature Dress",
      price: "£89",
      originalPrice: "£120",
      rating: 4.8,
      reviews: 124,
      badge: "Best Seller"
    },
    {
      id: 2,
      name: "Essential Blazer",
      price: "£149",
      rating: 4.9,
      reviews: 89,
      badge: "New In"
    },
    {
      id: 3,
      name: "Classic Jeans",
      price: "£69",
      rating: 4.7,
      reviews: 203,
      badge: ""
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-coral-500 focus:border-coral-500 transition-all"
              />
            </div>

            {/* Logo */}
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-[0.3em] text-black">MUTOVU</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
              <Heart className="h-5 w-5 text-gray-600 hover:text-coral-500 cursor-pointer transition-colors" />
              <User className="h-5 w-5 text-gray-600 hover:text-coral-500 cursor-pointer transition-colors" />
              <div className="relative">
                <ShoppingBag className="h-5 w-5 text-gray-600 hover:text-coral-500 cursor-pointer transition-colors" />
                <span className="absolute -top-2 -right-2 bg-coral-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-medium">2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Navigation */}
        <nav className="border-t border-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center space-x-12 py-3">
              {['Women', 'Men', 'Children', 'Home', 'Sale'].map((item) => (
                <a key={item} href="#" className="text-sm font-medium text-gray-700 hover:text-black transition-colors tracking-wide">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section - Minimal */}
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          {heroImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className={`h-full relative ${
                slide.theme === 'light' ? 'bg-stone-50' :
                slide.theme === 'dark' ? 'bg-gray-900' : 'bg-neutral-100'
              }`}>
                {/* Subtle pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px'
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="max-w-2xl">
              <div className={`transition-all duration-1000 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}>
                <h1 className={`text-5xl lg:text-6xl font-light mb-6 leading-tight tracking-tight ${
                  heroImages[currentSlide].theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  {heroImages[currentSlide].title}
                </h1>
                <p className={`text-xl mb-8 font-light ${
                  heroImages[currentSlide].theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {heroImages[currentSlide].subtitle}
                </p>
                <button className={`group inline-flex items-center gap-3 px-8 py-3 rounded-full font-medium transition-all hover:scale-105 ${
                  heroImages[currentSlide].theme === 'dark' 
                    ? 'bg-white text-black hover:bg-gray-100' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}>
                  {heroImages[currentSlide].cta}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-coral-500 w-8' 
                    : heroImages[currentSlide].theme === 'dark' ? 'bg-white/40' : 'bg-black/30'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories - Minimal Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-black mb-4 tracking-wide">Shop by Category</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <div key={category.name} className="group cursor-pointer">
                <div className="relative overflow-hidden bg-gray-50 aspect-[4/5] mb-4 group-hover:bg-gray-100 transition-colors">
                  {/* Placeholder for category image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-coral-500/10 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-coral-500 font-light">{category.name[0]}</span>
                    </div>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all flex items-end p-6">
                    <div className="w-full text-center">
                      <button className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                        Shop Now
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-medium text-black mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-500 font-light">{category.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Minimal */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-3xl font-light text-black mb-2 tracking-wide">Featured</h2>
              <p className="text-gray-600 font-light">Handpicked essentials</p>
            </div>
            <button className="text-sm text-coral-500 hover:text-coral-600 font-medium flex items-center gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="relative overflow-hidden bg-white aspect-[3/4] mb-4 group-hover:shadow-lg transition-all">
                  {product.badge && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        product.badge === 'New In' ? 'bg-black text-white' :
                        product.badge === 'Best Seller' ? 'bg-coral-500 text-white' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {product.badge}
                      </span>
                    </div>
                  )}
                  
                  <div className="absolute top-4 right-4 z-10">
                    <Heart className="h-5 w-5 text-gray-400 hover:text-coral-500 transition-colors" />
                  </div>

                  {/* Product placeholder */}
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-4xl text-gray-300">👗</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-black group-hover:text-coral-500 transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black">{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">{product.rating} ({product.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter - Ultra Minimal */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h3 className="text-2xl font-light text-black mb-4 tracking-wide">Stay Updated</h3>
          <p className="text-gray-600 font-light mb-8">
            New arrivals and exclusive offers, delivered to your inbox
          </p>
          
          <div className="flex max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 border border-r-0 border-gray-200 rounded-l-full focus:outline-none focus:ring-1 focus:ring-coral-500 focus:border-coral-500"
            />
            <button className="px-8 py-3 bg-black text-white rounded-r-full hover:bg-gray-800 transition-colors font-medium">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Minimal Trust Indicators */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-coral-500/10 rounded-full flex items-center justify-center mb-3">
                <div className="w-3 h-3 bg-coral-500 rounded-full"></div>
              </div>
              <h4 className="font-medium text-black text-sm mb-1">Free Delivery</h4>
              <p className="text-xs text-gray-500 font-light">Orders over £50</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-coral-500/10 rounded-full flex items-center justify-center mb-3">
                <div className="w-3 h-3 bg-coral-500 rounded-full"></div>
              </div>
              <h4 className="font-medium text-black text-sm mb-1">Easy Returns</h4>
              <p className="text-xs text-gray-500 font-light">60 day policy</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-coral-500/10 rounded-full flex items-center justify-center mb-3">
                <div className="w-3 h-3 bg-coral-500 rounded-full"></div>
              </div>
              <h4 className="font-medium text-black text-sm mb-1">Secure Payment</h4>
              <p className="text-xs text-gray-500 font-light">Protected checkout</p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Styles */}
      <style jsx>{`
        .text-coral-500 { color: #f87171; }
        .bg-coral-500 { background-color: #f87171; }
        .bg-coral-500\\/10 { background-color: rgba(248, 113, 113, 0.1); }
        .hover\\:text-coral-500:hover { color: #f87171; }
        .hover\\:text-coral-600:hover { color: #ef4444; }
        .ring-coral-500 { --tw-ring-color: #f87171; }
        .border-coral-500 { border-color: #f87171; }
        .focus\\:ring-coral-500:focus { --tw-ring-color: #f87171; }
        .focus\\:border-coral-500:focus { border-color: #f87171; }
      `}</style>
    </div>
  );
};

export default LandingPage;