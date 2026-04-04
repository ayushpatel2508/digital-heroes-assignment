import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Heart, Target, ArrowRight, Zap, Users, ShieldCheck, Star, Globe, ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const charities = [
  { name: 'Greenpeace', cause: 'Environment', color: 'from-green-500 to-emerald-600' },
  { name: 'UNICEF', cause: 'Children', color: 'from-blue-500 to-cyan-600' },
  { name: 'Red Cross', cause: 'Humanitarian', color: 'from-red-500 to-rose-600' },
  { name: 'WWF', cause: 'Wildlife', color: 'from-orange-500 to-amber-600' },
];

const Landing = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    if (!loading && user) {
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard');
    }
  }, [user, isAdmin, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#060810] text-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <span className="text-white font-black text-lg">⛳</span>
            </div>
            <span className="font-black text-lg tracking-tight">Digital<span className="text-emerald-400">Heroes</span></span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center gap-8"
          >
            <a href="#how-it-works" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">How It Works</a>
            <a href="#impact" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Our Impact</a>
            <a href="#draws" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Monthly Draw</a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors px-4 py-2">
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-black bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060810] via-[#080d16] to-[#060810]" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/[0.06] rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-amber-500/[0.04] rounded-full blur-[80px]" />
        </div>
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-24"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/[0.07] px-4 py-2 rounded-full text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-10"
          >
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Golf · Charity · Monthly Prizes
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-6xl md:text-8xl lg:text-[100px] font-black leading-[0.88] tracking-tighter mb-8"
          >
            <span className="text-white">Play with</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">Purpose.</span>
            <br />
            <span className="text-white">Win for</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Good.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed mb-12 font-medium"
          >
            The subscription platform where your golf scores enter you into monthly prize draws —
            and a guaranteed slice goes to the charity you care about most.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link
              to="/register"
              id="hero-cta"
              className="group flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg px-10 py-5 rounded-2xl transition-all hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-95"
            >
              Start Your Journey
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/charities-explorer"
              className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm border border-white/10 hover:border-white/20 px-8 py-5 rounded-2xl transition-all hover:bg-white/[0.04]"
            >
              <Heart size={16} className="text-rose-400" />
              Explore Charities
            </Link>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { value: '4.2k+', label: 'Active Heroes', icon: Users },
              { value: '£840k', label: 'Raised for Charity', icon: Heart },
              { value: '£25k', label: 'Monthly Prize Pool', icon: Trophy },
              { value: '100%', label: 'Verified Winners', icon: ShieldCheck },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 text-center backdrop-blur-sm"
              >
                <p className="text-2xl md:text-3xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <ChevronDown size={20} className="animate-bounce" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] block mb-4"
            >
              Simple by Design
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black tracking-tighter leading-tight"
            >
              Three steps to <span className="text-emerald-400">impact</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                title: 'Subscribe & Choose',
                desc: 'Pick monthly or annual. Select a charity you love — at least 10% of your fee goes directly to them. Optionally donate more.',
                icon: Heart,
                accent: 'rose',
              },
              {
                number: '02',
                title: 'Track Your Golf',
                desc: 'Enter your last 5 Stableford scores (1–45). Our Rolling 5 system automatically keeps them updated. Simple, honest, transparent.',
                icon: Target,
                accent: 'emerald',
              },
              {
                number: '03',
                title: 'Win Monthly Draws',
                desc: 'Match 3, 4, or 5 of the monthly draw numbers to share in the prize pool. Full 5-match jackpot rolls over until claimed.',
                icon: Trophy,
                accent: 'amber',
              },
            ].map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="group relative bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all overflow-hidden"
              >
                <div className="absolute top-6 right-6 text-6xl font-black text-white/[0.03] leading-none select-none">
                  {step.number}
                </div>
                <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center ${
                  step.accent === 'rose' ? 'bg-rose-500/10 text-rose-400' :
                  step.accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-amber-500/10 text-amber-400'
                } group-hover:scale-110 transition-transform`}>
                  <step.icon size={28} />
                </div>
                <h3 className="text-xl font-black mb-3 text-white">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHARITY IMPACT ── */}
      <section id="impact" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] block mb-4">Charitable Impact</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight mb-6">
                Every swing<br />makes a <span className="text-emerald-400">difference</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8 font-medium">
                When you join, you select a charity from our verified directory. A portion of every 
                subscription goes directly to your chosen cause — no middle-men, fully transparent.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { label: 'Minimum charity contribution', value: '10%' },
                  { label: 'Optional increase available', value: 'Up to 100%' },
                  { label: 'Independent donations', value: 'Always on' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                    <span className="text-slate-400 font-medium text-sm">{item.label}</span>
                    <span className="font-black text-emerald-400 text-sm">{item.value}</span>
                  </div>
                ))}
              </div>

              <Link to="/charities-explorer" className="inline-flex items-center gap-2 text-emerald-400 font-black hover:text-white transition-colors group">
                Explore All Charities
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {charities.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 group cursor-default"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} mb-4 flex items-center justify-center shadow-lg`}>
                    <Globe size={18} className="text-white" />
                  </div>
                  <p className="font-black text-white">{c.name}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{c.cause}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PRIZE POOLS ── */}
      <section id="draws" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] block mb-4"
            >
              Monthly Draw System
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black tracking-tighter"
            >
              How the <span className="text-amber-400">prize pool</span> works
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { match: '5 Numbers', share: '40%', rollover: true, color: 'from-amber-500 to-orange-500', desc: 'The jackpot. Rolls over if unclaimed.' },
              { match: '4 Numbers', share: '35%', rollover: false, color: 'from-emerald-500 to-teal-500', desc: 'Split equally among 4-match winners.' },
              { match: '3 Numbers', share: '25%', rollover: false, color: 'from-blue-500 to-cyan-500', desc: 'Split equally among 3-match winners.' },
            ].map((tier, i) => (
              <motion.div
                key={tier.match}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 group hover:bg-white/[0.05] transition-all"
              >
                <div className={`text-5xl font-black bg-gradient-to-r ${tier.color} bg-clip-text text-transparent mb-2`}>
                  {tier.share}
                </div>
                <p className="font-black text-white text-lg mb-1">{tier.match}</p>
                <p className="text-slate-400 text-sm font-medium mb-6">{tier.desc}</p>
                {tier.rollover && (
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg tracking-wider">
                    <Zap size={10} fill="currentColor" />
                    Jackpot Rollover
                  </span>
                )}
                <div className={`absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br ${tier.color} opacity-[0.04] blur-[60px] rounded-full group-hover:opacity-[0.08] transition-opacity`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-950/60 via-[#0d1f1a] to-emerald-950/40 border border-emerald-500/20 rounded-[3rem] p-14 md:p-20 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08)_0%,_transparent_70%)]" />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-amber-400" fill="currentColor" />
              ))}
              <span className="text-slate-400 text-sm font-bold ml-2">Trusted by 4,200+ heroes</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-6">
              Ready to be a<br /><span className="text-emerald-400">Digital Hero?</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 font-medium leading-relaxed">
              Your next round could fund a child's education, protect an ecosystem, or save a life. 
              Subscribe today and play for something bigger.
            </p>
            <Link
              to="/register"
              id="final-cta"
              className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xl px-14 py-5 rounded-2xl transition-all hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-95 group"
            >
              Join the Mission
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-base">⛳</span>
            </div>
            <span className="font-black text-white">Digital<span className="text-emerald-400">Heroes</span></span>
          </div>
          <p className="text-slate-500 text-sm font-medium">© 2026 Digital Heroes · Golf for Good</p>
          <div className="flex gap-6 text-sm font-bold text-slate-500">
            <Link to="/charities-explorer" className="hover:text-white transition-colors">Charities</Link>
            <Link to="/register" className="hover:text-emerald-400 transition-colors">Subscribe</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
