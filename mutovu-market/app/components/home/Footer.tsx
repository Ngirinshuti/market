"use client"
import React, { useState, useEffect } from 'react';
import { 
  Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, 
  CreditCard, Shield, Truck, Star, ArrowRight, ChevronUp, 
  Globe, Smartphone, Monitor, Award, Users, TrendingUp,
  Download, QrCode, Zap, Heart
} from 'lucide-react';

const NextProFooter = () => {
  const [selectedCountry, setSelectedCountry] = useState('UK');
  const [isNewsletterExpanded, setIsNewsletterExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const countries = [
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
  ];

  const socialLinks = [
    { name: 'Instagram', icon: <Instagram className="h-5 w-5" />, href: '#', color: 'hover:bg-pink-500', followers: '2.1M' },
    { name: 'Facebook', icon: <Facebook className="h-5 w-5" />, href: '#', color: 'hover:bg-blue-600', followers: '1.5M' },
    { name: 'Twitter', icon: <Twitter className="h-5 w-5" />, href: '#', color: 'hover:bg-blue-400', followers: '890K' },
    { name: 'YouTube', icon: <Youtube className="h-5 w-5" />, href: '#', color: 'hover:bg-red-600', followers: '650K' },
  ];

  const quickLinks = {
    'Shop': [
      { name: 'New In', href: '/new-in', badge: 'Hot' },
      { name: 'Dresses', href: '/dresses' },
      { name: 'Sale', href: '/sale', badge: 'Up to 70%' },
      { name: 'Gift Cards', href: '/gift-cards' },
    ],
    'Customer Care': [
      { name: 'Track Order', href: '/track', icon: <Truck className="h-4 w-4" /> },
      { name: 'Size Guide', href: '/size-guide', icon: <Monitor className="h-4 w-4" /> },
      { name: 'Returns', href: '/returns', icon: <ArrowRight className="h-4 w-4 rotate-180" /> },
      { name: 'Live Chat', href: '/chat', icon: <Users className="h-4 w-4" /> },
    ],
    'Company': [
      { name: 'About Next', href: '/about' },
      { name: 'Careers', href: '/careers', badge: 'Hiring' },
      { name: 'Sustainability', href: '/sustainability', icon: <Heart className="h-4 w-4" /> },
      { name: 'Press', href: '/press' },
    ]
  };

  const stats = [
    { icon: <Users className="h-6 w-6" />, value: '15M+', label: 'Happy Customers' },
    { icon: <Globe className="h-6 w-6" />, value: '40+', label: 'Countries' },
    { icon: <Award className="h-6 w-6" />, value: '4.8', label: 'Rating' },
    { icon: <TrendingUp className="h-6 w-6" />, value: '99%', label: 'Satisfaction' },
  ];

  const appDownloadLinks = [
    { platform: 'iOS', icon: '🍎', href: '#', size: '25MB' },
    { platform: 'Android', icon: '🤖', href: '#', size: '28MB' },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-stone-50 via-white to-stone-100 overflow-hidden">
      
      {/* Floating Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-coral-500 text-white rounded-full shadow-lg hover:bg-coral-600 transition-all hover:scale-110 flex items-center justify-center"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M50 50c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm-20 0c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zm-20 0c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Newsletter Section - Interactive */}
      <div className="relative coral-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Stay Ahead of Trends</h3>
                  <p className="text-white/80">Join 2.1M+ fashion enthusiasts</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">50%</div>
                  <div className="text-sm text-white/80">Exclusive Offers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24h</div>
                  <div className="text-sm text-white/80">Early Access</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">Weekly</div>
                  <div className="text-sm text-white/80">Style Tips</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex gap-3 mb-6">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-400"
                  />
                  <button className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all hover:scale-105 flex items-center gap-2">
                    <span className="hidden sm:inline">Subscribe</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-white/70">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-coral-500 rounded" />
                    Fashion updates
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-coral-500 rounded" />
                    Sale alerts
                  </label>
                </div>

                <p className="text-xs text-white/60 mt-4">
                  By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-16">
        
        {/* Stats Bar */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 bg-coral-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-coral-500/20 transition-all group-hover:scale-110">
                <div className="text-coral-500">
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-black mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 font-light">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Enhanced Features Bar */}
        <div className="border-t border-gray-200 mt-16 pt-12">
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { 
                icon: <Truck className="h-6 w-6" />, 
                title: 'Free Next Day Delivery', 
                desc: 'On orders over £50',
                accent: 'bg-blue-500'
              },
              { 
                icon: <Shield className="h-6 w-6" />, 
                title: 'Secure Shopping', 
                desc: '256-bit SSL encryption',
                accent: 'bg-green-500'
              },
              { 
                icon: <Star className="h-6 w-6" />, 
                title: '4.8★ Customer Rating', 
                desc: 'Based on 125k+ reviews',
                accent: 'bg-yellow-500'
              },
              { 
                icon: <Zap className="h-6 w-6" />, 
                title: 'Click & Collect', 
                desc: 'Free to 500+ stores',
                accent: 'bg-purple-500'
              }
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-coral-200 transition-all hover:shadow-lg group-hover:scale-105">
                  <div className={`w-12 h-12 ${feature.accent} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h5 className="font-semibold text-black text-sm mb-2">{feature.title}</h5>
                  <p className="text-xs text-gray-600 font-light">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="text-center mb-8">
            <h5 className="font-semibold text-black mb-4 text-sm tracking-wide">WE ACCEPT</h5>
            <div className="flex justify-center flex-wrap gap-3">
              {['Visa', 'Mastercard', 'American Express', 'PayPal', 'Apple Pay', 'Google Pay', 'Klarna', 'Clearpay'].map((method) => (
                <div key={method} className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-xs font-medium text-gray-700 hover:border-coral-300 transition-colors">
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Enhanced */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            
            {/* Copyright and Links */}
            <div className="flex flex-col lg:flex-row items-center gap-6 text-sm text-gray-500 font-light">
              <span>&copy; 2025 Next Retail Ltd. All rights reserved.</span>
              <div className="flex gap-6">
                <a href="#" className="hover:text-coral-500 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-coral-500 transition-colors">Terms & Conditions</a>
                <a href="#" className="hover:text-coral-500 transition-colors">Cookies</a>
                <a href="#" className="hover:text-coral-500 transition-colors">Accessibility</a>
              </div>
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <select 
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:border-coral-500"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
                <Globe className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="text-sm text-gray-500">
                <span className="font-light">Powered by</span>{' '}
                <span className="font-semibold text-black">NEXT Technology</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .text-coral-500 { color: #f87171; }
        .bg-coral-500 { background-color: #f87171; }
        .bg-coral-500\\/10 { background-color: rgba(248, 113, 113, 0.1); }
        .bg-coral-500\\/20 { background-color: rgba(248, 113, 113, 0.2); }
        .bg-coral-100 { background-color: #fee2e2; }
        .text-coral-600 { color: #dc2626; }
        .hover\\:text-coral-500:hover { color: #f87171; }
        .hover\\:bg-coral-500:hover { background-color: #f87171; }
        .hover\\:bg-coral-600:hover { background-color: #ef4444; }
        .hover\\:border-coral-200:hover { border-color: #fecaca; }
        .hover\\:border-coral-300:hover { border-color: #fca5a5; }
        .border-coral-200 { border-color: #fecaca; }
        .border-coral-300 { border-color: #fca5a5; }
        .focus\\:border-coral-500:focus { border-color: #f87171; }
        .coral-gradient { background: linear-gradient(135deg, #f87171 0%, #fb7185 50%, #f472b6 100%); }
      `}</style>
    </footer>
  );
};

export default NextProFooter;