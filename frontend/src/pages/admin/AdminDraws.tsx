import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Terminal,
  ArrowRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

const AdminDraws = () => {
  const { user: currentUser } = useAuth();
  const [month, setMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7) + '-01');
  const [type, setType] = useState<'random' | 'algorithmic'>('random');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pastDraws, setPastDraws] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchPastDraws();
    }
  }, [currentUser]);

  const fetchPastDraws = async () => {
    try {
      const response = await apiClient.get('/admin/draws', {
        headers: { 'x-user-id': currentUser?.id }
      });
      setPastDraws(response.data || []);
    } catch (error) {
      console.error('Error fetching past draws:', error);
    }
  };

  const handleRunDraw = async () => {
    if (!currentUser) return;
    
    // Validate date is not in the past
    const selectedDate = new Date(month);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setMessage({ type: 'error', text: 'Please select a valid date. Cannot execute draws for past months.' });
      return;
    }
    
    if (!confirm('PROTOCOL INITIATION: Are you sure you want to execute the prize distribution?')) return;
    
    setLoading(true);
    setMessage(null);
    try {
      const adminHeaders = { 'x-user-id': currentUser.id };
      const genRes = await apiClient.post('/draws/generate', { month, type }, { headers: adminHeaders });
      const pubRes = await apiClient.post(`/draws/${genRes.data.draw.id}/publish`, { month }, { headers: adminHeaders });

      setMessage({ 
        type: 'success', 
        text: `PRIZE PROTOCOL COMPLETE: Found ${pubRes.data.results.winnersCount} winners.` 
      });
      fetchPastDraws();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-emerald-500" fill="currentColor" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Draw Protocol 734-X</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight heading-fancy">
            Distribution <span className="text-emerald-500">Engine</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Verify system parameters and execute prize pool allocation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Draw Configuration */}
        <section className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-2xl font-black text-white heading-fancy">Initiate Distribution</h2>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Temporal Targeting</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Calendar className="text-slate-400" size={20} />
                  </div>
                  <input
                    type="date"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-8 py-5 text-lg font-black text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Algorithm Selector</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setType('random')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${type === 'random' ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                    <TrendingUp size={28} />
                    <span className="font-black text-[10px] uppercase tracking-widest">Random</span>
                  </button>
                  <button onClick={() => setType('algorithmic')} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${type === 'algorithmic' ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                    <Zap size={28} />
                    <span className="font-black text-[10px] uppercase tracking-widest">Weighted</span>
                  </button>
                </div>
                
                {/* Algorithm Explanation */}
                <div className="mt-6 p-4 bg-slate-900/50 border border-white/5 rounded-xl">
                  {type === 'random' ? (
                    <p className="text-sm text-slate-400 leading-relaxed">
                      <span className="text-emerald-400 font-bold">Random Selection:</span> All eligible participants have an equal chance of winning. The system randomly selects winners from users who have submitted 5 valid scores for the month.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 leading-relaxed">
                      <span className="text-emerald-400 font-bold">Weighted Algorithm:</span> Winners are selected based on performance metrics. Users with higher scores and better consistency have increased probability of selection, rewarding active and high-performing participants.
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleRunDraw}
                disabled={loading}
                className="w-full h-20 bg-white text-slate-950 rounded-[2rem] font-black text-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 group/btn"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>FIRE PROTOCOL <ArrowRight /></>}
              </button>
            </div>
          </div>
        </section>

        {/* Global Message */}
        {message && (
          <div>
            <div className={`p-6 rounded-[2rem] border flex items-center gap-4 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              <div className="flex-shrink-0">
                {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <p className="font-bold">{message.text}</p>
            </div>
          </div>
        )}

        {/* Action Logs */}
        <section className="bg-slate-950 border border-white/5 rounded-[3rem] p-10 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-white/5 rounded-2xl text-slate-400 border border-white/5">
              <Terminal size={24} />
            </div>
            <h2 className="text-2xl font-black text-white heading-fancy">Protocol Logs</h2>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {pastDraws.length === 0 ? (
              <p className="text-slate-500 font-bold opacity-30 text-center py-10">No logs found</p>
            ) : (
              pastDraws.map((draw) => (
                <div key={draw.id} className="bg-white/5 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-white">{new Date(draw.draw_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${draw.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                        {draw.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {draw.winning_numbers.map((n: number) => (
                        <div key={n} className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-emerald-400">
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Algorithm</p>
                    <p className="text-sm font-black text-emerald-500 uppercase tracking-tight">{draw.draw_type}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDraws;
