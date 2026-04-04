import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, UserPlus, ArrowRight, Medal, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // NOTE: isAdmin is intentionally NOT user-selectable.
  // Admin status is only set via the Supabase dashboard or backend.
  const { syncProfile } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      if (data.user) {
        // Sync profile — always a regular user (isAdmin = false)
        await syncProfile(data.user.id, fullName, email, false);
        setSuccess(true);
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060810] flex">
      {/* Left panel — value proposition */}
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
        <div className="relative z-10 max-w-md">
          <Link to="/" className="inline-flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <Medal size={20} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tight">Digital<span className="text-emerald-400">Heroes</span></span>
          </Link>

          <h2 className="text-5xl font-black text-white tracking-tighter leading-tight mb-6">
            Join 4,200+ <span className="text-emerald-400">Golf Heroes</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">
            Play golf. Track scores. Enter monthly draws. Fund charities you love — automatically.
          </p>

          <div className="space-y-4">
            {[
              { icon: '⛳', text: 'Enter your last 5 Stableford scores (Rolling 5 system)' },
              { icon: '🎯', text: 'Monthly draw — match 3, 4, or 5 numbers to win' },
              { icon: '❤️', text: 'Minimum 10% of your subscription goes to your chosen charity' },
              { icon: '🏆', text: 'Verified, transparent payouts — no black boxes' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <p className="text-slate-400 font-medium text-sm">{item.text}</p>
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
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Create account</h1>
            <p className="text-slate-500 font-medium">Join the movement — play for good</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-rose-500/[0.08] border border-rose-500/20 text-rose-400 rounded-2xl text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 rounded-2xl text-sm font-black flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                Account created! Redirecting to dashboard...
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Full Name</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none">
                  <User size={18} className="text-slate-600" />
                </div>
                <input
                  id="register-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.05] border border-white/[0.1] hover:border-white/[0.15] focus:border-emerald-500/50 rounded-xl text-white text-sm font-medium outline-none transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Email Address</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none">
                  <Mail size={18} className="text-slate-600" />
                </div>
                <input
                  id="register-email"
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
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none">
                  <Lock size={18} className="text-slate-600" />
                </div>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
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
              id="register-submit"
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-3 mt-6 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black text-base rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-slate-600 font-medium">
              By signing up, you agree to play golf for good. 🏌️
            </p>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Already a hero?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-white font-black transition-colors">
                Sign In →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
