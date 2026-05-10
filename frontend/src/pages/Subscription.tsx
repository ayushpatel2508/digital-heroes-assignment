import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Clock3, Crown, Heart, ShieldCheck, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { stripeApi } from '../api/stripeApi';
import { useAuth } from '../context/AuthContext';
import { subscriptionApi } from '../api/subscriptionApi';
import type { Subscription as SubscriptionRecord } from '../api/subscriptionApi';

const MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || '';
const YEARLY_PRICE_ID = import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || '';

const blackPillButton = 'btn-pill-black';

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionRecord | null>(null);
  const [pendingPlan, setPendingPlan] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    subscriptionApi
      .getUserSubscription(user.id)
      .then((data) => setCurrentSubscription(data || null))
      .catch((err) => {
        console.error('Failed to fetch subscription:', err);
        setCurrentSubscription(null);
      });
  }, [user]);

  const isActiveSubscription = currentSubscription?.status === 'active';

  const currentExpiry = useMemo(() => {
    if (!currentSubscription?.current_period_end) return '';
    return new Date(currentSubscription.current_period_end).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [currentSubscription?.current_period_end]);

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }
    if (!priceId) {
      setError('Stripe Price ID is not configured.');
      return;
    }

    if (isActiveSubscription) {
      setPendingPlan({ id: priceId, name: planName });
      return;
    }

    setLoading(priceId);
    setError(null);
    try {
      const data = await stripeApi.createCheckoutSession(priceId, user.id, user.email || '');
      if (data.url) window.location.href = data.url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout session';
      setError(message);
      setLoading(null);
    }
  };

  const confirmNewPlan = async () => {
    if (!pendingPlan || !user) return;

    setLoading(pendingPlan.id);
    setError(null);
    try {
      const data = await stripeApi.createCheckoutSession(pendingPlan.id, user.id, user.email || '');
      setPendingPlan(null);
      if (data.url) window.location.href = data.url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout session';
      setError(message);
      setLoading(null);
    }
  };

  const plans = [
    {
      id: MONTHLY_PRICE_ID,
      name: 'Monthly',
      price: '$15',
      period: '/mo',
      icon: Sparkles,
      highlight: 'Best for trying the platform',
      features: ['Rolling five score tracking', 'Monthly prize draw entry', 'Charity contribution included', 'Member dashboard access'],
    },
    {
      id: YEARLY_PRICE_ID,
      name: 'Yearly',
      price: '$150',
      period: '/yr',
      icon: Crown,
      popular: true,
      highlight: 'Best value for committed members',
      features: ['Everything in Monthly', 'Annual billing convenience', 'Priority winner verification', 'Advanced score trend view'],
    },
  ];

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-500">Subscription</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Choose your plan</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Two simple options. Pick monthly if you want flexibility or yearly if you want the best value.</p>
        {currentSubscription && (
          <p className="mx-auto mt-4 w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
            Current plan: {currentSubscription.plan_type} · {currentSubscription.status}
          </p>
        )}
      </motion.div>

      {error && <div className="mx-auto max-w-xl rounded-md bg-rose-50 p-4 text-center text-sm font-bold text-rose-700">{error}</div>}

      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
        {plans.map((plan) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm ${plan.popular ? 'border-slate-950 shadow-md' : 'border-slate-200'}`}
          >
            {plan.popular && (
              <span className="absolute right-4 top-4 rounded-full bg-slate-950 px-3 py-1 text-[10px] font-extrabold uppercase text-white">
                Best value
              </span>
            )}
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${plan.popular ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <plan.icon size={20} />
            </div>
            <h2 className="text-xl font-extrabold">{plan.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{plan.highlight}</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-extrabold">{plan.price}</span>
              <span className="pb-1 text-sm font-bold text-slate-400">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id, plan.name)}
              disabled={!!loading}
              className={`${blackPillButton} mt-7 w-full`}
            >
              <span>{loading === plan.id ? 'Starting...' : `Subscribe ${plan.name.toLowerCase()}`}</span>
              <ArrowRight size={15} />
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {pendingPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Active subscription detected</p>
                    <h2 className="mt-1 text-xl font-black text-slate-900">Confirm plan change</h2>
                  </div>
                </div>
                <button
                  onClick={() => setPendingPlan(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 hover:scale-105"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-600">
                <p>
                  Your current <span className="font-black text-slate-900">{currentSubscription?.plan_type || 'active'}</span> plan is active
                  {currentExpiry ? ` until ${currentExpiry}` : ''}.
                </p>
                <p>
                  If you continue, the <span className="font-black text-slate-900">{pendingPlan.name}</span> plan checkout will start now,
                  and your next billing cycle will follow the new plan.
                </p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                  <div className="flex items-center gap-2 font-black text-slate-900">
                    <Clock3 size={14} />
                    What happens next
                  </div>
                  <p className="mt-2">
                    We’ll move forward to payment and keep your current subscription info visible until the new checkout is completed.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setPendingPlan(null)}
                  className="btn-pill-ghost w-full"
                >
                  Cancel
                </button>
                <button onClick={confirmNewPlan} className={`${blackPillButton} w-full`}>
                  <span>Confirm & Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-5 md:grid-cols-3">
        <Benefit icon={Heart} title="More for causes" text="A guaranteed portion supports your selected charity." />
        <Benefit icon={ShieldCheck} title="Verified payouts" text="Winner verification and payment tracking are built in." />
        <Benefit icon={Crown} title="Simple choice" text="Just monthly or yearly, no extra tiers to compare." />
      </div>
    </div>
  );
};

const Benefit = ({ icon: Icon, title, text }: { icon: any; title: string; text: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <Icon size={18} className="text-amber-500" />
    <p className="mt-3 font-extrabold">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{text}</p>
  </div>
);

export default Subscription;
