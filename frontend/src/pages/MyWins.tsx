import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Image as ImageIcon, Trophy, Upload, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

interface Winner {
  id: string;
  match_type: string;
  prize_amount: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'paid';
  has_proof: boolean;
  created_at: string;
  monthly_draws?: { draw_month: string; winning_numbers: number[] };
}

const MyWins = () => {
  const { user } = useAuth();
  const [wins, setWins] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchWins();
  }, [user]);

  const fetchWins = async () => {
    if (!user) return;
    try {
      const response = await apiClient.get(`/winners/user/${user.id}`);
      setWins(response.data || []);
    } catch {
      setWins([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (winnerId: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }
    setUploading(winnerId);
    const formData = new FormData();
    formData.append('proof', file);
    try {
      await apiClient.post(`/winners/${winnerId}/upload-proof`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchWins();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload proof.');
    } finally {
      setUploading(null);
    }
  };

  const totalWinnings = wins.reduce((sum, win) => sum + win.prize_amount, 0);
  const paidWinnings = wins.filter((win) => win.payment_status === 'paid').reduce((sum, win) => sum + win.prize_amount, 0);
  const pendingWinnings = wins.filter((win) => win.payment_status === 'pending').reduce((sum, win) => sum + win.prize_amount, 0);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-500">Winnings</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">My Winnings</h1>
        <p className="mt-2 text-sm text-slate-500">Track prizes, verification status, and payout proof.</p>
      </div>

      {error && <div className="rounded-md bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total Winnings" value={`£${totalWinnings.toFixed(2)}`} />
        <Stat label="Paid Out" value={`£${paidWinnings.toFixed(2)}`} />
        <Stat label="Pending" value={`£${pendingWinnings.toFixed(2)}`} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-extrabold">Winnings history</h2>
        </div>
        {wins.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy size={34} className="mx-auto text-slate-300" />
            <p className="mt-3 font-bold text-slate-500">No wins yet</p>
            <p className="mt-1 text-sm text-slate-400">Your winning entries will show here after a published draw.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {wins.map((win) => {
              const status = getStatus(win);
              const StatusIcon = status.icon;
              const drawDate = win.monthly_draws?.draw_month
                ? new Date(win.monthly_draws.draw_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                : 'Unknown draw';

              return (
                <div key={win.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#172449] text-white">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="text-lg font-extrabold">£{win.prize_amount.toFixed(2)}</p>
                      <p className="flex items-center gap-2 text-xs font-bold text-slate-400"><Calendar size={12} /> {drawDate} · {win.match_type}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-extrabold ${status.className}`}>
                      <StatusIcon size={13} /> {status.label}
                    </span>
                    {!win.has_proof && win.verification_status !== 'rejected' ? (
                      <label className="cursor-pointer rounded-md bg-slate-950 px-3 py-2 text-xs font-extrabold text-white">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          className="hidden"
                          disabled={uploading === win.id}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) handleUploadProof(win.id, file);
                          }}
                        />
                        <span className="inline-flex items-center gap-1">
                          <Upload size={13} /> {uploading === win.id ? 'Uploading...' : 'Upload proof'}
                        </span>
                      </label>
                    ) : win.has_proof ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-2 text-xs font-extrabold text-blue-700">
                        <ImageIcon size={13} /> Uploaded
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const getStatus = (winner: Winner) => {
  if (winner.payment_status === 'paid') return { icon: CheckCircle2, label: 'Paid', className: 'bg-emerald-50 text-emerald-700' };
  if (winner.verification_status === 'rejected') return { icon: XCircle, label: 'Rejected', className: 'bg-rose-50 text-rose-700' };
  if (winner.verification_status === 'approved') return { icon: CheckCircle2, label: 'Approved', className: 'bg-blue-50 text-blue-700' };
  if (winner.has_proof) return { icon: Clock, label: 'Under Review', className: 'bg-amber-50 text-amber-700' };
  return { icon: Clock, label: 'Awaiting Proof', className: 'bg-slate-100 text-slate-600' };
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-2xl font-extrabold">{value}</p>
    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
  </div>
);

export default MyWins;
