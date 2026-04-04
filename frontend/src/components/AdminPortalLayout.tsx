import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Heart,
  Zap,
  Users,
  Trophy,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Command Center', icon: LayoutDashboard, desc: 'Overview & analytics' },
  { to: '/admin/users', label: 'User Management', icon: Users, desc: 'Subscribers & profiles' },
  { to: '/admin/draws', label: 'Draw Engine', icon: Zap, desc: 'Configure & publish draws' },
  { to: '/admin/charities', label: 'Charity Registry', icon: Heart, desc: 'Manage partners' },
  { to: '/admin/winners', label: 'Winner Verification', icon: Trophy, desc: 'Verify & mark payouts' },
];

const AdminPortalLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force redirect to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect anyway
      navigate('/login', { replace: true });
    }
  };

  const userInitial = user?.email?.[0]?.toUpperCase() || 'A';
  const userName = user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="min-h-screen bg-[#050810] text-white flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Admin Sidebar — distinct reddish/amber accent to differentiate from user */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-50 w-[280px] flex flex-col
        bg-[#0a0d16] border-r border-white/[0.06]
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Admin Logo */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white">Admin <span className="text-emerald-400">Portal</span></span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest -mt-0.5">Digital Heroes</p>
            </div>
          </div>

          {/* Warning badge */}
          <div className="bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl p-3 mb-6 flex items-center gap-2">
            <AlertOctagon size={14} className="text-emerald-400 flex-shrink-0" />
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Admin Access — Handle with care</p>
          </div>

          {/* Admin User Card */}
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-sm flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-white truncate">{userName}</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">System Administrator</p>
            </div>
          </div>
        </div>

        {/* Admin Nav */}
        <nav className="flex-1 px-4 overflow-y-auto py-2">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-3">Admin Controls</p>
          <div className="space-y-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group relative ${
                    isActive
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-400' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors">{item.desc}</p>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>

        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/[0.06] border border-transparent hover:border-rose-500/20 transition-all"
            data-testid="admin-logout-button"
          >
            <LogOut size={16} />
            <span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0a0d16]/90 backdrop-blur-md border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="font-black text-sm text-emerald-400">Admin Portal</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-400 hover:text-white transition-colors">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminPortalLayout;
