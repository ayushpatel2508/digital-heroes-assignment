import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Heart, X, PlusCircle, Sparkles, Globe, ArrowRight } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

const AdminCharities = () => {
  const { user: currentUser } = useAuth();
  const [charities, setCharities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    logo_url: '',
    is_featured: false
  });

  useEffect(() => {
    if (currentUser) {
      fetchCharities();
    }
  }, [currentUser]);

  const fetchCharities = async () => {
    try {
      const { data } = await apiClient.get('/admin/charities', {
        headers: { 'x-user-id': currentUser?.id }
      });
      // The backend doesn't have list charities yet, but we have a public route or can use admin?
      // Actually, admin.ts doesn't have GET /charities yet! 
      // I should add it to admin.ts or use the public one.
      // Let's add it to admin.ts for consistency.
      setCharities(data || []);
    } catch (error) {
      console.error('Error fetching charities:', error);
      // Fallback for list if admin route missing
      try {
        const { data } = await apiClient.get('/charities');
        setCharities(data || []);
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const handleAddCharity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await apiClient.post('/admin/charities', form, {
        headers: { 'x-user-id': currentUser.id }
      });
      setIsAdding(false);
      setForm({ name: '', description: '', logo_url: '', is_featured: false });
      fetchCharities();
    } catch (error) {
      console.error('Error adding charity:', error);
    }
  };

  const deleteCharity = async (id: string) => {
    if (!currentUser || !confirm('Permanent system removal? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/admin/charities/${id}`, {
        headers: { 'x-user-id': currentUser.id }
      });
      fetchCharities();
    } catch (error) {
      console.error('Error deleting charity:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-none">Accessing Charity Protocols...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Heart size={14} className="text-emerald-500" fill="currentColor" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Impact Registry</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight heading-fancy">
            Philanthropy <span className="text-emerald-500">Mgmt</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium italic">Configure impact partners and featured global causes.</p>
        </div>
        
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`px-8 py-4 rounded-[2rem] font-black text-sm tracking-tight flex items-center gap-3 transition-all ${
            isAdding 
            ? 'bg-white/10 text-white hover:bg-white/20' 
            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-xl shadow-emerald-500/20'
          }`}
        >
          {isAdding ? (
            <>
              <X size={20} />
              DISCARD CHANGE
            </>
          ) : (
            <>
              <PlusCircle size={20} />
              PROVISION NEW PARTNER
            </>
          )}
        </button>
      </div>

      {/* Add Form (Glassmorphic) */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl border border-slate-700/50 rounded-[3rem] p-10 mb-12 shadow-2xl relative">
              
              <form onSubmit={handleAddCharity} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-2">Official Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-500"
                      placeholder="Organization Identity"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-2">Assets (Logo URL)</label>
                    <input
                      type="url"
                      value={form.logo_url}
                      onChange={e => setForm({...form, logo_url: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-slate-500"
                      placeholder="SVG/PNG/JPG Resource"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-2">Mission Statement</label>
                    <textarea
                      required
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-600/50 rounded-2xl px-6 py-4 text-white focus:bg-slate-800 focus:border-emerald-500 outline-none transition-all font-medium placeholder:text-slate-500 leading-relaxed resize-none"
                      placeholder="Impact goals..."
                      rows={1}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 px-2">Featured Status</label>
                    <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-600/50 h-[56px]">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={form.is_featured}
                        onChange={e => setForm({...form, is_featured: e.target.checked})}
                        className="w-5 h-5 rounded accent-emerald-500 cursor-pointer bg-slate-700 border-slate-600"
                        style={{ accentColor: '#10b981' }}
                      />
                      <label htmlFor="is_featured" className="text-xs font-black text-slate-300 uppercase tracking-widest cursor-pointer select-none">
                        Featured
                      </label>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full h-16 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-3xl transition-all shadow-2xl shadow-emerald-500/30 active:scale-[0.98] flex items-center justify-center gap-3">
                  DEPLOY LISTING
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partners Catalog Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {charities.map((charity, i) => (
          <motion.div
            key={charity.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -8 }}
            className="group bg-white/5 border border-white/10 rounded-[3rem] p-8 transition-all hover:bg-white/[0.08] hover:border-white/20 relative overflow-hidden"
          >
            {/* Action Bar Overlay */}
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-20">
              <button 
                onClick={() => deleteCharity(charity.id)}
                className="p-3 bg-white/10 hover:bg-rose-500 hover:text-white rounded-2xl transition-all text-slate-400 border border-white/10 backdrop-blur-md"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex items-center gap-6 mb-8 relative z-10">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-emerald-400 border border-white/10 overflow-hidden p-2 group-hover:scale-105 transition-transform duration-500">
                {charity.logo_url ? (
                  <img src={charity.logo_url} className="w-full h-full object-contain filter group-hover:brightness-110" alt={charity.name} />
                ) : (
                  <Globe size={32} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-white truncate group-hover:text-emerald-400 transition-colors">{charity.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {charity.is_featured ? (
                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-amber-500/20">
                      <Sparkles size={10} fill="currentColor" />
                      Featured
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Partner</span>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-slate-400 text-sm font-medium line-clamp-4 mb-8 leading-relaxed italic relative z-10">
              "{charity.description || 'Impact summary pending system update...'}"
            </p>

            {/* Subtle Gradient Glow */}
            <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminCharities;
