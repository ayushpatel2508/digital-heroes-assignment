import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2, Clock, XCircle, Trophy, AlertCircle, ArrowRight, FileImage } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Win {
  id: string;
  draw_id: string;
  match_type: string;
  prize_amount: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'paid';
  proof_screenshot_url?: string;
  created_at: string;
  monthly_draws?: { draw_month: string; winning_numbers: number[] };
}

const statusConfig = {
  pending: { label: 'Pending Proof', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock },
  proof_submitted: { label: 'Under Review', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Clock },
  verified: { label: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  paid: { label: 'Paid Out ✓', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: XCircle },
};

const WinnerVerification = () => {
  const { user } = useAuth();
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [proofUrls, setProofUrls] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    if (user) fetchWins();
  }, [user]);

  const fetchWins = async () => {
    try {
      const { data, error } = await supabase
        .from('winners')
        .select('*, monthly_draws(draw_month, winning_numbers)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWins(data || []);
    } catch (err) {
      console.error('Error fetching wins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProofSubmit = async (winId: string) => {
    const proofUrl = proofUrls[winId];
    if (!proofUrl?.trim()) return;

    setUploading(winId);
    try {
      const { error } = await supabase
        .from('winners')
        .update({ proof_screenshot_url: proofUrl, verification_status: 'pending' })
        .eq('id', winId);
      if (error) throw error;
      await fetchWins();
      setProofUrls(prev => ({ ...prev, [winId]: '' }));
    } catch (err) {
      console.error('Error submitting proof:', err);
    } finally {
      setUploading(null);
    }
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

  const totalWon = wins.reduce((sum, w) => sum + (w.prize_amount || 0), 0);
  const pendingCount = wins.filter(w => w.payment_status === 'pending').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={12} className="text-amber-400" fill="currentColor" />
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Winner Centre</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">My Winnings</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Upload proof screenshots to claim your prizes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 text-center">
          <p className="text-2xl font-black text-emerald-400">£{totalWon.toLocaleString()}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Won</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 text-center">
          <p className="text-2xl font-black text-white">{wins.length}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Draws Won</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 text-center">
          <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Awaiting Proof</p>
        </div>
      </div>

      {/* Wins List */}
      {wins.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-16 text-center">
          <Trophy size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="font-black text-slate-500 text-lg mb-2">No Wins Yet</p>
          <p className="text-slate-600 text-sm font-medium">Complete your Rolling 5 and enter the monthly draws!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {wins.map((win, i) => {
            const status = statusConfig[win.payment_status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const drawDate = win.monthly_draws?.draw_month
              ? new Date(win.monthly_draws.draw_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
              : 'Unknown';
            const needsProof = win.payment_status === 'pending';

            return (
              <motion.div
                key={win.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <Trophy size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-black text-white">{drawDate} Draw</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${status.bg} ${status.color}`}>
                          <StatusIcon size={10} />
                          {status.label}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                          {win.match_type}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium mt-1">Prize: <span className="text-emerald-400 font-black">£{(win.prize_amount || 0).toLocaleString()}</span></p>
                    </div>
                  </div>
                </div>

                {/* Proof Upload */}
                {needsProof && (
                  <div className="mt-5 pt-5 border-t border-white/[0.06]">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-400 font-bold">Upload a screenshot of your scores from your golf platform to claim this prize.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 flex items-center gap-3 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3">
                        <FileImage size={16} className="text-slate-500 flex-shrink-0" />
                        <input
                          type="url"
                          placeholder="Paste screenshot URL (Imgur, Cloudinary, etc.)"
                          value={proofUrls[win.id] || ''}
                          onChange={(e) => setProofUrls(prev => ({ ...prev, [win.id]: e.target.value }))}
                          className="bg-transparent border-none outline-none text-sm font-medium text-white w-full placeholder:text-slate-600"
                        />
                      </div>
                      <button
                        onClick={() => handleProofSubmit(win.id)}
                        disabled={!proofUrls[win.id]?.trim() || uploading === win.id}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black text-sm px-5 py-3 rounded-xl transition-all"
                      >
                        {uploading === win.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Upload size={14} /> Submit</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {win.proof_screenshot_url && win.verification_status !== 'pending' && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <p className="text-xs text-slate-400 font-medium">Proof submitted — awaiting admin review</p>
                    <a href={win.proof_screenshot_url} target="_blank" rel="noreferrer" className="ml-auto text-xs font-black text-emerald-400 hover:text-white flex items-center gap-1 transition-colors">
                      View Proof <ArrowRight size={12} />
                    </a>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WinnerVerification;
