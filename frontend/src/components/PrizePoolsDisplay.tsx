import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trophy } from 'lucide-react';
import apiClient from '../api/apiClient';
import { supabase } from '../lib/supabase';

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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetchPrizePools();

    const channel = supabase
      .channel('prize_pools_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prize_pools' },
        () => {
          console.log('🔄 Realtime update: Prize pools changed, fetching new data...');
          fetchPrizePools();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPrizePools = async () => {
    try {
      const response = await apiClient.get('/draws/prize-pools');
      setPrizePools(response.data || []);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching prize pools:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount || 0);

  const formatMonth = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const currentDate = new Date();
  
  // Generate the rolling 12 months (Current month + 11 future months)
  const rollingMonths = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });

  // Map generated months to fetched data or default to 0
  const displayPools = rollingMonths.map(monthKey => {
    const found = prizePools.find(p => p.draw_month === monthKey);
    return found || {
      id: monthKey, // temporary ID
      draw_month: monthKey,
      total_pool: 0,
      pool_5_match: 0,
      pool_4_match: 0,
      pool_3_match: 0,
      rollover_from_previous: 0
    };
  });

  const featuredPool = displayPools[0];
  const upcomingPools = displayPools.slice(1);

  if (loading) {
    return (
      <div className="flex justify-center rounded-none border border-slate-200 bg-white py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
      </div>
    );
  }

  if (!featuredPool) {
    return (
      <section className="rounded-none border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-amber-50 text-amber-600">
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="font-extrabold">Prize pool</h2>
            <p className="text-xs text-slate-500">
              {loadError ? 'Live prize pool data is unavailable.' : 'Prize pool totals will appear after the next draw is published.'}
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['5-match jackpot', '40%', 'bg-amber-50 text-amber-700'],
            ['4-match prize', '35%', 'bg-blue-50 text-blue-700'],
            ['3-match prize', '25%', 'bg-rose-50 text-rose-700'],
          ].map(([label, value, classes]) => (
            <div key={label} className={`rounded-none p-4 ${classes}`}>
              <p className="text-2xl font-extrabold">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-none bg-[#172449] p-6 text-white shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-300">Prize pool</p>
            <h2 className="mt-1 text-2xl font-extrabold">{formatMonth(featuredPool.draw_month)}</h2>
          </div>
          <Trophy size={30} className="text-amber-300" />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <PoolTile label="Total Pool" value={formatCurrency(featuredPool.total_pool)} />
          <PoolTile label="5-Match" value={formatCurrency(featuredPool.pool_5_match)} accent="text-amber-300" />
          <PoolTile label="4-Match" value={formatCurrency(featuredPool.pool_4_match)} accent="text-blue-200" />
          <PoolTile label="3-Match" value={formatCurrency(featuredPool.pool_3_match)} accent="text-rose-200" />
        </div>
      </motion.div>

      {upcomingPools.length > 0 && (
        <div className="rounded-none border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calendar size={17} className="text-slate-400" />
            <h3 className="font-extrabold">Upcoming prize pools</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {upcomingPools.map((pool) => (
              <div key={pool.id} className="rounded-none border border-slate-100 p-4">
                <p className="font-extrabold">{formatMonth(pool.draw_month)}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{formatCurrency(pool.total_pool)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const PoolTile = ({ label, value, accent = 'text-white' }: { label: string; value: string; accent?: string }) => (
  <div className="rounded-none bg-white/10 p-4">
    <p className={`text-xl font-extrabold ${accent}`}>{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/60">{label}</p>
  </div>
);
