import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Heart,
  Medal,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import heroImage from '../assets/hero.png';

const Landing = () => {
  const { user, isAdmin, loading } = useAuth();
  const [stats, setStats] = useState({
    raised: 0,
    charities: 0,
    prizePool: 0,
    draws: 0,
  });

  useEffect(() => {
    fetchLandingStats();
  }, []);

  const fetchLandingStats = async () => {
    try {
      const [charitiesRes, poolsRes, drawsRes] = await Promise.allSettled([
        apiClient.get('/charities'),
        apiClient.get('/draws/prize-pools'),
        apiClient.get('/draws/results'),
      ]);

      const charities = charitiesRes.status === 'fulfilled'
        ? charitiesRes.value.data?.charities || charitiesRes.value.data || []
        : [];
      const pools = poolsRes.status === 'fulfilled' && Array.isArray(poolsRes.value.data) ? poolsRes.value.data : [];
      const draws = drawsRes.status === 'fulfilled' && Array.isArray(drawsRes.value.data) ? drawsRes.value.data : [];
      const raised = pools.reduce((sum: number, pool: { total_pool?: number | string }) => sum + Number(pool.total_pool || 0), 0);

      setStats({
        raised,
        charities: Array.isArray(charities) ? charities.length : 0,
        prizePool: Number(pools[0]?.total_pool || 0),
        draws: draws.length,
      });
    } catch (error) {
      console.error('Failed to fetch landing stats:', error);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      notation: value >= 10000 ? 'compact' : 'standard',
      maximumFractionDigits: value >= 10000 ? 1 : 0,
    }).format(value || 0);

  if (!loading && user) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-950">
      <Header />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid min-h-[calc(100vh-56px)] max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-500">Golf scores with a purpose</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-5xl">
                Play your round, support a cause, stay in the prize draw.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-600">
                Play for Dreams turns a member's rolling five golf scores into a simple dashboard for charity support,
                prize pool tracking, and verified monthly winners.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#172449] px-5 py-3 text-sm font-extrabold text-white">
                  Create account <ArrowRight size={16} />
                </Link>
                <Link to="/charities-explorer" className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700">
                  Browse charities
                </Link>
              </div>

              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
                <HeroStat value={formatCurrency(stats.prizePool)} label="latest pool" />
                <HeroStat value={`${stats.charities}`} label="charities" />
                <HeroStat value={`${stats.draws}`} label="draws logged" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-sm">
              <img src={heroImage} alt="A young plant held in open hands" className="h-[460px] w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur">
                  <ShieldCheck size={14} className="text-emerald-300" />
                  Verified draws and winner records
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <OverlayMetric value="5" label="scores tracked" />
                  <OverlayMetric value="10%" label="minimum cause share" />
                  <OverlayMetric value={formatCurrency(stats.raised)} label="tracked pool total" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-500">Inside the app</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight">Built around the things members actually check.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                The dashboard keeps the monthly loop visible: score progress, subscription status, selected charity,
                and prize draw readiness.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Feature icon={BarChart3} title="Rolling score view" text="Members add Stableford scores and see their current five-round entry progress." />
              <Feature icon={Heart} title="Charity selection" text="Each account can choose the cause connected to future subscription contributions." />
              <Feature icon={Trophy} title="Prize pool tracking" text="Current pools and draw results are surfaced without hiding them behind admin screens." />
              <Feature icon={CalendarCheck} title="Monthly readiness" text="Subscription, score count, and winner status stay together so the next action is clear." />
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-500">How it works</p>
                <h2 className="mt-3 text-3xl font-extrabold">A clean monthly rhythm.</h2>
              </div>
              <Link to="/register" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#172449]">
                Start with your first score <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Step number="01" title="Pick your cause" text="Browse active charity partners and choose where your contribution should point." />
              <Step number="02" title="Keep five scores current" text="Add your latest rounds so your draw entry reflects recent play." />
              <Step number="03" title="Follow the draw" text="Watch prize pools, published results, and winner verification from one place." />
            </div>
          </div>
        </section>

        <section id="impact" className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-extrabold">Current platform snapshot</p>
            </div>
            <div className="divide-y divide-slate-100">
              <Snapshot label="Latest prize pool" value={formatCurrency(stats.prizePool)} />
              <Snapshot label="Charity partners" value={`${stats.charities}`} />
              <Snapshot label="Published draws" value={`${stats.draws}`} />
              <Snapshot label="Tracked pool total" value={formatCurrency(stats.raised)} />
            </div>
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-500">Transparency</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight">The numbers should be close enough to inspect.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Public charity browsing and visible pool data give visitors a useful look before sign-up. Members get the
              full workflow once they create an account.
            </p>
            <div className="mt-6 space-y-3">
              <CheckItem text="Public charity explorer for logged-out visitors" />
              <CheckItem text="Member dashboard for scores, subscription, and cause selection" />
              <CheckItem text="Admin portal for users, charities, draws, and winners" />
            </div>
          </div>
        </section>

        <section className="bg-[#172449] py-14 text-white">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">Ready when you are</p>
              <h2 className="mt-3 text-3xl font-extrabold">Create your account and connect your first round.</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="inline-flex items-center justify-center rounded-md bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950">
                Get started
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-3 text-sm font-extrabold text-white">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs font-bold text-slate-400">
        Play for Dreams (c) 2026
      </footer>
    </div>
  );
};

const Header = () => (
  <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white">
          <Medal size={15} />
        </span>
        <span className="text-sm font-extrabold">Play for Dreams</span>
      </Link>
      <nav className="hidden items-center gap-5 text-xs font-bold text-slate-500 md:flex">
        <a href="#features" className="hover:text-slate-950">Features</a>
        <a href="#how-it-works" className="hover:text-slate-950">How it works</a>
        <a href="#impact" className="hover:text-slate-950">Impact</a>
        <Link to="/charities-explorer" className="hover:text-slate-950">Charities</Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link to="/login" className="rounded-md px-3 py-2 text-xs font-extrabold text-slate-500 hover:bg-slate-100 hover:text-slate-950">
          Login
        </Link>
        <Link to="/register" className="rounded-md bg-slate-950 px-3 py-2 text-xs font-extrabold text-white">
          Start
        </Link>
      </div>
    </div>
  </header>
);

const HeroStat = ({ value, label }: { value: string; label: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="truncate text-lg font-extrabold">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{label}</p>
  </div>
);

const OverlayMetric = ({ value, label }: { value: string; label: string }) => (
  <div className="rounded-md bg-white/10 p-3 backdrop-blur">
    <p className="text-xl font-extrabold">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase text-white/65">{label}</p>
  </div>
);

const Feature = ({ icon: Icon, title, text }: { icon: typeof BarChart3; title: string; text: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
      <Icon size={18} />
    </div>
    <h3 className="font-extrabold">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
  </div>
);

const Step = ({ number, title, text }: { number: string; title: string; text: string }) => (
  <div className="rounded-lg border border-slate-200 p-5">
    <p className="text-xs font-extrabold text-amber-500">{number}</p>
    <h3 className="mt-3 font-extrabold">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
  </div>
);

const Snapshot = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 px-5 py-4">
    <span className="text-sm font-bold text-slate-500">{label}</span>
    <span className="text-lg font-extrabold text-slate-950">{value}</span>
  </div>
);

const CheckItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700">
    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
    <span>{text}</span>
  </div>
);

export default Landing;
