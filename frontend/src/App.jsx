import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import useAuth from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { ROLES } from './utils/constants';

// Pages
import LoginPage from './features/auth/pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

// Phase 4 Pages
import CleanerDashboardPage from './features/cleanerDashboard/pages/CleanerDashboardPage';
import ServiceDetailPage from './features/services/pages/ServiceDetailPage';
import ServiceRecordDetailPage from './features/serviceRecords/pages/ServiceRecordDetailPage';
import InvoiceListPage from './features/invoices/pages/InvoiceListPage';
import InvoiceDetailPage from './features/invoices/pages/InvoiceDetailPage';
import SchedulePage from './features/services/pages/SchedulePage';

// Phase 5 Pages
import PaymentListPage from './features/payments/pages/PaymentListPage';
import EmployeePaymentPage from './features/employeePayments/pages/EmployeePaymentPage';
import RequestsQueuePage from './features/requests/pages/RequestsQueuePage';

// Dashboard Wrapper to handle role-aware dashboard page rendering
const DashboardWrapper = () => {
  const { role } = useAuth();
  if (role === ROLES.CLEANER) {
    return <CleanerDashboardPage />;
  }
  return <DashboardPage />;
};

// Employees Pages
import EmployeeListPage from './features/employees/pages/EmployeeListPage';
import EmployeeFormPage from './features/employees/pages/EmployeeFormPage';

// Customers Pages
import CustomerListPage from './features/customers/pages/CustomerListPage';
import CustomerFormPage from './features/customers/pages/CustomerFormPage';

// Agency Staff Pages
import AgencyStaffListPage from './features/agencyStaff/pages/AgencyStaffListPage';
import AgencyStaffFormPage from './features/agencyStaff/pages/AgencyStaffFormPage';

// Users Pages
import UserListPage from './features/users/pages/UserListPage';

// Agencies Pages
import AgencyListPage from './features/agencies/pages/AgencyListPage';
import AgencyFormPage from './features/agencies/pages/AgencyFormPage';

// Services Pages
import ServiceListPage from './features/services/pages/ServiceListPage';
import ServiceFormPage from './features/services/pages/ServiceFormPage';

// Settings Pages
import ServiceOptionsSettingsPage from './features/settings/pages/ServiceOptionsSettingsPage';

// Role restriction wrapper that displays an error toast on redirect
const RoleRestrictedRoute = ({ allowedRoles, children }) => {
  const { role } = useAuth();
  const { addToast } = useToast();

  const isAuthorized = role && allowedRoles.includes(role);

  useEffect(() => {
    if (!isAuthorized) {
      addToast("You don't have permission to access that page.", 'error');
    }
  }, [isAuthorized, addToast]);

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Under construction placeholder for future Phase 3 pages
const UnderConstruction = ({ title }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center py-16">
    <div className="w-16 h-16 bg-brand-accent/10 text-brand-accent rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-xl">🛠️</span>
    </div>
    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
      This page is under construction for Phase 3. The skeleton structure is ready.
    </p>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Public Authentication Path */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Shell Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardWrapper />} />
        <Route path="dashboard" element={<DashboardWrapper />} />

        {/* Employees Routes */}
        <Route
          path="employees"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.CLEANER_MANAGER]}>
              <EmployeeListPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="employees/new"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <EmployeeFormPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="employees/:id/edit"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <EmployeeFormPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Customers Routes */}
        <Route
          path="customers"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <CustomerListPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="customers/new"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <CustomerFormPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="customers/:id/edit"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <CustomerFormPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Agency Staff Routes */}
        <Route
          path="agency-staff"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <AgencyStaffListPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="agency-staff/new"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <AgencyStaffFormPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="agency-staff/:id/edit"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <AgencyStaffFormPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Users Routes (Admin only) */}
        <Route
          path="users"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN]}>
              <UserListPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Agencies Routes */}
        <Route
          path="agencies"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <AgencyListPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="agencies/new"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <AgencyFormPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="agencies/:id/edit"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <AgencyFormPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Services Routes */}
        <Route
          path="services"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.CLEANER_MANAGER]}>
              <ServiceListPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="services/new"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <ServiceFormPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="services/:id/edit"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <ServiceFormPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Settings / Service Options Routes */}
        <Route
          path="settings/service-options"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <ServiceOptionsSettingsPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Other Pages */}
        {/* Services Detail page */}
        <Route
          path="services/:id"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.CLEANER_MANAGER]}>
              <ServiceDetailPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Service Record Detail page */}
        <Route
          path="service-records/:id"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <ServiceRecordDetailPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Schedule Page */}
        <Route
          path="schedule"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.CLEANER_MANAGER]}>
              <SchedulePage />
            </RoleRestrictedRoute>
          }
        />

        {/* Invoices Pages */}
        <Route
          path="invoices"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <InvoiceListPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="invoices/:id"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENCY_BOOKKEEPER]}>
              <InvoiceDetailPage />
            </RoleRestrictedRoute>
          }
        />

        {/* Phase 5 Financial & Change Request Routes */}
        <Route
          path="payments"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <PaymentListPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="employee-payments"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <EmployeePaymentPage />
            </RoleRestrictedRoute>
          }
        />
        <Route
          path="requests"
          element={
            <RoleRestrictedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <RequestsQueuePage />
            </RoleRestrictedRoute>
          }
        />

        <Route path="settings" element={<UnderConstruction title="System Settings" />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/404" replace />} />
      <Route path="/404" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
