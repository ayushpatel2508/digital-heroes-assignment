import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Subscription from './pages/Subscription';
import Dashboard from './pages/Dashboard';
import Charities from './pages/Charities';
import Landing from './pages/Landing';
import MyWins from './pages/MyWins';
import Notifications from './pages/Notifications';
import UserLayout from './components/UserLayout';
import AdminPortalLayout from './components/AdminPortalLayout';
import AdminLayout from './components/AdminLayout';
import AdminUsers from './pages/admin/AdminUsers';
import AdminWinners from './pages/admin/AdminWinners';
import './App.css';

// Global loading spinner
const GlobalLoader = () => (
  <div className="fixed inset-0 bg-[#080c14] flex items-center justify-center z-[9999]">
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-white/5" />
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-emerald-400/30 border-b-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Initialising Platform</p>
    </div>
  </div>
);

// Protected routes for Subscribers (non-admin)
const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <GlobalLoader />;
  if (!user) return <Navigate to="/" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  return <UserLayout>{children}</UserLayout>;
};

// Protected routes for Admins
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <GlobalLoader />;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <AdminPortalLayout>{children}</AdminPortalLayout>;
};

// Redirect logged-in users away from public pages
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <GlobalLoader />;
  if (user) return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  return <>{children}</>;
};

const HomeRoute = () => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <GlobalLoader />;
  if (user) return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  return <Landing />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ── Public Routes ── */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/charities-explorer" element={<Charities />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* ── Subscriber Routes ── */}
          <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
          <Route path="/charities" element={<UserRoute><Charities /></UserRoute>} />
          <Route path="/subscription" element={<UserRoute><Subscription /></UserRoute>} />
          <Route path="/winners" element={<UserRoute><MyWins /></UserRoute>} />
          <Route path="/notifications" element={<UserRoute><Notifications /></UserRoute>} />

          {/* ── Admin Routes ── */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminLayout pathSuffix="dashboard" /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/draws" element={<AdminRoute><AdminLayout pathSuffix="draws" /></AdminRoute>} />
          <Route path="/admin/charities" element={<AdminRoute><AdminLayout pathSuffix="charities" /></AdminRoute>} />
          <Route path="/admin/winners" element={<AdminRoute><AdminWinners /></AdminRoute>} />
          <Route path="/admin/notifications" element={<AdminRoute><Notifications /></AdminRoute>} />

          {/* ── Catch All ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
