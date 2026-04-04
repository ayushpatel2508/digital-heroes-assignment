import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Medal, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) throw signInError;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();

        navigate(profile?.is_admin ? '/admin/dashboard' : '/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060810] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[100px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        <div className="relative z-10 text-center max-w-md">
          <Link to="/" className="inline-flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <Medal size={20} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">Digital<span className="text-emerald-400">Heroes</span></span>
          </Link>

          <h2 className="text-5xl font-black text-white tracking-tighter leading-tight mb-6">
            Golf that <span className="text-emerald-400">gives back.</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">
            Every subscription funds charity. Every round enters you in the monthly draw. 
            Real prizes, real impact.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-12">
            {[
              { value: '4.2k+', label: 'Active Members' },
              { value: '£840k', label: 'Raised for Charity' },
              { value: '£25k', label: 'Monthly Pool' },
              { value: '100%', label: 'Verified Winners' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-8 lg:p-12 bg-[#0a0d16] border-l border-white/[0.06]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Medal size={18} className="text-white" />
            </div>
            <span className="font-black text-lg">Digital<span className="text-emerald-400">Heroes</span></span>
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Welcome back</h1>
            <p className="text-slate-500 font-medium">Sign in to your hero account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-rose-500/[0.08] border border-rose-500/20 text-rose-400 rounded-2xl text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                Email Address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none">
                  <Mail size={18} className="text-slate-600" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.15] focus:border-emerald-500/50 rounded-xl text-white text-sm font-medium outline-none transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none">
                  <Lock size={18} className="text-slate-600" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.15] focus:border-emerald-500/50 rounded-xl text-white text-sm font-medium outline-none transition-all placeholder:text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 mt-6 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black text-base rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-400 hover:text-white font-black transition-colors">
                Sign Up Free →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
