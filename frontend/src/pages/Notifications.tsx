import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Trophy, Calendar, Users, Award } from 'lucide-react';
import apiClient from '../api/apiClient';

interface DrawResult {
  id: string;
  draw_month: string;
  winning_numbers: number[];
  status: string;
  created_at: string;
  winners?: {
    match_type: string;
    count: number;
    total_prize: number;
  }[];
}

const Notifications = () => {
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrawResults();
  }, []);

  const fetchDrawResults = async () => {
    try {
      const response = await apiClient.get('/draws/results');
      setDraws(response.data || []);
    } catch (error) {
      console.error('Error fetching draw results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const getMatchColor = (matchType: string) => {
    if (matchType.includes('5')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    if (matchType.includes('4')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (matchType.includes('3')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    return 'text-slate-400 bg-white/5 border-white/10';
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-white/5" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Bell size={12} className="text-emerald-400" fill="currentColor" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Draw Results</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Notifications</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">View all monthly draw results and winners</p>
      </div>

      {/* Draw Results */}
      <div className="space-y-6">
        {draws.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 text-center">
            <Bell size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No draw results yet</p>
            <p className="text-slate-600 text-sm mt-1">Check back after the monthly draw</p>
          </div>
        ) : (
          draws.map((draw, i) => (
            <motion.div
              key={draw.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6"
            >
              {/* Draw Header */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Trophy size={24} className="text-emerald-400" fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{formatMonth(draw.draw_month)}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Calendar size={12} />
                      <span>Draw completed</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  {draw.status}
                </span>
              </div>

              {/* Winning Numbers */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Winning Numbers</p>
                <div className="flex gap-3 flex-wrap">
                  {draw.winning_numbers.map((num, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              {/* Winners Summary */}
              {draw.winners && draw.winners.length > 0 ? (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Winners</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Always show all 3 match types */}
                    {['5-match', '4-match', '3-match'].map((matchType) => {
                      const winner = draw.winners?.find(w => w.match_type === matchType);
                      const count = winner?.count || 0;
                      const totalPrize = winner?.total_prize || 0;
                      
                      return (
                        <div
                          key={matchType}
                          className={`rounded-xl p-4 border ${getMatchColor(matchType)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {matchType}
                            </span>
                            <Award size={16} />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black">{count}</span>
                            <span className="text-xs font-bold opacity-60">
                              {count === 1 ? 'Winner' : 'Winners'}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-current/20">
                            <span className="text-xs font-bold">£{totalPrize.toLocaleString()}</span>
                            <span className="text-[10px] opacity-60 ml-1">total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Winners</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Show all 3 match types with 0 when no winners */}
                    {['5-match', '4-match', '3-match'].map((matchType) => (
                      <div
                        key={matchType}
                        className={`rounded-xl p-4 border ${getMatchColor(matchType)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {matchType}
                          </span>
                          <Award size={16} />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black">0</span>
                          <span className="text-xs font-bold opacity-60">Winners</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <span className="text-xs font-bold">£0</span>
                          <span className="text-[10px] opacity-60 ml-1">total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!draw.winners || draw.winners.length === 0) && (
                <div className="text-center py-6 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06] mt-4">
                  <Users size={24} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No winners for this draw</p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
