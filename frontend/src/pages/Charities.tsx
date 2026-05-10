import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Heart, Medal, Search, Star } from 'lucide-react';
import { charityApi } from '../api/charityApi';
import type { Charity, UserCharity } from '../api/charityApi';
import { useAuth } from '../context/AuthContext';
import CharitySelectionModal from '../components/CharitySelectionModal';

const PublicHeader = () => (
  <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white">
          <Medal size={15} />
        </span>
        <span className="text-sm font-extrabold">Play for Dreams</span>
      </Link>
      <nav className="hidden items-center gap-5 text-xs font-bold text-slate-500 md:flex">
        <a href="/#features" className="hover:text-slate-950">Features</a>
        <a href="/#how-it-works" className="hover:text-slate-950">How it works</a>
        <a href="/#impact" className="hover:text-slate-950">Impact</a>
        <Link to="/charities-explorer" className="hover:text-slate-950">Charities</Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link to="/login" className="rounded-md px-3 py-2 text-xs font-extrabold text-slate-500 hover:bg-slate-100 hover:text-slate-950">
          Login
        </Link>
        <Link to="/register" className="rounded-md bg-slate-950 px-3 py-2 text-xs font-extrabold text-white">
          Start
        </Link>
      </div>
    </div>
  </header>
);

const getCharityList = (response: unknown): Charity[] => {
  if (Array.isArray(response)) return response;

  if (typeof response === 'object' && response !== null && 'charities' in response) {
    const charities = (response as { charities?: Charity[] }).charities;
    return Array.isArray(charities) ? charities : [];
  }

  return [];
};

const blackPillButton = 'btn-pill-black';

const Charities = () => {
  const { user } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [userCharity, setUserCharity] = useState<UserCharity | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const promises: Promise<unknown>[] = [charityApi.getAllCharities()];
      if (user) promises.push(charityApi.getUserCharity(user.id).catch(() => null));

      const [charitiesRes, userCharityRes] = await Promise.all(promises);
      const charityList = getCharityList(charitiesRes);

      setCharities(charityList);
      setUserCharity(user ? (userCharityRes as UserCharity | null) : null);
      setMessage(null);
    } catch (error: unknown) {
      console.error('Failed to fetch charities:', error);
      setCharities([]);
      setUserCharity(null);
      setMessage(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectClick = (charityId: string) => {
    if (!user) return;
    const charity = charities.find((item) => item.id === charityId);
    if (charity) {
      setSelectedCharity(charity);
      setModalOpen(true);
    }
  };

  const handleConfirmSelection = async (percentage: number) => {
    if (!user || !selectedCharity) return;

    setSelecting(selectedCharity.id);
    try {
      const res = await charityApi.selectCharity(user.id, selectedCharity.id, percentage);
      setUserCharity(res.data);
      setMessage({ type: 'success', text: `${selectedCharity.name} selected. ${percentage}% contribution active.` });
      setModalOpen(false);
      setSelectedCharity(null);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      setMessage({ type: 'error', text: apiError.response?.data?.error || 'Failed to select charity' });
    } finally {
      setSelecting(null);
    }
  };

  const filteredCharities = charities.filter((charity) =>
    `${charity.name} ${charity.description || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#fafafa] text-slate-950">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
      </div>
    );
  }

  const featuredCharities = filteredCharities.filter((c) => c.is_featured);
  const otherCharities = filteredCharities.filter((c) => !c.is_featured);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-950">
      {!user && <PublicHeader />}
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <CharitySelectionModal
          isOpen={modalOpen}
          onClose={() => !selecting && setModalOpen(false)}
          onConfirm={handleConfirmSelection}
          charityName={selectedCharity?.name || ''}
          isLoading={!!selecting}
        />

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-500">Verified Partners</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Browse our charity partners</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Choose a cause to support through your subscription. Your contribution helps verified charities make real impact.
            You can update your choice any time.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Heart size={20} className="text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total partners</p>
                <p className="text-2xl font-extrabold text-slate-900">{charities.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Star size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Featured</p>
                <p className="text-2xl font-extrabold text-slate-900">{featuredCharities.length}</p>
              </div>
            </div>
          </div>

          {userCharity && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Your selection</p>
                  <p className="truncate text-sm font-extrabold text-emerald-900">{userCharity.charities?.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or mission..."
            className="w-full rounded-md border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-950 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>

        {message && (
          <div
            className={`rounded-md p-4 text-sm font-bold ${
              message.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {featuredCharities.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Star size={18} className="text-amber-500" fill="currentColor" />
              <h2 className="font-extrabold text-slate-900">Featured Partners</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {featuredCharities.map((charity) => (
                <CharityCard
                  key={charity.id}
                  charity={charity}
                  isSelected={userCharity?.charity_id === charity.id}
                  isSelecting={selecting === charity.id}
                  onSelect={handleSelectClick}
                  isLoggedIn={!!user}
                />
              ))}
            </div>
          </div>
        )}

        {otherCharities.length > 0 && (
          <div>
            <h2 className="mb-4 font-extrabold text-slate-900">All Partners</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {otherCharities.map((charity) => (
                <CharityCard
                  key={charity.id}
                  charity={charity}
                  isSelected={userCharity?.charity_id === charity.id}
                  isSelecting={selecting === charity.id}
                  onSelect={handleSelectClick}
                  isLoggedIn={!!user}
                />
              ))}
            </div>
          </div>
        )}

        {filteredCharities.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100">
                <Heart size={28} className="text-slate-300" />
              </div>
            </div>
            <p className="mt-4 font-extrabold text-slate-700">No charities found</p>
            <p className="mt-1 text-sm text-slate-500">Try searching with different terms or check back soon.</p>
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
}: {
  charity: Charity;
  isSelected: boolean;
  isSelecting: boolean;
  onSelect: (id: string) => void;
  isLoggedIn: boolean;
}) => (
  <div className={`overflow-hidden rounded-lg border bg-white shadow-sm transition ${isSelected ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
    <div className="relative h-40 bg-slate-100">
      {charity.logo_url ? (
        <img src={charity.logo_url} alt={charity.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-5xl font-extrabold text-slate-300">{charity.name.charAt(0)}</div>
      )}
      {charity.is_featured && (
        <div className="absolute left-3 top-3 rounded-md bg-amber-400 px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-slate-950">
          Featured
        </div>
      )}
    </div>
    <div className="p-5">
      <h3 className="font-extrabold text-slate-900">{charity.name}</h3>
      <p className="mt-2 min-h-[40px] line-clamp-2 text-sm text-slate-600">
        {charity.description || 'Supporting verified charity initiatives.'}
      </p>
      {isLoggedIn ? (
        <button
          onClick={() => onSelect(charity.id)}
          disabled={isSelected || isSelecting}
          className={`${blackPillButton} mt-4 w-full ${isSelected ? 'bg-emerald-100 text-emerald-700 shadow-none hover:scale-100' : ''}`}
        >
          <span>{isSelecting ? 'Selecting...' : isSelected ? 'Selected' : 'Select'}</span>
          {!isSelected && <Search size={14} />}
        </button>
      ) : (
        <Link to="/login" className={blackPillButton + ' mt-4 w-full'}>
          <span>Sign in to select</span>
          <Search size={14} />
        </Link>
      )}
    </div>
  </div>
);

export default Charities;