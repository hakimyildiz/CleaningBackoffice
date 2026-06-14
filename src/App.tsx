import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { UserRole } from './lib/api';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { ManagerDashboard } from './pages/dashboard/ManagerDashboard';
import { CleanerManagerDashboard } from './pages/dashboard/CleanerManagerDashboard';
import { CleanerDashboard } from './pages/dashboard/CleanerDashboard';
import { CustomerDashboard } from './pages/dashboard/CustomerDashboard';
import { AgencyManagerDashboard } from './pages/dashboard/AgencyManagerDashboard';
import { AgencyBookkeeperDashboard } from './pages/dashboard/AgencyBookkeeperDashboard';
import { AgencyStaffDashboard } from './pages/dashboard/AgencyStaffDashboard';
import { MainLayout } from './components/layout/MainLayout';

function AppContent() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <MainLayout>{getDashboard(userRole)}</MainLayout>;
}

function getDashboard(role: UserRole | null) {
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'cleaner_manager':
      return <CleanerManagerDashboard />;
    case 'cleaner':
      return <CleanerDashboard />;
    case 'customer':
      return <CustomerDashboard />;
    case 'agency_manager':
      return <AgencyManagerDashboard />;
    case 'agency_bookkeeper':
      return <AgencyBookkeeperDashboard />;
    case 'agency_staff':
      return <AgencyStaffDashboard />;
    default:
      return <AdminDashboard />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
