import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Heart,
  CreditCard,
  LogOut,
  Menu,
  X,
  Trophy,
  Medal,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Your performance hub' },
  { to: '/charities', label: 'Charities', icon: Heart, desc: 'Your giving impact' },
  { to: '/subscription', label: 'Subscription', icon: CreditCard, desc: 'Plan & billing' },
  { to: '/winners', label: 'My Winnings', icon: Trophy, desc: 'Verify & collect' },
];

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, signOut } = useAuth();
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

  const userInitial = user?.email?.[0]?.toUpperCase() || 'U';
  const userName = user?.email?.split('@')[0] || 'Member';

  return (
    <div className="min-h-screen bg-[#080c14] text-white flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-50 w-[280px] flex flex-col
        bg-[#0d1117] border-r border-white/[0.06]
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Medal size={18} className="text-white" fill="white" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white">Digital<span className="text-emerald-400">Heroes</span></span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest -mt-0.5">Golf Platform</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-sm flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-white truncate">{userName}</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active Member</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 overflow-y-auto py-2">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-3">Navigation</p>
          <div className="space-y-1">
            {navItems.map((item) => (
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
                    {isActive && <ChevronRight size={14} className="text-emerald-400 flex-shrink-0" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Admin switch */}
          {isAdmin && (
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-3">Privileges</p>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] transition-all group"
              >
                <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 text-[10px] font-black">A</span>
                </div>
                <span className="font-bold text-sm">Admin Portal</span>
              </button>
            </div>
          )}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/[0.06] border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut size={16} />
            <span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Medal size={14} className="text-white" />
            </div>
            <span className="font-black text-sm">Digital<span className="text-emerald-400">Heroes</span></span>
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

export default UserLayout;
