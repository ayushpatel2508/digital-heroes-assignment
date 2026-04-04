import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  Heart, 
  Trophy, 
  ArrowUpRight,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { PrizePoolsDisplay } from '../../components/PrizePoolsDisplay';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    prizePool: 0,
    availablePrizePool: 0,
    reservedPrizePool: 0,
    pendingVerifications: 0,
    totalWinningsPaid: 0,
    pendingWinnings: 0,
    recentWinners: [],
    fiveMatchWinners: 0,
    fourMatchWinners: 0,
    threeMatchWinners: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/stats', {
        headers: { 'x-user-id': currentUser?.id }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">Accessing Secure Logs...</p>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Platform Users', value: stats.totalUsers || 0, icon: Users, trend: 'Network', color: 'emerald' },
    { label: 'Active Subscribers', value: stats.activeSubscribers || 0, icon: CreditCard, trend: 'Revenue', color: 'blue' },
    { label: 'Pending Payouts', value: stats.pendingVerifications || 0, icon: Heart, trend: 'Review', color: 'rose' },
    { label: 'Total Prize Pool', value: `£${(stats.prizePool || 0).toLocaleString()}`, icon: Trophy, trend: 'Total', color: 'emerald' },
  ];

  const winnerCards = [
    { label: 'Available Pool', value: `£${(stats.availablePrizePool || 0).toLocaleString()}`, color: 'emerald', desc: 'Ready to distribute' },
    { label: 'Reserved (Approved)', value: `£${(stats.reservedPrizePool || 0).toLocaleString()}`, color: 'emerald', desc: 'Awaiting payout' },
    { label: 'Total Paid Out', value: `£${(stats.totalWinningsPaid || 0).toLocaleString()}`, color: 'blue', desc: 'Completed payouts' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Protocol Active</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight heading-fancy">
            Command <span className="text-emerald-500">Center</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Global platform oversight and real-time metrics.</p>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <button 
            onClick={() => navigate('/admin/notifications')}
            className="flex items-center justify-center w-12 h-12 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl transition-all"
            title="View Notifications"
          >
            <Bell size={18} className="text-slate-400 hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  card.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                  card.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                  card.color === 'rose' ? 'bg-rose-500/10 text-rose-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  <card.icon size={22} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg">
                  {card.trend}
                  <ArrowUpRight size={12} />
                </div>
              </div>
              <p className="text-3xl font-black text-white mb-1 leading-none">{card.value}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.label}</p>
            </div>
            
            {/* Background Glow */}
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-[40px] group-hover:bg-white/10 transition-all" />
          </motion.div>
        ))}
      </div>

      {/* Winner Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Winner Stats */}
        <div className="grid grid-cols-1 gap-4">
          {winnerCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${
                card.color === 'emerald' ? 'border-emerald-500/20' :
                card.color === 'emerald' ? 'border-emerald-500/20' :
                'border-blue-500/20'
              }`}
            >
              <p className={`text-2xl font-black mb-1 ${
                card.color === 'emerald' ? 'text-emerald-400' :
                card.color === 'emerald' ? 'text-emerald-400' :
                'text-blue-400'
              }`}>
                {card.value}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.label}</p>
              {card.desc && (
                <p className="text-[9px] text-slate-600 mt-1 font-medium">{card.desc}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Recent Winners */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <Trophy size={20} className="text-emerald-400" />
              Recent Winners
            </h3>
            <button 
              onClick={() => navigate('/admin/winners')}
              className="text-xs font-black text-emerald-400 hover:text-white transition-colors"
            >
              View All →
            </button>
          </div>

          {stats.recentWinners && stats.recentWinners.length > 0 ? (
            <div className="space-y-3">
              {stats.recentWinners.slice(0, 3).map((winner: any, i: number) => (
                <motion.div
                  key={winner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-black text-emerald-400 text-xs">
                      {winner.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{winner.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {winner.match_type} • {new Date(winner.monthly_draws?.draw_month || winner.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-400 text-sm">£{(winner.prize_amount || 0).toLocaleString()}</p>
                    <p className={`text-[10px] font-black uppercase ${
                      winner.payment_status === 'paid' ? 'text-emerald-400' : 
                      winner.verification_status === 'approved' ? 'text-blue-400' : 'text-slate-500'
                    }`}>
                      {winner.payment_status === 'paid' ? 'Paid' : 
                       winner.verification_status === 'approved' ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Trophy size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">No recent winners</p>
            </div>
          )}
        </div>
      </div>

      {/* Prize Pools Section */}
      <div className="mt-8">
        <PrizePoolsDisplay />
      </div>
    </div>
  );
};

export default AdminDashboard;
