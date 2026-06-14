import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, getAuthToken, setAuthToken, type AuthUser, type UserRole } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  userRole: UserRole | null;
  entityId: number | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; success: boolean }>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: Error | null; success: boolean }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [entityId, setEntityId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const result = await authApi.me();
      setUser(result.user);
      setUserRole(result.user.role as UserRole);
      setEntityId(result.user.entityId || null);
    } catch (err) {
      console.error('Error fetching user:', err);
      setAuthToken(null);
      setUser(null);
      setUserRole(null);
      setEntityId(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authApi.login(email, password);
      setAuthToken(result.token);
      setUser(result.user);
      setUserRole(result.user.role as UserRole);
      setEntityId(result.user.entityId || null);
      return { error: null, success: true };
    } catch (err) {
      return { error: err as Error, success: false };
    }
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const result = await authApi.register(email, password, role);
      setAuthToken(result.token);
      setUser(result.user);
      setUserRole(result.user.role as UserRole);
      return { error: null, success: true };
    } catch (err) {
      return { error: err as Error, success: false };
    }
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAuthToken(null);
      setUser(null);
      setUserRole(null);
      setEntityId(null);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!userRole) return false;
    if (userRole === 'admin') return true;

    const perms: Record<UserRole, string[]> = {
      admin: ['*'],
      manager: ['view_all', 'manage_cleaners', 'manage_customers', 'manage_services', 'manage_schedules', 'view_invoices', 'manage_invoices'],
      cleaner_manager: ['view_cleaners', 'manage_cleaner_schedules', 'manage_timesheets', 'view_cleaner_details'],
      customer: ['view_own_invoices', 'request_extra_cleaning', 'reschedule_cleaning', 'view_own_services'],
      cleaner: ['clock_in_out', 'upload_photos', 'view_own_schedule', 'view_own_records'],
      agency_manager: ['manage_agency_properties', 'manage_agency_staff', 'view_agency_invoices', 'manage_agency_payments', 'view_agency_services'],
      agency_bookkeeper: ['view_agency_invoices', 'manage_agency_payments'],
      agency_staff: ['view_property_status', 'request_cleaner', 'set_expected_arrival', 'view_assigned_properties'],
    };

    return perms[userRole]?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      entityId,
      loading,
      signIn,
      signUp,
      signOut,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
