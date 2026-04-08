import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Package, Users, ShoppingBag,
  IndianRupee, LayoutDashboard, X, UserPen, History,
  CheckCircle, Clock, ArrowDownRight, ArrowUpRight, Edit, Edit2, RotateCcw,
  Moon, Sun, LogOut, ChevronRight, Droplets, Trash2, Store, ImagePlus, Search, Sparkles, Flame, Info, Phone, MapPin, LayoutGrid, List, Coffee, ReceiptText, Briefcase, Printer, MessageCircle, Languages,
  MoreHorizontal, Settings, Shield, Building2, ChevronUp, BadgeCheck, ToggleLeft, ToggleRight, PlusCircle, Download
} from 'lucide-react';

import MenuCard from './MenuCard';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';

const API_BASE_URL = import.meta.env.DEV ? `http://${window.location.hostname}:5000` : '';

// Phone number validation helpers
const validatePhone = (value) => {
  // Remove any non-digit characters
  const cleaned = value.replace(/\D/g, '');
  // Limit to 10 digits
  return cleaned.slice(0, 10);
};

const isValidPhone = (phone) => {
  // Sirf 10 numbers allow karega
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

// Multi-tenant: Har request mein X-Shop-Username header add karna
// Isse backend ko pata chalega ki kaun sa shop data chahiye
const getShopUsername = () => localStorage.getItem('shop_username') || 'admin';
const shopFetch = (url, options = {}) => {
  const headers = {
    ...options.headers,
    'X-Shop-Username': getShopUsername(),
  };
  return fetch(url, { ...options, headers });
};

// --- MAIN APP WRAPPER WITH THEME & AUTH ---
function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');
  const [shopName, setShopName] = useState(localStorage.getItem('shop_name') || 'SweetCraft');

  useEffect(() => {
    const metaThemeColor = document.getElementById('theme-color-meta');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#09090b'); // zinc-950
      document.body.style.backgroundColor = '#09090b'; // Force iOS Safari sync
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#fafafa'); // zinc-50
      document.body.style.backgroundColor = '#fafafa'; // Force iOS Safari sync
    }
  }, [isDarkMode]);

  // Jab bhi user authenticated hoga, shop settings se shop name fetch karo
  useEffect(() => {
    if (isAuthenticated) {
      shopFetch(`${API_BASE_URL}/api/settings`)
        .then(r => r.json())
        .then(d => {
          if (d.shop_name) {
            setShopName(d.shop_name);
            localStorage.setItem('shop_name', d.shop_name);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const login = () => { setIsAuthenticated(true); localStorage.setItem('isAuthenticated', 'true'); };
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('isAuthenticated', 'false');
    localStorage.removeItem('shop_name');
    localStorage.removeItem('shop_username');
    setShopName('SweetCraft');
  };

  return (
    <Router>
      <Routes>
        <Route path="/menu" element={<PublicMenuCard toggleTheme={toggleTheme} isDarkMode={isDarkMode} />} />
        <Route path="/superadmin" element={<SuperAdminSection isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
        <Route path="/superadmin/*" element={<SuperAdminSection isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
        <Route path="/*" element={
          isAuthenticated ? (
            <AdminLayout logout={logout} toggleTheme={toggleTheme} isDarkMode={isDarkMode} shopName={shopName} />
          ) : (
            <LoginScreen onLogin={login} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          )
        } />
      </Routes>
    </Router>
  );
}

// Admin Layout Component
function AdminLayout({ logout, toggleTheme, isDarkMode, shopName }) {
  const { t, i18n } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar_collapsed', next);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-900 dark:text-zinc-50 antialiased selection:bg-purple-500/30">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-64 lg:w-72'} bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-r border-zinc-200 dark:border-zinc-800 flex-shrink-0 z-20 transition-all duration-300`}>
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3 p-6 lg:p-8'}`}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <Droplets className="text-white" size={24} />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-xl lg:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight truncate">{shopName}</h2>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Poddar Solutions</p>
            </div>
          )}
        </div>
        <nav className={`${sidebarCollapsed ? 'px-2' : 'px-3 lg:px-4'} py-2 space-y-1 flex-1 overflow-y-auto`}>
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label={t("Overview")} collapsed={sidebarCollapsed} />
          <NavItem to="/inventory" icon={<Package size={20} />} label={t("Stock & Inventory")} collapsed={sidebarCollapsed} />
          <NavItem to="/orders" icon={<ShoppingBag size={20} />} label={t("Party Orders")} collapsed={sidebarCollapsed} />
          <NavItem to="/staff" icon={<Users size={20} />} label={t("Staff Khata")} collapsed={sidebarCollapsed} />
          <NavItem to="/debt" icon={<IndianRupee size={20} />} label={t("Market Udhari")} collapsed={sidebarCollapsed} />
          <NavItem to="/expenses" icon={<ReceiptText size={20} />} label={t("Daily Expenses")} collapsed={sidebarCollapsed} />
          <NavItem to="/menu-manager" icon={<Store size={20} />} label={t("Menu Manager")} collapsed={sidebarCollapsed} />
          <NavItem to="/mahajan" icon={<Briefcase size={20} />} label={t("Mahajan Manager")} collapsed={sidebarCollapsed} />
          <NavItem to="/reports" icon={<History size={20} />} label={t("All Reports")} collapsed={sidebarCollapsed} />
          <NavItem to="/settings" icon={<Settings size={20} />} label={t("Shop Settings")} collapsed={sidebarCollapsed} />
        </nav>
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4 lg:p-6'} border-t border-zinc-200 dark:border-zinc-800 space-y-2`}>
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-500">{t("Theme")} / Lang</span>
              <div className="flex gap-2">
                <button onClick={toggleLanguage} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all" title="हिंदी / English">
                  <Languages size={18} />
                </button>
                <button onClick={toggleTheme} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          )}
          <button onClick={toggleSidebar} className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full p-2' : 'gap-2 w-full py-2 px-3'} rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95`} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <ChevronRight size={18} className={`transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {!sidebarCollapsed && <span className="text-xs font-bold">Collapse</span>}
          </button>
          {!sidebarCollapsed && (
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-all active:scale-95">
              <LogOut size={18} /> {t("Logout")}
            </button>
          )}
          {sidebarCollapsed && (
            <button onClick={logout} className="flex items-center justify-center w-full p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95" title="Logout">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile/Tablet Header */}
        <header className="md:hidden flex items-center justify-between px-4 sm:px-6 pb-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
              <Droplets className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-black text-zinc-800 dark:text-white tracking-tight leading-tight">{shopName}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleLanguage} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 active:scale-95 transition-all">
              <Languages size={19} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 active:scale-95 transition-all">
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-3 sm:px-5 md:px-8 pt-5 pb-28 md:pb-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/debt" element={<DebtPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/menu-manager" element={<MenuManagerPage />} />
            <Route path="/expenses" element={<ExpensePage />} />
            <Route path="/mahajan" element={<MahajanPage />} />
            <Route path="/settings" element={<ShopSettingsPage />} />
          </Routes>
        </main>

        {/* Mobile Bottom Nav - Staff Khata & Daily Expenses as primary, Stock & Orders in More */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-200/50 dark:border-zinc-800/50 z-50" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <div className="flex justify-around items-center pt-2 pb-1 px-2">
            <BottomNavItem to="/" icon={<LayoutDashboard size={22} />} label={t("Home")} />
            <BottomNavItem to="/staff" icon={<Users size={22} />} label={t("Staff")} />
            <BottomNavItem to="/expenses" icon={<ReceiptText size={22} />} label={t("Kharcha")} />
            <BottomNavItem to="/debt" icon={<IndianRupee size={22} />} label={t("Udhari")} />
            <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center justify-center w-14 group">
              <div className="p-1.5 rounded-2xl text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 active:scale-95 transition-all">
                <MoreHorizontal size={22} />
              </div>
              <span className="text-[10px] mt-0.5 font-semibold text-zinc-400 dark:text-zinc-500">{t("More")}</span>
            </button>
          </div>
        </nav>

        {/* More Drawer */}
        {moreOpen && <MoreDrawer onClose={() => setMoreOpen(false)} logout={logout} t={t} toggleLanguage={toggleLanguage} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
      </div>
    </div>
  );
}

// More Drawer - slide up menu for mobile
function MoreDrawer({ onClose, logout, t, toggleLanguage, toggleTheme, isDarkMode }) {
  const navigate = useNavigate();
  const go = (path) => { navigate(path); onClose(); };
  return (
    <>
      {/* FIX: backdrop pe pointer-events-none nahi, click karne pe band ho */}
      <div className="fixed inset-0 z-50 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden bg-white dark:bg-zinc-900 rounded-t-[2rem] shadow-2xl border-t border-zinc-200 dark:border-zinc-800 animate-slide-up" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-5" />
        <div className="px-4 grid grid-cols-3 gap-3 mb-4">
          {[
            { label: t('Stock & Inventory'), icon: <Package size={22}/>, path: '/inventory', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' },
            { label: t('Party Orders'), icon: <ShoppingBag size={22}/>, path: '/orders', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
            { label: t('Menu Manager'), icon: <Store size={22}/>, path: '/menu-manager', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
            { label: t('Mahajan Manager'), icon: <Briefcase size={22}/>, path: '/mahajan', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
            { label: t('All Reports'), icon: <History size={22}/>, path: '/reports', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
            { label: t('Shop Settings'), icon: <Settings size={22}/>, path: '/settings', color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' },
          ].map(item => (
            <button key={item.path} onClick={() => go(item.path)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${item.color} active:scale-95 transition-all`}>
              {item.icon}
              <span className="text-xs font-bold text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="px-4 flex gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <button onClick={toggleLanguage} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm active:scale-95">
            <Languages size={18} /> हिं/EN
          </button>
          <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm active:scale-95">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />} {isDarkMode ? 'Light' : 'Dark'}
          </button>
          <button onClick={() => { logout(); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm active:scale-95">
            <LogOut size={18} /> {t('Logout')}
          </button>
        </div>
      </div>
    </>
  );
}

function NavItem({ to, icon, label, collapsed }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  if (collapsed) {
    return (
      <Link to={to} title={label} className={`flex items-center justify-center p-3 rounded-2xl transition-all duration-200 ${isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}`}>
        <span className={`${isActive ? 'scale-110' : ''} transition-transform`}>{icon}</span>
      </Link>
    );
  }
  return (
    <Link to={to} className={`flex items-center space-x-3 px-3 lg:px-4 py-3 rounded-2xl transition-all duration-200 font-semibold group text-sm lg:text-base ${isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}`}>
      <span className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform flex-shrink-0`}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function BottomNavItem({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className="flex flex-col items-center justify-center w-14 group">
      <div className={`p-1.5 rounded-2xl transition-all duration-200 ${isActive ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 scale-110' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'} active:scale-95`}>
        {icon}
      </div>
      <span className={`text-[10px] mt-0.5 font-semibold transition-colors ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400 dark:text-zinc-500'}`}>{label}</span>
    </Link>
  );
}

// ==================== SKELETON LOADING COMPONENTS ====================
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-3/4 mb-3"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/2 mb-2"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3"></div>
        </div>
        <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
      </div>
      <div className="space-y-3">
        <div className="h-12 bg-zinc-100 dark:bg-zinc-950/50 rounded-2xl"></div>
        <div className="flex gap-2">
          <div className="h-10 flex-1 bg-zinc-100 dark:bg-zinc-950/50 rounded-xl"></div>
          <div className="h-10 flex-1 bg-zinc-100 dark:bg-zinc-950/50 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 animate-pulse">
      <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-1/4 mb-6"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl">
            <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-3/4"></div>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/2"></div>
            </div>
            <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-2/3 mb-3"></div>
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3"></div>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/2"></div>
            </div>
          </div>
          <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
        </div>
      ))}
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="pt-2">
        <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/4 animate-pulse"></div>
      </div>
      <SkeletonStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonTable />
        <SkeletonTable />
      </div>
    </div>
  );
}

// ==================== UI COMPONENTS ====================
export function UI_Input({ label, type = "text", list, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2 ml-1">{label}</label>}
      <input type={type} list={list} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-zinc-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]" {...props} />
    </div>
  );
}

export function UI_Select({ label, options, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2 ml-1">{label}</label>}
      <select className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 transition-all text-zinc-900 dark:text-white" {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function UI_Button({ children, onClick, variant = "primary", className = "", type = "button", disabled }) {
  const baseStyled = "w-full font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 flex justify-center items-center gap-2 active:scale-95 shadow-sm text-center";
  let variants = {
    primary: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/30",
    secondary: "bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20",
    success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20",
    warning: "bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20",
    outline: "border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyled} ${variants[variant]} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>{children}</button>
}

// --- LOGIN SCREEN ---
function LoginScreen({ onLogin, isDarkMode, toggleTheme }) {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        // Multi-tenant ke liye username save karo
        localStorage.setItem('shop_username', data.username || username);
        onLogin();
      } else {
        setError('Galat Username ya Password!');
      }
    } catch (err) {
      setError('Network connection error.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans ${isDarkMode ? 'dark' : ''} transition-colors duration-500 relative overflow-hidden`}>
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-[3rem] p-10 shadow-2xl border border-white/20 dark:border-zinc-800/50 relative z-10">
        <div className="absolute top-6 right-6 flex gap-2">
          <button onClick={() => {
            const newLang = i18n.language === 'en' ? 'hi' : 'en';
            i18n.changeLanguage(newLang);
            localStorage.setItem('app_lang', newLang);
          }} className="p-2 rounded-full bg-white/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all shadow-sm" title="Change Language (हिं/EN)">
            <Languages size={18} />
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-full bg-white/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all shadow-sm">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="flex justify-center mb-8 mt-4">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
            <Droplets className="text-white" size={40} />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">{t('Secure Login')}</h1>
          {error && <p className="text-red-500 font-bold mt-2">{error}</p>}
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <UI_Input placeholder={t('Username')} value={username} onChange={e=>setUsername(e.target.value)} required />
          <UI_Input type="password" placeholder={t('Password')} value={password} onChange={e=>setPassword(e.target.value)} required />
          <div className="pt-4">
            <UI_Button type="submit" variant="primary"><span>{t('Secure Login')}</span> <ChevronRight size={20} /></UI_Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- DASHBOARD PAGE ---
function Dashboard() {
  const { t } = useTranslation(); 
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({ expiring_items: [], upcoming_orders: [], low_stock_items: [] });
  const [stats, setStats] = useState({ total_income: 0, total_cash: 0, total_online: 0, total_expense: 0, total_staff_pay: 0, total_principle: 0, net_income: 0 });
  const [incomeForm, setIncomeForm] = useState({ payment_mode: 'Cash', amount: '', description: '' });
  const [principleForm, setPrincipleForm] = useState({ amount: '', description: '' });
  
  // NAYA: Purane metrics wapas laane ke liye state
  const [oldMetrics, setOldMetrics] = useState({ totalUdhari: 0, totalPendingOrders: 0, totalPresentStaff: 0, totalStaff: 0 });

  const fetchStats = () => shopFetch(API_BASE_URL + '/api/dashboard/stats').then(res => res.json()).then(setStats).catch(()=>{});
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          shopFetch(API_BASE_URL + '/api/dashboard/alerts').then(res => res.json()).then(data => { if (data) setAlerts(data); }),
          fetchStats(),
          shopFetch(API_BASE_URL + '/api/staff').then(res => res.json()).then(data => {
            setOldMetrics(prev => ({ ...prev, totalPresentStaff: data.filter(s => s.today_attendance === 'Present').length, totalStaff: data.length }));
          }),
          shopFetch(API_BASE_URL + '/api/customers').then(res => res.json()).then(data => setOldMetrics(prev => ({ ...prev, totalUdhari: data.customers ? (data.total_udhar || 0) : data.reduce((sum, c) => sum + (c.balance || 0), 0) }))),
          shopFetch(API_BASE_URL + '/api/orders').then(res => res.json()).then(data => setOldMetrics(prev => ({ ...prev, totalPendingOrders: data.filter(o => o.status !== 'Delivered').length })))
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    shopFetch(API_BASE_URL + '/api/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(incomeForm) })
      .then(() => { setIncomeForm({ payment_mode: 'Cash', amount: '', description: '' }); fetchStats(); });
  };

  const handlePrincipleSubmit = (e) => {
    e.preventDefault();
    shopFetch(API_BASE_URL + '/api/principle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(principleForm) })
      .then(() => { setPrincipleForm({ amount: '', description: '' }); fetchStats(); });
  };

  const getExpiryText = (dateStr) => {
    const diffDays = Math.ceil((new Date(dateStr) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    return diffDays <= 0 ? `Expired` : `Expires in ${diffDays}d`;
  };

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t("Overview")}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium text-lg">{t("Welcome back, here's your daily summary.")}</p>
      </div>

      {/* Main Income Stats */}
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 md:p-8 rounded-[2rem] text-white shadow-lg flex flex-col gap-6">
          <div className="flex-1">
              <p className="text-emerald-50 font-bold tracking-widest mb-2 uppercase text-[10px]">{t('Net Daily Sales')}</p>
              <h3 className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-3">₹{stats.net_income}</h3>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                 <span className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">💰 Sale: ₹{stats.total_income}</span>
                 <span className="bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-black/5">📦 Expense: ₹{stats.total_expense}</span>
                 <span className="bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-black/5">👥 Staff: ₹{stats.total_staff_pay}</span>
                 <span className="bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-black/5">🏦 Direct Income: ₹{stats.total_principle}</span>
              </div>
              <p className="text-emerald-50/80 text-xs mt-3 font-medium">Net Sale = Expense + Staff + Principle - Sale</p>
              <p className="text-emerald-50/80 text-xs mt-1 font-medium">Total Cash in Hand: ₹{stats.total_income + stats.total_principle}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <form onSubmit={handleIncomeSubmit} className="bg-white/10 p-5 rounded-[1.5rem] border border-white/20 backdrop-blur-md flex flex-col gap-3">
               <h4 className="font-bold text-[11px] uppercase tracking-widest text-emerald-50 mb-1">{t('Principle Amount')}</h4>
               <div className="grid grid-cols-2 gap-2">
                 <select className="bg-white/20 text-white rounded-xl px-3 py-2 text-sm outline-none border border-white/10" value={incomeForm.payment_mode} onChange={e=>setIncomeForm({...incomeForm, payment_mode: e.target.value})}>
                   <option value="Cash" className="text-black">{t('Cash')}</option>
                   <option value="Online" className="text-black">{t('Online')}</option>
                 </select>
                 <input type="number" placeholder={t('₹ Amount')} value={incomeForm.amount} onChange={e=>setIncomeForm({...incomeForm, amount: e.target.value})} className="bg-white/20 text-white placeholder-white/60 text-sm rounded-xl px-3 py-2 outline-none border border-white/10" required />
               </div>
               <div className="flex gap-2">
                 <input type="text" placeholder={t('Detail (Optional)')} value={incomeForm.description} onChange={e=>setIncomeForm({...incomeForm, description: e.target.value})} className="bg-white/20 text-white placeholder-white/60 text-sm rounded-xl px-3 py-2 w-full outline-none border border-white/10" />
                 <button type="submit" className="bg-white text-emerald-600 font-bold w-12 rounded-xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95">+</button>
               </div>
            </form>

            <form onSubmit={handlePrincipleSubmit} className="bg-white/10 p-5 rounded-[1.5rem] border border-white/20 backdrop-blur-md flex flex-col gap-3">
               <h4 className="font-bold text-[11px] uppercase tracking-widest text-emerald-50 mb-1">{t('Record Direct Income')}</h4>
               <input type="number" placeholder={t('₹ Amount')} value={principleForm.amount} onChange={e=>setPrincipleForm({...principleForm, amount: e.target.value})} className="bg-white/20 text-white placeholder-white/60 text-sm rounded-xl px-3 py-2 outline-none border border-white/10" required />
               <div className="flex gap-2">
                 <input type="text" placeholder={t('Detail (Optional)')} value={principleForm.description} onChange={e=>setPrincipleForm({...principleForm, description: e.target.value})} className="bg-white/20 text-white placeholder-white/60 text-sm rounded-xl px-3 py-2 w-full outline-none border border-white/10" />
                 <button type="submit" className="bg-white text-emerald-600 font-bold w-12 rounded-xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95">+</button>
               </div>
            </form>
          </div>
      </div>

      {/* Row 1: Finance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard title="Total Principle" value={`₹${stats.total_income}`} sub={`C: ₹${stats.total_cash} | O: ₹${stats.total_online}`} icon={<IndianRupee size={24} />} gradient="from-purple-400 to-indigo-500" />
        <MetricCard title="Total Daily Expense" value={`₹${stats.total_expense}`} icon={<ReceiptText size={24} />} gradient="from-red-400 to-rose-600" />
        <MetricCard title="Staff Pay (Today)" value={`₹${stats.total_staff_pay}`} icon={<Users size={24} />} gradient="from-orange-400 to-rose-500" />
        <MetricCard title="Total Direct Income" value={`₹${stats.total_principle}`} icon={<Briefcase size={24} />} gradient="from-blue-400 to-indigo-500" />
      </div>

      {/* Row 2: Operation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard title="Market Udhari" value={`₹${oldMetrics.totalUdhari}`} icon={<IndianRupee size={24} />} gradient="from-pink-400 to-rose-500" />
        <MetricCard title="Pending Orders" value={oldMetrics.totalPendingOrders} icon={<ShoppingBag size={24} />} gradient="from-blue-400 to-indigo-500" />
        <MetricCard title="Staff Present" value={oldMetrics.totalPresentStaff} sub={`/ ${oldMetrics.totalStaff} Total Staff`} icon={<Users size={24} />} gradient="from-emerald-400 to-teal-500" />
        <MetricCard title="Active Alerts" value={(alerts.expiring_items?.length || 0) + (alerts.low_stock_items?.length || 0)} icon={<AlertTriangle size={24} />} gradient="from-amber-400 to-orange-500" />
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {alerts.expiring_items?.length > 0 && (
          <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 md:p-8 rounded-[2rem]">
            <h2 className="text-xl font-extrabold text-red-700 dark:text-red-400 flex items-center mb-6"><AlertTriangle className="mr-2" size={24} /> {t("Expiring Stock")}</h2>
            <div className="space-y-3">
              {alerts.expiring_items.map(item => (
                <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.item_name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Stock: {item.quantity}</p>
                  </div>
                  <span className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-xs px-3 py-1.5 rounded-lg font-bold">{getExpiryText(item.expiry_date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alerts.upcoming_orders?.length > 0 && (
          <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 p-6 md:p-8 rounded-[2rem]">
            <h2 className="text-xl font-extrabold text-purple-700 dark:text-purple-400 flex items-center mb-6"><Clock className="mr-2" size={24} /> {t("Upcoming Orders")}</h2>
            <div className="space-y-3">
              {alerts.upcoming_orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{order.customer_name}</p>
                  <span className="bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 text-xs px-3 py-1.5 rounded-lg font-bold tracking-wide">Del: {order.delivery_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alerts.low_stock_items?.length > 0 && (
          <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-6 md:p-8 rounded-[2rem] lg:col-span-2">
            <h2 className="text-xl font-extrabold text-orange-700 dark:text-orange-400 flex items-center mb-6"><AlertTriangle className="mr-2" size={24} /> {t("Low Stock Alerts")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.low_stock_items.map(item => (
                <div key={'low'+item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.item_name}</p>
                    <p className="text-xs text-zinc-500 font-medium tracking-wide mt-0.5">Stock Left: {item.quantity} (Limit: {item.min_stock})</p>
                  </div>
                  <span className="bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-xs px-3 py-1.5 rounded-lg font-bold">Low Stock</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, icon, gradient }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group">
      <div className="flex justify-between items-start gap-3">
        {/* min-w-0 ensures that long text truncates properly instead of pushing layout */}
        <div className="flex-1 min-w-0"> 
          <p className="text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-2 uppercase text-[10px] truncate">{title}</p>
          <h3 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight truncate leading-none mb-1.5">{value}</h3>
          {/* Sub text ko neeche move kar diya aur truncate lagaya taki overflow na ho */}
          {sub && <p className="text-zinc-400 dark:text-zinc-500 font-semibold text-[11px] truncate">{sub}</p>}
        </div>
        <div className={`w-12 h-12 flex-shrink-0 rounded-[1rem] bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// --- INVENTORY PAGE ---
function InventoryPage() {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({ item_name: '', quantity: '', expiry_date: '', min_stock: '5' });
  const [searchQuery, setSearchQuery] = useState(''); // Naya Search State

  const fetchInventory = () => shopFetch(`${API_BASE_URL}/api/inventory`).then(res => res.json()).then(setInventory).catch(() => setInventory([]));
  useEffect(() => { fetchInventory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await shopFetch(`${API_BASE_URL}/api/inventory`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(formData) 
      });

      if (response.ok) {
        setFormData({ item_name: '', quantity: '', expiry_date: '', min_stock: '5' }); 
        fetchInventory();
      } else {
        const data = await response.json();
        alert("Backend Error: " + (data.error || "Stock add nahi ho paya!"));
      }
    } catch (error) {
      alert("Network Error: Backend se connection fail ho gaya.");
    }
  };

  const handleStockAction = async (id, type) => {
    const qty = prompt(`Kitna stock ${type === 'out' ? 'sale' : 'return'} karna hai?`);
    if (!qty || isNaN(qty) || qty <= 0) return;

    try {
      const response = await shopFetch(`${API_BASE_URL}/api/inventory/${id}/${type}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ quantity: Number(qty) }) 
      });

      if (response.ok) fetchInventory();
    } catch (error) {
      alert("Network Error: Backend se connection fail ho gaya.");
    }
  };

  const handleDeleteItem = async (itemName) => {
    if (!window.confirm(`Kya aap sach mein '${itemName}' ko hamesha ke liye list se hatana chahte hain? Isse iska dashboard alert bhi band ho jayega.`)) return;
    try {
      const response = await shopFetch(`${API_BASE_URL}/api/inventory/item/${encodeURIComponent(itemName)}`, { method: 'DELETE' });
      if(response.ok) fetchInventory();
    } catch (err) {
      alert("Delete fail ho gaya.");
    }
  };

  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.item_name]) {
      acc[item.item_name] = { item_name: item.item_name, total_quantity: 0, min_stock: item.min_stock, batches: [] };
    }
    acc[item.item_name].total_quantity += item.quantity;
    if (item.quantity > 0) {
      acc[item.item_name].batches.push(item);
    }
    return acc;
  }, {});

  const groupedItemsList = Object.values(groupedInventory);
  const uniqueItemNames = Object.keys(groupedInventory);

  // Search Filter
  const filteredItemsList = groupedItemsList.filter(group => 
    group.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Stock</h1></div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h2 className="text-xl font-extrabold mb-6 dark:text-white">{t('Add New Stock')}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
          <div className="md:col-span-2">
            <UI_Input 
              label={t('Item Name')} 
              placeholder="e.g. Haldiram Bhujia" 
              list="item-names"
              value={formData.item_name} 
              onChange={e => setFormData({ ...formData, item_name: e.target.value })} 
              required 
            />
            <datalist id="item-names">
              {uniqueItemNames.map(name => <option key={name} value={name} />)}
            </datalist>
          </div>
          <UI_Input label={t('Qty')} type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} required />
          <UI_Input label={t('Limit (Alert)')} type="number" min="1" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: e.target.value })} required />
          <UI_Input label={t('Expiry Date')} type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} required />
          <div className="md:col-span-4 lg:col-span-1"><UI_Button type="submit" variant="secondary">{t('Add')}</UI_Button></div>
        </form>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{t('Current Stock')}</h2>
          <div className="relative w-full md:w-72">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
             <input type="text" placeholder={t('Search stock item...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItemsList.map(group => (
          <div key={group.item_name} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-2xl font-bold dark:text-white">{group.item_name}</h3>
                <button onClick={() => handleDeleteItem(group.item_name)} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full hover:scale-110 transition-transform" title="Remove Item Completely">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                <span className={`font-bold px-3 py-1.5 rounded-xl text-sm ${group.total_quantity <= group.min_stock ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'}`}>
                  Total Stock: {group.total_quantity}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-2 border-b border-zinc-100 dark:border-zinc-800 pb-1">{t('Expiry Batches')}</p>
              
              {group.batches.length > 0 ? (
                group.batches.sort((a,b) => new Date(a.expiry_date) - new Date(b.expiry_date)).map(batch => (
                  <div key={batch.id} className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold dark:text-zinc-200">Exp: {batch.expiry_date}</span>
                      <span className="text-sm font-bold text-zinc-500">Qty: {batch.quantity}</span>
                    </div>
                    <div className="flex gap-2">
                      <UI_Button onClick={() => handleStockAction(batch.id, 'out')} variant="warning" className="!py-1.5 !px-2 !text-xs flex-1"><ArrowUpRight size={14} /> {t('Sale')}</UI_Button>
                      <UI_Button onClick={() => handleStockAction(batch.id, 'return')} variant="danger" className="!py-1.5 !px-2 !text-xs flex-1"><RotateCcw size={14} /> {t('Return')}</UI_Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500 font-medium py-2">Saara stock khatam ho chuka hai.</p>
              )}
            </div>
          </div>
        ))}
        {filteredItemsList.length === 0 && <p className="text-zinc-500 col-span-full">Koi stock nahi mila.</p>}
      </div>
    </div>
  );
}

// --- STAFF PAGE ---
function StaffPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [todayPay, setTodayPay] = useState(0);
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '', payment_type: 'Daily', base_salary: '' });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, staff: null, logs: [] });
  const [payModal, setPayModal] = useState({ isOpen: false, staffId: null, action: '', amount: '', note: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, staff: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = () => { 
    const todayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0];
    return shopFetch(API_BASE_URL + `/api/staff?date=${todayDate}`).then(res => res.json()).then(setStaffList).catch(() => { }); 
  };
  const fetchTodayPay = () => { return shopFetch(API_BASE_URL + '/api/staff/today_pay').then(res => res.json()).then(data => setTodayPay(data.total_pay_today)).catch(() => { }); };
  
  useEffect(() => { 
    Promise.all([fetchStaff(), fetchTodayPay()]).finally(() => setLoading(false));
  }, []);

 const handleAddStaff = (e) => {
    e.preventDefault();
    
    // 10-digit Phone Validation
    if (formData.mobile && !isValidPhone(formData.mobile)) {
      return alert("Mobile number strictly 10 digits ka hona chahiye.");
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    shopFetch(API_BASE_URL + '/api/staff', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(formData) 
    })
      .then(() => { 
        setFormData({ name: '', mobile: '', address: '', payment_type: 'Daily', base_salary: '' }); 
        fetchStaff(); 
        alert("Staff added successfully!"); // Success Alert
      })
      .catch(err => {
        console.error("Error adding staff:", err);
        alert("Error adding staff.");
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleAttendance = (id, status) => {
    const todayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0];
    shopFetch(`${API_BASE_URL}/api/staff/${id}/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, date: todayDate }) })
      .then(res => res.json())
      .then(() => {
        // Attendance mark hone ke baad staff list refresh karo
        fetchStaff();
      })
      .catch(err => {
        console.error("Attendance mark karne mein error:", err);
        alert("Attendance mark nahi ho paya. Dobara try karein.");
      });
  };

  const submitFinance = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    shopFetch(`${API_BASE_URL}/api/staff/${payModal.staffId}/advance_clear`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ action: payModal.action, amount: Number(payModal.amount), note: payModal.note }) 
    })
      .then(res => res.json())
      .then(() => { 
        setPayModal({ isOpen: false, staffId: null, action: '', amount: '', note: '', currentBalance: undefined });
        // Payment ke baad staff list aur today pay dono refresh karo
        return Promise.all([fetchStaff(), fetchTodayPay()]);
      })
      .catch(err => {
        console.error("Payment process mein error:", err);
        alert("Payment process fail ho gaya. Dobara try karein.");
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleEditStaff = (staff) => {
    setEditModal({ isOpen: true, staff: { ...staff } });
  };

  const submitEditStaff = (e) => {
    e.preventDefault();
    
    // 10-digit Phone Validation
    if (editModal.staff.mobile && !isValidPhone(editModal.staff.mobile)) {
      return alert("Mobile number strictly 10 digits ka hona chahiye.");
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    shopFetch(`${API_BASE_URL}/api/staff/${editModal.staff.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editModal.staff)
    })
      .then(() => {
        setEditModal({ open: false, staff: null });
        fetchStaff();
        alert("Staff updated successfully!");
      })
      .catch(err => alert("Error updating staff"))
      .finally(() => setIsSubmitting(false));
  };

  const handleViewHistory = (staff) => {
    shopFetch(`${API_BASE_URL}/api/staff/${staff.id}/history`)
      .then(res => res.json())
      .then(data => setHistoryModal({ isOpen: true, staff, logs: data }))
      .catch(() => {});
  };

  // NAYA: Staff Delete karne ka function
  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Kya aap sach me '${name}' ka poora khata hamesha ke liye delete karna chahte hain? Iska saara hisaab aur attendance mit jayega.`)) return;
    try {
      const res = await shopFetch(`${API_BASE_URL}/api/staff/${id}`, { method: 'DELETE' });
      if (res.ok) fetchStaff();
    } catch (error) {
      alert("Delete fail ho gaya. Network check karein.");
    }
  };

  // NAYA: Mark All Present function
  const handleMarkAllPresent = async () => {
    if (!window.confirm('Kya aap sabhi staff ko aaj Present mark karna chahte hain?')) return;
    const todayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0];
    
    try {
      // Mark all staff as present
      const promises = staffList.map(staff => 
        shopFetch(`${API_BASE_URL}/api/staff/${staff.id}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Present', date: todayDate })
        })
      );
      
      await Promise.all(promises);
      fetchStaff();
      fetchTodayPay();
    } catch (error) {
      alert('Kuch staff ka attendance mark nahi ho paya. Dobara try karein.');
    }
  };

  // Search Filter with stable sorting by ID to prevent card jumping
  const filteredStaff = staffList
    .filter(staff => 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (staff.mobile && staff.mobile.includes(searchQuery))
    )
    .sort((a, b) => a.id - b.id); // Stable sort by ID to prevent jumping

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="pt-2">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-1/3 mb-2 animate-pulse"></div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 md:p-8 rounded-[2.5rem] animate-pulse">
          <div className="h-8 bg-white/20 rounded-xl w-1/3"></div>
        </div>
        <SkeletonTable />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t('Staff Khata')}</h1></div>

      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 md:p-8 rounded-[2.5rem] text-white shadow-lg flex justify-between items-center">
          <div>
              <p className="text-purple-100 font-bold tracking-wide mb-1 uppercase text-xs">{t('Total Pay Given Today')}</p>
              <h3 className="text-4xl md:text-5xl font-black">₹{todayPay}</h3>
          </div>
          <Users size={48} className="text-white/30" />
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h2 className="text-xl font-extrabold mb-6 dark:text-white">{t('Register New Staff')}</h2>
        <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <UI_Input label={t('Name')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <UI_Input 
            label={t('Mobile')} 
            type="tel"
            value={formData.mobile} 
            onChange={e => setFormData({ ...formData, mobile: validatePhone(e.target.value) })} 
            placeholder="10 digit mobile number"
            maxLength="10"
          />
          <div className="md:col-span-2"><UI_Input label={t('Address')} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
          <UI_Select label={t('Pay Type')} options={[{ label: 'Daily Wage', value: 'Daily' }, { label: 'Monthly Salary', value: 'Monthly' }]} value={formData.payment_type} onChange={e => setFormData({ ...formData, payment_type: e.target.value })} />
          <UI_Input label={t('Amount (₹)')} type="number" value={formData.base_salary} onChange={e => setFormData({ ...formData, base_salary: e.target.value })} required />
          <div className="md:col-span-2"><UI_Button type="submit" variant="secondary" disabled={isSubmitting}>{isSubmitting ? t('Adding...') : t('Add Staff')}</UI_Button></div>
        </form>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{t('All Staff')}</h2>
          <div className="flex gap-3 items-center w-full md:w-auto">
            <button 
              onClick={handleMarkAllPresent}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <CheckCircle size={16} /> Mark All Present
            </button>
            <div className="relative flex-1 md:w-72">
               <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
               <input type="text" placeholder={t('Search staff name or mobile...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(staff => (
          <div key={staff.id} className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
  {staff.name}
  {staff.today_paid && (
    <CheckCircle 
      size={20} 
      className="text-emerald-500" 
      title="Aaj ka payment ho gaya hai" 
    />
  )}
</h3>
                {staff.mobile && <a href={`tel:${staff.mobile}`} className="text-blue-500 font-medium mt-1 inline-flex items-center gap-1 hover:underline">📞 {staff.mobile}</a>}
                <p className="text-zinc-500 font-medium mt-1">₹{staff.base_salary} <span className="text-xs">/{staff.payment_type === 'Daily' ? 'day' : 'mo'}</span></p>
              </div>
              
              {/* BALANCE, EDIT & DELETE BUTTONS */}
              <div className="flex flex-col items-end gap-2">
                 <div className={`px-3 py-1.5 rounded-xl font-bold text-sm ${staff.balance < 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>₹{staff.balance.toFixed(0)}</div>
                 <div className="flex gap-1">
                   <button onClick={() => handleEditStaff(staff)} className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full hover:scale-110 transition-transform opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Edit Staff">
                      <Edit2 size={16} />
                   </button>
                   <button onClick={() => handleDeleteStaff(staff.id, staff.name)} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full hover:scale-110 transition-transform opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Delete Staff">
                      <Trash2 size={16} />
                   </button>
                 </div>
              </div>
            </div>

            <div className="space-y-3 mt-2">
              {staff.today_attendance ? (
                <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-500 font-bold text-sm">{t('Attendance')}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${staff.today_attendance === 'Present' ? 'text-emerald-600' : staff.today_attendance === 'Absent' ? 'text-red-600' : 'text-orange-600'}`}>
                      {staff.today_attendance}
                    </span>
                    <button 
                      onClick={() => setStaffList(staffList.map(s => s.id === staff.id ? { ...s, today_attendance: null } : s))} 
                      className="text-blue-500 hover:text-blue-600 text-sm font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <UI_Button onClick={() => handleAttendance(staff.id, 'Present')} variant="success" className="!py-2 !text-sm flex-1">{t('Present')}</UI_Button>
                  <UI_Button onClick={() => handleAttendance(staff.id, 'Half Day')} variant="warning" className="!py-2 !text-sm flex-1">{t('Half')}</UI_Button>
                  <UI_Button onClick={() => handleAttendance(staff.id, 'Absent')} variant="danger" className="!py-2 !text-sm flex-1">{t('Absent')}</UI_Button>
                </div>
              )}
              
              <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <UI_Button onClick={() => setPayModal({isOpen: true, staffId: staff.id, action: 'advance', amount: '', note: ''})} variant="danger" className="!py-2 !text-sm flex-1">{t('Pay')}</UI_Button>
                <UI_Button onClick={() => setPayModal({isOpen: true, staffId: staff.id, action: 'clear', amount: '', note: '', currentBalance: staff.balance})} variant="outline" className="!py-2 !text-sm flex-1">{t('Settle')}</UI_Button>
                <UI_Button onClick={() => handleViewHistory(staff)} variant="secondary" className="!py-2 !text-sm flex-1"><History size={14}/> {t('Log')}</UI_Button>
              </div>
            </div>
          </div>
        ))}
        {filteredStaff.length === 0 && <p className="text-zinc-500 col-span-full">Koi staff nahi mila.</p>}
      </div>

      {payModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in">
            <button onClick={() => setPayModal({ isOpen: false, staffId: null, action: '', amount: '', note: '' })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-4 dark:text-white">{payModal.action === 'advance' ? t('Pay Staff Amount') : t('Settle Staff Dues')}</h2>

            {payModal.action === 'clear' && (
              <div className="mb-5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Current Balance</p>
                <p className={`text-3xl font-black ${payModal.currentBalance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  ₹{payModal.currentBalance}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {payModal.currentBalance < 0 ? 'Staff ko itna dena baaki hai' : 'Staff ka credit balance hai'}
                </p>
              </div>
            )}

            <form onSubmit={submitFinance} className="space-y-4">
               {payModal.action === 'advance' && (
                 <UI_Input label={t('Amount (₹)')} type="number" value={payModal.amount} onChange={e=>setPayModal({...payModal, amount: e.target.value})} required />
               )}
               {payModal.action === 'clear' && (
                 <div>
                   <UI_Input
                     label="Settle karne ki rashi (₹)"
                     type="number"
                     placeholder={`e.g. ${Math.abs(payModal.currentBalance || 0)}`}
                     value={payModal.amount}
                     onChange={e => setPayModal({...payModal, amount: e.target.value})}
                     required
                   />
                   {payModal.amount !== '' && payModal.currentBalance !== undefined && (
                     <p className="text-sm font-bold mt-2 ml-1 text-blue-600 dark:text-blue-400">
                       Settle ke baad balance: ₹{(Number(payModal.currentBalance) + Number(payModal.amount || 0)).toFixed(0)}
                     </p>
                   )}
                 </div>
               )}
               <UI_Input label={t('Note / Detail')} placeholder="settlement ka reason..." value={payModal.note} onChange={e=>setPayModal({...payModal, note: e.target.value})} />
               <div className="pt-2"><UI_Button type="submit" variant={payModal.action === 'advance' ? 'danger' : 'success'} disabled={isSubmitting}>{isSubmitting ? t('Processing...') : payModal.action === 'advance' ? t('Confirm Pay') : 'Confirm Settle'}</UI_Button></div>
            </form>
          </div>
        </div>
      )}

      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-start z-[100] p-4 overflow-y-auto pt-20" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in">
            <button onClick={() => setEditModal({ isOpen: false, staff: null })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-6 dark:text-white">{t('Edit Staff Details')}</h2>
            
            <form onSubmit={submitEditStaff} className="space-y-4">
               <UI_Input label={t('Name')} value={editModal.staff?.name || ''} onChange={e=>setEditModal({...editModal, staff: {...editModal.staff, name: e.target.value}})} required />
               <UI_Input 
                 label={t('Mobile')} 
                 type="tel"
                 value={editModal.staff?.mobile || ''} 
                 onChange={e=>setEditModal({...editModal, staff: {...editModal.staff, mobile: validatePhone(e.target.value)}})}
                 placeholder="10 digit mobile number"
                 maxLength="10"
               />
               <UI_Input label={t('Address')} value={editModal.staff?.address || ''} onChange={e=>setEditModal({...editModal, staff: {...editModal.staff, address: e.target.value}})} />
               <UI_Select label={t('Pay Type')} options={[{ label: 'Daily Wage', value: 'Daily' }, { label: 'Monthly Salary', value: 'Monthly' }]} value={editModal.staff?.payment_type || 'Daily'} onChange={e=>setEditModal({...editModal, staff: {...editModal.staff, payment_type: e.target.value}})} />
               <UI_Input label={t('Amount (₹)')} type="number" value={editModal.staff?.base_salary || ''} onChange={e=>setEditModal({...editModal, staff: {...editModal.staff, base_salary: e.target.value}})} required />
               <div className="pt-4"><UI_Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? t('Updating...') : t('Update Staff')}</UI_Button></div>
            </form>
          </div>
        </div>
      )}

      {historyModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-start z-[100] p-4 overflow-y-auto pt-20" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in flex flex-col max-h-[90vh]">
             <button onClick={() => setHistoryModal({isOpen:false, staff:null, logs:[]})} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20}/></button>
             <h2 className="text-2xl font-black mb-1 dark:text-white">{historyModal.staff.name}'s History</h2>
             <p className="text-zinc-500 mb-6 font-medium">Detailed Ledger & Attendance</p>
             <div className="overflow-y-auto flex-1 pr-2">
                <div className="space-y-3">
                   {historyModal.logs.length === 0 && <p className="text-zinc-500">{t('No records found.')}</p>}
                   {historyModal.logs.map(log => (
                      <div key={log.id} className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                         <div>
                            <p className="font-bold text-zinc-900 dark:text-white text-sm">{log.description}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{log.date}</p>
                         </div>
                         <div className="text-right">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 inline-block ${log.txn_type==='Advance'?'bg-red-100 text-red-700':log.txn_type==='Edit'?'bg-orange-100 text-orange-700':'bg-emerald-100 text-emerald-700'}`}>{log.txn_type}</span>
                            <p className="font-black dark:text-white">₹{log.amount}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- ORDERS PAGE ---
function OrdersPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentItem, setCurrentItem] = useState('');
  const [currentQty, setCurrentQty] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ customer_name: '', phone: '', address: '', delivery_date: '', total_amount: '', advance_paid: '' });
  const [deliveryModal, setDeliveryModal] = useState({ isOpen: false, order: null, paidNow: '' });
  const [searchQuery, setSearchQuery] = useState(''); 
  const navigate = useNavigate();

  const fetchOrders = () => { return shopFetch(API_BASE_URL + '/api/orders').then(res => res.json()).then(setOrders).catch(() => { }); };
  useEffect(() => { 
    Promise.all([
      fetchOrders(),
      shopFetch(API_BASE_URL + '/api/menu').then(res => res.json()).then(setMenuItems)
    ]).catch(()=>{}).finally(() => setLoading(false));
  }, []);

  const handleItemSelect = (val) => {
    setCurrentItem(val);
    const found = menuItems.find(m => m.name === val);
    if (found) setCurrentPrice(found.price);
    else setCurrentPrice('');
  };

  const addItemToOrder = () => {
    if(currentItem && currentQty && currentPrice) {
        const itemDetails = menuItems.find(m => m.name === currentItem);
        const unit = itemDetails ? itemDetails.unit : 'pc/kg';
        const addAmount = Number(currentPrice) * Number(currentQty);
        
        setSelectedItems([...selectedItems, `${currentItem} (${currentQty} ${unit}) - ₹${addAmount}`]);
        const newTotal = calculatedTotal + addAmount;
        setCalculatedTotal(newTotal);
        setFormData({...formData, total_amount: newTotal}); 
        setCurrentItem(''); setCurrentQty(''); setCurrentPrice('');
    } else {
        alert("Kripya Item Name, Qty, aur Price teeno dalein.");
    }
  };

 const handleAddOrder = async (e) => {
    e.preventDefault();
    
    if (formData.phone && !isValidPhone(formData.phone)) {
      return alert("Phone number strictly 10 digits ka hona chahiye.");
    }
    if (selectedItems.length === 0) {
      return alert("Kripya kam se kam ek item add karein.");
    }
    if (!formData.delivery_date) {
      return alert("Delivery date select karein.");
    }
    if (!formData.total_amount || Number(formData.total_amount) <= 0) {
      return alert("Total amount enter karein.");
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    const orderData = {
      customer_name: formData.customer_name,
      phone: formData.phone || '',
      address: formData.address || '',
      delivery_date: formData.delivery_date,
      total_amount: Number(formData.total_amount),
      advance_paid: Number(formData.advance_paid) || 0,
      discount: 0,
      items_details: selectedItems.join(', '),
    };

    try {
      const res = await shopFetch(API_BASE_URL + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${res.status}`);
      }
      setFormData({ customer_name: '', phone: '', address: '', delivery_date: '', total_amount: '', advance_paid: '' });
      setSelectedItems([]);
      setCalculatedTotal(0);
      fetchOrders();
      alert("Order successfully book ho gaya!");
    } catch (err) {
      alert("Order save nahi hua: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    shopFetch(`${API_BASE_URL}/api/orders/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }).then(fetchOrders);
  };

  // NAYA: Order Cancel/Delete karne ka function
  const handleDeleteOrder = async (id, customerName) => {
    if (!window.confirm(`Kya aap sach me '${customerName}' ka order cancel/delete karna chahte hain?`)) return;
    try {
      const res = await shopFetch(`${API_BASE_URL}/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) fetchOrders();
    } catch (error) {
      alert("Order delete fail ho gaya. Network check karein.");
    }
  };

  const confirmDelivery = (action) => {
    // Fix: Convert empty paidNow to 0
    const paidNow = deliveryModal.paidNow === '' || deliveryModal.paidNow === null ? 0 : Number(deliveryModal.paidNow);
    
    shopFetch(`${API_BASE_URL}/api/orders/${deliveryModal.order.id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Delivered', paid_now: paidNow, action: action })
    }).then(() => { 
       setDeliveryModal({ isOpen: false, order: null, paidNow: '' }); 
       if (action === 'udhari') navigate('/debt'); else fetchOrders(); 
    });
  };

  const printBill = async (order) => {
    let s = { shop_name: 'SweetCraft', tagline: 'Premium Sweets & Snacks', phone: '', phone2: '', address: 'Main Market', city: 'Deoghar, Jharkhand', footer_note: 'धन्यवाद! पुनः पधारें।', gstin: '', upi_id: '' };
    try { const r = await shopFetch(`${API_BASE_URL}/api/settings`); if (r.ok) s = { ...s, ...(await r.json()) }; } catch(e) {}

    // Items parse karo - "Name xQty @Rate" format try karo, warna sirf name
    const rawItems = order.items_details.split(',').map(i => i.trim()).filter(Boolean);
    const itemRows = rawItems.map((itm, idx) => {
      // App ka format: "ItemName (Qty Unit) - ₹TotalAmount"
      // e.g. "एनी (20 pc/kg) - ₹200"  or  "Kaju Katli (2 kg) - ₹1600"
      const appFmt = itm.match(/^(.+?)\s*\((\d+\.?\d*)\s*([^)]*)\)\s*-\s*[₹Rs.]*\s*(\d+\.?\d*)$/);
      if (appFmt) {
        const name = appFmt[1].trim();
        const qty  = appFmt[2];
        const unit = appFmt[3].trim();
        const totalAmt = appFmt[4];
        // Rate = totalAmt / qty
        const rate = qty && parseFloat(qty) > 0
          ? (parseFloat(totalAmt) / parseFloat(qty)).toFixed(0)
          : '';
        return { sn: String(idx + 1).padStart(2, '0'), name: `${name} (${unit})`, qty, rate, amt: totalAmt };
      }
      // Fallback formats: "Name xQty @Rate" or plain name
      const xFmt = itm.match(/^(.+?)\s*[xX×]\s*(\d+\.?\d*)\s*(?:@\s*(\d+\.?\d*))?$/);
      if (xFmt) {
        const qty = xFmt[2], rate = xFmt[3] || '';
        return { sn: String(idx + 1).padStart(2, '0'), name: xFmt[1].trim(), qty, rate,
          amt: (qty && rate) ? (parseFloat(qty) * parseFloat(rate)).toFixed(0) : '' };
      }
      return { sn: String(idx + 1).padStart(2, '0'), name: itm, qty: '', rate: '', amt: '' };
    });

    const due = order.total_amount - order.advance_paid - (order.discount || 0);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <meta charset="UTF-8"/>
          <title>कैश मेमो - ${order.customer_name}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com"/>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700;900&display=swap"/>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Noto Sans Devanagari', 'Mangal', Arial, sans-serif;
              color: #000;
              background: #fff;
              padding: 12px;
              max-width: 680px;
              margin: auto;
              font-size: 13px;
            }
            /* ── HEADER ── */
            .top-label { text-align: center; font-size: 11px; letter-spacing: 2px; margin-bottom: 4px; }
            .shop-header { display: flex; align-items: center; justify-content: center; gap: 10px; border-top: 3px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin-bottom: 4px; }
            .shop-name-box { background: #000; color: #fff; font-size: 26px; font-weight: 900; padding: 2px 12px; letter-spacing: -1px; }
            .shop-name-rest { font-size: 26px; font-weight: 900; }
            .shop-sub { text-align: center; font-size: 11px; color: #333; padding: 3px 0; border-bottom: 2px solid #000; }
            .invoice-row { display: flex; justify-content: space-between; padding: 5px 2px; border-bottom: 1px solid #000; font-size: 12px; }
            /* ── CUSTOMER INFO ── */
            .info-section { border: 1px solid #000; padding: 6px 8px; margin: 6px 0; }
            .info-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; font-size: 12px; }
            .info-row:last-child { margin-bottom: 0; }
            .info-label { font-weight: 700; white-space: nowrap; min-width: 70px; }
            .info-dots { flex: 1; border-bottom: 1px dotted #555; min-width: 40px; height: 14px; }
            .info-value { font-size: 12px; min-width: 60px; }
            /* ── ITEMS TABLE ── */
            table { width: 100%; border-collapse: collapse; margin: 6px 0; }
            thead tr { background: #000; color: #fff; }
            thead th { padding: 5px 4px; font-size: 12px; font-weight: 700; text-align: center; border: 1px solid #000; }
            thead th.left { text-align: left; }
            tbody tr td { border: 1px solid #000; padding: 5px 4px; font-size: 12px; vertical-align: middle; }
            tbody tr td.center { text-align: center; }
            tbody tr td.right { text-align: right; }
            tbody tr td.sn { text-align: center; width: 32px; font-weight: 700; }
            .empty-row td { height: 22px; }
            /* ── TOTALS ── */
            .totals-wrap { display: flex; justify-content: flex-end; margin-top: 4px; }
            .totals-table { border-collapse: collapse; min-width: 220px; }
            .totals-table td { border: 1px solid #000; padding: 5px 10px; font-size: 13px; }
            .totals-table td.label { font-weight: 700; text-align: left; background: #f5f5f5; }
            .totals-table td.value { text-align: right; font-weight: 700; min-width: 90px; }
            .totals-table tr.due td { font-size: 15px; font-weight: 900; }
            /* ── FOOTER ── */
            .footer { text-align: center; margin-top: 14px; padding-top: 8px; border-top: 2px solid #000; font-size: 11px; color: #333; }
            @media print {
              body { padding: 4px; }
              @page { margin: 8mm; }
            }
          </style>
        </head>
        <body>
          <p class="top-label">कैश मेमो</p>

          <div class="shop-header">
            <span class="shop-name-box">${s.shop_name.split(' ')[0]}</span>
            <span class="shop-name-rest">${s.shop_name.split(' ').slice(1).join(' ') || s.tagline}</span>
          </div>

          <div class="shop-sub">
            ${s.address}, ${s.city} &nbsp;|&nbsp; मोब: ${s.phone}${s.phone2 ? ' / ' + s.phone2 : ''}
            ${s.gstin ? `&nbsp;|&nbsp; GSTIN: ${s.gstin}` : ''}
          </div>

          <div class="invoice-row">
            <span><strong>बिल नं.&nbsp;-&nbsp;</strong>${order.id}</span>
            <span><strong>दिनांक:&nbsp;</strong>${new Date(order.delivery_date).toLocaleDateString('hi-IN', { day:'2-digit', month:'2-digit', year:'numeric' })}</span>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">श्री/श्रीमती :</span>
              <span class="info-value">${order.customer_name}</span>
              <span class="info-dots"></span>
            </div>
            <div class="info-row">
              <span class="info-label">पता :</span>
              <span class="info-value">${order.address || ''}</span>
              <span class="info-dots"></span>
            </div>
            <div class="info-row">
              <span class="info-label">मोबाइल :</span>
              <span class="info-value">${order.phone || ''}</span>
              <span class="info-dots" style="max-width:120px"></span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:36px">क्र.</th>
                <th class="left" style="width:auto">विवरण (Particulars)</th>
                <th style="width:52px">मात्रा</th>
                <th style="width:60px">दर (₹)</th>
                <th style="width:72px">राशि (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows.map(r => `
                <tr>
                  <td class="sn">${r.sn}</td>
                  <td>${r.name}</td>
                  <td class="center">${r.qty}</td>
                  <td class="right">${r.rate}</td>
                  <td class="right">${r.amt}</td>
                </tr>
              `).join('')}
              ${Array.from({ length: Math.max(0, 10 - itemRows.length) }).map(() => `
                <tr class="empty-row">
                  <td></td><td></td><td></td><td></td><td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-wrap">
            <table class="totals-table">
              <tr>
                <td class="label">कुल (Total)</td>
                <td class="value">₹ ${order.total_amount}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td class="label">छूट (Discount)</td>
                <td class="value" style="color:#059669">- ₹ ${order.discount}</td>
              </tr>` : ''}
              <tr>
                <td class="label">अग्रिम (Adv.)</td>
                <td class="value">₹ ${order.advance_paid}</td>
              </tr>
              <tr class="due">
                <td class="label">बकाया (Dues)</td>
                <td class="value">₹ ${due < 0 ? 0 : due}</td>
              </tr>
            </table>
          </div>

          ${s.upi_id && due > 0 ? `
          <div style="text-align:center;margin-top:10px">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=${s.upi_id}&pn=${s.shop_name}&am=${due}&cu=INR`)}" alt="UPI QR"/>
            <p style="font-size:10px;margin-top:3px">UPI से भुगतान करें: ${s.upi_id}</p>
          </div>` : ''}

          <div class="footer">
            <strong>${s.footer_note}</strong>
            <p style="margin-top:5px;font-size:10px;letter-spacing:1px">Powered by Poddar Solutions</p>
          </div>

          <script>
            document.fonts.ready.then(() => { setTimeout(() => { window.print(); }, 400); });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareWhatsapp = async (order) => {
      let s = { shop_name: 'SweetCraft', tagline: 'Premium Sweets & Snacks', phone: '' };
      try { const r = await shopFetch(`${API_BASE_URL}/api/settings`); if (r.ok) s = { ...s, ...(await r.json()) }; } catch(e) {}
      
      const itemsList = order.items_details.split(',').map((itm, i) => `  ${i+1}. ${itm.trim()}`).join('\n');
      const text = `*${s.shop_name}*\n_${s.tagline}_\n📞 ${s.phone}\n----------------------------------\n*🧾 INVOICE / BILL*\nOrder No: #${order.id}\nCustomer: ${order.customer_name}\nDelivery: ${order.delivery_date}\n\n*Item Details:*\n${itemsList}\n\n----------------------------------\n*💰 Bill Summary*\nTotal Amount : ₹${order.total_amount}\nAdvance Paid : ₹${order.advance_paid}\n*Due Amount   : ₹${order.total_amount - order.advance_paid}*\n----------------------------------\nThank you for choosing us! 🙏`;
      
      window.open(`https://wa.me/91${order.phone || ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Search Filter
  const filteredOrders = orders.filter(o => 
    o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (o.phone && o.phone.includes(searchQuery)) ||
    o.items_details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="pt-2">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-1/3 mb-2 animate-pulse"></div>
        </div>
        <SkeletonTable />
        <SkeletonList />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t('Party Orders')}</h1></div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h2 className="text-xl font-extrabold mb-6 dark:text-white">{t('Book New Order')}</h2>
        <form onSubmit={handleAddOrder} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <UI_Input label={t('Customer Name')} value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} required />
          <UI_Input 
            label={t('Phone')} 
            type="tel"
            value={formData.phone} 
            onChange={e => setFormData({ ...formData, phone: validatePhone(e.target.value) })} 
            placeholder="10 digit mobile number"
            maxLength="10"
            required 
          />
          <div className="md:col-span-2"><UI_Input label={t('Address')} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
          <UI_Input 
  label={t('Delivery Date')} 
  type="date" 
  value={formData.delivery_date} 
  onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} 
  min={new Date().toISOString().split("T")[0]} 
  required 
/>
          <div className="lg:col-span-3 flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full">
                <UI_Input label={t('Search/Select Menu Item (Or type custom)')} list="order-menu-items" placeholder="Search item..." value={currentItem} onChange={e=>handleItemSelect(e.target.value)} />
                <datalist id="order-menu-items">
                    {menuItems.map(m => <option key={m.id} value={m.name} />)}
                </datalist>
             </div>
             <div className="w-full md:w-28"><UI_Input label={t('Price/Unit')} type="number" value={currentPrice} onChange={e=>setCurrentPrice(e.target.value)} placeholder="₹" /></div>
             <div className="w-full md:w-28"><UI_Input label={t('Qty')} type="number" value={currentQty} onChange={e=>setCurrentQty(e.target.value)} /></div>
             <UI_Button onClick={addItemToOrder} variant="secondary" className="!w-full md:!w-auto h-[50px]"><Package size={18}/> {t('Add Item')}</UI_Button>
          </div>

          {selectedItems.length > 0 && (
              <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                     <strong className="text-purple-600 dark:text-purple-400">{t('Order Items:')}</strong>
                     <strong className="text-zinc-600 dark:text-zinc-300">Sum Total: ₹{calculatedTotal}</strong>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedItems.map((itm, i) => (
                       <div key={i} className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg font-semibold shadow-sm border border-zinc-100 dark:border-zinc-800 flex justify-between items-center gap-2">
                           <span className="flex-1">{itm.split(' - ')[0]}</span>
                           <span className="text-purple-600 dark:text-purple-400">{itm.split(' - ')[1]}</span>
                           <button type="button" onClick={() => {
                             const itemAmt = Number(itm.split('₹')[1]);
                             const newItems = selectedItems.filter((_, idx) => idx !== i);
                             const newTotal = calculatedTotal - itemAmt;
                             setSelectedItems(newItems);
                             setCalculatedTotal(newTotal);
                             setFormData(prev => ({...prev, total_amount: newTotal}));
                           }} className="p-1 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-lg hover:scale-110 transition-transform flex-shrink-0">
                             <Trash2 size={14} />
                           </button>
                       </div>
                    ))}
                  </div>
              </div>
          )}

          <div className="w-full relative">
             <UI_Input label={t('Final Total Cost (₹)')} type="number" value={formData.total_amount} onChange={e => setFormData({ ...formData, total_amount: e.target.value })} required />
             {calculatedTotal > Number(formData.total_amount) && formData.total_amount !== '' && (
                 <span className="absolute -bottom-5 left-1 text-xs font-bold text-emerald-500">Discount Added: ₹{calculatedTotal - formData.total_amount}</span>
             )}
          </div>
          <UI_Input label={t('Advance Paid (₹)')} type="number" value={formData.advance_paid} onChange={e => setFormData({ ...formData, advance_paid: e.target.value })} />
          <div className="md:col-span-2"><UI_Button type="submit" variant="primary">{t('Book Order')}</UI_Button></div>
        </form>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{t('Pending & In Progress')}</h2>
          <div className="relative w-full md:w-72">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
             <input type="text" placeholder={t('Search customer, phone or item...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
          </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {filteredOrders.filter(o => o.status !== 'Delivered').map(order => (
          <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-[1.5rem] p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4 relative overflow-hidden group">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.status === 'Pending' ? 'bg-orange-400' : 'bg-blue-500'}`}></div>
            <div className="pl-3 flex-1 flex flex-col md:flex-row gap-4 w-full">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold dark:text-white">{order.customer_name}</h3>
                  <div className="flex gap-2 mb-2 md:mb-0">
                     <button onClick={()=>printBill(order)} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 rounded-lg hover:scale-105 transition" title="Print Bill"><Printer size={16}/></button>
                     <button onClick={()=>shareWhatsapp(order)} className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:scale-105 transition" title="Share on WhatsApp"><MessageCircle size={16}/></button>
                     <button onClick={() => handleDeleteOrder(order.id, order.customer_name)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:scale-105 transition opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Delete/Cancel Order"><Trash2 size={16}/></button>
                  </div>
                </div>
                <p className="text-sm text-zinc-500 font-medium">📞 {order.phone} • <Clock size={12} className="inline mb-0.5" /> Delivers {order.delivery_date}</p>
                <div className="text-zinc-700 dark:text-zinc-300 font-medium text-sm mt-2 p-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl">{order.items_details.split(',').map((it,i)=><div key={i}>• {it}</div>)}</div>
              </div>
              <div className="flex flex-col md:items-end justify-center min-w-[120px]">
                <span className={`text-xs font-bold px-3 py-1 rounded-xl mb-2 w-max ${order.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                <p className="font-black text-lg dark:text-white">Total: ₹{order.total_amount}</p>
                {order.discount > 0 && <p className="text-emerald-500 font-bold text-xs">Discount: ₹{order.discount}</p>}
                <p className="text-red-500 font-bold text-xs">Due: ₹{order.total_amount - order.advance_paid}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto md:flex-col justify-center border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800 pt-3 md:pt-0 md:pl-3">
              {order.status === 'Pending' && <UI_Button onClick={() => handleStatusChange(order.id, 'In Progress')} variant="success" className="!py-2 !px-4"><ArrowUpRight size={16}/> {t('Start')}</UI_Button>}
              {order.status === 'In Progress' && <UI_Button onClick={() => setDeliveryModal({ isOpen: true, order, paidNow: order.total_amount - order.advance_paid })} variant="secondary" className="bg-zinc-900 text-white !py-2 !px-4"><CheckCircle size={16}/> {t('Deliver')}</UI_Button>}
            </div>
          </div>
        ))}
        {filteredOrders.filter(o => o.status !== 'Delivered').length === 0 && <p className="text-zinc-500 p-4">{t('No pending orders match your search.')}</p>}
      </div>

      <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-8 mb-4">{t('Delivered Orders')}</h2>
      <div className="flex flex-col gap-4">
        {filteredOrders.filter(o => o.status === 'Delivered').map(order => (
          <div key={order.id} className="bg-zinc-50 dark:bg-zinc-900/50 opacity-75 hover:opacity-100 transition-opacity rounded-[1.5rem] p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
            <div className="pl-3 flex-1 flex flex-col md:flex-row gap-4 md:items-center w-full">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold dark:text-white">{order.customer_name} <span className="text-emerald-600 text-xs ml-2"><CheckCircle size={14} className="inline" /> {t('Delivered')}</span></h3>
                    <div className="flex gap-2 ml-2">
                       <button onClick={()=>printBill(order)} className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition" title="Print Bill"><Printer size={14}/></button>
                       <button onClick={()=>shareWhatsapp(order)} className="p-1.5 text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition" title="Share on WhatsApp"><MessageCircle size={14}/></button>
                    </div>
                </div>
                <p className="text-sm text-zinc-500 font-medium mt-1">📞 {order.phone} • {order.items_details}</p>
              </div>
              <div className="flex flex-col md:items-end justify-center min-w-[120px] mt-2 md:mt-0">
                <p className="font-black text-lg dark:text-white">Total: ₹{order.total_amount}</p>
                {order.discount > 0 ? <p className="text-emerald-500 font-bold text-xs">Discount/Saved: ₹{order.discount}</p> : null}
                {order.is_due_cleared ? <p className="text-emerald-500 font-bold text-xs">{t('Dues Cleared')}</p> : <p className="text-orange-500 font-bold text-xs">{t('Due in Udhari')}</p>}
              </div>
            </div>
            {/* Delivered Order Delete Button (Optional, agar isko bhi delete karna ho) */}
            <div className="hidden md:flex flex-col justify-center border-l border-zinc-200 dark:border-zinc-800 pl-3">
                <button onClick={() => handleDeleteOrder(order.id, order.customer_name)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition opacity-0 group-hover:opacity-100" title="Delete Log"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {filteredOrders.filter(o => o.status === 'Delivered').length === 0 && <p className="text-zinc-500 p-4">{t('No delivered orders match your search.')}</p>}
      </div>

      {deliveryModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-start z-[100] p-4 overflow-y-auto pt-20" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in">
            <button onClick={() => setDeliveryModal({ isOpen: false })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-1 dark:text-white">{t('Complete Order')}</h2>
            <p className="text-zinc-500 mb-6 font-medium">Customer: <span className="text-zinc-900 dark:text-white">{deliveryModal.order.customer_name}</span></p>

            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl mb-6">
              <p className="text-red-700 dark:text-red-400 font-bold">Total Due: ₹{deliveryModal.order.total_amount - deliveryModal.order.advance_paid}</p>
            </div>

            <div className="mb-6">
              <UI_Input label={t('Amount Received Now (₹)')} type="number" value={deliveryModal.paidNow} onChange={e => setDeliveryModal({ ...deliveryModal, paidNow: e.target.value })} />
            </div>

            <div className="flex gap-3">
              <UI_Button onClick={() => confirmDelivery('settle')} variant="success" className="flex-1">{t('Complete')}</UI_Button>
              <UI_Button onClick={() => confirmDelivery('udhari')} variant="warning" className="flex-1">{t('To Udhari')}</UI_Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- DEBT PAGE ---
function DebtPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  
  const [txnModal, setTxnModal] = useState({ isOpen: false, customerId: null, action: '', amount: '' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentItem, setCurrentItem] = useState('');
  const [currentQty, setCurrentQty] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  const [historyModal, setHistoryModal] = useState({ isOpen: false, customer: null, logs: [] });
  const [searchQuery, setSearchQuery] = useState(''); 
  const [totalUdhari, setTotalUdhari] = useState(0);
  const [todayUdhari, setTodayUdhari] = useState(0);

  const fetchCustomers = () => { 
      return shopFetch(API_BASE_URL + '/api/customers')
      .then(res => res.json())
      .then(data => {
          if (data.customers) {
              setCustomers(data.customers);
              setTodayUdhari(data.today_udhar || 0);
              setTotalUdhari(data.total_udhar || 0);
          } else {
              setCustomers(data);
          }
      }).catch(() => { }); 
  };
  useEffect(() => { 
      Promise.all([
        fetchCustomers(),
        shopFetch(API_BASE_URL + '/api/menu').then(res => res.json()).then(setMenuItems)
      ]).catch(()=>{}).finally(() => setLoading(false));
  }, []);

  const handleAddCustomer = (e) => {
    e.preventDefault();
    shopFetch(API_BASE_URL + '/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      .then(() => { setFormData({ name: '', phone: '', address: '' }); fetchCustomers(); });
  };

  // NAYA: Customer Delete karne ka function
  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Kya aap sach me '${name}' ka poora khata hamesha ke liye delete karna chahte hain? Iska saara hisaab mit jayega.`)) return;
    try {
      const res = await shopFetch(`${API_BASE_URL}/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCustomers();
    } catch (error) {
      alert("Delete fail ho gaya. Network check karein.");
    }
  };

  const handleItemSelect = (val) => {
    setCurrentItem(val);
    const found = menuItems.find(m => m.name === val);
    if (found) setCurrentPrice(found.price);
    else setCurrentPrice('');
  };

  const addItemToUdhar = () => {
    if(currentItem && currentQty && currentPrice) {
        const itemDetails = menuItems.find(m => m.name === currentItem);
        const unit = itemDetails ? itemDetails.unit : 'pc/kg';
        const addAmount = Number(currentPrice) * Number(currentQty);
        
        setSelectedItems([...selectedItems, `${currentItem} (${currentQty} ${unit}) - ₹${addAmount}`]);
        const newTotal = calculatedTotal + addAmount;
        setCalculatedTotal(newTotal);
        setTxnModal({...txnModal, amount: newTotal});
        setCurrentItem(''); setCurrentQty(''); setCurrentPrice('');
    } else {
        alert("Kripya Item Name, Qty, aur Price teeno dalein.");
    }
  };

  const submitTransaction = (e) => {
    e.preventDefault();
    const finalItemsDetails = selectedItems.length > 0 ? selectedItems.join(', ') : 'Cash/Other Adjustment';
    
    shopFetch(`${API_BASE_URL}/api/customers/${txnModal.customerId}/transaction`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ action: txnModal.action, amount: Number(txnModal.amount), items_details: finalItemsDetails }) 
    }).then(() => {
        setTxnModal({ isOpen: false, customerId: null, action: '', amount: '' });
        setSelectedItems([]);
        setCalculatedTotal(0);
        fetchCustomers();
    });
  };

  const openTxnModal = (customerId, action) => {
      setTxnModal({ isOpen: true, customerId, action, amount: '' });
      setSelectedItems([]);
      setCalculatedTotal(0);
  };

  const handleViewHistory = (customer) => {
    shopFetch(`${API_BASE_URL}/api/customers/${customer.id}/history`)
      .then(res => res.json())
      .then(data => setHistoryModal({ isOpen: true, customer, logs: data }))
      .catch(() => {});
  };

  // Search Filter
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.phone && c.phone.includes(searchQuery))
  );

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="pt-2">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-1/3 mb-2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl h-24"></div>
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl h-24"></div>
        </div>
        <SkeletonTable />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t('Market Udhari')}</h1></div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col items-end">
        <div className="w-full flex justify-between items-center mb-6 gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl flex-1 border border-orange-100 dark:border-orange-900/30">
               <p className="text-orange-600 dark:text-orange-400 font-bold uppercase text-xs tracking-wider mb-1">Aaj Ki Udhari Di Gayi</p>
               <h3 className="text-2xl font-black text-orange-700 dark:text-orange-300">₹{todayUdhari}</h3>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl flex-1 border border-red-100 dark:border-red-900/30">
               <p className="text-red-600 dark:text-red-400 font-bold uppercase text-xs tracking-wider mb-1">Total Market Udhari</p>
               <h3 className="text-2xl font-black text-red-700 dark:text-red-300">₹{totalUdhari}</h3>
            </div>
        </div>

        <form onSubmit={handleAddCustomer} className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-end w-full">
          <UI_Input label={t('Customer Name')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <UI_Input 
            label={t('Phone')} 
            type="tel"
            value={formData.phone} 
            onChange={e => setFormData({ ...formData, phone: validatePhone(e.target.value) })} 
            placeholder="10 digit mobile number"
            maxLength="10"
            required 
          />
          <UI_Input label={t('Address')} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          <UI_Button type="submit" variant="secondary">{t('Add Khata')}</UI_Button>
        </form>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{t('Udhari List')}</h2>
          <div className="relative w-full md:w-72">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
             <input type="text" placeholder={t('Search customer or phone...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(c => (
          <div key={c.id} className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between group">
            <div>
              {/* NAYA: Delete Button Header me add kar diya */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-2xl dark:text-white mb-1">{c.name}</h3>
                  <p className="text-sm text-zinc-500 font-medium mb-4">📞 {c.phone}</p>
                </div>
                <button onClick={() => handleDeleteCustomer(c.id, c.name)} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full hover:scale-110 transition-transform opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Delete Khata">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl mb-6 flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 font-bold">{t('Total Due')}</span>
                <span className={`px-4 py-2 rounded-xl font-bold ${c.balance > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  ₹{c.balance}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <UI_Button onClick={() => openTxnModal(c.id, 'give_udhar')} variant="danger" className="!py-2.5 !text-sm flex-1 bg-red-50 text-red-600"><ArrowUpRight size={16} /> {t('Udhar')}</UI_Button>
              <UI_Button onClick={() => openTxnModal(c.id, 'receive_payment')} variant="success" className="!py-2.5 !text-sm flex-1"><ArrowDownRight size={16} /> {t('Jama')}</UI_Button>
              <UI_Button onClick={() => handleViewHistory(c)} variant="secondary" className="!py-2.5 !text-sm flex-[0.5]" title="View History"><History size={16}/></UI_Button>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && <p className="text-zinc-500 col-span-full">Koi customer nahi mila.</p>}
      </div>

      {/* Transaction Modal */}
      {txnModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start p-4 overflow-y-auto pt-20 backdrop-blur-md bg-black/70" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setTxnModal({ isOpen: false, customerId: null, action: '', amount: '' })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-6 dark:text-white">{txnModal.action === 'give_udhar' ? 'Naya Udhar Bill' : 'Payment Receive'}</h2>
            
            <form onSubmit={submitTransaction} className="space-y-4">
               {txnModal.action === 'give_udhar' && (
                 <>
                   <div className="flex flex-col md:flex-row gap-3 items-end">
                     <div className="flex-1 w-full">
                         <UI_Input label={t('Search/Select Item (Or custom)')} list="udhar-menu-items" placeholder="Search item..." value={currentItem} onChange={e=>handleItemSelect(e.target.value)} />
                         <datalist id="udhar-menu-items">
                             {menuItems.map(m => <option key={m.id} value={m.name} />)}
                         </datalist>
                     </div>
                     <div className="w-full md:w-20"><UI_Input label="Price" type="number" value={currentPrice} onChange={e=>setCurrentPrice(e.target.value)} placeholder="₹" /></div>
                     <div className="w-full md:w-20"><UI_Input label={t('Qty')} type="number" value={currentQty} onChange={e=>setCurrentQty(e.target.value)} /></div>
                     <UI_Button onClick={addItemToUdhar} variant="secondary" className="!w-full md:!w-auto h-[50px]"><Package size={18}/> {t('Add')}</UI_Button>
                   </div>
                   
                   {selectedItems.length > 0 && (
                      <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800">
                          <strong className="text-purple-600 dark:text-purple-400 block mb-2">Udhar Items (Sum: ₹{calculatedTotal}):</strong> 
                          <div className="flex flex-col gap-2">
                             {selectedItems.map((itm, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg font-semibold shadow-sm border border-zinc-100 dark:border-zinc-800 flex justify-between items-center gap-2">
                                  <span className="flex-1 text-sm">{itm}</span>
                                  <button type="button" onClick={() => {
                                    const parts = itm.split('₹');
                                    const amt = parts.length > 1 ? Number(parts[parts.length-1]) : 0;
                                    const newItems = selectedItems.filter((_, idx) => idx !== i);
                                    const newTotal = calculatedTotal - amt;
                                    setSelectedItems(newItems);
                                    setCalculatedTotal(newTotal);
                                    setTxnModal(prev => ({...prev, amount: newTotal}));
                                  }} className="p-1 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-lg hover:scale-110 transition-transform flex-shrink-0">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                             ))}
                           </div>
                      </div>
                   )}
                 </>
               )}
               
               <UI_Input label={txnModal.action === 'give_udhar' ? "Final Amount (Edit to round off)" : "Received Amount (₹)"} type="number" value={txnModal.amount} onChange={e=>setTxnModal({...txnModal, amount: e.target.value})} required />
               <div className="pt-4"><UI_Button type="submit" variant={txnModal.action === 'give_udhar' ? 'danger' : 'success'}>{t('Confirm Transaction')}</UI_Button></div>
            </form>
          </div>
        </div>
      )}

      {historyModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start p-4 overflow-y-auto pt-20 backdrop-blur-md bg-black/70" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in flex flex-col max-h-[90vh]">
             <button onClick={() => setHistoryModal({isOpen:false, customer:null, logs:[]})} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20}/></button>
             <h2 className="text-2xl font-black mb-1 dark:text-white">{historyModal.customer.name}'s Ledger</h2>
             <p className="text-zinc-500 mb-6 font-medium">{t('Udhari aur Payment ki details')}</p>
             <div className="overflow-y-auto flex-1 pr-2">
                <div className="space-y-3">
                   {historyModal.logs.length === 0 && <p className="text-zinc-500">{t('No records found.')}</p>}
                   {historyModal.logs.map(log => (
                      <div key={log.id} className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-start gap-4">
                         <div className="flex-1">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1.5 inline-block ${log.txn_type.includes('Udhar') || log.txn_type.includes('Due') ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{log.txn_type}</span>
                            <p className="font-bold text-zinc-900 dark:text-white text-sm mt-1">{log.items_details}</p>
                            <p className="text-xs text-zinc-500 mt-1"><Clock size={10} className="inline mb-0.5"/> {log.date}</p>
                         </div>
                         <div className="text-right">
                            <p className={`font-black text-lg ${log.txn_type.includes('Udhar') || log.txn_type.includes('Due') ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                               {log.txn_type.includes('Udhar') || log.txn_type.includes('Due') ? '+' : '-'} ₹{log.amount}
                            </p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- REPORTS PAGE ---
function ReportsPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState({ inventory: [], returns: [], staff: [], customers: [], incomes: [], principles: [], expenses: [] });
  const [activeTab, setActiveTab] = useState('incomes');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({ total_income: 0, total_cash: 0, total_online: 0, total_expense: 0, total_staff_pay: 0, total_principle: 0, net_income: 0 });
  const [editModal, setEditModal] = useState({ isOpen: false, type: null, row: null });
  const [shopSettings, setShopSettings] = useState({ shop_name: localStorage.getItem('shop_name') || 'SweetCraft', tagline: '', phone: '', address: '' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchReports = (date) => {
    const url = date ? `${API_BASE_URL}/api/reports?date=${date}` : `${API_BASE_URL}/api/reports`;
    shopFetch(url).then(res => res.json()).then(setReports).catch(() => { });
  };

  const fetchStats = (date) => {
    const url = date ? `${API_BASE_URL}/api/dashboard/stats?date=${date}` : `${API_BASE_URL}/api/dashboard/stats`;
    shopFetch(url).then(res => res.json()).then(setStats).catch(() => { });
  };

  useEffect(() => { 
    fetchReports(selectedDate); 
    fetchStats(selectedDate);
    shopFetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).then(d => {
      if (d.shop_name) setShopSettings(d);
    }).catch(() => {});
  }, [selectedDate]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setCurrentPage(1);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    const { type, row } = editModal;
    let endpoint;
    if (type === 'income') endpoint = `/api/income/${row.id}`;
    else if (type === 'principle') endpoint = `/api/principle/${row.id}`;
    else if (type === 'staff') endpoint = `/api/staff/ledger/${row.id}`;
    await shopFetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
    setEditModal({ isOpen: false, type: null, row: null });
    fetchReports(selectedDate);
    fetchStats(selectedDate);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Kya aap is entry ko delete karna chahte hain?')) return;
    let endpoint;
    if (type === 'income') endpoint = `/api/income/${id}`;
    else if (type === 'principle') endpoint = `/api/principle/${id}`;
    else if (type === 'staff') endpoint = `/api/staff/ledger/${id}`;
    await shopFetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE' });
    fetchReports(selectedDate);
    fetchStats(selectedDate);
  };

  const handleDownloadPDF = async (e) => {
    const button = e.currentTarget;
    button.disabled = true;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<span>Generating PDF...</span>';
    try {
      await new Promise(r => setTimeout(r, 200));

      // ── Noto Sans font fetch & embed for Hindi support ───────
      // jsPDF default Helvetica Hindi render nahi kar sakta
      // Hum ek clean HTML window mein render karke canvas se PDF banate hain
      // lekin Tailwind oklch issue se bachne ke liye apna isolated HTML use karte hain

      const netSale = stats.net_income;
      const totalIncome = stats.total_principle - stats.total_income;
      const isProfit = totalIncome >= 0;
      const cashInHand = stats.total_income + stats.total_principle;

      // Build complete self-contained HTML for PDF
      const incomeRows = (reports.incomes || []).map((r,i) => `
        <tr style="background:${i%2===1?'#f9fafb':'#fff'}">
          <td>${r.payment_mode||'-'}</td><td>${r.description||'-'}</td>
          <td style="text-align:right;font-weight:700">Rs.${r.amount}</td>
          <td style="color:#666">${r.date.split(' ').slice(1).join(' ')}</td>
        </tr>`).join('');

      const expenseRows = (reports.expenses || []).map((r,i) => `
        <tr style="background:${i%2===1?'#f9fafb':'#fff'}">
          <td>${r.item_name||'-'}</td>
          <td>${r.mahajan?`${r.mahajan} (${r.status})`:r.status||'-'}</td>
          <td style="text-align:right;font-weight:700">Rs.${r.amount}</td>
          <td style="color:#666">${r.date.split(' ').slice(1).join(' ')}</td>
        </tr>`).join('');

      const staffAdv = (reports.staff||[]).filter(r=>r.txn_type==='Advance'||r.txn_type==='Settle');
      const staffRows = staffAdv.map((r,i) => `
        <tr style="background:${i%2===1?'#f9fafb':'#fff'}">
          <td>${r.staff_name||'-'}</td><td>${r.description||'-'}</td>
          <td>${r.txn_type}</td>
          <td style="text-align:right;font-weight:700">Rs.${r.amount}</td>
          <td style="color:#666">${r.date.split(' ').slice(1).join(' ')}</td>
        </tr>`).join('');

      const principleRows = (reports.principles||[]).map((r,i) => `
        <tr style="background:${i%2===1?'#f9fafb':'#fff'}">
          <td style="text-align:right;font-weight:700">Rs.${r.amount}</td>
          <td>${r.description||'-'}</td>
          <td style="color:#666">${r.date.split(' ').slice(1).join(' ')}</td>
        </tr>`).join('');

      const dateStr = new Date(selectedDate+'T00:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Noto Sans Devanagari', Arial, Helvetica, sans-serif;
            background: #fff;
            color: #111;
            font-size: 12px;
            width: 794px;
            line-height: 1.5;
          }          /* HEADER */
          .header {
            background: #4338ca;
            color: #fff;
            padding: 18px 28px 14px;
          }
          .header .shop-name {
            font-size: 11px;
            font-weight: bold;
            color: #c7d2fe;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #fff;
            margin-bottom: 6px;
            letter-spacing: 0;
          }
          .header .meta {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #a5b4fc;
          }
          /* SUMMARY CARDS */
          .cards-wrap {
            margin: 16px 28px 0;
            border: 1px solid #d1d5db;
          }
          .cards-row {
            display: flex;
            border-bottom: 1px solid #d1d5db;
          }
          .cards-row:last-child { border-bottom: none; }
          .card {
            flex: 1;
            padding: 12px 16px;
            border-right: 1px solid #d1d5db;
          }
          .card:last-child { border-right: none; }
          .card .lbl {
            font-size: 9px;
            font-weight: bold;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .card .val {
            font-size: 20px;
            font-weight: bold;
            line-height: 1.2;
          }
          .card .sub {
            font-size: 9px;
            color: #9ca3af;
            margin-top: 3px;
          }
          .green { color: #059669; }
          .red   { color: #dc2626; }
          .orange{ color: #d97706; }
          .blue  { color: #2563eb; }
          .profit-color { color: #059669; }
          .loss-color   { color: #dc2626; }
          /* CASH BAR */
          .cash-bar {
            margin: 0 28px;
            background: #f5f3ff;
            border: 1px solid #d1d5db;
            border-top: none;
            padding: 8px 16px;
            font-size: 11px;
            font-weight: bold;
            color: #4338ca;
          }
          /* SECTIONS */
          .section { margin: 18px 28px 0; }
          .sec-header {
            background: #4338ca;
            color: #fff;
            padding: 7px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 0.3px;
          }
          .sec-header .count {
            font-size: 10px;
            font-weight: normal;
            color: #c7d2fe;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background: #f3f4f6;
            padding: 7px 10px;
            text-align: left;
            font-weight: bold;
            color: #374151;
            border: 1px solid #d1d5db;
            font-size: 10px;
          }
          td {
            padding: 6px 10px;
            border: 1px solid #e5e7eb;
            color: #374151;
            vertical-align: middle;
          }
          tr:nth-child(even) td { background: #f9fafb; }
          .total-row td {
            font-weight: bold;
            color: #4338ca;
            background: #eef2ff;
            border-top: 2px solid #c7d2fe;
          }
          /* FOOTER */
          .footer {
            text-align: center;
            padding: 14px 28px 10px;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
        </style>
      </head><body>

        <div class="header">
          <div class="shop-name">${shopSettings.shop_name || 'SweetCraft'}</div>
          <h1>Daily Business Report</h1>
          <div class="meta">
            <span>${dateStr}</span>
            <span>Generated: ${new Date().toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="cards-wrap">
          <div class="cards-row">
            <div class="card">
              <div class="lbl">Principle</div>
              <div class="val green">Rs.${stats.total_income}</div>
              <div class="sub">Cash: ${stats.total_cash} &nbsp;|&nbsp; Online: ${stats.total_online}</div>
            </div>
            <div class="card">
              <div class="lbl">Total Expense</div>
              <div class="val red">Rs.${stats.total_expense}</div>
            </div>
            <div class="card">
              <div class="lbl">Staff Pay</div>
              <div class="val orange">Rs.${stats.total_staff_pay}</div>
            </div>
            <div class="card">
              <div class="lbl">Direct Income</div>
              <div class="val blue">Rs.${stats.total_principle}</div>
            </div>
          </div>
          <div class="cards-row">
            <div class="card">
              <div class="lbl">Net Daily Sales</div>
              <div class="val" style="color:#111">Rs.${netSale}</div>
              <div class="sub">Expense + Staff + Direct Income - Principle</div>
            </div>
            <div class="card">
              <div class="lbl">Total Income (P&amp;L)</div>
              <div class="val ${isProfit ? 'profit-color' : 'loss-color'}">
                ${isProfit ? 'PROFIT' : 'OVER EXPENSE'}: Rs.${Math.abs(totalIncome)}
              </div>
              <div class="sub">Direct Income - (Cash + Online)</div>
            </div>
          </div>
        </div>

        <div class="cash-bar">
          Total Cash in Hand: Rs.${cashInHand} &nbsp; = &nbsp; Principle + Direct Income
        </div>

        ${reports.incomes?.length > 0 ? `
        <div class="section">
          <div class="sec-header">
            <span>PRINCIPLE DETAILS</span>
            <span class="count">${reports.incomes.length} records</span>
          </div>
          <table>
            <thead><tr><th>Mode</th><th>Description</th><th>Amount</th><th>Time</th></tr></thead>
            <tbody>
              ${incomeRows}
              <tr class="total-row">
                <td colspan="2"><b>TOTAL</b></td>
                <td><b>Rs.${reports.incomes.reduce((s,r)=>s+r.amount,0).toFixed(2)}</b></td>
                <td>${reports.incomes.length} records</td>
              </tr>
            </tbody>
          </table>
        </div>` : ''}

        ${reports.expenses?.length > 0 ? `
        <div class="section">
          <div class="sec-header">
            <span>EXPENSE DETAILS</span>
            <span class="count">${reports.expenses.length} records</span>
          </div>
          <table>
            <thead><tr><th>Item</th><th>Vendor / Status</th><th>Amount</th><th>Time</th></tr></thead>
            <tbody>
              ${expenseRows}
              <tr class="total-row">
                <td colspan="2"><b>TOTAL</b></td>
                <td><b>Rs.${reports.expenses.reduce((s,r)=>s+r.amount,0).toFixed(2)}</b></td>
                <td>${reports.expenses.length} records</td>
              </tr>
            </tbody>
          </table>
        </div>` : ''}

        ${staffAdv.length > 0 ? `
        <div class="section">
          <div class="sec-header">
            <span>STAFF PAYMENT DETAILS</span>
            <span class="count">${staffAdv.length} records</span>
          </div>
          <table>
            <thead><tr><th>Staff Name</th><th>Note</th><th>Type</th><th>Amount</th><th>Time</th></tr></thead>
            <tbody>
              ${staffRows}
              <tr class="total-row">
                <td colspan="3"><b>TOTAL</b></td>
                <td><b>Rs.${staffAdv.reduce((s,r)=>s+r.amount,0).toFixed(2)}</b></td>
                <td>${staffAdv.length} records</td>
              </tr>
            </tbody>
          </table>
        </div>` : ''}

        ${reports.principles?.length > 0 ? `
        <div class="section">
          <div class="sec-header">
            <span>DIRECT INCOME DETAILS</span>
            <span class="count">${reports.principles.length} records</span>
          </div>
          <table>
            <thead><tr><th>Amount</th><th>Description</th><th>Time</th></tr></thead>
            <tbody>
              ${principleRows}
              <tr class="total-row">
                <td><b>Rs.${reports.principles.reduce((s,r)=>s+r.amount,0).toFixed(2)}</b></td>
                <td><b>TOTAL</b></td>
                <td>${reports.principles.length} records</td>
              </tr>
            </tbody>
          </table>
        </div>` : ''}

        <div class="footer">
          Powered by Poddar Solutions &nbsp;|&nbsp; Generated on ${new Date().toLocaleString('en-IN')}
        </div>

      </body></html>`;

      // Isolated iframe mein render karo - Tailwind oklch se isolated
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1px;border:none;';
      document.body.appendChild(iframe);
      const iDoc = iframe.contentDocument || iframe.contentWindow.document;
      iDoc.open(); iDoc.write(html); iDoc.close();

      // Font load hone ka wait
      await new Promise(r => setTimeout(r, 1200));

      const bodyH = iDoc.body.scrollHeight;
      iframe.style.height = bodyH + 'px';
      await new Promise(r => setTimeout(r, 300));

      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(iDoc.body, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false,
        windowWidth: 794, windowHeight: bodyH,
      });
      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pW = 210, pH = 297;
      const imgH = (canvas.height * pW) / canvas.width;
      let yOff = 0;
      while (yOff < imgH) {
        if (yOff > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -yOff, pW, imgH);
        yOff += pH;
      }
      pdf.save(`Daily_Report_${selectedDate.replace(/-/g,'')}.pdf`);

    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    } finally {
      button.disabled = false;
      button.innerHTML = originalHTML;
    }
  };

  const handlePrint = () => {
    // Get the printable content
    const printContent = document.getElementById('printable-report');
    const originalContent = document.body.innerHTML;
    
    // Replace body content with print content
    document.body.innerHTML = printContent.innerHTML;
    
    // Print
    window.print();
    
    // Restore original content
    document.body.innerHTML = originalContent;
    
    // Reload to restore React state
    window.location.reload();
  };

  // Calculate totals for each tab
  const calculateTotal = (tab) => {
    const data = reports[tab] || [];
    if (tab === 'incomes' || tab === 'principles' || tab === 'expenses') {
      return data.reduce((sum, item) => sum + (item.amount || 0), 0);
    }
    if (tab === 'staff') {
      return data.filter(item => item.txn_type === 'Advance').reduce((sum, item) => sum + (item.amount || 0), 0);
    }
    if (tab === 'customers') {
      return data.reduce((sum, item) => sum + (item.amount || 0), 0);
    }
    return 0;
  };

  const TabButton = ({ id, label }) => (
    <button onClick={() => handleTabChange(id)} className={`flex-1 py-3 px-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap print:hidden ${activeTab === id ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
      {label}
    </button>
  );

  // Filter staff data to show only Advance payments (not Wage)
  const filteredStaffData = activeTab === 'staff' 
    ? (reports.staff || []).filter(item => item.txn_type === 'Advance' || item.txn_type === 'Settle')
    : reports[activeTab] || [];

  // Pagination Logic - use filtered data for staff
  const currentData = activeTab === 'staff' ? filteredStaffData : (reports[activeTab] || []);
  const totalPages = Math.ceil(currentData.length / rowsPerPage);
  const paginatedData = currentData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  
  // For print: show all data
  const printData = currentData;

  return (
    <div className="space-y-6">
      <div className="pt-2 print:mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t('All Reports')}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium print:text-black">Date: {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 print:hidden w-full sm:w-auto">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Download size={16} className="flex-shrink-0" /> <span className="hidden xs:inline sm:hidden md:inline">Download</span> PDF
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Printer size={16} className="flex-shrink-0" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* COMPLETE PRINT VIEW - ALL SECTIONS */}
      <div id="printable-report" style={{display: 'none'}} className="print-content">
        <div style={{padding: '20px', fontFamily: "'Noto Sans Devanagari', 'Mangal', Arial, sans-serif", color: '#000', background: '#fff'}}>
        
        {/* Print Header */}
        <div style={{textAlign: 'center', marginBottom: '20px', borderBottom: '3px solid #000', paddingBottom: '15px'}}>
          <h1 style={{fontSize: '20px', fontWeight: 'bold', margin: '0 0 3px 0', color: '#000'}}>{shopSettings.shop_name || 'SweetCraft'}</h1>
          <h2 style={{fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#000'}}>Daily Business Report</h2>
          <p style={{fontSize: '12px', margin: '0', color: '#000'}}>Date: {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Daily Summary Box */}
        <div style={{border: '2px solid #000', padding: '15px', marginBottom: '20px', backgroundColor: '#f5f5f5'}}>
          <h2 style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#000'}}>Daily Summary</h2>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px'}}>
            <div style={{borderRight: '1px solid #666', paddingRight: '10px'}}>
              <p style={{fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#000'}}>Principle</p>
              <p style={{fontSize: '18px', fontWeight: 'bold', color: '#000'}}>₹{stats.total_income}</p>
              <p style={{fontSize: '8px', color: '#000'}}>Cash: ₹{stats.total_cash} | Online: ₹{stats.total_online}</p>
            </div>
            <div style={{borderRight: '1px solid #666', paddingRight: '10px'}}>
              <p style={{fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#000'}}>Total Expense</p>
              <p style={{fontSize: '18px', fontWeight: 'bold', color: '#000'}}>₹{stats.total_expense}</p>
            </div>
            <div style={{borderRight: '1px solid #666', paddingRight: '10px'}}>
              <p style={{fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#000'}}>Staff Payment</p>
              <p style={{fontSize: '18px', fontWeight: 'bold', color: '#000'}}>₹{stats.total_staff_pay}</p>
            </div>
            <div>
              <p style={{fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#000'}}>Direct Income</p>
              <p style={{fontSize: '18px', fontWeight: 'bold', color: '#000'}}>₹{stats.total_principle}</p>
            </div>
          </div>
          <div style={{borderTop: '2px solid #000', paddingTop: '10px'}}>
            <p style={{fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#000'}}>Net Daily Sales</p>
            <p style={{fontSize: '22px', fontWeight: 'bold', color: '#000'}}>Rs.{stats.net_income}</p>
            <p style={{fontSize: '8px', color: '#555'}}>Net Sale = Expense + Staff + Principle - Sale</p>
            <p style={{fontSize: '10px', fontWeight: 'bold', marginTop: '8px', color: '#000'}}>
              Total Income (P&L): {(() => { const ti = stats.total_principle - stats.total_income; return ti >= 0 ? `PROFIT Rs.${ti}` : `OVER EXPENSE Rs.${Math.abs(ti)}`; })()}
            </p>
            <p style={{fontSize: '8px', color: '#555'}}>Formula: Principle - (Cash + Online)</p>
            <p style={{fontSize: '10px', fontWeight: 'bold', marginTop: '4px', color: '#000'}}>Total Cash in Hand: Rs.{stats.total_income + stats.total_principle}</p>
          </div>
        </div>
          {/* Income Section */}
          {reports.incomes && reports.incomes.length > 0 && (
            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #000', paddingBottom: '4px'}}>Principle Details</h3>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px'}}>
                <thead>
                  <tr style={{backgroundColor: '#e0e0e0'}}>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Mode</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Details</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'right'}}>Amount</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.incomes.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{border: '1px solid #000', padding: '5px'}}>{row.payment_mode}</td>
                      <td style={{border: '1px solid #000', padding: '5px'}}>{row.description || '-'}</td>
                      <td style={{border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold'}}>₹{row.amount}</td>
                      <td style={{border: '1px solid #000', padding: '5px', fontSize: '9px'}}>{row.date}</td>
                    </tr>
                  ))}
                  <tr style={{backgroundColor: '#f0f0f0'}}>
                    <td colSpan="2" style={{border: '1px solid #000', padding: '5px', fontWeight: 'bold'}}>Total</td>
                    <td style={{border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold'}}>₹{reports.incomes.reduce((sum, item) => sum + item.amount, 0)}</td>
                    <td style={{border: '1px solid #000', padding: '5px'}}>{reports.incomes.length} records</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Expense Section */}
          {reports.expenses && reports.expenses.length > 0 && (
            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #000', paddingBottom: '4px'}}>Daily Expense Details</h3>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px'}}>
                <thead>
                  <tr style={{backgroundColor: '#e0e0e0'}}>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Item</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Mahajan/Status</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'right'}}>Amount</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.expenses.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{border: '1px solid #000', padding: '5px'}}>{row.item_name}</td>
                      <td style={{border: '1px solid #000', padding: '5px'}}>{row.mahajan ? `${row.mahajan} (${row.status})` : `Direct (${row.status})`}</td>
                      <td style={{border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold'}}>₹{row.amount}</td>
                      <td style={{border: '1px solid #000', padding: '5px', fontSize: '9px'}}>{row.date}</td>
                    </tr>
                  ))}
                  <tr style={{backgroundColor: '#f0f0f0'}}>
                    <td colSpan="2" style={{border: '1px solid #000', padding: '5px', fontWeight: 'bold'}}>Total</td>
                    <td style={{border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold'}}>₹{reports.expenses.reduce((sum, item) => sum + item.amount, 0)}</td>
                    <td style={{border: '1px solid #000', padding: '5px'}}>{reports.expenses.length} records</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Staff Payment Section */}
          {reports.staff && reports.staff.filter(item => item.txn_type === 'Advance' || item.txn_type === 'Settle').length > 0 && (
            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #000', paddingBottom: '4px'}}>Staff Payment Details</h3>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px'}}>
                <thead>
                  <tr style={{backgroundColor: '#e0e0e0'}}>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Staff Name</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Details</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Type</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'right'}}>Amount</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.staff.filter(item => item.txn_type === 'Advance' || item.txn_type === 'Settle').map((row, idx) => (
                    <tr key={idx}>
                      <td style={{border: '1px solid #000', padding: '5px'}}>{row.staff_name}</td>
                      <td style={{border: '1px solid #000', padding: '5px'}}>{row.description}</td>
                      <td style={{border: '1px solid #000', padding: '5px'}}>{row.txn_type}</td>
                      <td style={{border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold'}}>₹{row.amount}</td>
                      <td style={{border: '1px solid #000', padding: '5px', fontSize: '9px'}}>{row.date}</td>
                    </tr>
                  ))}
                  <tr style={{backgroundColor: '#f0f0f0'}}>
                    <td colSpan="3" style={{border: '1px solid #000', padding: '5px', fontWeight: 'bold'}}>Total</td>
                    <td style={{border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold'}}>₹{reports.staff.filter(item => item.txn_type === 'Advance' || item.txn_type === 'Settle').reduce((sum, item) => sum + item.amount, 0)}</td>
                    <td style={{border: '1px solid #000', padding: '5px'}}>{reports.staff.filter(item => item.txn_type === 'Advance' || item.txn_type === 'Settle').length} records</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Principle Section */}
          {reports.principles && reports.principles.length > 0 && (
            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '2px solid #000', paddingBottom: '4px'}}>Direct Income Details</h3>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '10px'}}>
                <thead>
                  <tr style={{backgroundColor: '#e0e0e0'}}>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'right'}}>Amount</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Details</th>
                    <th style={{border: '1px solid #000', padding: '6px', textAlign: 'left'}}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.principles.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold'}}>₹{row.amount}</td>
                      <td style={{border: '1px solid #000', padding: '5px'}}>{row.description || '-'}</td>
                      <td style={{border: '1px solid #000', padding: '5px', fontSize: '9px'}}>{row.date}</td>
                    </tr>
                  ))}
                  <tr style={{backgroundColor: '#f0f0f0'}}>
                    <td style={{border: '1px solid #000', padding: '5px', textAlign: 'right', fontWeight: 'bold'}}>₹{reports.principles.reduce((sum, item) => sum + item.amount, 0)}</td>
                    <td style={{border: '1px solid #000', padding: '5px', fontWeight: 'bold'}}>Total</td>
                    <td style={{border: '1px solid #000', padding: '5px'}}>{reports.principles.length} records</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={{marginTop: '25px', paddingTop: '10px', borderTop: '2px solid #000', textAlign: 'center'}}>
            <p style={{fontSize: '9px', color: '#666'}}>Generated on {new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Total Card for Active Tab - Screen Only */}
      {(activeTab === 'incomes' || activeTab === 'principles' || activeTab === 'expenses' || activeTab === 'staff') && (
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-[2rem] text-white shadow-lg print:hidden">
          <p className="text-purple-100 font-bold tracking-widest mb-2 uppercase text-[10px]">
            {activeTab === 'incomes' && 'Total Principle'}
            {activeTab === 'principles' && 'Total Direct Income'}
            {activeTab === 'expenses' && 'Total Daily Expense'}
            {activeTab === 'staff' && 'Total Staff Payment (Advance)'}
          </p>
          <h3 className="text-5xl font-black tracking-tight">₹{calculateTotal(activeTab).toFixed(2)}</h3>
          {activeTab === 'incomes' && (
            <p className="text-purple-100 text-sm mt-2 font-medium">Cash: ₹{stats.total_cash} | Online: ₹{stats.total_online}</p>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col min-h-[500px] print:rounded-none print:shadow-none print:border-2">
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 mb-6 scrollbar-hide print:border-b-2 print:border-zinc-300">
          <TabButton id="incomes" label={t('Principle')} />
          <TabButton id="principles" label={t('Direct Income')} />
          <TabButton id="expenses" label={t('Daily Expense')} />
          <TabButton id="staff" label={t('Staff Khata')} />
          <TabButton id="customers" label={t('Udhari Ledger')} />
          <TabButton id="inventory" label={t('Inventory')} />
          <TabButton id="returns" label={t('Returns')} />
        </div>

        {/* Screen View: Paginated */}
        <div className="overflow-x-auto flex-1 print:hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 text-sm">
                {activeTab === 'incomes' && <><th className="pb-3 pl-4">{t('Payment Mode')}</th><th className="pb-3">{t('Details')}</th><th className="pb-3">Amount</th><th className="pb-3">{t('Date')}</th><th className="pb-3">Edit</th></>}
                {activeTab === 'principles' && <><th className="pb-3 pl-4">Amount</th><th className="pb-3">{t('Details')}</th><th className="pb-3">{t('Date')}</th><th className="pb-3">Edit</th></>}
                {activeTab === 'expenses' && <><th className="pb-3 pl-4">{t('Item/Detail')}</th><th className="pb-3">{t('Mahajan/Status')}</th><th className="pb-3">Amount</th><th className="pb-3">{t('Date')}</th></>}
                {activeTab === 'inventory' && <><th className="pb-3 pl-4">Item</th><th className="pb-3">{t('Action')}</th><th className="pb-3">{t('Qty')}</th><th className="pb-3">{t('Date')}</th></>}
                {activeTab === 'returns' && <><th className="pb-3 pl-4">Item</th><th className="pb-3">{t('Return Qty')}</th><th className="pb-3">{t('Date')}</th></>}
                {activeTab === 'staff' && <><th className="pb-3 pl-4">{t('Staff Name')}</th><th className="pb-3">{t('Details')}</th><th className="pb-3">Type</th><th className="pb-3">Amount</th><th className="pb-3">{t('Date')}</th><th className="pb-3">Edit</th></>}
                {activeTab === 'customers' && <><th className="pb-3 pl-4">{t('Customer Name')}</th><th className="pb-3">{t('Transaction')}</th><th className="pb-3">Amount</th><th className="pb-3">{t('Date')}</th></>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 && <tr><td colSpan="5" className="py-6 text-center text-zinc-500">{t('No records found.')}</td></tr>}
              {paginatedData.map((row, idx) => (
                <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-950/50">
                  {activeTab === 'incomes' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.payment_mode}</td><td className="py-4 text-sm dark:text-zinc-300">{row.description || '-'}</td><td className="py-4 font-bold text-emerald-600">₹{row.amount}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td><td className="py-4"><div className="flex gap-1"><button onClick={() => setEditModal({ isOpen: true, type: 'income', row: {...row} })} className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:scale-105 transition-transform" title="Edit"><Edit size={14}/></button><button onClick={() => handleDelete('income', row.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:scale-105 transition-transform" title="Delete"><Trash2 size={14}/></button></div></td></>}
                  {activeTab === 'principles' && <><td className="py-4 pl-4 font-bold text-blue-600">₹{row.amount}</td><td className="py-4 text-sm dark:text-zinc-300">{row.description || '-'}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td><td className="py-4"><div className="flex gap-1"><button onClick={() => setEditModal({ isOpen: true, type: 'principle', row: {...row} })} className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:scale-105 transition-transform" title="Edit"><Edit size={14}/></button><button onClick={() => handleDelete('principle', row.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:scale-105 transition-transform" title="Delete"><Trash2 size={14}/></button></div></td></>}
                  {activeTab === 'expenses' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.item_name}</td><td className="py-4 text-sm dark:text-zinc-300">{row.mahajan ? `${row.mahajan} (${row.status})` : `Direct (${row.status})`}</td><td className="py-4 font-bold text-rose-600">₹{row.amount}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td></>}
                  {activeTab === 'inventory' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.item_name}</td><td className="py-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${row.action === 'Add' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{row.action}</span></td><td className="py-4 font-medium dark:text-white">{row.quantity}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td></>}
                  {activeTab === 'returns' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.item_name}</td><td className="py-4 font-medium dark:text-white">{row.quantity}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td></>}
                  {activeTab === 'staff' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.staff_name}</td><td className="py-4 text-sm dark:text-zinc-300">{row.description}</td><td className="py-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${row.txn_type === 'Advance' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.txn_type}</span></td><td className="py-4 font-bold dark:text-white">₹{row.amount}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td><td className="py-4"><div className="flex gap-1"><button onClick={() => setEditModal({ isOpen: true, type: 'staff', row: {...row} })} className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:scale-105 transition-transform" title="Edit"><Edit size={14}/></button><button onClick={() => handleDelete('staff', row.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:scale-105 transition-transform" title="Delete"><Trash2 size={14}/></button></div></td></>}
                  {activeTab === 'customers' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.customer_name}</td><td className="py-4 text-sm dark:text-zinc-300">{row.txn_type}</td><td className="py-4 font-bold dark:text-white">₹{row.amount}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td></>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Print View: All Data */}
        <div className="hidden print:block">
          <h3 className="text-base font-black text-zinc-900 mb-3">
            {activeTab === 'incomes' && 'Principle Details'}
            {activeTab === 'principles' && 'Direct Income Details'}
            {activeTab === 'expenses' && 'Daily Expense Details'}
            {activeTab === 'staff' && 'Staff Payment Details'}
            {activeTab === 'customers' && 'Customer Udhari Details'}
            {activeTab === 'inventory' && 'Inventory Log'}
            {activeTab === 'returns' && 'Returns Log'}
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-black border-b-2 border-zinc-300">
                {activeTab === 'incomes' && <><th className="pb-2 pl-2">{t('Payment Mode')}</th><th className="pb-2">{t('Details')}</th><th className="pb-2">Amount</th><th className="pb-2">{t('Time')}</th></>}
                {activeTab === 'principles' && <><th className="pb-2 pl-2">Amount</th><th className="pb-2">{t('Details')}</th><th className="pb-2">{t('Time')}</th></>}
                {activeTab === 'expenses' && <><th className="pb-2 pl-2">{t('Item/Detail')}</th><th className="pb-2">{t('Mahajan/Status')}</th><th className="pb-2">Amount</th><th className="pb-2">{t('Time')}</th></>}
                {activeTab === 'inventory' && <><th className="pb-2 pl-2">Item</th><th className="pb-2">{t('Action')}</th><th className="pb-2">{t('Qty')}</th><th className="pb-2">{t('Time')}</th></>}
                {activeTab === 'returns' && <><th className="pb-2 pl-2">Item</th><th className="pb-2">{t('Return Qty')}</th><th className="pb-2">{t('Time')}</th></>}
                {activeTab === 'staff' && <><th className="pb-2 pl-2">{t('Staff Name')}</th><th className="pb-2">{t('Details')}</th><th className="pb-2">Type</th><th className="pb-2">Amount</th><th className="pb-2">{t('Time')}</th></>}
                {activeTab === 'customers' && <><th className="pb-2 pl-2">{t('Customer Name')}</th><th className="pb-2">{t('Transaction')}</th><th className="pb-2">Amount</th><th className="pb-2">{t('Time')}</th></>}
              </tr>
            </thead>
            <tbody>
              {printData.length === 0 && <tr><td colSpan="5" className="py-4 text-center text-black">{t('No records found.')}</td></tr>}
              {printData.map((row, idx) => (
                <tr key={idx} className="border-b border-zinc-200">
                  {activeTab === 'incomes' && <><td className="py-2 pl-2 font-bold">{row.payment_mode}</td><td className="py-2">{row.description || '-'}</td><td className="py-2 font-bold">₹{row.amount}</td><td className="py-2">{row.date}</td></>}
                  {activeTab === 'principles' && <><td className="py-2 pl-2 font-bold">₹{row.amount}</td><td className="py-2">{row.description || '-'}</td><td className="py-2">{row.date}</td></>}
                  {activeTab === 'expenses' && <><td className="py-2 pl-2 font-bold">{row.item_name}</td><td className="py-2">{row.mahajan ? `${row.mahajan} (${row.status})` : `Direct (${row.status})`}</td><td className="py-2 font-bold">₹{row.amount}</td><td className="py-2">{row.date}</td></>}
                  {activeTab === 'inventory' && <><td className="py-2 pl-2 font-bold">{row.item_name}</td><td className="py-2">{row.action}</td><td className="py-2 font-bold">{row.quantity}</td><td className="py-2">{row.date}</td></>}
                  {activeTab === 'returns' && <><td className="py-2 pl-2 font-bold">{row.item_name}</td><td className="py-2 font-bold">{row.quantity}</td><td className="py-2">{row.date}</td></>}
                  {activeTab === 'staff' && <><td className="py-2 pl-2 font-bold">{row.staff_name}</td><td className="py-2">{row.description}</td><td className="py-2">{row.txn_type}</td><td className="py-2 font-bold">₹{row.amount}</td><td className="py-2">{row.date}</td></>}
                  {activeTab === 'customers' && <><td className="py-2 pl-2 font-bold">{row.customer_name}</td><td className="py-2">{row.txn_type}</td><td className="py-2 font-bold">₹{row.amount}</td><td className="py-2">{row.date}</td></>}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-3 border-t-2 border-zinc-300 flex justify-between">
            <p className="text-xs text-zinc-600 font-semibold">Total Records: {printData.length}</p>
            {(activeTab === 'incomes' || activeTab === 'principles' || activeTab === 'expenses' || activeTab === 'staff') && (
              <p className="text-sm font-black text-zinc-900">Total: ₹{calculateTotal(activeTab).toFixed(2)}</p>
            )}
          </div>
        </div>

        {/* NAYA: Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 print:hidden">
             <button 
               onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
               disabled={currentPage === 1}
               className="px-4 py-2 rounded-xl text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-50 transition-all hover:bg-zinc-200"
             >
               Previous
             </button>
             <span className="text-sm font-semibold text-zinc-500">Page {currentPage} of {totalPages}</span>
             <button 
               onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
               disabled={currentPage === totalPages}
               className="px-4 py-2 rounded-xl text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-50 transition-all hover:bg-zinc-200"
             >
               Next
             </button>
          </div>
        )}
      </div>

      {/* Edit Income/Principle Modal */}
      {editModal.isOpen && editModal.row && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-[100] p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in">
            <button onClick={() => setEditModal({ isOpen: false, type: null, row: null })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-6 dark:text-white">
              {editModal.type === 'income' ? 'Edit Income Entry' : editModal.type === 'staff' ? 'Edit Staff Payment' : 'Edit Principle Entry'}
            </h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              {editModal.type === 'income' && (
                <UI_Select label="Payment Mode" options={[{label:'Cash', value:'Cash'},{label:'Online', value:'Online'}]} value={editModal.row.payment_mode} onChange={e => setEditModal(prev => ({...prev, row: {...prev.row, payment_mode: e.target.value}}))} />
              )}
              {editModal.type === 'staff' && (
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  Staff: <span className="text-zinc-900 dark:text-white font-bold">{editModal.row.staff_name}</span> &nbsp;|&nbsp; Type: <span className={`font-bold ${editModal.row.txn_type === 'Advance' ? 'text-red-600' : 'text-emerald-600'}`}>{editModal.row.txn_type}</span>
                </div>
              )}
              <UI_Input label="Amount (₹)" type="number" value={editModal.row.amount} onChange={e => setEditModal(prev => ({...prev, row: {...prev.row, amount: e.target.value}}))} required />
              <UI_Input label="Details (Optional)" value={editModal.row.description || ''} onChange={e => setEditModal(prev => ({...prev, row: {...prev.row, description: e.target.value}}))} />
              <div className="pt-2"><UI_Button type="submit" variant="primary">Save Changes</UI_Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// --- ADMIN: MENU MANAGER PAGE ---
function MenuManagerPage() {
  const { t } = useTranslation();
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', desc: '', category: 'Sweets', price: '', unit: 'pc', popular: false, in_stock: true });
  const [imageFile, setImageFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // Search state
  
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchMenu = () => shopFetch(`${API_BASE_URL}/api/menu`).then(res => res.json()).then(setMenuItems).catch(()=>{});
  useEffect(() => { fetchMenu(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('desc', formData.desc);
    data.append('category', formData.category);
    data.append('price', formData.price);
    data.append('unit', formData.unit);
    data.append('popular', formData.popular);
    data.append('in_stock', formData.in_stock);
    if (imageFile) data.append('image', imageFile);

    try {
      let url = `${API_BASE_URL}/api/menu`;
      let method = 'POST';
      if(editMode) {
          url = `${API_BASE_URL}/api/menu/${editId}`;
          method = 'PUT';
      }

      const res = await fetch(url, { method: method, body: data });
      if (res.ok) {
        resetForm();
        e.target.reset(); 
        fetchMenu();
      }
    } catch (err) { alert("Error saving item!"); }
  };

  const resetForm = () => {
      setFormData({ name: '', desc: '', category: 'Sweets', price: '', unit: 'pc', popular: false, in_stock: true });
      setImageFile(null);
      setEditMode(false);
      setEditId(null);
  };

  const handleEdit = (item) => {
      setFormData({ name: item.name, desc: item.desc || '', category: item.category, price: item.price, unit: item.unit, popular: item.popular, in_stock: item.in_stock ?? true });
      setEditMode(true);
      setEditId(item.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    await shopFetch(`${API_BASE_URL}/api/menu/${id}`, { method: 'DELETE' });
    fetchMenu();
  };

  const filteredMenu = menuItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t('Menu Manager')}</h1></div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-extrabold dark:text-white">{editMode ? 'Edit Menu Item' : 'Add Display Item'}</h2>
           {editMode && <button onClick={resetForm} className="text-red-500 font-bold text-sm hover:underline">{t('Cancel Edit')}</button>}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <UI_Input label={t('Item Name')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <div className="md:col-span-2"><UI_Input label="Details (Tagline)" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} /></div>
          <UI_Select label={t('Category')} options={[{label:'Sweets', value:'Sweets'}, {label:'Snacks', value:'Snacks'}, {label:'Beverages', value:'Beverages'}, {label:'Namkeen', value:'Namkeen'}]} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          
          <UI_Input label={t('Price (₹)')} type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
          <UI_Select label={t('Unit')} options={[{label:'Per Piece (pc)', value:'pc'}, {label:'Per Kg', value:'kg'}, {label:'Per Plate', value:'plate'}, {label:'Per Glass', value:'glass'}]} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
          
          <div className="w-full">
            <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2 ml-1">{editMode ? 'Change Image (Optional)' : 'Upload Image'}</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 dark:file:bg-purple-900/30 dark:file:text-purple-400 cursor-pointer dark:text-zinc-300" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full h-full items-end pb-1 lg:col-span-1">
             <div className="flex gap-2 w-full">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex-1 justify-center font-bold text-[10px] text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  <input type="checkbox" checked={formData.popular} onChange={e => setFormData({ ...formData, popular: e.target.checked })} className="w-4 h-4 accent-purple-600" />
                  🔥 Bestseller
                </label>
                <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-2xl border flex-1 justify-center font-bold text-[10px] uppercase tracking-wider ${formData.in_stock ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>
                  <input type="checkbox" checked={formData.in_stock} onChange={e => setFormData({ ...formData, in_stock: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                  📦 {formData.in_stock ? 'In Stock' : 'Out of Stock'}
                </label>
             </div>
          </div>
          <div className="lg:col-span-4"><UI_Button type="submit" variant="primary">{editMode ? 'Update Item' : 'Save Item'}</UI_Button></div>
        </form>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{t('All Menu Items')}</h2>
          <div className="relative w-full md:w-72">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
             <input type="text" placeholder={t('Search menu...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMenu.map(item => (
          <div key={item.id} className={`bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col relative ${!item.in_stock ? 'opacity-60 grayscale' : ''}`}>
            {!item.in_stock && <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md z-10 shadow-md">{t('Out of Stock')}</div>}
            {item.image_url ? (
              <img src={`${API_BASE_URL}${item.image_url}`} alt={item.name} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"><ImagePlus className="text-zinc-400" size={32}/></div>
            )}
            <div className="p-5 flex-1 flex flex-col">
               <div className="flex justify-between items-start mb-1">
                 <h3 className="font-bold text-lg dark:text-white leading-tight">{item.name}</h3>
                 <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="text-blue-500 hover:scale-110"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:scale-110"><Trash2 size={16}/></button>
                 </div>
               </div>
               <p className="text-xs text-zinc-500 mb-3">{item.category}</p>
               <div className="mt-auto font-black text-xl text-zinc-900 dark:text-white">₹{item.price}<span className="text-xs text-zinc-500 font-medium">/{item.unit}</span></div>
            </div>
          </div>
        ))}
        {filteredMenu.length === 0 && <p className="text-zinc-500 col-span-full">{t('No items found.')}</p>}
      </div>
    </div>
  );
}

// --- PUBLIC: CUSTOMER MENU CARD ---
function PublicMenuCard({ toggleTheme, isDarkMode }) {
  const { t } = useTranslation(); // 👈 NAYA HOOK ADD KIYA
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => { shopFetch(`${API_BASE_URL}/api/menu`).then(res => res.json()).then(setMenuItems).catch(()=>{}); }, []);

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  
  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-purple-500/30 flex flex-col">
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none z-0"></div>
      
      <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
           <div className="flex items-center gap-2">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20"><Droplets className="text-white" size={20} /></div>
             <div>
               <h1 className="text-xl font-black tracking-tight leading-none dark:text-white">SweetCraft</h1>
               <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{t("Premium Menu")}</span>
             </div>
           </div>
           <button onClick={toggleTheme} className="p-2 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 active:scale-95">
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
           </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-6 w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Search className="text-zinc-400" size={20} /></div>
          <input type="text" placeholder={t("Search for sweets, snacks...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-full py-3.5 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white backdrop-blur-md" />
        </div>

        {/* Categories & View Toggle */}
        <div className="flex justify-between items-center mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide flex-1">
            {categories.map(category => (
              <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${activeCategory === category ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'}`}>
                {category}
              </button>
            ))}
          </div>
          
          {/* Grid vs List Toggle Buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm ml-4 backdrop-blur-md">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-100 dark:bg-zinc-800 text-purple-600 dark:text-purple-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              <List size={18} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-100 dark:bg-zinc-800 text-purple-600 dark:text-purple-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        {/* Menu Display Area */}
        {filteredMenu.length > 0 ? (
          viewMode === 'grid' ? (
            // --- GRID VIEW ---
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 animate-fade-in mb-12" style={{ animationDelay: '300ms' }}>
              {filteredMenu.map(item => (
                <div key={item.id} className={`group bg-white dark:bg-zinc-900/80 backdrop-blur-lg border border-zinc-200/80 dark:border-zinc-800/80 rounded-[2rem] shadow-sm overflow-hidden flex flex-col relative ${item.in_stock === false ? 'opacity-60 grayscale' : ''}`}>
                  {item.in_stock === false && (
                    <div className="absolute inset-0 bg-zinc-900/10 dark:bg-white/5 z-20 pointer-events-none flex items-center justify-center">
                      <span className="bg-red-600 text-white font-black text-xl px-4 py-2 rounded-2xl rotate-[-10deg] shadow-xl border border-red-500/50">{t("OUT OF STOCK")}</span>
                    </div>
                  )}
                  {item.popular && <div className="absolute top-0 right-0 bg-gradient-to-bl from-orange-500 to-red-500 text-white text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-bl-2xl shadow-md z-10 flex items-center gap-1"><Flame size={12} /> {t("Bestseller")}</div>}
                  {item.image_url && <img src={`${API_BASE_URL}${item.image_url}`} alt={item.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />}
                  <div className="p-5 flex-1 flex flex-col bg-white dark:bg-zinc-900 relative z-10">
                    <h3 className="text-xl font-bold dark:text-white leading-tight mb-1">{item.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2">{item.desc}</p>
                    <div className="mt-4 flex items-end justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-lg">{item.category}</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">₹{item.price}</span>
                        <span className="text-zinc-500 text-sm font-semibold ml-1">/{item.unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // --- COMPACT LIST VIEW ---
            <div className="flex flex-col gap-3 animate-fade-in mb-12" style={{ animationDelay: '300ms' }}>
              {filteredMenu.map(item => (
                <div key={item.id} className={`group flex items-center bg-white dark:bg-zinc-900/80 backdrop-blur-lg border border-zinc-200/80 dark:border-zinc-800/80 rounded-[1.5rem] p-3 shadow-sm transition-all relative overflow-hidden ${item.in_stock === false ? 'opacity-60 grayscale' : 'hover:shadow-md'}`}>
                  {item.in_stock === false && (
                     <div className="absolute inset-0 bg-zinc-900/5 dark:bg-white/5 z-20 pointer-events-none flex items-center justify-center">
                         <span className="bg-red-600/90 backdrop-blur-sm text-white font-black text-lg px-6 py-1 rounded-xl shadow-lg uppercase tracking-widest border border-red-500/50">{t("OUT OF STOCK")}</span>
                     </div>
                  )}
                  {/* Bestseller Left Bar */}
                  {item.popular && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-500 to-red-500"></div>}
                  
                  {/* Small Thumbnail */}
                  {item.image_url ? (
                    <img src={`${API_BASE_URL}${item.image_url}`} alt={item.name} className="w-16 h-16 object-cover rounded-xl ml-1 mr-3 md:mr-4 border border-zinc-100 dark:border-zinc-800" />
                  ) : (
                    <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-xl ml-1 mr-3 md:mr-4 flex items-center justify-center">
                       {item.category === 'Sweets' ? <Sparkles className="text-purple-400" size={24} /> :
                        item.category === 'Snacks' ? <Flame className="text-orange-400" size={24} /> :
                        item.category === 'Beverages' ? <Coffee className="text-amber-600" size={24} /> :
                        <Package className="text-emerald-500" size={24} />}
                    </div>
                  )}

                  {/* Name & Desc */}
                  <div className="flex-1 pr-2 relative z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base md:text-lg font-bold dark:text-white leading-tight">{item.name}</h3>
                      {item.popular && <span className="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5"><Flame size={10}/> {t("Hot")}</span>}
                    </div>
                    {item.desc && <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{item.desc}</p>}
                  </div>

                  {/* Price */}
                  <div className="text-right pl-3 border-l border-zinc-100 dark:border-zinc-800/50 flex flex-col justify-center min-w-[70px] relative z-10">
                    <div className="text-lg md:text-xl font-black text-zinc-900 dark:text-white tracking-tight">₹{item.price}</div>
                    <div className="text-zinc-400 dark:text-zinc-500 text-[10px] md:text-xs font-semibold uppercase tracking-wider">/{item.unit}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
           <div className="col-span-full py-12 text-center text-zinc-500 flex flex-col items-center">
             <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mb-3 shadow-sm"><Info size={24} className="text-zinc-400"/></div>
             <h3 className="text-lg font-bold dark:text-white">{t("No items found")}</h3>
             <p className="text-sm">{t("Try searching for something else.")}</p>
           </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-4 border-t border-zinc-200 dark:border-zinc-800/50 text-center animate-fade-in">
           <h3 className="text-lg font-black dark:text-white mb-4">SweetCraft</h3>
           <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 text-sm text-zinc-500 font-medium">
             <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-purple-600 transition-colors"><Phone size={16}/> +91 98765 43210</a>
             <span className="flex items-center gap-2"><MapPin size={16}/> Main Market, Deoghar, Jharkhand</span>
           </div>
           <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-8 font-bold">Powered by Poddar Solutions</p>
        </footer>
      </div>
    </div>
  );
}

// --- EXPENSE PAGE ---
function ExpensePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState({ items: [], total_today: 0 });
  const [mahajans, setMahajans] = useState([]);
  const [suggestions, setSuggestions] = useState([]); // Autocomplete list state
  const [formData, setFormData] = useState({ item_name: '', amount: '', mahajan_id: '', payment_status: 'Paid' });

  const fetchExpenses = () => shopFetch(API_BASE_URL + '/api/expenses').then(res => res.json()).then(setExpenses).catch(() => {});
  const fetchSuggestions = () => shopFetch(API_BASE_URL + '/api/expenses/suggest').then(res => res.json()).then(setSuggestions).catch(() => {});
  
  useEffect(() => { 
    Promise.all([
      fetchExpenses(),
      fetchSuggestions(),
      shopFetch(API_BASE_URL + '/api/mahajans').then(res => res.json()).then(d => setMahajans(d.mahajans || d))
    ]).catch(()=>{}).finally(() => setLoading(false));
  }, []);

  const handleAddExpense = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      mahajan_id: formData.mahajan_id || null,
      payment_status: formData.mahajan_id ? formData.payment_status : 'Paid',
    };
    shopFetch(API_BASE_URL + '/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(() => { 
         setFormData({ item_name: '', amount: '', mahajan_id: '', payment_status: 'Paid' }); 
         fetchExpenses(); 
         fetchSuggestions();
      });
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Kya aap sach me is expense ko delete karna chahte hain?")) return;
    const res = await shopFetch(`${API_BASE_URL}/api/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) fetchExpenses();
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="pt-2">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-1/3 mb-2 animate-pulse"></div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-6 md:p-8 rounded-[2.5rem] animate-pulse">
          <div className="h-8 bg-white/20 rounded-xl w-1/3"></div>
        </div>
        <SkeletonTable />
        <SkeletonList />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t('Daily Expenses')}</h1></div>

      <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-6 md:p-8 rounded-[2.5rem] text-white shadow-lg flex justify-between items-center">
          <div>
              <p className="text-rose-100 font-bold tracking-wide mb-1 uppercase text-xs">{t('Total Expenses Today')}</p>
              <h3 className="text-4xl md:text-5xl font-black">₹{expenses.total_today}</h3>
          </div>
          <ReceiptText size={48} className="text-white/30" />
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h2 className="text-xl font-extrabold mb-6 dark:text-white">{t('Add New Expense')}</h2>
        
        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          
          <div>
             <UI_Input label={t('Expense Detail (Saman)')} list="expense-suggestions" value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} required />
             {/* Autocomplete Datalist */}
             <datalist id="expense-suggestions">
                {suggestions.map((s, idx) => <option key={idx} value={s} />)}
             </datalist>
          </div>
          
          <UI_Input label={t('Total Amount (₹)')} type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
          
          <div>
             <UI_Select label={t('Mahajan/Vendor (Optional)')} options={[{label:'No Mahajan (Direct)', value:''}].concat(mahajans.map(m => ({label: m.name, value: m.id})))} value={formData.mahajan_id} onChange={e => setFormData({ ...formData, mahajan_id: e.target.value, payment_status: 'Paid' })} />
          </div>
          
          {formData.mahajan_id ? (
            <UI_Select label={t('Payment Status')} options={[{label:'Paid Instantly', value:'Paid'}, {label:'Udhari (Credit)', value:'Credit'}]} value={formData.payment_status} onChange={e => setFormData({ ...formData, payment_status: e.target.value })} />
          ) : (
            <div className="w-full">
              <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2 ml-1">{t('Payment Status')}</label>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Direct Cash Payment (Paid)</div>
            </div>
          )}
          
          <UI_Button type="submit" variant="secondary" className="h-[50px]">{t('Note Expense')}</UI_Button>
        </form>
      </div>

      <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-8 mb-4">{t("Today's Expense Log")}</h2>
      <div className="space-y-3">
         {expenses.items.length === 0 && <p className="text-zinc-500">Koi kharcha entry nahi hai aaj ka.</p>}
         {expenses.items.map(e => (
            <div key={e.id} className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex justify-between items-center group">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg dark:text-white">{e.item_name}</h3>
                      {e.status === 'Credit' ? (
                          <span className="bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">{t('Udhar')}</span>
                      ) : (
                          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">Paid</span>
                      )}
                   </div>
                   <p className="text-xs text-zinc-500 font-medium">
                      {e.date} 
                      {e.mahajan && <span className="ml-2 font-bold text-zinc-700 dark:text-zinc-300">• Vendor: {e.mahajan}</span>}
                   </p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-rose-600 dark:text-rose-400 font-black text-xl">- ₹{e.amount}</div>
                   <button onClick={() => handleDeleteExpense(e.id)} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:scale-105 transition-transform opacity-100 md:opacity-0 md:group-hover:opacity-100">
                     <Trash2 size={16} />
                   </button>
                </div>
            </div>
         ))}
      </div>
    </div>
  );
}

// --- MAHAJAN MANAGER PAGE ---
function MahajanPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [mahajans, setMahajans] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [totalVendorUdhari, setTotalVendorUdhari] = useState(0);
  const [todayVendorUdhari, setTodayVendorUdhari] = useState(0);
  
  // Modals state
  const [selectedMahajan, setSelectedMahajan] = useState(null);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showViewBillsModal, setShowViewBillsModal] = useState(false);
  const [showEditMahajanModal, setShowEditMahajanModal] = useState(false);
  const [mahajanBills, setMahajanBills] = useState([]);
  const [editMahajanForm, setEditMahajanForm] = useState({ name: '', phone: '' });
  
  // Bill form state
  const [billForm, setBillForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', description: '', bill_image: '' });
  const [billFile, setBillFile] = useState(null);
  const [editBill, setEditBill] = useState(null);
  const [payModal, setPayModal] = useState({ isOpen: false, id: null, name: '', balance: 0, amount: '' });

  const fetchMahajans = () => { 
      return shopFetch(API_BASE_URL + '/api/mahajans')
      .then(res => res.json())
      .then(data => {
          if(data.mahajans) {
              setMahajans(data.mahajans);
              setTotalVendorUdhari(data.total_udhar || 0);
              setTodayVendorUdhari(data.today_udhar || 0);
          } else {
              setMahajans(data);
          }
      }).catch(()=>{}); 
  };
  
  const fetchMahajanBills = (mahajanId) => {
    shopFetch(`${API_BASE_URL}/api/mahajans/${mahajanId}/bills`)
      .then(res => res.json())
      .then(setMahajanBills)
      .catch(() => {});
  };
  
  useEffect(() => { 
    fetchMahajans().finally(() => setLoading(false));
  }, []);

  const handleAddMahajan = (e) => {
    e.preventDefault();
    shopFetch(API_BASE_URL + '/api/mahajans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      .then(() => { setFormData({ name: '', phone: '' }); fetchMahajans(); });
  };
  
  const openAddBillModal = (mahajan) => {
    setSelectedMahajan(mahajan);
    setShowAddBillModal(true);
    setBillForm({ date: new Date().toISOString().split('T')[0], amount: '', description: '', bill_image: '' });
    setBillFile(null);
    setEditBill(null);
  };
  
  const openViewBillsModal = (mahajan) => {
    setSelectedMahajan(mahajan);
    setShowViewBillsModal(true);
    fetchMahajanBills(mahajan.id);
  };
  
  const openEditMahajanModal = (mahajan) => {
    setSelectedMahajan(mahajan);
    setEditMahajanForm({ name: mahajan.name, phone: mahajan.phone });
    setShowEditMahajanModal(true);
  };
  
  const handleUpdateMahajan = (e) => {
    e.preventDefault();
    shopFetch(`${API_BASE_URL}/api/mahajans/${selectedMahajan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editMahajanForm)
    })
    .then(() => {
      setShowEditMahajanModal(false);
      fetchMahajans();
      alert('Mahajan updated successfully!');
    })
    .catch(err => alert('Error: ' + err.message));
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBillFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillForm({ ...billForm, bill_image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddBill = (e) => {
    e.preventDefault();
    const billData = { ...billForm, mahajan_id: selectedMahajan.id };
    shopFetch(API_BASE_URL + '/api/mahajan-bills', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(billData) 
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to add bill');
      return res.json();
    })
    .then(() => { 
      setShowAddBillModal(false);
      setBillForm({ date: new Date().toISOString().split('T')[0], amount: '', description: '', bill_image: '' });
      setBillFile(null);
      fetchMahajans(); 
      alert('Bill added successfully!');
    })
    .catch(err => alert('Error: ' + err.message));
  };
  
  const handleEditBill = (bill) => {
    // Only allow editing actual bills, not expenses
    if (bill.type === 'expense') return;
    
    setEditBill({ ...bill, id: bill.id.replace('bill_', '') });
    setBillForm({ date: bill.date, amount: bill.amount, description: bill.description, bill_image: bill.bill_image });
    setShowViewBillsModal(false);
    setShowAddBillModal(true);
  };
  
  const handleUpdateBill = (e) => {
    e.preventDefault();
    shopFetch(`${API_BASE_URL}/api/mahajan-bills/${editBill.id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(billForm) 
    })
    .then(() => { 
      setEditBill(null);
      setShowAddBillModal(false);
      setBillForm({ date: new Date().toISOString().split('T')[0], amount: '', description: '', bill_image: '' });
      setBillFile(null);
      fetchMahajans(); 
      alert('Bill updated successfully!');
    });
  };
  
  const handleDeleteBill = (id) => {
    if (!window.confirm("Kya aap sach me is bill ko delete karna chahte hain?")) return;
    shopFetch(`${API_BASE_URL}/api/mahajan-bills/${id}`, { method: 'DELETE' })
      .then(() => { 
        fetchMahajanBills(selectedMahajan.id);
        fetchMahajans(); 
        alert('Bill deleted successfully!');
      });
  };

  const handlePayMahajan = (id, name, balance) => {
    setPayModal({ isOpen: true, id, name, balance, amount: '' });
  };

  const confirmPayMahajan = async (e) => {
    e.preventDefault();
    if (!payModal.amount || isNaN(payModal.amount) || Number(payModal.amount) <= 0) return;
    await shopFetch(`${API_BASE_URL}/api/mahajans/${payModal.id}/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(payModal.amount) }) });
    setPayModal({ isOpen: false, id: null, name: '', balance: 0, amount: '' });
    fetchMahajans();
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="pt-2">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl w-1/3 mb-2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl h-24"></div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl h-24"></div>
        </div>
        <SkeletonTable />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Mahajan Manager</h1></div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div className="w-full flex justify-between items-center mb-6 gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl flex-1 border border-orange-100 dark:border-orange-900/30">
               <p className="text-orange-600 dark:text-orange-400 font-bold uppercase text-xs tracking-wider mb-1">Aaj Ka Udhari (Vendor Se)</p>
               <h3 className="text-2xl font-black text-orange-700 dark:text-orange-300">₹{todayVendorUdhari}</h3>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl flex-1 border border-red-100 dark:border-red-900/30">
               <p className="text-red-600 dark:text-red-400 font-bold uppercase text-xs tracking-wider mb-1">Total Pay Karna Hai</p>
               <h3 className="text-2xl font-black text-red-700 dark:text-red-300">₹{totalVendorUdhari}</h3>
            </div>
        </div>

        <h2 className="text-xl font-extrabold mb-6 dark:text-white">{t('Add New Mahajan / Vendor')}</h2>
        <form onSubmit={handleAddMahajan} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <UI_Input label={t('Vendor Name')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <UI_Input 
            label={t('Phone')} 
            type="tel"
            value={formData.phone} 
            onChange={e => setFormData({ ...formData, phone: validatePhone(e.target.value) })} 
            placeholder="10 digit mobile number"
            maxLength="10"
          />
          <UI_Button type="submit" variant="secondary">{t('Add Vendor')}</UI_Button>
        </form>
      </div>

      {/* Mahajan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mahajans.map(m => (
          <div key={m.id} className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col justify-between group">
            <div>
              <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-2xl dark:text-white mb-1">{m.name}</h3>
                    <p className="text-sm text-zinc-500 font-medium">📞 {m.phone || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditMahajanModal(m)} className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full hover:scale-110 transition-transform opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Edit Vendor">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => {
                        if(window.confirm(`Kya aap sach me vendor '${m.name}' ko delete karna chahte hain?`)) {
                            shopFetch(`${API_BASE_URL}/api/mahajans/${m.id}`, { method: 'DELETE' }).then(fetchMahajans);
                        }
                    }} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full hover:scale-110 transition-transform opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Delete Vendor">
                      <Trash2 size={16} />
                    </button>
                  </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-950/50 p-4 rounded-2xl mb-4 flex justify-between items-center border border-red-100 dark:border-red-900/30">
                <span className="text-red-600 dark:text-red-400 font-bold text-sm">{t('Total Dues')}</span>
                <span className="font-black text-red-600 dark:text-red-400 text-xl">₹{m.balance}</span>
              </div>
            </div>
            <div className="space-y-2">
              <UI_Button onClick={() => openAddBillModal(m)} variant="primary" className="!py-3 w-full">
                <PlusCircle size={18} className="inline mr-2" />Add Bill
              </UI_Button>
              <UI_Button onClick={() => openViewBillsModal(m)} variant="secondary" className="!py-3 w-full">
                <History size={18} className="inline mr-2" />View Bills
              </UI_Button>
              <UI_Button onClick={() => handlePayMahajan(m.id, m.name, m.balance)} variant="success" className="!py-3 w-full">{t('Pay Vendor')}</UI_Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Bill Modal */}
      {showAddBillModal && selectedMahajan && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start p-4 overflow-y-auto pt-20 backdrop-blur-md bg-black/70" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in">
            <button onClick={() => {
              setShowAddBillModal(false);
              setEditBill(null);
              setBillForm({ date: new Date().toISOString().split('T')[0], amount: '', description: '', bill_image: '' });
              setBillFile(null);
            }} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black mb-2 dark:text-white">{editBill ? 'Edit Bill' : 'Add Bill'}</h2>
            <p className="text-zinc-500 mb-6 font-medium">{selectedMahajan.name}</p>
            
            <form onSubmit={editBill ? handleUpdateBill : handleAddBill} className="space-y-4">
              <UI_Input 
                label="Date" 
                type="date" 
                value={billForm.date} 
                onChange={e => setBillForm({ ...billForm, date: e.target.value })} 
                required 
              />
              <UI_Input 
                label="Amount (₹)" 
                type="number" 
                value={billForm.amount} 
                onChange={e => setBillForm({ ...billForm, amount: e.target.value })} 
                required 
              />
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Description / Note</label>
                <textarea 
                  value={billForm.description} 
                  onChange={e => setBillForm({ ...billForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  placeholder="Enter bill details..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">Upload Bill Image (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500"
                />
                {billForm.bill_image && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ Image uploaded</p>
                )}
              </div>
              <div className="pt-2">
                <UI_Button type="submit" variant="secondary" className="w-full">{editBill ? 'Update Bill' : 'Add Bill'}</UI_Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bills Modal */}
      {showViewBillsModal && selectedMahajan && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start p-4 overflow-y-auto pt-20 backdrop-blur-md bg-black/70" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in my-8">
            <button onClick={() => setShowViewBillsModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-black mb-2 dark:text-white">{selectedMahajan.name} - Bills</h2>
            <p className="text-zinc-500 mb-6 font-medium">Total Balance: <span className="text-red-600 dark:text-red-400 font-black text-xl">₹{selectedMahajan.balance}</span></p>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {mahajanBills.length === 0 && <p className="text-zinc-500 text-center py-8">Koi bill nahi hai</p>}
              {mahajanBills.map(bill => (
                <div key={bill.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span className="text-red-600 dark:text-red-400 font-black text-xl">₹{bill.amount}</span>
                        {bill.type === 'expense' && (
                          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-md font-bold">Expense</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{bill.description || 'No description'}</p>
                      {bill.bill_image && (
                        <div className="mt-2">
                          <img 
                            src={bill.bill_image} 
                            alt="Bill" 
                            className="max-w-full h-auto rounded-lg border border-zinc-300 dark:border-zinc-600 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(bill.bill_image, '_blank')}
                            style={{ maxHeight: '200px' }}
                          />
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Click image to view full size</p>
                        </div>
                      )}
                    </div>
                    {bill.type !== 'expense' && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditBill(bill)} 
                          className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:scale-105 transition-transform"
                          title="Edit Bill"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteBill(bill.id.replace('bill_', ''))} 
                          className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:scale-105 transition-transform"
                          title="Delete Bill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Mahajan Modal */}
      {showEditMahajanModal && selectedMahajan && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start p-4 overflow-y-auto pt-20 backdrop-blur-md bg-black/70" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in">
            <button onClick={() => setShowEditMahajanModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black mb-6 dark:text-white">Edit Mahajan</h2>
            
            <form onSubmit={handleUpdateMahajan} className="space-y-4">
              <UI_Input 
                label="Vendor Name" 
                value={editMahajanForm.name} 
                onChange={e => setEditMahajanForm({ ...editMahajanForm, name: e.target.value })} 
                required 
              />
              <UI_Input 
                label="Phone" 
                type="tel"
                value={editMahajanForm.phone} 
                onChange={e => setEditMahajanForm({ ...editMahajanForm, phone: validatePhone(e.target.value) })} 
                placeholder="10 digit mobile number"
                maxLength="10"
              />
              <div className="pt-2">
                <UI_Button type="submit" variant="secondary" className="w-full">Update Mahajan</UI_Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Vendor Modal */}
      {payModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in">
            <button onClick={() => setPayModal({ isOpen: false, id: null, name: '', balance: 0, amount: '' })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black mb-1 dark:text-white">{t('Pay Vendor')}</h2>
            <p className="text-zinc-500 mb-2 font-medium">{payModal.name}</p>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3 rounded-2xl mb-6">
              <p className="text-red-700 dark:text-red-400 font-bold">Current Due: ₹{payModal.balance}</p>
            </div>
            <form onSubmit={confirmPayMahajan} className="space-y-4">
              <UI_Input label="Amount to Pay (₹)" type="number" value={payModal.amount} onChange={e => setPayModal({...payModal, amount: e.target.value})} required autoFocus />
              <div className="pt-2"><UI_Button type="submit" variant="success">Confirm Payment</UI_Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// --- SHOP SETTINGS PAGE ---
function ShopSettingsPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ shop_name: '', tagline: '', owner_name: '', phone: '', phone2: '', address: '', city: '', upi_id: '', gstin: '', footer_note: '' });
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopFetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).then(d => { setForm(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await shopFetch(`${API_BASE_URL}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if(!passForm.oldPassword || !passForm.newPassword) return alert("Dono password daliye");
    try {
      const res = await shopFetch(`${API_BASE_URL}/api/settings/password`, {
         method: 'PUT', headers: {'Content-Type': 'application/json'},
         body: JSON.stringify(passForm)
      });
      const data = await res.json();
      if(res.ok) { alert(data.message || "Password badal gaya!"); setPassForm({oldPassword:'', newPassword:''}); }
      else alert(data.error || "Password change fail!");
    } catch(err) { alert("Error connecting server"); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t('Shop Settings')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">{t('Dukaan ki Jankari')}</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        {saved && <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-2"><BadgeCheck size={20} /> {t('Settings Saved!')}</div>}
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UI_Input label={t('Shop Name')} value={form.shop_name} onChange={e => setForm({...form, shop_name: e.target.value})} required />
          <UI_Input label={t('Tagline / Description')} value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} />
          <UI_Input label={t('Owner Name')} value={form.owner_name} onChange={e => setForm({...form, owner_name: e.target.value})} />
          <UI_Input label={t('Primary Phone')} type="tel" value={form.phone} onChange={e => setForm({...form, phone: validatePhone(e.target.value)})} placeholder="10 digit mobile number" maxLength="10" />
          <UI_Input label={t('Alternate Phone')} type="tel" value={form.phone2} onChange={e => setForm({...form, phone2: validatePhone(e.target.value)})} placeholder="10 digit mobile number" maxLength="10" />
          <UI_Input label={t('Address')} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <UI_Input label={t('City / State')} value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
          <UI_Input label={t('UPI ID (for QR)')} value={form.upi_id} onChange={e => setForm({...form, upi_id: e.target.value})} />
          <UI_Input label={t('GSTIN (Optional)')} value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})} />
          <UI_Input label={t('Invoice Footer Note')} value={form.footer_note} onChange={e => setForm({...form, footer_note: e.target.value})} />
          <div className="md:col-span-2 pt-2"><UI_Button type="submit" variant="primary">{t('Save Settings')}</UI_Button></div>
        </form>
        
        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
           <h3 className="text-xl font-bold dark:text-white mb-2">Reset Today's Entry</h3>
           <p className="text-sm text-zinc-500 mb-4">Sirf aaj ka income, principle aur expense entries delete ho jayenge. Baaki data safe rahega.</p>
           <button type="button" onClick={async () => {
             if (!window.confirm("Kya aap sach mein aaj ka saara entry (Income, Principle, Expense) reset karna chahte hain? Ye action undo nahi ho sakta.")) return;
             try {
               const res = await shopFetch(`${API_BASE_URL}/api/settings/reset-today`, { method: 'POST' });
               const data = await res.json();
               if (res.ok) { alert(data.message || "Aaj ka entry reset ho gaya!"); }
               else { alert(data.error || "Reset fail ho gaya."); }
             } catch(err) { alert("Server se connection fail."); }
           }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-2xl transition-all active:scale-95">
             Reset Today's Entry
           </button>
        </div>
        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
           <h3 className="text-xl font-bold dark:text-white mb-4">Change Password</h3>
           <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <UI_Input type="password" label="Old Password" value={passForm.oldPassword} onChange={e => setPassForm({...passForm, oldPassword: e.target.value})} required />
              <UI_Input type="password" label="New Password" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} required />
              <div className="pb-1"><UI_Button type="submit" variant="secondary">Change Password</UI_Button></div>
           </form>
        </div>
      </div>
    </div>
  );
}

// --- SUPER ADMIN SECTION ---
function SuperAdminSection({ isDarkMode, toggleTheme }) {
  const { t } = useTranslation();
  const [isSAAuth, setIsSAAuth] = useState(() => sessionStorage.getItem('sa_auth') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [newShop, setNewShop] = useState({ shop_name: '', owner_name: '', phone: '', city: '', admin_username: '', admin_password: '', plan: 'Free' });

  useEffect(() => { if (isSAAuth) fetchShops(); }, [isSAAuth]);

  const fetchShops = () => { setLoading(true); fetch(`${API_BASE_URL}/api/superadmin/shops`).then(r => r.json()).then(d => { setShops(d); setLoading(false); }).catch(() => setLoading(false)); };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE_URL}/api/superadmin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (res.ok) { sessionStorage.setItem('sa_auth', 'true'); setIsSAAuth(true); }
    else { const d = await res.json(); setError(d.error || 'Invalid credentials'); }
  };

  const toggleShop = async (id) => {
    await fetch(`${API_BASE_URL}/api/superadmin/shops/${id}/toggle`, { method: 'PUT' });
    fetchShops();
  };

  const handleAddShop = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE_URL}/api/superadmin/shops`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newShop) });
    setAddModal(false);
    setNewShop({ shop_name: '', owner_name: '', phone: '', city: '', admin_username: '', admin_password: '', plan: 'Free' });
    fetchShops();
  };

  const logout = () => { sessionStorage.removeItem('sa_auth'); setIsSAAuth(false); };

  if (!isSAAuth) return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-zinc-950 font-sans ${isDarkMode ? 'dark' : ''}`}>
      <div className="w-full max-w-sm bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-zinc-800">
        <div className="flex justify-center mb-6"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl"><Shield className="text-white" size={32} /></div></div>
        <h1 className="text-3xl font-black text-white text-center mb-1">Super Admin</h1>
        <p className="text-zinc-500 text-center text-sm font-medium mb-8">SweetCraft SaaS Control Panel</p>
        {error && <p className="text-red-400 font-bold text-sm text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-red-500" placeholder={t('Username')} value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-red-500" placeholder={t('Password')} value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all active:scale-95">Login as Super Admin</button>
        </form>
      </div>
    </div>
  );

  const activeCount = shops.filter(s => s.is_active).length;

  return (
    <div className={`min-h-screen bg-zinc-950 font-sans text-white ${isDarkMode ? 'dark' : ''}`}>
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center"><Shield size={22} /></div>
          <div><h1 className="text-xl font-black">Super Admin</h1><p className="text-xs text-zinc-500 font-medium">SweetCraft SaaS Control</p></div>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-zinc-400 font-medium">{activeCount}/{shops.length} Active</span>
          <button onClick={() => setAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all active:scale-95"><PlusCircle size={16} /> New Shop</button>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-sm transition-all"><LogOut size={16} /> {t('Logout')}</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"><p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total Shops</p><h3 className="text-4xl font-black">{shops.length}</h3></div>
          <div className="bg-emerald-950/50 border border-emerald-900/50 p-6 rounded-2xl"><p className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2">Active</p><h3 className="text-4xl font-black text-emerald-400">{activeCount}</h3></div>
          <div className="bg-red-950/50 border border-red-900/50 p-6 rounded-2xl"><p className="text-red-500 text-xs font-bold uppercase tracking-wider mb-2">Suspended</p><h3 className="text-4xl font-black text-red-400">{shops.length - activeCount}</h3></div>
        </div>

        <h2 className="text-xl font-black mb-4">Registered Shops</h2>
        {loading ? <div className="text-center py-12 text-zinc-500">Loading...</div> : (
          <div className="space-y-3">
            {shops.map(shop => (
              <div key={shop.id} className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${shop.is_active ? 'border-zinc-800' : 'border-red-900/50 opacity-70'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold">{shop.shop_name}</h3>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${shop.plan === 'Pro' ? 'bg-purple-900/50 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>{shop.plan}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${shop.is_active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>{shop.is_active ? '● Active' : '○ Suspended'}</span>
                  </div>
                  <p className="text-zinc-400 text-sm mt-1">{shop.owner_name} • {shop.city} • @{shop.admin_username}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">Joined: {shop.joined_date} | Phone: {shop.phone}</p>
                </div>
                <button onClick={() => toggleShop(shop.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 flex-shrink-0 ${shop.is_active ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50'}`}>
                  {shop.is_active ? <><ToggleRight size={18}/> Suspend</> : <><ToggleLeft size={18}/> Activate</>}
                </button>
              </div>
            ))}
            {shops.length === 0 && <div className="text-center py-12 text-zinc-600">Koi shop registered nahi hai abhi.</div>}
          </div>
        )}
      </main>

      {addModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-start justify-center z-[100] p-4 overflow-y-auto pt-20" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 w-full max-w-md">
            <h2 className="text-xl font-black mb-6">Register New Shop</h2>
            <form onSubmit={handleAddShop} className="space-y-4">
              <input className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Dukaan ka Naam *" value={newShop.shop_name} onChange={e => setNewShop({...newShop, shop_name: e.target.value})} required />
              <input className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Malik ka Naam *" value={newShop.owner_name} onChange={e => setNewShop({...newShop, owner_name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-3">
                <input type="tel" className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder="10 digit mobile" value={newShop.phone} onChange={e => setNewShop({...newShop, phone: validatePhone(e.target.value)})} maxLength="10" />
                <input className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Sheher" value={newShop.city} onChange={e => setNewShop({...newShop, city: e.target.value})} />
              </div>
              <input className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Admin Username *" value={newShop.admin_username} onChange={e => setNewShop({...newShop, admin_username: e.target.value})} required />
              <input type="password" className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Admin Password *" value={newShop.admin_password} onChange={e => setNewShop({...newShop, admin_password: e.target.value})} required />
              <select className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white outline-none" value={newShop.plan} onChange={e => setNewShop({...newShop, plan: e.target.value})}>
                <option value="Free">Free Plan</option><option value="Pro">Pro Plan</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddModal(false)} className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition-all">Register Shop</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;