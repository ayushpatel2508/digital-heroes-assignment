import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { charityApi } from '../api/charityApi';
import type { Charity, UserCharity } from '../api/charityApi';
import { Heart, Star, CheckCircle2, Search, Sparkles, Globe, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CharitySelectionModal from '../components/CharitySelectionModal';

const Charities = () => {
  const { user } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [userCharity, setUserCharity] = useState<UserCharity | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCharityForModal, setSelectedCharityForModal] = useState<Charity | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [charityApi.getAllCharities()];
      if (user) {
        promises.push(charityApi.getUserCharity(user.id).catch(() => null));
      }
      
      const [charitiesRes, userCharityRes] = await Promise.all(promises);
      setCharities(charitiesRes.charities || []);
      if (user) {
        setUserCharity(userCharityRes);
      }
    } catch (error) {
      console.error('Error fetching charities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClick = (charityId: string) => {
    if (!user) return;
    const charity = charities.find(c => c.id === charityId);
    if (charity) {
      setSelectedCharityForModal(charity);
      setModalOpen(true);
    }
  };

  const handleConfirmSelection = async (percentage: number) => {
    if (!user || !selectedCharityForModal) return;
    
    const isFirstTime = !userCharity;
    
    setSelecting(selectedCharityForModal.id);
    setMessage(null);
    
    try {
      const res = await charityApi.selectCharity(user.id, selectedCharityForModal.id, percentage);
      setUserCharity(res.data);
      
      if (isFirstTime) {
        setMessage({ 
          type: 'success', 
          text: `Successfully registered to ${selectedCharityForModal.name}! ${percentage}% of your subscription will support this charity.` 
        });
      } else {
        setMessage({ 
          type: 'success', 
          text: `Charity changed to ${selectedCharityForModal.name}! Change will apply from next month.` 
        });
      }
      
      setModalOpen(false);
      setSelectedCharityForModal(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to select charity' });
    } finally {
      setSelecting(null);
    }
  };

  const handleCloseModal = () => {
    if (!selecting) {
      setModalOpen(false);
      setSelectedCharityForModal(null);
    }
  };

  const filteredCharities = charities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const featured = filteredCharities.filter((c) => c.is_featured);
  const regular = filteredCharities.filter((c) => !c.is_featured);
  const selectedCharityId = userCharity?.charity_id;

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Accessing Global Impact List...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      {/* Charity Selection Modal */}
      <CharitySelectionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmSelection}
        charityName={selectedCharityForModal?.name || ''}
        isLoading={!!selecting}
      />

      {/* Hero Impact Section */}
      <div className="relative rounded-[4rem] bg-gradient-to-br from-slate-900 to-black p-12 lg:p-20 text-white overflow-hidden shadow-2xl border border-white/5">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] text-emerald-400 group-hover:emerald-glow transition-all">
              <Heart size={32} fill="currentColor" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Philanthropy Registry</span>
          </div>
          <h1 className="text-6xl font-black heading-fancy leading-tight mb-8">
            Define Your <span className="text-emerald-500 font-black italic">Legacy.</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-xl">
            10% of every subscription plan is directed to the mission you target. Choose the cause that aligns with your values.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[80%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
      </div>

      {/* Modern Search & Control Bar */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={24} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mission, name or keyword..."
            className="w-full pl-20 pr-10 py-7 bg-white/5 border border-white/10 rounded-[2.5rem] text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-emerald-500/50 outline-none transition-all shadow-2xl font-bold"
          />
        </div>

        {userCharity && (
          <div className="px-10 py-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center gap-6 shadow-xl w-full md:w-auto">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Target Mission</p>
              <p className="text-lg font-black text-white">{userCharity.charities?.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-6 rounded-[2rem] text-sm font-black text-center border ${
              message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Partnerships */}
      {featured.length > 0 && (
        <div className="space-y-10">
          <div className="flex items-center gap-4 px-4">
            <Sparkles size={28} className="text-amber-500" />
            <h2 className="text-3xl font-black text-white heading-fancy uppercase tracking-tighter">Strategic Partnerships</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {featured.map((charity) => (
              <CharityCard
                key={charity.id}
                charity={charity}
                isSelected={selectedCharityId === charity.id}
                isSelecting={selecting === charity.id}
                onSelect={handleSelectClick}
                isLoggedIn={!!user}
                featured
              />
            ))}
          </div>
        </div>
      )}

      {/* Global Catalog */}
      <div className="space-y-10 pt-12">
        <div className="flex items-center gap-4 px-4">
          <Globe size={28} className="text-slate-600" />
          <h2 className="text-3xl font-black text-white heading-fancy uppercase tracking-tighter">Global Impact Registry</h2>
        </div>
        {regular.length === 0 && featured.length === 0 ? (
          <div className="text-center py-32 bg-white/5 rounded-[4rem] border border-dashed border-white/10 group">
            <Heart size={80} className="mx-auto mb-8 text-slate-800 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-2xl font-black text-slate-500 heading-fancy">No matching partners detected</p>
            <button onClick={() => setSearchQuery('')} className="mt-4 text-emerald-400 font-bold hover:text-white transition-colors">Reset filter protocols</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {regular.map((charity) => (
              <CharityCard
                key={charity.id}
                charity={charity}
                isSelected={selectedCharityId === charity.id}
                isSelecting={selecting === charity.id}
                onSelect={handleSelectClick}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CharityCard = ({
  charity,
  isSelected,
  isSelecting,
  onSelect,
  isLoggedIn,
  featured = false
}: {
  charity: Charity;
  isSelected: boolean;
  isSelecting: boolean;
  onSelect: (id: string) => void;
  isLoggedIn: boolean;
  featured?: boolean;
}) => {
  return (
    <motion.div
      layout
      whileHover={{ y: -10 }}
      className={`group relative bg-white/5 rounded-[3rem] border overflow-hidden transition-all duration-500 ${
        isSelected 
        ? 'border-emerald-500 shadow-[0_0_50px_-20px_rgba(16,185,129,0.3)] bg-white/10' 
        : 'border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
      }`}
    >
      {/* Header Container */}
      <div className={`relative ${featured ? 'h-48' : 'h-40'} overflow-hidden bg-slate-800`}>
        {charity.logo_url ? (
          <img 
            src={charity.logo_url} 
            alt={charity.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-black">
            <span className="text-white/10 text-8xl font-black">{charity.name.charAt(0)}</span>
          </div>
        )}
        
        {/* Rich Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
          <div className="flex-1 min-w-0">
            {featured && (
              <div className="flex items-center gap-2 bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-3 w-fit shadow-xl shadow-amber-500/20">
                <Star size={12} fill="currentColor" />
                PREMIUM PARTNER
              </div>
            )}
            <h3 className="text-3xl font-black text-white heading-fancy leading-tight truncate">{charity.name}</h3>
          </div>
          {isSelected && (
            <div className="w-14 h-14 bg-emerald-500 rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <CheckCircle2 size={28} className="text-slate-950" />
            </div>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6">
        <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6 line-clamp-2">
          {charity.description || 'Pioneering new standards in global impact and sustainable community development.'}
        </p>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <button
              onClick={() => onSelect(charity.id)}
              disabled={isSelected || isSelecting}
              className={`flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isSelected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                : 'bg-white text-slate-950 hover:bg-emerald-500'
              } active:scale-[0.98] disabled:opacity-80`}
            >
              {isSelecting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : isSelected ? (
                'SELECTED'
              ) : (
                <>
                  SELECT
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          ) : (
            <div className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 font-bold text-[10px] uppercase tracking-wider">
              Login Required
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Charities;
