import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Mail,
  ShieldCheck,
  Edit2,
  X,
  Save,
  AlertCircle,
  Crown,
  UserMinus,
  LogOut,
} from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  subscriptions?: { plan_type: string; status: string }[];
}

const AdminUsers = () => {
  const { user: currentUser, signOut } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users', {
        headers: { 'x-user-id': currentUser?.id }
      });
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser || !currentUser) return;
    setSaving(true);
    try {
      await apiClient.patch(`/admin/users/${editingUser.id}`, {
        full_name: editingUser.full_name,
        is_admin: editingUser.is_admin
      }, {
        headers: { 'x-user-id': currentUser.id }
      });
      await fetchUsers();
      setEditingUser(null);
    } catch (err) {
      console.error('Error saving user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePromoteUser = async (userId: string) => {
    if (!currentUser) return;
    setPromoting(userId);
    try {
      await apiClient.post(`/admin/users/${userId}/promote`, {}, {
        headers: { 'x-user-id': currentUser.id }
      });
      await fetchUsers();
    } catch (err) {
      console.error('Error promoting user:', err);
    } finally {
      setPromoting(null);
    }
  };

  const handleDemoteUser = async (userId: string) => {
    if (!currentUser) return;
    setPromoting(userId);
    try {
      await apiClient.post(`/admin/users/${userId}/demote`, {}, {
        headers: { 'x-user-id': currentUser.id }
      });
      await fetchUsers();
    } catch (err) {
      console.error('Error demoting user:', err);
    } finally {
      setPromoting(null);
    }
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

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

  const activeCount = users.filter(u => u.subscriptions?.some(s => s.status === 'active')).length;
  const adminCount = users.filter(u => u.is_admin).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={12} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">User Registry</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">User Management</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {users.length} total · {activeCount} active subscribers · {adminCount} admins
          </p>
        </div>
        
        <button 
          onClick={async () => {
            await signOut();
            window.location.href = '/login';
          }}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl transition-all border border-rose-500/20 flex items-center gap-2"
          title="Sign Out"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-white">{users.length}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Users</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Active Subscribers</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-2xl font-black text-emerald-400">{adminCount}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Admins</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
        <Search size={16} className="text-slate-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-sm font-medium text-white w-full placeholder:text-slate-600"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_150px_120px_100px_120px] gap-4 px-6 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">User</p>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Plan</p>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Status</p>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Role</p>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Actions</p>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No users found</p>
          </div>
        ) : (
          filtered.map((user, i) => {
            const sub = user.subscriptions?.[0];
            const isActive = sub?.status === 'active';
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[1fr_150px_120px_100px_120px] gap-4 px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center font-black text-slate-300 text-sm flex-shrink-0">
                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{user.full_name || '—'}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                      <Mail size={9} />{user.email}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {sub?.plan_type || '—'}
                  </span>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-500'
                  }`}>
                    {isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                <div>
                  {user.is_admin ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-slate-600 uppercase">User</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
                    title="Edit User"
                  >
                    <Edit2 size={12} />
                  </button>
                  
                  {user.is_admin ? (
                    <button
                      onClick={() => handleDemoteUser(user.id)}
                      disabled={promoting === user.id || user.id === currentUser?.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title={user.id === currentUser?.id ? "Cannot demote yourself" : "Remove Admin"}
                    >
                      {promoting === user.id ? (
                        <div className="w-3 h-3 border border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                      ) : (
                        <UserMinus size={12} />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePromoteUser(user.id)}
                      disabled={promoting === user.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                      title="Promote to Admin"
                    >
                      {promoting === user.id ? (
                        <div className="w-3 h-3 border border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                      ) : (
                        <Crown size={12} />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={(e) => e.target === e.currentTarget && setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#0d1117] border border-white/[0.1] rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-white text-xl">Edit User</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm font-medium outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Email</label>
                  <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 text-slate-500 text-sm font-medium">
                    {editingUser.email}
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle size={9} /> Email changes must be made through Supabase Auth
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.07] rounded-xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span className="font-bold text-sm text-white">Admin Privileges</span>
                  </div>
                  <button
                    onClick={() => setEditingUser({ ...editingUser, is_admin: !editingUser.is_admin })}
                    className={`w-12 h-6 rounded-full transition-all relative ${editingUser.is_admin ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${editingUser.is_admin ? 'left-6.5 translate-x-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.08] text-white font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={saving}
                  className="flex-1 py-3 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all disabled:opacity-50"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
