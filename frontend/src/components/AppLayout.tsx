import Sidebar from './Sidebar';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
