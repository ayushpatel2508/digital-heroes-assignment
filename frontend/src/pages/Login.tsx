import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Medal } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single();
        navigate(profile?.is_admin ? '/admin/dashboard' : '/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-white text-slate-900 lg:grid-cols-2">
      <section className="hidden items-center justify-center overflow-hidden bg-[#172449] p-12 text-white lg:flex">
        <div className="max-w-sm">
          <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10">
            <Mail size={20} className="text-amber-300" />
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">Empower Change with Every Play.</h1>
          <p className="mt-4 text-sm leading-6 text-white/65">Join thousands of players supporting global charities while getting a chance to win exclusive rewards.</p>
          <div className="mt-8 rounded-lg border border-white/15 bg-white/10 p-4 text-xs font-bold">Join 2.4k+ users donating today.</div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white"><Medal size={15} /></span>
            <span className="text-sm font-extrabold">Play for Dreams</span>
          </Link>

          <h2 className="text-2xl font-extrabold">Welcome Back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to access your dashboard</p>

          <div className="mt-6 grid grid-cols-2 rounded-md bg-slate-100 p-1 text-xs font-extrabold">
            <span className="rounded bg-white py-2 text-center shadow-sm">Sign In</span>
            <Link to="/register" className="py-2 text-center text-slate-500">Register</Link>
          </div>

          {error && <div className="mt-5 rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Field icon={Mail} label="Email Address" type="email" value={email} onChange={setEmail} placeholder="name@company.com" />
            <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="Password" />
            <button disabled={loading} className="w-full rounded-md bg-[#172449] py-3 text-sm font-extrabold text-white disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> Or continue with <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="rounded-md border border-slate-200 py-3 text-xs font-extrabold text-slate-700">Google</button>
            <button className="rounded-md border border-slate-200 py-3 text-xs font-extrabold text-slate-700">Github</button>
          </div>
        </div>
      </section>
    </div>
  );
};

const Field = ({ icon: Icon, label, type, value, onChange, placeholder }: {
  icon: any;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-xs font-bold text-slate-700">{label}</span>
    <span className="relative block">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-[#172449]"
      />
    </span>
  </label>
);

export default Login;
