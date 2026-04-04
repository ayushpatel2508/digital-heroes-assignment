import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Heart, 
  CreditCard, 
  LogOut, 
  ChevronLeft, 
  Zap, 
  ShieldCheck, 
  Settings,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarItem {
  to: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
}

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userNavItems: SidebarItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/charities', label: 'Charities', icon: Heart },
    { to: '/subscription', label: 'Subscription', icon: CreditCard },
  ];

  const adminNavItems: SidebarItem[] = [
    { to: '/admin/dashboard', label: 'Admin Metrics', icon: ShieldCheck },
    { to: '/admin/charities', label: 'Charity Admin', icon: Heart },
    { to: '/admin/draws', label: 'Draw Engine', icon: Zap },
  ];

  // Determine which nav items to show based on current path or role
  const isAdminPath = location.pathname.startsWith('/admin');
  const currentNavItems = isAdminPath ? adminNavItems : userNavItems;

  return (
    <div className={`min-h-screen bg-slate-950 transition-colors duration-500`}>
      {/* --- Mobile Header --- */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-white text-sm">DH</div>
          <span className="font-extrabold tracking-tighter text-slate-900">Heroes</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* --- Sidebar (Glassmorphic) --- */}
        <aside 
          className={`
            fixed lg:static inset-y-0 left-0 w-72 z-50 transition-transform duration-300 transform
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            bg-slate-900/40 
            backdrop-blur-2xl border-r border-white/10
            flex flex-col shadow-2xl lg:shadow-none
          `}
        >
          {/* Logo Section */}
          <div className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
              >
                <span className="text-white text-xl font-black">⛳</span>
              </motion.div>
              <div>
                <h2 className={`font-black text-xl tracking-tighter leading-none ${isAdminPath ? 'text-white' : 'text-slate-900'}`}>
                  Digital<span className="text-emerald-500">Heroes</span>
                </h2>
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">Impact Platform</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {currentNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                      : isAdminPath 
                        ? 'text-slate-400 hover:text-white hover:bg-white/5' 
                        : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                  }`
                }
              >
                <item.icon size={20} className="relative z-10 transition-transform group-hover:scale-110" />
                <span className="relative z-10">{item.label}</span>
                {location.pathname === item.to && (
                  <motion.div layoutId="nav-glow" className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-transparent" />
                )}
              </NavLink>
            ))}

            {/* Context Switcher (User <-> Admin) */}
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-white/10 space-y-2">
                <p className={`text-[10px] uppercase font-bold px-5 mb-2 ${isAdminPath ? 'text-slate-500' : 'text-slate-400'}`}>Perspective</p>
                <button
                  onClick={() => navigate(isAdminPath ? '/dashboard' : '/admin/dashboard')}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                    isAdminPath 
                      ? 'text-slate-400 hover:text-white hover:bg-white/5' 
                      : 'bg-slate-900 text-emerald-400 shadow-xl shadow-slate-900/20'
                  }`}
                >
                  {isAdminPath ? <ChevronLeft size={20} /> : <ShieldCheck size={20} />}
                  {isAdminPath ? 'Exit Admin View' : 'Go to Admin Portal'}
                </button>
              </div>
            )}
          </nav>

          {/* User Footer */}
          <div className="p-6">
            <div className={`p-4 rounded-2xl ${isAdminPath ? 'bg-white/5' : 'bg-slate-100'} flex items-center gap-3 border border-white/5`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-500 border border-emerald-500/20">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black truncate uppercase ${isAdminPath ? 'text-white' : 'text-slate-900'}`}>
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-bold">
                  {isAdmin ? 'System Admin' : 'Active Member'}
                </p>
              </div>
              <button 
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* --- Main Content Content --- */}
        <main className={`flex-1 overflow-y-auto relative z-10 ${isAdminPath ? 'text-white' : 'text-slate-900'}`}>
          {/* Subtle Grains & Glows */}
          {isAdminPath && (
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
              <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[150px] rounded-full animate-pulse" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>
          )}

          {/* Global Header/Search (Sleek) */}
          <header className={`sticky top-0 z-40 px-8 h-20 flex items-center justify-between border-b ${isAdminPath ? 'bg-slate-950/60 border-white/5' : 'bg-white/60 border-slate-100'} backdrop-blur-lg`}>
            <div className="flex items-center gap-4 bg-slate-100/10 px-4 py-2 rounded-xl border border-white/5 min-w-[300px]">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Search round, draw or charity..." className="bg-transparent border-none outline-none text-sm font-medium w-full" />
            </div>
            
            <div className="flex items-center gap-3">
              <button className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isAdminPath ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50 text-slate-400'}`}>
                <Bell size={18} />
              </button>
              <button className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isAdminPath ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50 text-slate-400'}`}>
                <Settings size={18} />
              </button>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
