import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Package, Users, ShoppingBag,
  IndianRupee, LayoutDashboard, Menu, X, UserPen, History,
  CheckCircle, Clock, ArrowDownRight, ArrowUpRight, Edit2, RotateCcw,
  Moon, Sun, LogOut, ChevronRight, Droplets, Trash2, Store, ImagePlus, Search, Sparkles, Flame, Info, Phone, MapPin, LayoutGrid, List, Coffee, ReceiptText, Briefcase, Printer, MessageCircle, Languages
} from 'lucide-react';

import MenuCard from './MenuCard';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';


// --- MAIN APP WRAPPER WITH THEME & AUTH ---
function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const login = () => { setIsAuthenticated(true); localStorage.setItem('isAuthenticated', 'true'); };
  const logout = () => { setIsAuthenticated(false); localStorage.setItem('isAuthenticated', 'false'); };

  return (
    <Router>
      <Routes>
        {/* NAYA: Public Route for Customers */}
        <Route path="/menu" element={<PublicMenuCard toggleTheme={toggleTheme} isDarkMode={isDarkMode} />} />
        
        {/* Admin/Private Routes */}
        <Route path="/*" element={
          isAuthenticated ? (
            <AdminLayout logout={logout} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
          ) : (
            <LoginScreen onLogin={login} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          )
        } />
      </Routes>
    </Router>
  );
}

// Admin Layout Component
function AdminLayout({ logout, toggleTheme, isDarkMode }) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-900 dark:text-zinc-50 antialiased selection:bg-purple-500/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border-r border-zinc-200 dark:border-zinc-800 flex-shrink-0 z-20 transition-all">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Droplets className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 tracking-tight">SweetCraft</h2>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Poddar Solutions</p>
          </div>
        </div>
        <nav className="px-4 py-2 space-y-2 flex-1 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label={t("Overview")} />
          <NavItem to="/inventory" icon={<Package size={20} />} label={t("Stock & Inventory")} />
          <NavItem to="/orders" icon={<ShoppingBag size={20} />} label={t("Party Orders")} />
          <NavItem to="/staff" icon={<Users size={20} />} label={t("Staff Khata")} />
          <NavItem to="/debt" icon={<IndianRupee size={20} />} label={t("Market Udhari")} />
          <NavItem to="/reports" icon={<History size={20} />} label={t("All Reports")} />
          <NavItem to="/menu-manager" icon={<Store size={20} />} label={t("Menu Manager")} />
          <NavItem to="/expenses" icon={<ReceiptText size={20} />} label={t("Daily Expenses")} />
          <NavItem to="/mahajan" icon={<Briefcase size={20} />} label={t("Mahajan Manager")} />
        </nav>
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-500">{t("Theme")} / Lang</span>
            <div className="flex gap-2">
              <button onClick={toggleLanguage} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all" title="Change Language">
                <Languages size={18} />
              </button>
              <button onClick={toggleTheme} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
          <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-2xl transition-all active:scale-95">
            <LogOut size={18} /> {t("Logout")}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden flex items-center justify-between px-6 pb-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
              <Droplets className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-black text-zinc-800 dark:text-white tracking-tight">SweetCraft</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleLanguage} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all">
              <Languages size={20} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-28 md:pb-8">
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
          </Routes>
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border-t border-zinc-200/50 dark:border-zinc-800/50 pb-safe pt-2 px-4 sm:px-6 z-50">
          <div className="flex justify-between items-center pb-2">
            <BottomNavItem to="/" icon={<LayoutDashboard size={24} />} label={t("Home")} />
            <BottomNavItem to="/inventory" icon={<Package size={24} />} label={t("Stock")} />
            <BottomNavItem to="/orders" icon={<ShoppingBag size={24} />} label={t("Orders")} />
            <BottomNavItem to="/debt" icon={<IndianRupee size={24} />} label={t("Udhari")} />
            <BottomNavItem to="/menu-manager" icon={<Store size={24} />} label={t("Menu")} />
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold group ${isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}`}>
      <span className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function BottomNavItem({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className="flex flex-col items-center justify-center w-14 group">
      <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 scale-110' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'} active:scale-95`}>
        {icon}
      </div>
      <span className={`text-[10px] mt-1 font-semibold transition-colors ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400 dark:text-zinc-500'}`}>{label}</span>
    </Link>
  );
}

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
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans ${isDarkMode ? 'dark' : ''} transition-colors duration-500 relative overflow-hidden`}>
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-600/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-[3rem] p-10 shadow-2xl border border-white/20 dark:border-zinc-800/50 relative z-10">
        <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-white/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:scale-105 active:scale-95 transition-all shadow-sm">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="flex justify-center mb-8 mt-4">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
            <Droplets className="text-white" size={40} />
          </div>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-2">Welcome Back</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">SweetCraft Manager Pro</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-4">
          <UI_Input placeholder="Username" required />
          <UI_Input type="password" placeholder="Password" required />
          <div className="pt-4">
            <UI_Button type="submit" variant="primary"><span>Secure Login</span> <ChevronRight size={20} /></UI_Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- DASHBOARD PAGE ---
function Dashboard() {
  const { t } = useTranslation(); // 👈 NAYA HOOK ADD KIYA
  const [alerts, setAlerts] = useState({ expiring_items: [], upcoming_orders: [], low_stock_items: [] });
  const [staffList, setStaffList] = useState([]);
  const [metrics, setMetrics] = useState({ totalUdhari: 0, totalPendingOrders: 0, totalPresentStaff: 0 });

  useEffect(() => {
    fetch(API_BASE_URL + '/api/dashboard/alerts').then(res => res.json()).then(data => { if (data) setAlerts(data); }).catch(() => { });
    fetch(API_BASE_URL + '/api/staff').then(res => res.json()).then(data => {
      setStaffList(data); setMetrics(prev => ({ ...prev, totalPresentStaff: data.filter(s => s.today_attendance === 'Present').length }));
    }).catch(() => { });
    fetch(API_BASE_URL + '/api/customers').then(res => res.json()).then(data => setMetrics(prev => ({ ...prev, totalUdhari: data.reduce((sum, c) => sum + c.balance, 0) }))).catch(() => { });
    fetch(API_BASE_URL + '/api/orders').then(res => res.json()).then(data => setMetrics(prev => ({ ...prev, totalPendingOrders: data.filter(o => o.status !== 'Delivered').length }))).catch(() => { });
  }, []);

  const getExpiryText = (dateStr) => {
    const diffDays = Math.ceil((new Date(dateStr) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return `Expired`;
    return `Expires in ${diffDays}d`;
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="pt-2">
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{t("Overview")}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium text-lg">{t("Welcome back, here's your daily summary.")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <MetricCard title={t("Staff Present")} value={metrics.totalPresentStaff} sub={`/ ${staffList.length}`} icon={<Users size={28} />} gradient="from-emerald-400 to-teal-500" />
        <MetricCard title={t("Market Udhari")} value={`₹${metrics.totalUdhari}`} icon={<IndianRupee size={28} />} gradient="from-orange-400 to-rose-500" />
        <MetricCard title={t("Pending Orders")} value={metrics.totalPendingOrders} icon={<ShoppingBag size={28} />} gradient="from-indigo-400 to-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {alerts.expiring_items?.length > 0 && (
          <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 md:p-8 rounded-[2.5rem]">
            <h2 className="text-xl font-extrabold text-red-700 dark:text-red-400 flex items-center mb-6"><AlertTriangle className="mr-2" size={24} /> {t("Expiring Stock")}</h2>
            <div className="space-y-3">
              {alerts.expiring_items.map(item => (
                <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.item_name}</p>
                    <p className="text-sm text-zinc-500">Stock: {item.quantity}</p>
                  </div>
                  <span className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-xs px-3 py-1.5 rounded-xl font-bold">{getExpiryText(item.expiry_date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alerts.upcoming_orders?.length > 0 && (
          <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 p-6 md:p-8 rounded-[2.5rem]">
            <h2 className="text-xl font-extrabold text-purple-700 dark:text-purple-400 flex items-center mb-6"><Clock className="mr-2" size={24} /> {t("Upcoming Orders")}</h2>
            <div className="space-y-3">
              {alerts.upcoming_orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">{order.customer_name}</p>
                  <span className="bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 text-xs px-3 py-1.5 rounded-xl font-bold tracking-wide">Del: {order.delivery_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alerts.low_stock_items?.length > 0 && (
          <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-6 md:p-8 rounded-[2.5rem] lg:col-span-2">
            <h2 className="text-xl font-extrabold text-orange-700 dark:text-orange-400 flex items-center mb-6"><AlertTriangle className="mr-2" size={24} /> {t("Low Stock Alerts")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.low_stock_items.map(item => (
                <div key={'low'+item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.item_name}</p>
                    <p className="text-sm text-zinc-500 font-medium tracking-wide">Stock Left: {item.quantity} (Limit: {item.min_stock})</p>
                  </div>
                  <span className="bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-xs px-3 py-1.5 rounded-xl font-bold">Low Stock</span>
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
    <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold tracking-wide mb-2 ml-1 uppercase text-xs">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">{value}</h3>
            {sub && <span className="text-zinc-400 font-bold">{sub}</span>}
          </div>
        </div>
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// --- INVENTORY PAGE ---
function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({ item_name: '', quantity: '', expiry_date: '', min_stock: '5' });
  const [searchQuery, setSearchQuery] = useState(''); // Naya Search State

  const fetchInventory = () => fetch(`${API_BASE_URL}/api/inventory`).then(res => res.json()).then(setInventory).catch(() => setInventory([]));
  useEffect(() => { fetchInventory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory`, { 
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
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}/${type}`, { 
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
      const response = await fetch(`${API_BASE_URL}/api/inventory/item/${encodeURIComponent(itemName)}`, { method: 'DELETE' });
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
    <div className="animate-fade-in space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Stock</h1></div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h2 className="text-xl font-extrabold mb-6 dark:text-white">Add New Stock</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
          <div className="md:col-span-2">
            <UI_Input 
              label="Item Name" 
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
          <UI_Input label="Qty" type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} required />
          <UI_Input label="Limit (Alert)" type="number" min="1" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: e.target.value })} required />
          <UI_Input label="Expiry Date" type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} required />
          <div className="md:col-span-4 lg:col-span-1"><UI_Button type="submit" variant="secondary">Add</UI_Button></div>
        </form>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Current Stock</h2>
          <div className="relative w-full md:w-72">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
             <input type="text" placeholder="Search stock item..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
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
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-2 border-b border-zinc-100 dark:border-zinc-800 pb-1">Expiry Batches</p>
              
              {group.batches.length > 0 ? (
                group.batches.sort((a,b) => new Date(a.expiry_date) - new Date(b.expiry_date)).map(batch => (
                  <div key={batch.id} className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold dark:text-zinc-200">Exp: {batch.expiry_date}</span>
                      <span className="text-sm font-bold text-zinc-500">Qty: {batch.quantity}</span>
                    </div>
                    <div className="flex gap-2">
                      <UI_Button onClick={() => handleStockAction(batch.id, 'out')} variant="warning" className="!py-1.5 !px-2 !text-xs flex-1"><ArrowUpRight size={14} /> Sale</UI_Button>
                      <UI_Button onClick={() => handleStockAction(batch.id, 'return')} variant="danger" className="!py-1.5 !px-2 !text-xs flex-1"><RotateCcw size={14} /> Return</UI_Button>
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
  const [staffList, setStaffList] = useState([]);
  const [todayPay, setTodayPay] = useState(0);
  const [formData, setFormData] = useState({ name: '', mobile: '', address: '', payment_type: 'Daily', base_salary: '' });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, staff: null, logs: [] });
  const [payModal, setPayModal] = useState({ isOpen: false, staffId: null, action: '', amount: '', note: '' });
  const [searchQuery, setSearchQuery] = useState(''); // Naya Search State

  const fetchStaff = () => { 
    const todayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0];
    fetch(API_BASE_URL + `/api/staff?date=${todayDate}`).then(res => res.json()).then(setStaffList).catch(() => { }); 
  };
  const fetchTodayPay = () => { fetch(API_BASE_URL + '/api/staff/today_pay').then(res => res.json()).then(data => setTodayPay(data.total_pay_today)).catch(() => { }); };
  
  useEffect(() => { fetchStaff(); fetchTodayPay(); }, []);

  const handleAddStaff = (e) => {
    e.preventDefault();
    fetch(API_BASE_URL + '/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      .then(() => { setFormData({ name: '', mobile: '', address: '', payment_type: 'Daily', base_salary: '' }); fetchStaff(); });
  };

  const handleAttendance = (id, status) => {
    const todayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60 * 1000)).toISOString().split('T')[0];
    fetch(`${API_BASE_URL}/api/staff/${id}/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, date: todayDate }) }).then(fetchStaff);
  };

  const submitFinance = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/staff/${payModal.staffId}/advance_clear`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ action: payModal.action, amount: Number(payModal.amount), note: payModal.note }) 
    }).then(() => { 
      setPayModal({ isOpen: false, staffId: null, action: '', amount: '', note: '' });
      fetchStaff(); 
      fetchTodayPay(); 
    });
  };

  const handleViewHistory = (staff) => {
    fetch(`${API_BASE_URL}/api/staff/${staff.id}/history`)
      .then(res => res.json())
      .then(data => setHistoryModal({ isOpen: true, staff, logs: data }))
      .catch(() => {});
  };

  // Search Filter
  const filteredStaff = staffList.filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (staff.mobile && staff.mobile.includes(searchQuery))
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Staff Khata</h1></div>

      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 md:p-8 rounded-[2.5rem] text-white shadow-lg flex justify-between items-center">
          <div>
              <p className="text-purple-100 font-bold tracking-wide mb-1 uppercase text-xs">Total Pay Given Today</p>
              <h3 className="text-4xl md:text-5xl font-black">₹{todayPay}</h3>
          </div>
          <Users size={48} className="text-white/30" />
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h2 className="text-xl font-extrabold mb-6 dark:text-white">Register New Staff</h2>
        <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <UI_Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <UI_Input label="Mobile" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
          <div className="md:col-span-2"><UI_Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
          <UI_Select label="Pay Type" options={[{ label: 'Daily Wage', value: 'Daily' }, { label: 'Monthly Salary', value: 'Monthly' }]} value={formData.payment_type} onChange={e => setFormData({ ...formData, payment_type: e.target.value })} />
          <UI_Input label="Amount (₹)" type="number" value={formData.base_salary} onChange={e => setFormData({ ...formData, base_salary: e.target.value })} required />
          <div className="md:col-span-2"><UI_Button type="submit" variant="secondary">Add Staff</UI_Button></div>
        </form>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">All Staff</h2>
          <div className="relative w-full md:w-72">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
             <input type="text" placeholder="Search staff name or mobile..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(staff => (
          <div key={staff.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{staff.name}</h3>
                {staff.mobile && <a href={`tel:${staff.mobile}`} className="text-blue-500 font-medium mt-1 inline-flex items-center gap-1 hover:underline"><UserPen size={14}/> {staff.mobile}</a>}
                <p className="text-zinc-500 font-medium mt-1">₹{staff.base_salary} <span className="text-xs">/{staff.payment_type === 'Daily' ? 'day' : 'mo'}</span></p>
              </div>
              <div className={`px-3 py-1.5 rounded-xl font-bold text-sm ${staff.balance < 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>₹{staff.balance.toFixed(0)}</div>
            </div>

            <div className="space-y-3 mt-2">
              {staff.today_attendance ? (
                <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-500 font-bold text-sm">Attendance</span>
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
                  <UI_Button onClick={() => handleAttendance(staff.id, 'Present')} variant="success" className="!py-2 !text-sm flex-1">Present</UI_Button>
                  <UI_Button onClick={() => handleAttendance(staff.id, 'Half Day')} variant="warning" className="!py-2 !text-sm flex-1">Half</UI_Button>
                  <UI_Button onClick={() => handleAttendance(staff.id, 'Absent')} variant="danger" className="!py-2 !text-sm flex-1">Absent</UI_Button>
                </div>
              )}
              
              <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <UI_Button onClick={() => setPayModal({isOpen: true, staffId: staff.id, action: 'advance', amount: '', note: ''})} variant="danger" className="!py-2 !text-sm flex-1">Pay</UI_Button>
                <UI_Button onClick={() => setPayModal({isOpen: true, staffId: staff.id, action: 'clear', amount: staff.balance, note: 'Settle all dues'})} variant="outline" className="!py-2 !text-sm flex-1">Settle</UI_Button>
                <UI_Button onClick={() => handleViewHistory(staff)} variant="secondary" className="!py-2 !text-sm flex-1"><History size={14}/> Log</UI_Button>
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
            <h2 className="text-2xl font-black mb-6 dark:text-white">{payModal.action === 'advance' ? 'Pay Staff Amount' : 'Settle Staff Dues'}</h2>
            
            <form onSubmit={submitFinance} className="space-y-4">
               {payModal.action === 'advance' && <UI_Input label="Amount (₹)" type="number" value={payModal.amount} onChange={e=>setPayModal({...payModal, amount: e.target.value})} required />}
               <UI_Input label="Note / Detail" placeholder="kis cheez ke liye pay kar rhe ho..." value={payModal.note} onChange={e=>setPayModal({...payModal, note: e.target.value})} required={payModal.action==='advance'} />
               <div className="pt-4"><UI_Button type="submit" variant={payModal.action === 'advance' ? 'danger' : 'success'}>Confirm {payModal.action === 'advance' ? 'Pay' : 'Settle'}</UI_Button></div>
            </form>
          </div>
        </div>
      )}

      {historyModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in flex flex-col max-h-[90vh]">
             <button onClick={() => setHistoryModal({isOpen:false, staff:null, logs:[]})} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20}/></button>
             <h2 className="text-2xl font-black mb-1 dark:text-white">{historyModal.staff.name}'s History</h2>
             <p className="text-zinc-500 mb-6 font-medium">Detailed Ledger & Attendance</p>
             <div className="overflow-y-auto flex-1 pr-2">
                <div className="space-y-3">
                   {historyModal.logs.length === 0 && <p className="text-zinc-500">No records found.</p>}
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
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentItem, setCurrentItem] = useState('');
  const [currentQty, setCurrentQty] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  
  const [formData, setFormData] = useState({ customer_name: '', phone: '', address: '', delivery_date: '', total_amount: '', advance_paid: '' });
  const [deliveryModal, setDeliveryModal] = useState({ isOpen: false, order: null, paidNow: '' });
  const [searchQuery, setSearchQuery] = useState(''); 
  const navigate = useNavigate();

  const fetchOrders = () => { fetch(API_BASE_URL + '/api/orders').then(res => res.json()).then(setOrders).catch(() => { }); };
  useEffect(() => { 
    fetchOrders(); 
    fetch(API_BASE_URL + '/api/menu').then(res => res.json()).then(setMenuItems).catch(()=>{});
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

  const handleAddOrder = (e) => {
    e.preventDefault();
    if(selectedItems.length === 0) return alert("Please add at least one item to the order.");
    
    let finalDiscount = 0;
    if(calculatedTotal > Number(formData.total_amount)) {
        finalDiscount = calculatedTotal - Number(formData.total_amount);
    }
    
    const submitData = { ...formData, items_details: selectedItems.join(', '), discount: finalDiscount };
    
    fetch(API_BASE_URL + '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitData) })
      .then(() => { 
        setFormData({ customer_name: '', phone: '', address: '', delivery_date: '', total_amount: '', advance_paid: '' }); 
        setSelectedItems([]);
        setCalculatedTotal(0);
        fetchOrders(); 
      });
  };

  const handleStatusChange = (id, newStatus) => {
    fetch(`${API_BASE_URL}/api/orders/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }).then(fetchOrders);
  };

  // NAYA: Order Cancel/Delete karne ka function
  const handleDeleteOrder = async (id, customerName) => {
    if (!window.confirm(`Kya aap sach me '${customerName}' ka order cancel/delete karna chahte hain?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, { method: 'DELETE' });
      if (res.ok) fetchOrders();
    } catch (error) {
      alert("Order delete fail ho gaya. Network check karein.");
    }
  };

  const confirmDelivery = (action) => {
    fetch(`${API_BASE_URL}/api/orders/${deliveryModal.order.id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Delivered', paid_now: Number(deliveryModal.paidNow), action: action })
    }).then(() => { 
       setDeliveryModal({ isOpen: false, order: null, paidNow: '' }); 
       if (action === 'udhari') navigate('/debt'); else fetchOrders(); 
    });
  };

  const printBill = (order) => {
    const itemsList = order.items_details.split(',').map(item => `<li>${item.trim()}</li>`).join('');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.customer_name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #6b21a8; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #6b21a8; font-size: 32px; letter-spacing: -1px; }
            .header p { margin: 5px 0 0; color: #666; font-size: 14px; font-weight: 500; }
            .details { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 15px; background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .details-col p { margin: 5px 0; }
            .items-box { margin-bottom: 25px; }
            .items-box h3 { margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; color: #374151; font-size: 18px; }
            .items-box ul { list-style-type: none; padding: 0; margin: 0; }
            .items-box li { padding: 10px 5px; border-bottom: 1px dashed #d1d5db; font-size: 15px; color: #4b5563; }
            .items-box li:last-child { border-bottom: none; }
            .totals-container { display: flex; justify-content: flex-end; }
            .totals { width: 100%; max-width: 320px; border-collapse: collapse; }
            .totals td { padding: 10px 8px; text-align: right; border-bottom: 1px solid #f3f4f6; font-size: 15px; }
            .totals td:first-child { text-align: left; font-weight: bold; color: #4b5563; }
            .due-row td { font-size: 20px; font-weight: 900; color: #dc2626; border-bottom: none; border-top: 2px solid #e5e7eb; padding-top: 15px; }
            .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
            .footer strong { color: #374151; font-size: 15px; display: block; margin-bottom: 5px; }
            @media print {
              body { padding: 0; }
              .items-box li { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SweetCraft</h1>
            <p>Main Market, Deoghar, Jharkhand | Phone: +91 98765 43210</p>
          </div>
          <div class="details">
            <div class="details-col">
              <p><strong>Billed To:</strong> ${order.customer_name}</p>
              <p><strong>Phone:</strong> ${order.phone}</p>
              ${order.address ? `<p><strong>Address:</strong> ${order.address}</p>` : ''}
            </div>
            <div class="details-col" style="text-align: right;">
              <p><strong>Order No:</strong> #${order.id || Math.floor(Math.random() * 10000)}</p>
              <p><strong>Delivery Date:</strong> ${order.delivery_date}</p>
            </div>
          </div>
          <div class="items-box">
            <h3>Order Details</h3>
            <ul>
              ${itemsList}
            </ul>
          </div>
          <div class="totals-container">
            <table class="totals">
              <tr>
                <td>Total Amount:</td>
                <td>₹${order.total_amount}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td>Discount / Saved:</td>
                <td style="color: #059669;">- ₹${order.discount}</td>
              </tr>` : ''}
              <tr>
                <td>Advance Paid:</td>
                <td style="color: #059669;">- ₹${order.advance_paid}</td>
              </tr>
              <tr class="due-row">
                <td>Due Amount:</td>
                <td>₹${order.total_amount - order.advance_paid}</td>
              </tr>
            </table>
          </div>
          <div class="footer">
            <strong>Thank you for your business!</strong>
            <p>For any queries or future orders, please contact us at +91 98765 43210</p>
            <p style="margin-top: 15px; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">Powered by Poddar Solutions</p>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(() => { window.print(); }, 200); 
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareWhatsapp = (order) => {
      const text = `Hello ${order.customer_name},\nHere are your order details from *SweetCraft*:\n\n*Items:* \n${order.items_details.split(', ').join('\n')}\n\n*Total Amount:* ₹${order.total_amount}\n*Advance Paid:* ₹${order.advance_paid}\n*Due Amount:* ₹${order.total_amount - order.advance_paid}\n*Delivery Date:* ${order.delivery_date}\n\nThank you!`;
      window.open(`https://wa.me/91${order.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Search Filter
  const filteredOrders = orders.filter(o => 
    o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (o.phone && o.phone.includes(searchQuery)) ||
    o.items_details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Party Orders</h1></div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h2 className="text-xl font-extrabold mb-6 dark:text-white">Book New Order</h2>
        <form onSubmit={handleAddOrder} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <UI_Input label="Customer Name" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} required />
          <UI_Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
          <div className="md:col-span-2"><UI_Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
          <UI_Input label="Delivery Date" type="date" value={formData.delivery_date} onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} required />
          
          <div className="lg:col-span-3 flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full">
                <UI_Input label="Search/Select Menu Item (Or type custom)" list="order-menu-items" placeholder="Search item..." value={currentItem} onChange={e=>handleItemSelect(e.target.value)} />
                <datalist id="order-menu-items">
                    {menuItems.map(m => <option key={m.id} value={m.name} />)}
                </datalist>
             </div>
             <div className="w-full md:w-28"><UI_Input label="Price/Unit" type="number" value={currentPrice} onChange={e=>setCurrentPrice(e.target.value)} placeholder="₹" /></div>
             <div className="w-full md:w-28"><UI_Input label="Qty" type="number" value={currentQty} onChange={e=>setCurrentQty(e.target.value)} /></div>
             <UI_Button onClick={addItemToOrder} variant="secondary" className="!w-full md:!w-auto h-[50px]"><Package size={18}/> Add Item</UI_Button>
          </div>

          {selectedItems.length > 0 && (
              <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                     <strong className="text-purple-600 dark:text-purple-400">Order Items:</strong>
                     <strong className="text-zinc-600 dark:text-zinc-300">Sum Total: ₹{calculatedTotal}</strong>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedItems.map((itm, i) => (
                       <span key={i} className="bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg font-semibold shadow-sm border border-zinc-100 dark:border-zinc-800 flex justify-between">
                           <span>{itm.split(' - ')[0]}</span>
                           <span className="text-purple-600 dark:text-purple-400">{itm.split(' - ')[1]}</span>
                       </span>
                    ))}
                  </div>
              </div>
          )}

          <div className="w-full relative">
             <UI_Input label="Final Total Cost (₹)" type="number" value={formData.total_amount} onChange={e => setFormData({ ...formData, total_amount: e.target.value })} required />
             {calculatedTotal > Number(formData.total_amount) && formData.total_amount !== '' && (
                 <span className="absolute -bottom-5 left-1 text-xs font-bold text-emerald-500">Discount Added: ₹{calculatedTotal - formData.total_amount}</span>
             )}
          </div>
          <UI_Input label="Advance Paid (₹)" type="number" value={formData.advance_paid} onChange={e => setFormData({ ...formData, advance_paid: e.target.value })} />
          <div className="md:col-span-2"><UI_Button type="submit" variant="primary">Book Order</UI_Button></div>
        </form>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Pending & In Progress</h2>
          <div className="relative w-full md:w-72">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
             <input type="text" placeholder="Search customer, phone or item..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
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
              {order.status === 'Pending' && <UI_Button onClick={() => handleStatusChange(order.id, 'In Progress')} variant="success" className="!py-2 !px-4"><ArrowUpRight size={16}/> Start</UI_Button>}
              {order.status === 'In Progress' && <UI_Button onClick={() => setDeliveryModal({ isOpen: true, order, paidNow: order.total_amount - order.advance_paid })} variant="secondary" className="bg-zinc-900 text-white !py-2 !px-4"><CheckCircle size={16}/> Deliver</UI_Button>}
            </div>
          </div>
        ))}
        {filteredOrders.filter(o => o.status !== 'Delivered').length === 0 && <p className="text-zinc-500 p-4">No pending orders match your search.</p>}
      </div>

      <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-8 mb-4">Delivered Orders</h2>
      <div className="flex flex-col gap-4">
        {filteredOrders.filter(o => o.status === 'Delivered').map(order => (
          <div key={order.id} className="bg-zinc-50 dark:bg-zinc-900/50 opacity-75 hover:opacity-100 transition-opacity rounded-[1.5rem] p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
            <div className="pl-3 flex-1 flex flex-col md:flex-row gap-4 md:items-center w-full">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold dark:text-white">{order.customer_name} <span className="text-emerald-600 text-xs ml-2"><CheckCircle size={14} className="inline" /> Delivered</span></h3>
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
                {order.is_due_cleared ? <p className="text-emerald-500 font-bold text-xs">Dues Cleared</p> : <p className="text-orange-500 font-bold text-xs">Due in Udhari</p>}
              </div>
            </div>
            {/* Delivered Order Delete Button (Optional, agar isko bhi delete karna ho) */}
            <div className="hidden md:flex flex-col justify-center border-l border-zinc-200 dark:border-zinc-800 pl-3">
                <button onClick={() => handleDeleteOrder(order.id, order.customer_name)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition opacity-0 group-hover:opacity-100" title="Delete Log"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {filteredOrders.filter(o => o.status === 'Delivered').length === 0 && <p className="text-zinc-500 p-4">No delivered orders match your search.</p>}
      </div>

      {deliveryModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in">
            <button onClick={() => setDeliveryModal({ isOpen: false })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-1 dark:text-white">Complete Order</h2>
            <p className="text-zinc-500 mb-6 font-medium">Customer: <span className="text-zinc-900 dark:text-white">{deliveryModal.order.customer_name}</span></p>

            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl mb-6">
              <p className="text-red-700 dark:text-red-400 font-bold">Total Due: ₹{deliveryModal.order.total_amount - deliveryModal.order.advance_paid}</p>
            </div>

            <div className="mb-6">
              <UI_Input label="Amount Received Now (₹)" type="number" value={deliveryModal.paidNow} onChange={e => setDeliveryModal({ ...deliveryModal, paidNow: e.target.value })} />
            </div>

            <div className="flex gap-3">
              <UI_Button onClick={() => confirmDelivery('settle')} variant="success" className="flex-1">Complete</UI_Button>
              <UI_Button onClick={() => confirmDelivery('udhari')} variant="warning" className="flex-1">To Udhari</UI_Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- DEBT PAGE ---
function DebtPage() {
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

  const fetchCustomers = () => { fetch(API_BASE_URL + '/api/customers').then(res => res.json()).then(setCustomers).catch(() => { }); };
  useEffect(() => { 
      fetchCustomers(); 
      fetch(API_BASE_URL + '/api/menu').then(res => res.json()).then(setMenuItems).catch(()=>{});
  }, []);

  const handleAddCustomer = (e) => {
    e.preventDefault();
    fetch(API_BASE_URL + '/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      .then(() => { setFormData({ name: '', phone: '', address: '' }); fetchCustomers(); });
  };

  // NAYA: Customer Delete karne ka function
  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Kya aap sach me '${name}' ka poora khata hamesha ke liye delete karna chahte hain? Iska saara hisaab mit jayega.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${id}`, { method: 'DELETE' });
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
    
    fetch(`${API_BASE_URL}/api/customers/${txnModal.customerId}/transaction`, { 
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
    fetch(`${API_BASE_URL}/api/customers/${customer.id}/history`)
      .then(res => res.json())
      .then(data => setHistoryModal({ isOpen: true, customer, logs: data }))
      .catch(() => {});
  };

  // Search Filter
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Market Udhari</h1></div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col items-end">
        <form onSubmit={handleAddCustomer} className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-end w-full">
          <UI_Input label="Customer Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <UI_Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
          <UI_Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          <UI_Button type="submit" variant="secondary">Add Khata</UI_Button>
        </form>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Udhari List</h2>
          <div className="relative w-full md:w-72">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
             <input type="text" placeholder="Search customer or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
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
                <span className="text-zinc-500 font-bold">Total Due</span>
                <span className={`px-4 py-2 rounded-xl font-bold ${c.balance > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  ₹{c.balance}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <UI_Button onClick={() => openTxnModal(c.id, 'give_udhar')} variant="danger" className="!py-2.5 !text-sm flex-1 bg-red-50 text-red-600"><ArrowUpRight size={16} /> Udhar</UI_Button>
              <UI_Button onClick={() => openTxnModal(c.id, 'receive_payment')} variant="success" className="!py-2.5 !text-sm flex-1"><ArrowDownRight size={16} /> Jama</UI_Button>
              <UI_Button onClick={() => handleViewHistory(c)} variant="secondary" className="!py-2.5 !text-sm flex-[0.5]" title="View History"><History size={16}/></UI_Button>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && <p className="text-zinc-500 col-span-full">Koi customer nahi mila.</p>}
      </div>

      {/* Transaction Modal */}
      {txnModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setTxnModal({ isOpen: false, customerId: null, action: '', amount: '' })} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20} /></button>
            <h2 className="text-2xl font-black mb-6 dark:text-white">{txnModal.action === 'give_udhar' ? 'Naya Udhar Bill' : 'Payment Receive'}</h2>
            
            <form onSubmit={submitTransaction} className="space-y-4">
               {txnModal.action === 'give_udhar' && (
                 <>
                   <div className="flex flex-col md:flex-row gap-3 items-end">
                     <div className="flex-1 w-full">
                         <UI_Input label="Search/Select Item (Or custom)" list="udhar-menu-items" placeholder="Search item..." value={currentItem} onChange={e=>handleItemSelect(e.target.value)} />
                         <datalist id="udhar-menu-items">
                             {menuItems.map(m => <option key={m.id} value={m.name} />)}
                         </datalist>
                     </div>
                     <div className="w-full md:w-20"><UI_Input label="Price" type="number" value={currentPrice} onChange={e=>setCurrentPrice(e.target.value)} placeholder="₹" /></div>
                     <div className="w-full md:w-20"><UI_Input label="Qty" type="number" value={currentQty} onChange={e=>setCurrentQty(e.target.value)} /></div>
                     <UI_Button onClick={addItemToUdhar} variant="secondary" className="!w-full md:!w-auto h-[50px]"><Package size={18}/> Add</UI_Button>
                   </div>
                   
                   {selectedItems.length > 0 && (
                      <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl text-sm border border-zinc-200 dark:border-zinc-800">
                          <strong className="text-purple-600 dark:text-purple-400 block mb-2">Udhar Items (Sum: ₹{calculatedTotal}):</strong> 
                          <div className="flex flex-wrap gap-2">
                            {selectedItems.map((itm, i) => (
                               <span key={i} className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg font-semibold shadow-sm border border-zinc-100 dark:border-zinc-800">{itm}</span>
                            ))}
                          </div>
                      </div>
                   )}
                 </>
               )}
               
               <UI_Input label={txnModal.action === 'give_udhar' ? "Final Amount (Edit to round off)" : "Received Amount (₹)"} type="number" value={txnModal.amount} onChange={e=>setTxnModal({...txnModal, amount: e.target.value})} required />
               <div className="pt-4"><UI_Button type="submit" variant={txnModal.action === 'give_udhar' ? 'danger' : 'success'}>Confirm Transaction</UI_Button></div>
            </form>
          </div>
        </div>
      )}

      {historyModal.isOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 lg:p-8 w-full max-w-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 relative animate-fade-in flex flex-col max-h-[90vh]">
             <button onClick={() => setHistoryModal({isOpen:false, customer:null, logs:[]})} className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><X size={20}/></button>
             <h2 className="text-2xl font-black mb-1 dark:text-white">{historyModal.customer.name}'s Ledger</h2>
             <p className="text-zinc-500 mb-6 font-medium">Udhari aur Payment ki details</p>
             <div className="overflow-y-auto flex-1 pr-2">
                <div className="space-y-3">
                   {historyModal.logs.length === 0 && <p className="text-zinc-500">No records found.</p>}
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
  const [reports, setReports] = useState({ inventory: [], returns: [], staff: [], customers: [] });
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => { fetch(API_BASE_URL + '/api/reports').then(res => res.json()).then(setReports).catch(() => { }); }, []);

  const TabButton = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)} className={`flex-1 py-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === id ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
      {label}
    </button>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Reports</h1></div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 mb-6 scrollbar-hide">
          <TabButton id="inventory" label="Inventory" />
          <TabButton id="returns" label="Returns" />
          <TabButton id="staff" label="Staff" />
          <TabButton id="customers" label="Customers" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 text-sm">
                {activeTab === 'inventory' && <><th className="pb-3 pl-4">Item</th><th className="pb-3">Action</th><th className="pb-3">Qty</th><th className="pb-3">Date</th></>}
                {activeTab === 'returns' && <><th className="pb-3 pl-4">Item</th><th className="pb-3">Return Qty</th><th className="pb-3">Date</th></>}
                {activeTab === 'staff' && <><th className="pb-3 pl-4">Staff Name</th><th className="pb-3">Details</th><th className="pb-3">Type</th><th className="pb-3">Amount</th><th className="pb-3">Date</th></>}
                {activeTab === 'customers' && <><th className="pb-3 pl-4">Customer Name</th><th className="pb-3">Transaction</th><th className="pb-3">Amount</th><th className="pb-3">Date</th></>}
              </tr>
            </thead>
            <tbody>
              {reports[activeTab].length === 0 && <tr><td colSpan="4" className="py-6 text-center text-zinc-500">No records found.</td></tr>}
              {reports[activeTab].map(row => (
                <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-950/50">
                  {activeTab === 'inventory' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.item_name}</td><td className="py-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${row.action === 'Add' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{row.action}</span></td><td className="py-4 font-medium dark:text-white">{row.quantity}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td></>}
                  {activeTab === 'returns' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.item_name}</td><td className="py-4 font-medium dark:text-white">{row.quantity}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td></>}
                  {activeTab === 'staff' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.staff_name}</td><td className="py-4 text-sm dark:text-zinc-300">{row.description}</td><td className="py-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${row.txn_type === 'Advance' ? 'bg-red-100 text-red-700' : row.txn_type === 'Edit' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.txn_type}</span></td><td className="py-4 font-bold dark:text-white">₹{row.amount}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td></>}
                  {activeTab === 'customers' && <><td className="py-4 pl-4 font-bold dark:text-white">{row.customer_name}</td><td className="py-4 text-sm dark:text-zinc-300">{row.txn_type}</td><td className="py-4 font-bold dark:text-white">₹{row.amount}</td><td className="py-4 text-sm text-zinc-500">{row.date}</td></>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- ADMIN: MENU MANAGER PAGE ---
function MenuManagerPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', desc: '', category: 'Sweets', price: '', unit: 'pc', popular: false, in_stock: true });
  const [imageFile, setImageFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // Search state
  
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchMenu = () => fetch(`${API_BASE_URL}/api/menu`).then(res => res.json()).then(setMenuItems).catch(()=>{});
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
    await fetch(`${API_BASE_URL}/api/menu/${id}`, { method: 'DELETE' });
    fetchMenu();
  };

  const filteredMenu = menuItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Menu Manager</h1></div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-extrabold dark:text-white">{editMode ? 'Edit Menu Item' : 'Add Display Item'}</h2>
           {editMode && <button onClick={resetForm} className="text-red-500 font-bold text-sm hover:underline">Cancel Edit</button>}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <UI_Input label="Item Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <div className="md:col-span-2"><UI_Input label="Details (Tagline)" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} /></div>
          <UI_Select label="Category" options={[{label:'Sweets', value:'Sweets'}, {label:'Snacks', value:'Snacks'}, {label:'Beverages', value:'Beverages'}, {label:'Namkeen', value:'Namkeen'}]} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          
          <UI_Input label="Price (₹)" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
          <UI_Select label="Unit" options={[{label:'Per Piece (pc)', value:'pc'}, {label:'Per Kg', value:'kg'}, {label:'Per Plate', value:'plate'}, {label:'Per Glass', value:'glass'}]} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
          
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
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">All Menu Items</h2>
          <div className="relative w-full md:w-72">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search className="text-zinc-400" size={16} /></div>
             <input type="text" placeholder="Search menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white" />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredMenu.map(item => (
          <div key={item.id} className={`bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col relative ${!item.in_stock ? 'opacity-60 grayscale' : ''}`}>
            {!item.in_stock && <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md z-10 shadow-md">Out of Stock</div>}
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
        {filteredMenu.length === 0 && <p className="text-zinc-500 col-span-full">No items found.</p>}
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

  useEffect(() => { fetch(`${API_BASE_URL}/api/menu`).then(res => res.json()).then(setMenuItems).catch(()=>{}); }, []);

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
  const [expenses, setExpenses] = useState({ items: [], total_today: 0 });
  const [formData, setFormData] = useState({ item_name: '', amount: '' });

  const fetchExpenses = () => fetch(API_BASE_URL + '/api/expenses').then(res => res.json()).then(setExpenses).catch(() => {});
  useEffect(() => { fetchExpenses(); }, []);

  const handleAddExpense = (e) => {
    e.preventDefault();
    fetch(API_BASE_URL + '/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      .then(() => { setFormData({ item_name: '', amount: '' }); fetchExpenses(); });
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Kya aap sach me is expense ko delete karna chahte hain?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchExpenses();
    } catch (error) {
      alert("Delete fail ho gaya.");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="pt-2"><h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Daily Expenses</h1></div>

      <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-6 md:p-8 rounded-[2.5rem] text-white shadow-lg flex justify-between items-center">
          <div>
              <p className="text-rose-100 font-bold tracking-wide mb-1 uppercase text-xs">Total Expenses Today</p>
              <h3 className="text-4xl md:text-5xl font-black">₹{expenses.total_today}</h3>
          </div>
          <ReceiptText size={48} className="text-white/30" />
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
        <h2 className="text-xl font-extrabold mb-6 dark:text-white">Add New Expense</h2>
        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <UI_Input label="Expense Detail (e.g. Doodh, Sabji)" value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })} required />
          <UI_Input label="Amount (₹)" type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
          <UI_Button type="submit" variant="secondary">Note Expense</UI_Button>
        </form>
      </div>

      <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-8 mb-4">Today's Activity</h2>
      <div className="space-y-3">
         {expenses.items.length === 0 && <p className="text-zinc-500">Koi kharcha entry nahi hai aaj ka.</p>}
         {expenses.items.map(e => (
            <div key={e.id} className="bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm flex justify-between items-center group">
                <div>
                   <h3 className="font-bold dark:text-white">{e.item_name}</h3>
                   <p className="text-xs text-zinc-500 font-medium">{e.date}</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-rose-600 dark:text-rose-400 font-black text-lg">- ₹{e.amount}</div>
                   <button onClick={() => handleDeleteExpense(e.id)} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full hover:scale-110 transition-transform opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Delete Expense">
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
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-purple-500/20">
         <Briefcase size={40} className="text-white" />
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">Mahajan Manager</h1>
      <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium max-w-md">Business bulk suppliers aur Mahajano ke ledger manage karne ka feature abhi under development hai.</p>
      <div className="mt-8 px-6 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-700">
         <span className="font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-widest text-sm">Coming Soon 🚀</span>
      </div>
    </div>
  );
}

export default App;