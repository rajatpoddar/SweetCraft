import React, { useState } from 'react';
import { Search, Sparkles, Flame, Coffee, Info } from 'lucide-react';

// --- MOCK DATA: Isko aap baad me backend database se replace kar sakte hain ---
const menuItems = [
  { id: 1, name: 'Premium Kaju Katli', price: 800, unit: 'kg', category: 'Sweets', desc: 'Pure kaju & silver varq', popular: true },
  { id: 2, name: 'Special Rasgulla', price: 20, unit: 'pc', category: 'Sweets', desc: 'Soft, spongy & perfectly sweet', popular: false },
  { id: 3, name: 'Motichoor Laddoo', price: 400, unit: 'kg', category: 'Sweets', desc: 'Desi ghee se bane hue', popular: true },
  { id: 4, name: 'Punjabi Samosa', price: 15, unit: 'pc', category: 'Snacks', desc: 'Crispy with spicy aloo filling', popular: true },
  { id: 5, name: 'Khasta Kachori', price: 20, unit: 'pc', category: 'Snacks', desc: 'Moong dal stuffed & crispy', popular: false },
  { id: 6, name: 'Paneer Pakoda', price: 25, unit: 'pc', category: 'Snacks', desc: 'Fresh paneer deep fried', popular: false },
  { id: 7, name: 'Kesariya Lassi', price: 60, unit: 'glass', category: 'Beverages', desc: 'Thick, creamy & refreshing', popular: true },
  { id: 8, name: 'Hot Masala Chai', price: 15, unit: 'cup', category: 'Beverages', desc: 'Adrak & elaichi special', popular: false },
];

const categories = ['All', 'Sweets', 'Snacks', 'Beverages'];

export default function MenuCard() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Logic
  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-purple-500/30">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none z-0"></div>
      <div className="fixed top-[-10%] right-[-5%] w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        {/* Header Section */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-purple-500/10 mb-4 border border-zinc-100 dark:border-zinc-800">
            <Sparkles className="text-purple-500" size={28} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500">Menu</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Authentic taste, crafted with love.</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-zinc-400" size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search for sweets, snacks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-full py-3.5 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dark:text-white backdrop-blur-md"
          />
        </div>

        {/* Categories Carousel */}
        <div className="flex overflow-x-auto gap-3 pb-4 mb-6 scrollbar-hide animate-fade-in" style={{ animationDelay: '200ms' }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 ${
                activeCategory === category 
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          {filteredMenu.length > 0 ? (
            filteredMenu.map(item => (
              <div key={item.id} className="group bg-white dark:bg-zinc-900/80 backdrop-blur-lg border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                
                {/* Popular Badge */}
                {item.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-orange-500 to-red-500 text-white text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-bl-2xl shadow-md flex items-center gap-1">
                    <Flame size={12} /> Bestseller
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-2 pr-20">
                    <h3 className="text-xl font-bold dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{item.name}</h3>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-4 line-clamp-2">{item.desc}</p>
                </div>
                
                <div className="flex items-end justify-between mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                  <div className="flex items-center gap-1 text-zinc-400">
                    {item.category === 'Sweets' && <Sparkles size={16} />}
                    {item.category === 'Snacks' && <Flame size={16} />}
                    {item.category === 'Beverages' && <Coffee size={16} />}
                    <span className="text-xs font-semibold">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">₹{item.price}</span>
                    <span className="text-zinc-500 text-sm font-semibold ml-1">/{item.unit}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Info className="text-zinc-400" size={24} />
              </div>
              <h3 className="text-lg font-bold dark:text-white">No items found</h3>
              <p className="text-zinc-500 mt-1">Try searching for something else.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}