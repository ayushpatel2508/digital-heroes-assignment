import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Play, Shuffle, Sparkles, Terminal, Zap } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { PrizePoolsDisplay } from '../../components/PrizePoolsDisplay';

interface DrawLog {
  id: string;
  draw_month: string;
  status: string;
  winning_numbers?: number[];
  draw_type?: string;
}

const algorithmOptions = [
  {
    id: 'random',
    mode: 'random' as const,
    title: 'Random Draw',
    subtitle: 'Equal chance',
    description: 'Every eligible user with a complete Rolling 5 has the same chance.',
    icon: Shuffle,
  },
  {
    id: 'weighted-frequency',
    mode: 'algorithmic' as const,
    title: 'Score Frequency Weighted',
    subtitle: 'Score weighted',
    description: 'Submitted score frequency influences the winning number pool.',
    icon: Zap,
  },
  {
    id: 'balanced-performance',
    mode: 'algorithmic' as const,
    title: 'Balanced Performance',
    subtitle: 'Activity aware',
    description: 'Uses the algorithmic engine for a performance-aware draw run.',
    icon: Sparkles,
  },
];

const AdminDraws = () => {
  const { user: currentUser } = useAuth();
  const [month, setMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7) + '-01');
  const [algorithmId, setAlgorithmId] = useState(algorithmOptions[0].id);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pastDraws, setPastDraws] = useState<DrawLog[]>([]);
  const selectedAlgorithm = algorithmOptions.find((option) => option.id === algorithmId) || algorithmOptions[0];

  const fetchPastDraws = useCallback(async () => {
    if (!currentUser) return;
    try {
      const response = await apiClient.get('/admin/draws', { headers: { 'x-user-id': currentUser?.id } });
      setPastDraws(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      console.error('Failed to fetch admin draws:', error);
      const apiError = error as { response?: { data?: { error?: string } } };
      setMessage({ type: 'error', text: apiError.response?.data?.error || 'Failed to fetch draw logs from backend.' });
    }
  }, [currentUser]);

  useEffect(() => {
    fetchPastDraws();
  }, [fetchPastDraws]);

  const handleRunDraw = async () => {
    if (!currentUser) return;
    if (!confirm(`Run ${selectedAlgorithm.title} for ${month}?`)) return;

    setLoading(true);
    setMessage(null);
    try {
      const adminHeaders = { 'x-user-id': currentUser.id };
      const genRes = await apiClient.post('/draws/generate', { month, type: selectedAlgorithm.mode }, { headers: adminHeaders });
      const pubRes = await apiClient.post(`/draws/${genRes.data.draw.id}/publish`, { month }, { headers: adminHeaders });
      setMessage({ type: 'success', text: `${selectedAlgorithm.title} complete. Found ${pubRes.data.results.winnersCount} winners.` });
      fetchPastDraws();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } }; message?: string };
      setMessage({ type: 'error', text: apiError.response?.data?.error || apiError.message || 'Failed to run draw.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-500">Admin Panel</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Draw Engine</h1>
        <p className="mt-2 text-sm text-slate-500">Select the draw month, choose the algorithm, and publish the prize distribution.</p>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#172449] text-white">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="font-extrabold">Draw configuration</h2>
              <p className="text-xs text-slate-500">This creates and publishes the draw in one action.</p>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-wide text-slate-400">Draw month</span>
            <input
              type="date"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-slate-950"
            />
          </label>

          <div className="mt-6">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">Algorithm selector</p>
            <div className="grid gap-3 md:grid-cols-3">
              {algorithmOptions.map((option) => {
                const Icon = option.icon;
                const selected = option.id === algorithmId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAlgorithmId(option.id)}
                    className={`rounded-lg border p-4 text-left transition ${
                      selected ? 'border-[#172449] bg-[#172449] text-white' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} className={selected ? 'text-amber-300' : 'text-slate-400'} />
                    <p className="mt-4 text-sm font-extrabold">{option.title}</p>
                    <p className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${selected ? 'text-white/60' : 'text-slate-400'}`}>{option.subtitle}</p>
                    <p className={`mt-3 text-xs leading-5 ${selected ? 'text-white/70' : 'text-slate-500'}`}>{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRunDraw}
            disabled={loading}
            className="mt-6 w-full rounded-md bg-amber-400 py-4 text-sm font-extrabold text-slate-950 disabled:opacity-60"
          >
            <Play size={16} /> {loading ? 'Running draw...' : 'Run and publish draw'}
          </button>

          {message && (
            <div className={`mt-4 flex items-center gap-2 rounded-md p-4 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Terminal size={18} className="text-slate-400" />
            <h2 className="font-extrabold">Protocol logs</h2>
          </div>
          <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {pastDraws.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">No logs found</p>
            ) : (
              pastDraws.map((draw) => (
                <div key={draw.id} className="rounded-md border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-extrabold">{new Date(draw.draw_month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase ${draw.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {draw.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(draw.winning_numbers || []).map((number: number) => (
                      <span key={number} className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-xs font-extrabold text-white">{number}</span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">{draw.draw_type}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <PrizePoolsDisplay />
    </div>
  );
};

export default AdminDraws;
