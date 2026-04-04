import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';
import apiClient from '../api/apiClient';

interface PrizePool {
  id: string;
  draw_month: string;
  total_pool: number;
  pool_5_match: number;
  pool_4_match: number;
  pool_3_match: number;
  rollover_from_previous: number;
}

export const PrizePoolsDisplay = () => {
  const [prizePools, setPrizePools] = useState<PrizePool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrizePools();
  }, []);

  const fetchPrizePools = async () => {
    try {
      const response = await apiClient.get('/draws/prize-pools');
      setPrizePools(response.data);
    } catch (error) {
      console.error('Error fetching prize pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const currentMonth = getCurrentMonth();
  const currentPool = prizePools.find(p => p.draw_month === currentMonth);
  const pastPools = prizePools.filter(p => p.draw_month !== currentMonth);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Month - Featured */}
      {currentPool && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Current Month</span>
            </div>
            
            <h2 className="text-3xl font-black text-white mb-6 heading-fancy flex items-center gap-3">
              <Trophy size={32} />
              {formatMonth(currentPool.draw_month)}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Total Pool</p>
                <p className="text-3xl font-black text-white">£{currentPool.total_pool.toLocaleString()}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">5-Match Prize</p>
                <p className="text-2xl font-black text-amber-300">£{currentPool.pool_5_match.toLocaleString()}</p>
                <p className="text-[9px] text-white/50 mt-1">40% of pool</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">4-Match Prize</p>
                <p className="text-2xl font-black text-blue-300">£{currentPool.pool_4_match.toLocaleString()}</p>
                <p className="text-[9px] text-white/50 mt-1">35% of pool</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">3-Match Prize</p>
                <p className="text-2xl font-black text-rose-300">£{currentPool.pool_3_match.toLocaleString()}</p>
                <p className="text-[9px] text-white/50 mt-1">25% of pool</p>
              </div>
            </div>

            {currentPool.rollover_from_previous > 0 && (
              <div className="mt-4 flex items-center gap-2 text-amber-300">
                <TrendingUp size={16} />
                <span className="text-sm font-bold">
                  Includes £{currentPool.rollover_from_previous.toLocaleString()} rollover from previous month
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Past Months */}
      {pastPools.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Calendar size={20} className="text-slate-400" />
            <h3 className="text-xl font-black text-white">Previous Months</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastPools.map((pool, i) => (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-white">{formatMonth(pool.draw_month)}</h4>
                  <Trophy size={18} className="text-slate-500" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Total Pool</span>
                    <span className="text-lg font-black text-white">£{pool.total_pool.toLocaleString()}</span>
                  </div>
                  
                  <div className="h-px bg-white/10" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">5-Match</span>
                      <span className="text-sm font-bold text-amber-400">£{pool.pool_5_match.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">4-Match</span>
                      <span className="text-sm font-bold text-blue-400">£{pool.pool_4_match.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">3-Match</span>
                      <span className="text-sm font-bold text-rose-400">£{pool.pool_3_match.toLocaleString()}</span>
                    </div>
                  </div>

                  {pool.rollover_from_previous > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1 text-amber-400">
                        <TrendingUp size={12} />
                        <span className="text-[10px] font-bold">+£{pool.rollover_from_previous.toLocaleString()} rollover</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {prizePools.length === 0 && !loading && (
        <div className="text-center py-12">
          <Trophy size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">No prize pools available yet</p>
        </div>
      )}
    </div>
  );
};
