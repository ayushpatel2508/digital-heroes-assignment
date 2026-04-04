import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Upload, CheckCircle2, Clock, XCircle, Image as ImageIcon, Calendar, AlertCircle } from 'lucide-react';
import apiClient from '../api/apiClient';

interface Winner {
  id: string;
  match_type: string;
  prize_amount: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'paid';
  proof_screenshot_url: string | null;
  has_proof: boolean;
  proof_url: string | null;
  created_at: string;
  monthly_draws?: {
    draw_month: string;
    winning_numbers: number[];
  };
}

const MyWins = () => {
  const { user } = useAuth();
  const [wins, setWins] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchWins();
    }
  }, [user]);

  const fetchWins = async () => {
    if (!user) return;
    
    try {
      const response = await apiClient.get(`/winners/user/${user.id}`);
      setWins(response.data || []);
    } catch (err: any) {
      console.error('Error fetching wins:', err);
      setError('Failed to load your wins');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleUploadProof = async (winnerId: string, file: File) => {
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      showToast('File too large! Maximum size is 5MB. Please compress your image and try again.', 'error');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file type! Only JPEG, PNG, and WebP images are allowed.', 'error');
      return;
    }

    setUploading(winnerId);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('proof', file);

      await apiClient.post(`/winners/${winnerId}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Proof uploaded successfully! Your submission is under review.', 'success');
      
      // Refresh wins
      await fetchWins();
    } catch (err: any) {
      const errorCode = err.response?.data?.code;
      const errorMessage = err.response?.data?.error;

      // Show user-friendly error messages based on error code
      if (errorCode === 'FILE_TOO_LARGE') {
        showToast('File too large! Maximum size is 5MB. Please compress your image.', 'error');
      } else if (errorCode === 'INVALID_FILE_TYPE') {
        showToast('Invalid file type! Only JPEG, PNG, and WebP images are allowed.', 'error');
      } else if (errorCode === 'ALREADY_UPLOADED') {
        showToast('Proof already uploaded! You can only upload once per win.', 'error');
      } else if (errorCode === 'STORAGE_NOT_CONFIGURED') {
        showToast('Storage error! Please contact support.', 'error');
      } else {
        showToast(errorMessage || 'Failed to upload proof. Please try again.', 'error');
      }
      
      setError(errorMessage || 'Failed to upload proof');
    } finally {
      setUploading(null);
    }
  };

  const getStatusBadge = (winner: Winner) => {
    if (winner.payment_status === 'paid') {
      return { icon: CheckCircle2, label: 'Paid', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    }
    if (winner.verification_status === 'rejected') {
      return { icon: XCircle, label: 'Rejected', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
    }
    if (winner.verification_status === 'approved') {
      return { icon: CheckCircle2, label: 'Approved', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    }
    if (winner.has_proof) {
      return { icon: Clock, label: 'Under Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    }
    return { icon: Clock, label: 'Awaiting Proof', color: 'text-slate-400', bg: 'bg-white/5 border-white/10' };
  };

  const totalWinnings = wins.reduce((sum, w) => sum + w.prize_amount, 0);
  const paidWinnings = wins.filter(w => w.payment_status === 'paid').reduce((sum, w) => sum + w.prize_amount, 0);
  const pendingWinnings = wins.filter(w => w.payment_status === 'pending').reduce((sum, w) => sum + w.prize_amount, 0);

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
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 max-w-md"
          >
            <div className={`rounded-2xl p-4 shadow-2xl border backdrop-blur-xl ${
              toast.type === 'success' 
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-start gap-3">
                {toast.type === 'success' ? (
                  <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm leading-relaxed">{toast.message}</p>
                </div>
                <button
                  onClick={() => setToast(null)}
                  className="text-white/50 hover:text-white/80 transition-colors"
                >
                  <XCircle size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={12} className="text-emerald-400" fill="currentColor" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Your Victories</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">My Wins</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Track your prizes and upload proof screenshots</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm font-bold">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-white">£{totalWinnings.toFixed(2)}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Winnings</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-emerald-400">£{paidWinnings.toFixed(2)}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Paid Out</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-amber-400">£{pendingWinnings.toFixed(2)}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Pending</p>
        </div>
      </div>

      {/* Wins List */}
      <div className="space-y-3">
        {wins.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 text-center">
            <Trophy size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No wins yet</p>
            <p className="text-slate-600 text-sm mt-1">Keep playing and good luck!</p>
          </div>
        ) : (
          wins.map((win, i) => {
            const status = getStatusBadge(win);
            const StatusIcon = status.icon;
            const drawDate = win.monthly_draws?.draw_month
              ? new Date(win.monthly_draws.draw_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
              : 'Unknown Draw';

            return (
              <motion.div
                key={win.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Win Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Trophy size={24} className="text-emerald-400" fill="currentColor" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-white text-lg">£{win.prize_amount.toFixed(2)}</p>
                        <span className="text-[10px] font-black text-slate-500 uppercase px-2 py-1 bg-white/5 rounded-lg">
                          {win.match_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <Calendar size={10} />
                        <span>{drawDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 ml-auto flex-wrap">
                    <span className={`text-[10px] font-black uppercase px-3 py-2 rounded-lg border flex items-center gap-2 ${status.bg} ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>

                    {/* Upload Button or Status */}
                    {!win.has_proof && win.verification_status !== 'rejected' ? (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          className="hidden"
                          disabled={uploading === win.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadProof(win.id, file);
                          }}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase rounded-lg transition-all">
                          {uploading === win.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={12} />
                              Upload Proof
                            </>
                          )}
                        </div>
                      </label>
                    ) : win.has_proof ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-[10px] uppercase rounded-lg">
                        <ImageIcon size={12} />
                        Uploaded
                      </div>
                    ) : null}
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

export default MyWins;
