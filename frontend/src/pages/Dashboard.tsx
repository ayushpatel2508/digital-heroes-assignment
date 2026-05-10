import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { scoreApi } from '../api/scoreApi';
import type { Score } from '../api/scoreApi';
import { subscriptionApi } from '../api/subscriptionApi';
import type { Subscription } from '../api/subscriptionApi';
import { charityApi } from '../api/charityApi';
import type { UserCharity } from '../api/charityApi';
import { PrizePoolsDisplay } from '../components/PrizePoolsDisplay';
import {
  PlusCircle,
  Trophy,
  Trash2,
  Heart,
  Calendar,
  Target,
  ArrowRight,
  Activity,
  Sparkles,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// Spinner component
const Spinner = () => (
  <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
);

const blackPillButton = 'btn-pill-black';

const Dashboard = () => {
  const { user } = useAuth();
  const [scores, setScores] = useState<Score[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userCharity, setUserCharity] = useState<UserCharity | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreValue, setScoreValue] = useState<number | ''>('');
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    console.log('🔍 Fetching dashboard data for user:', user?.id);
    setLoading(true);
    try {
      const [scoresData, subData, charityData] = await Promise.allSettled([
        scoreApi.getRollingScores(user!.id),
        subscriptionApi.getUserSubscription(user!.id),
        charityApi.getUserCharity(user!.id),
      ]);
      
      if (scoresData.status === 'fulfilled') {
        console.log('✅ Scores fetched:', scoresData.value);
        setScores(scoresData.value.scores || []);
      } else {
        console.error('❌ Scores fetch failed:', scoresData.reason);
      }

      if (subData.status === 'fulfilled') {
        console.log('✅ Subscription fetched:', subData.value);
        setSubscription(subData.value);
      } else {
        console.error('❌ Subscription fetch failed:', subData.reason);
      }

      if (charityData.status === 'fulfilled') {
        console.log('✅ Charity fetched:', charityData.value);
        setUserCharity(charityData.value);
      } else {
        console.error('❌ Charity fetch failed:', charityData.reason);
      }
    } catch (error) {
      console.error('❌ Unexpected fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || scoreValue === '') return;

    const val = Number(scoreValue);
    if (val < 1 || val > 45) {
      setMessage({ type: 'error', text: 'Score must be 1–45 (Stableford format)' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await scoreApi.addScore(user.id, val, scoreDate);
      setMessage({ type: 'success', text: scores.length >= 5 ? '✅ Rolling 5 updated — oldest replaced!' : '✅ Score added!' });
      setScoreValue('');
      const data = await scoreApi.getRollingScores(user.id);
      setScores(data.scores || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to add score. Try again.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteScore = async (id: string) => {
    if (!user) return;
    try {
      await scoreApi.deleteScore(id, user.id);
      setScores(scores.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting score:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const avg = scores.length > 0 ? (scores.reduce((a, s) => a + s.score_value, 0) / scores.length).toFixed(1) : '—';
  const highest = scores.length > 0 ? Math.max(...scores.map(s => s.score_value)) : null;
  const isActive = subscription?.status === 'active';
  const isUpgradable = subscription?.plan_type === 'monthly';
  const userName = user?.email?.split('@')[0] || 'Member';

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={12} className="text-emerald-400" fill="currentColor" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">
              {isActive ? 'Active Season' : 'No Active Subscription'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, <span className="text-emerald-400">{userName}</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {scores.length === 5
              ? 'Your Rolling 5 is complete — you\'re eligible for the next draw!'
              : `${5 - scores.length} more score${5 - scores.length !== 1 ? 's' : ''} needed to complete your Rolling 5.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/notifications"
            className="flex items-center justify-center w-12 h-12 bg-white shadow-sm border border-slate-200 rounded-none transition-all flex-shrink-0 hover:scale-105"
            title="View Notifications"
          >
            <Bell size={18} className="text-slate-400 hover:text-slate-900 transition-colors" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="bg-white shadow-sm border border-slate-200 rounded-none px-4 py-3 text-center min-w-[80px]">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-0.5">Avg</p>
              <p className="text-xl font-black text-slate-900">{avg}</p>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 rounded-none px-4 py-3 text-center min-w-[80px]">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-0.5">Peak</p>
              <p className="text-xl font-black text-emerald-400">{highest ?? '—'}</p>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 rounded-none px-4 py-3 text-center min-w-[80px]">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-0.5">Rolls</p>
              <p className="text-xl font-black text-amber-400">{scores.length}/5</p>
            </div>
          </div>
        </div>
      </div>

      {!isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm border border-slate-200 rounded-none p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(16,185,129,0.05)_0%,_transparent_70%)] pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-slate-900 text-sm">Subscription Required</p>
              <p className="text-slate-500 text-xs font-medium mt-0.5">You need an active subscription to participate in draws.</p>
            </div>
          </div>
          <Link to="/subscription" className={blackPillButton}>
            <span>Subscribe</span>
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-sm border border-slate-200 rounded-none p-7 flex flex-col relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PlusCircle size={20} />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-base">Submit Score</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stableford · 1–45 pts</p>
              </div>
            </div>

            <form onSubmit={handleAddScore} className="flex-1 flex flex-col gap-4">
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="45"
                  id="score-input"
                  value={scoreValue}
                  onChange={(e) => setScoreValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-500 rounded-none px-6 py-6 text-5xl font-black text-slate-900 text-center outline-none transition-all placeholder:text-slate-300 shadow-inner"
                  placeholder="00"
                  required
                />
                <span className="absolute bottom-3 right-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">points</span>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-none px-4 py-3">
                <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                <input
                  type="date"
                  value={scoreDate}
                  onChange={(e) => setScoreDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-full"
                  required
                />
              </div>

              <button type="submit" disabled={submitting} className={`${blackPillButton} mt-auto w-full py-4 text-sm`}>
                {submitting ? <Spinner /> : <><PlusCircle size={18} /> <span>Add Score</span> <ArrowRight size={14} /></>}
              </button>
            </form>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-3 rounded-none text-xs font-black text-center flex items-center justify-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white shadow-sm border border-slate-200 rounded-none p-7 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-black text-slate-900 text-base">Rolling 5</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Last 5 scores · Auto-updated</p>
            </div>
            <div className={`px-3 py-1.5 rounded-none text-[10px] font-black uppercase tracking-widest ${
              scores.length >= 5
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
                : 'bg-slate-100 border border-slate-200 text-slate-600'
            }`}>
              {scores.length}/5 {scores.length >= 5 ? 'Draw Ready ✓' : 'Incomplete'}
            </div>
          </div>

          <div className="h-1.5 w-full bg-slate-100 rounded-none overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(Math.min(scores.length, 5) / 5) * 100}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-none"
            />
          </div>

          <div className="flex-1 space-y-3">
            {scores.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-30">
                <Target size={40} className="mb-3 text-slate-600" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No scores yet</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {scores.slice(0, 5).map((score, i) => (
                  <motion.div
                    key={score.id}
                    layout
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-3.5 rounded-none bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-none flex items-center justify-center font-black text-lg flex-shrink-0 ${
                      i === 0 ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/30' : 'bg-white shadow-sm text-slate-300'
                    }`}>
                      {score.score_value}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm flex items-center gap-2">
                        Round {scores.length - i}
                        {i === 0 && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(score.score_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteScore(score.id)} className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-none transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-none p-6 relative overflow-hidden bg-white shadow-sm border border-slate-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none flex items-center justify-center bg-slate-100 text-slate-600">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">Subscription</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {subscription?.plan_type ? `${subscription.plan_type} plan` : 'No active plan'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-none border ${
                isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                {isActive ? '● Active' : '○ Inactive'}
              </span>
            </div>

            {subscription?.current_period_end && (
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-4">
                <Clock size={12} />
                Renews {new Date(subscription.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}

            <Link to="/subscription" className={blackPillButton}>
              <span>{isUpgradable ? 'Upgrade Plan' : isActive ? 'Manage Plan' : 'Get Subscription'}</span>
              <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white shadow-sm border border-slate-200 rounded-none p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-none bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Heart size={18} />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">Your Cause</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Charity contribution</p>
              </div>
            </div>

            {userCharity ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {userCharity.charities.logo_url && <img src={userCharity.charities.logo_url} alt="Logo" className="h-8 w-auto object-contain" />}
                  <p className="font-black text-slate-900 truncate">{userCharity.charities.name}</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                  <Zap size={10} fill="currentColor" /> {userCharity.donation_percentage}% Contribution Active
                </div>
              </div>
            ) : (
              <div>
                <p className="text-slate-500 text-sm font-medium mb-3">No charity selected yet.</p>
                <Link to="/charities" className={blackPillButton}>
                  <span>Choose Charity</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white shadow-sm border border-slate-200 rounded-none p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-none bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Trophy size={18} />
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">Monthly Draw</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prize pool participation</p>
              </div>
            </div>

            {isActive && scores.length >= 5 ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-none">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-500">Eligible ✓</p>
                  <p className="text-[10px] text-slate-400 font-medium">You're entered in the next draw</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-white shadow-sm border border-slate-200 rounded-none">
                <Activity size={16} className="text-slate-500 flex-shrink-0" />
                <p className="text-xs text-slate-500 font-medium">
                  {!isActive ? 'Subscribe to enter draws' : `Add ${5 - scores.length} more score(s) to qualify`}
                </p>
              </div>
            )}

            <Link to="/winners" className={`${blackPillButton} mt-4 w-full`}>
              <span>View My Winnings</span>
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </div>

      {isUpgradable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white shadow-sm border border-slate-200 rounded-none p-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_rgba(16,185,129,0.05)_0%,_transparent_70%)] pointer-events-none" />
          <div className="relative flex items-center gap-5">
            <div className="hidden sm:flex w-14 h-14 rounded-none bg-slate-100 border border-slate-200 items-center justify-center text-slate-900 flex-shrink-0">
              <TrendingUp size={26} />
            </div>
            <div>
              <p className="font-black text-slate-900 text-lg">Save 20% — Go Annual</p>
              <p className="text-slate-600 text-sm font-medium mt-0.5">Annual members save on every payment and get priority draw placement.</p>
            </div>
          </div>
          <Link to="/subscription" className={blackPillButton}>
            <span>Upgrade Plan</span>
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
        <PrizePoolsDisplay />
      </motion.div>
    </div>
  );
};

export default Dashboard;
