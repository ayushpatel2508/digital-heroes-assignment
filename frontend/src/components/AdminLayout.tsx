import { Navigate, Routes, Route } from 'react-router-dom';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminCharities from '../pages/admin/AdminCharities';
import AdminDraws from '../pages/admin/AdminDraws';

/**
 * AdminLayout is now a thin sub-router that renders specific admin pages.
 * Wrapping and sidebar is handled by AdminPortalLayout in App.tsx.
 */
const AdminLayout = ({ pathSuffix }: { pathSuffix?: string }) => {
  if (pathSuffix === 'dashboard') return <AdminDashboard />;
  if (pathSuffix === 'draws') return <AdminDraws />;
  if (pathSuffix === 'charities') return <AdminCharities />;

  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="charities" element={<AdminCharities />} />
      <Route path="draws" element={<AdminDraws />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default AdminLayout;
