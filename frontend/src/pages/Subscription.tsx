import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { stripeApi } from '../api/stripeApi';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Star, ArrowRight, ShieldCheck, Globe, Zap as Flash } from 'lucide-react';

const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || '';
const YEARLY_PRICE_ID = import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || '';

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }

    if (!priceId) {
      setError('Stripe Price ID is not configured. Please check your .env file.');
      return;
    }

    setLoading(priceId);
    setError(null);

    try {
      const data = await stripeApi.createCheckoutSession(priceId, user.id, user.email || '');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout session');
      setLoading(null);
    }
  };

  const plans = [
    {
      id: MONTHLY_PRICE_ID,
      name: 'Monthly Pro',
      price: '£10',
      period: '/ month',
      description: 'Ideal for regular golfers playing 2-4 times a month.',
      icon: Flash,
      color: 'emerald',
      features: [
        'Sync up to 5 rolling scores',
        'Automatic entry into monthly draws',
        'Basic profile analytics',
        'Choose charity contribution (min 10%)',
        'Secure dashboard access'
      ]
    },
    {
      id: YEARLY_PRICE_ID,
      name: 'Season Elite',
      price: '£100',
      period: '/ year',
      description: 'Save 2 months! The ultimate package for dedicated heroes.',
      icon: Crown,
      color: 'amber',
      popular: true,
      features: [
        'All Monthly Pro features',
        'Priority draw verification',
        'Advanced performance charts',
        'Early access to new features',
        '2 months free membership'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#060810] pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-16">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6"
          >
            <Star size={12} className="text-emerald-400 fill-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Premium Membership</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-6 heading-fancy"
          >
            Choose your <span className="text-emerald-500">plan</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-lg font-medium max-w-2xl mx-auto"
          >
            Support golf charities, track your Rolling 5, and win monthly prizes. 
            Cancel or upgrade your membership anytime.
          </motion.p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto mb-12 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-center text-sm font-bold"
          >
            {error}
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className={`relative bg-white/[0.03] backdrop-blur-md border rounded-[2.5rem] p-10 flex flex-col group ${
                plan.popular ? 'border-amber-500/30' : 'border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/20">
                  Best Value
                </div>
              )}

              <div className="mb-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${
                  plan.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  <plan.icon size={28} />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">{plan.name}</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">{plan.period}</span>
                </div>
              </div>

              <div className="flex-1 mb-10">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-emerald-400" />
                      </div>
                      <span className="text-sm text-slate-400 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all ${
                  plan.popular 
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20' 
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                } disabled:opacity-50 active:scale-[0.98] group`}
              >
                {loading === plan.id ? (
                  <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    {plan.popular ? 'Start Season' : 'Join Monthly'}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 p-12 bg-white/[0.02] border border-white/5 rounded-[3rem]">
          {[
            { icon: ShieldCheck, title: 'Secure Payouts', desc: 'Direct to your verified bank account.' },
            { icon: Globe, title: 'Rolling 5 System', desc: 'Standardized score tracking worldwide.' },
            { icon: Zap, title: 'Instant Entry', desc: 'Automatic draw entry for all active members.' },
          ].map((item, i) => (
            <div key={i} className="text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                <item.icon size={20} className="text-slate-400" />
              </div>
              <h4 className="text-white font-black text-sm uppercase mb-2">{item.title}</h4>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscription;
