import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Medal, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { syncProfile } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      if (data.user) {
        await syncProfile(data.user.id, fullName, email, false);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-white text-slate-900 lg:grid-cols-2">
      <section className="hidden items-center justify-center overflow-hidden bg-[#172449] p-12 text-white lg:flex">
        <div className="max-w-sm">
          <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10">
            <Medal size={20} className="text-amber-300" />
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">Start playing for dreams today.</h1>
          <p className="mt-4 text-sm leading-6 text-white/65">Create your account, choose a charity, subscribe, and enter monthly prize draws with your rolling scores.</p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs font-bold">
            <span className="rounded-md bg-white/10 p-3">Scores</span>
            <span className="rounded-md bg-white/10 p-3">Impact</span>
            <span className="rounded-md bg-white/10 p-3">Prizes</span>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white"><Medal size={15} /></span>
            <span className="text-sm font-extrabold">Play for Dreams</span>
          </Link>

          <h2 className="text-2xl font-extrabold">Create Account</h2>
          <p className="mt-1 text-sm text-slate-500">Register to start your dashboard</p>

          <div className="mt-6 grid grid-cols-2 rounded-md bg-slate-100 p-1 text-xs font-extrabold">
            <Link to="/login" className="py-2 text-center text-slate-500">Sign In</Link>
            <span className="rounded bg-white py-2 text-center shadow-sm">Register</span>
          </div>

          {error && <div className="mt-5 rounded-md bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <Field icon={User} label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="John Smith" />
            <Field icon={Mail} label="Email Address" type="email" value={email} onChange={setEmail} placeholder="name@company.com" />
            <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 6 characters" />
            <button disabled={loading} className="w-full rounded-md bg-[#172449] py-3 text-sm font-extrabold text-white disabled:opacity-60">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
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

export default Register;
