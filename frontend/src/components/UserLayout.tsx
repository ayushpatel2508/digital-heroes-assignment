import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Heart, CreditCard, LogOut, Menu, Trophy, X, LayoutDashboard, Medal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/charities', label: 'Charities', icon: Heart },
  { to: '/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/winners', label: 'Winnings', icon: Trophy },
];

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white">
                <Medal size={15} />
              </span>
              <span className="text-sm font-extrabold tracking-tight">Play for Dreams</span>
            </button>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-xs font-bold transition ${
                      isActive ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="rounded-md px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
                >
                  Admin
                </button>
              )}
            </nav>
          </div>

          <div className="hidden items-center gap-2 md:flex ml-auto">
            <span className="max-w-28 truncate rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-500">
              {user?.email?.split('@')[0] || 'member'}
            </span>
            <button onClick={handleSignOut} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>

          <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-slate-600 md:hidden ml-auto">
            <Menu size={20} />
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white p-4 md:hidden">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-extrabold">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-md p-2 text-slate-500">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-3 text-sm font-bold ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-600'
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-rose-50 px-3 py-3 text-sm font-bold text-rose-600 hover:bg-rose-100"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-xs text-slate-500 sm:grid-cols-4">
          <div>
            <p className="font-extrabold text-slate-900">Play for Dreams</p>
            <p className="mt-2 leading-relaxed">Golf scores, charity impact, and monthly prizes.</p>
          </div>
          <p>Contact Info<br />hello@playfordreams.co</p>
          <p>Legal<br />Terms<br />Privacy Policy</p>
          <p>Connect<br />Twitter<br />LinkedIn</p>
        </div>
      </footer>
    </div>
  );
};

export default UserLayout;
