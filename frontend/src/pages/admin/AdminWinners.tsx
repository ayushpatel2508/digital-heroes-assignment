import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Search,
  X,
  ExternalLink,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

interface Winner {
  id: string;
  user_id: string;
  draw_id: string;
  match_type: string;
  prize_amount: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'paid';
  proof_screenshot_url?: string;
  created_at: string;
  profiles?: { full_name: string; email?: string };
  monthly_draws?: { draw_month: string };
}

const getStatusDisplay = (winner: Winner) => {
  if (winner.verification_status === 'rejected') return { label: 'Rejected', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
  if (winner.payment_status === 'paid') return { label: 'Paid', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  if (winner.verification_status === 'approved') return { label: 'Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  if (winner.proof_screenshot_url) return { label: 'Proof Submitted', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
  return { label: 'Pending Proof', color: 'text-slate-400', bg: 'bg-white/5 border-white/10' };
};

const AdminWinners = () => {
  const { user: currentUser } = useAuth();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('proof_submitted');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchWinners();
    }
  }, [currentUser]);

  const fetchWinners = async () => {
    try {
      const response = await apiClient.get('/admin/winners', {
        headers: { 'x-user-id': currentUser?.id }
      });
      setWinners(response.data || []);
    } catch (err) {
      console.error('Error fetching winners:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateWinner = async (id: string, updates: Partial<Winner>) => {
    setUpdating(id);
    try {
      await apiClient.patch(`/admin/winners/${id}`, updates, {
        headers: { 'x-user-id': currentUser?.id }
      });
      setWinners(prev => prev.map(w => w.id === id ? { ...w, ...updates as any } : w));
    } catch (err) {
      console.error('Error updating winner:', err);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = winners.filter(w => {
    const matchSearch = !search ||
      w.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
      w.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = 
      (statusFilter === 'proof_submitted' && w.proof_screenshot_url) || // All with proof, regardless of status
      (statusFilter === 'pending' && w.verification_status === 'pending' && !w.proof_screenshot_url) ||
      (statusFilter === 'paid' && w.payment_status === 'paid') ||
      (statusFilter === 'rejected' && w.verification_status === 'rejected');

    return matchSearch && matchStatus;
  });

  const proofSubmitted = winners.filter(w => w.proof_screenshot_url && w.verification_status === 'pending').length; // Only pending with proof
  const totalPaid = winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + (w.prize_amount || 0), 0);

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
          <Trophy size={12} className="text-emerald-400" fill="currentColor" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Verification System</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Winner Verification</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Review proof submissions and manage prize payouts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-white">{winners.length}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Winners</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-blue-400">{proofSubmitted}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Pending Review</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-emerald-400">{winners.filter(w => w.verification_status === 'approved').length}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Verified</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-emerald-400">£{totalPaid.toLocaleString()}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Paid Out</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
          <Search size={16} className="text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-medium text-white w-full placeholder:text-slate-600"
          />
          {search && <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white"><X size={14} /></button>}
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-medium text-white outline-none cursor-pointer"
        >
          <option value="proof_submitted" className="bg-slate-900 text-white">Proof Submitted</option>
          <option value="pending" className="bg-slate-900 text-white">Pending</option>
          <option value="paid" className="bg-slate-900 text-white">Paid</option>
          <option value="rejected" className="bg-slate-900 text-white">Rejected</option>
        </select>
      </div>

      {/* Winners List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 text-center">
            <Trophy size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No winners found</p>
          </div>
        ) : (
          filtered.map((winner, i) => {
            const status = getStatusDisplay(winner);
            const drawDate = winner.monthly_draws?.draw_month
              ? new Date(winner.monthly_draws.draw_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
              : 'Unknown Draw';

            return (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-black text-emerald-400 flex-shrink-0">
                      {winner.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{winner.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{winner.profiles?.email}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400">{drawDate}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{winner.match_type}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-[10px] font-black text-emerald-400">£{(winner.prize_amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>

                    {winner.proof_screenshot_url && (
                      <a
                        href={winner.proof_screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-black text-slate-400 hover:text-white transition-colors"
                      >
                        <ExternalLink size={12} /> View Proof
                      </a>
                    )}

                    {/* Action Buttons */}
                    {winner.verification_status === 'pending' && winner.proof_screenshot_url && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateWinner(winner.id, { verification_status: 'approved' })}
                          disabled={updating === winner.id}
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                          className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button
                          onClick={() => updateWinner(winner.id, { verification_status: 'rejected' })}
                          disabled={updating === winner.id}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                          className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center gap-1"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}
                    {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                      <button
                        onClick={() => updateWinner(winner.id, { payment_status: 'paid' })}
                        disabled={updating === winner.id}
                        style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
                        className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 flex items-center gap-1"
                      >
                        <DollarSign size={12} /> Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminWinners;
