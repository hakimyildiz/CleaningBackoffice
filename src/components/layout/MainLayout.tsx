"use client";
import { useState, ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../lib/api';
import { LuHouse as Home, LuUsers as Users, LuBuilding2 as Building2, LuCalendar as Calendar, LuFileText as FileText, LuSettings as Settings, LuLogOut as LogOut, LuMenu as Menu, LuX as X, LuShield as Shield, LuUserCheck as UserCheck, LuUser as User, LuBuilding as Building, LuWallet as Wallet, LuClock as Clock, LuChevronDown as ChevronDown, LuLayoutDashboard as LayoutDashboard } from 'react-icons/lu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  cleaner_manager: 'Cleaner Manager',
  cleaner: 'Cleaner',
  customer: 'Customer',
  agency_manager: 'Agency Manager',
  agency_bookkeeper: 'Agency Bookkeeper',
  agency_staff: 'Agency Staff',
};

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: UserRole[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, path: '/', roles: ['admin', 'manager', 'cleaner_manager', 'agency_manager', 'agency_bookkeeper', 'agency_staff'] },
  { label: 'My Schedule', icon: Calendar, path: '/schedule', roles: ['cleaner'] },
  {
    label: 'People',
    icon: Users,
    path: '/people',
    roles: ['admin', 'manager', 'cleaner_manager'],
    children: [
      { label: 'Cleaners', icon: UserCheck, path: '/cleaners', roles: ['admin', 'manager', 'cleaner_manager'] },
      { label: 'Customers', icon: User, path: '/customers', roles: ['admin', 'manager'] },
      { label: 'User Accounts', icon: Shield, path: '/users', roles: ['admin'] },
    ],
  },
  {
    label: 'Agencies',
    icon: Building2,
    path: '/agencies',
    roles: ['admin', 'manager'],
    children: [
      { label: 'Agencies', icon: Building, path: '/agencies', roles: ['admin', 'manager'] },
      { label: 'Agency Staff', icon: Users, path: '/agency-staff', roles: ['admin', 'manager'] },
    ],
  },
  { label: 'Services', icon: LayoutDashboard, path: '/services', roles: ['admin', 'manager', 'agency_manager'] },
  { label: 'Calendar', icon: Calendar, path: '/calendar', roles: ['admin', 'manager', 'cleaner_manager'] },
  { label: 'Invoices', icon: FileText, path: '/invoices', roles: ['admin', 'manager', 'agency_manager', 'agency_bookkeeper'] },
  { label: 'My Invoices', icon: FileText, path: '/my-invoices', roles: ['customer'] },
  { label: 'Payments', icon: Wallet, path: '/payments', roles: ['agency_manager', 'agency_bookkeeper'] },
  { label: 'Timesheets', icon: Clock, path: '/timesheets', roles: ['cleaner_manager'] },
  { label: 'Properties', icon: Building, path: '/properties', roles: ['agency_manager', 'agency_staff'] },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const { userRole, signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.some((r) => r === userRole || userRole === 'admin')
  );

  const handleNavClick = (item: NavItem) => {
    if (item.children) {
      setExpandedMenu(expandedMenu === item.label ? null : item.label);
    } else {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
            <Menu className="h-6 w-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-slate-900">CleanPro</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">CleanPro</h1>
                <p className="text-xs text-slate-500">Service Management</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = item.path === pathname || (item.children && item.children.some(c => c.path === pathname));
                return (
                <li key={item.label}>
                  {item.children ? (
                    <button
                      onClick={() => handleNavClick(item)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        expandedMenu === item.label || isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedMenu === item.label ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        pathname === item.path
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  )}
                  
                  {item.children && (expandedMenu === item.label || isActive) && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.children
                        .filter((child) => child.roles.length === 0 || child.roles.some((r) => r === userRole || userRole === 'admin'))
                        .map((child) => (
                          <li key={child.label}>
                            <Link 
                              href={child.path}
                              onClick={() => setSidebarOpen(false)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                pathname === child.path
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <child.icon className="h-4 w-4" />
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              )})}
            </ul>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                <p className="text-xs text-slate-500">{userRole ? roleLabels[userRole] : 'Unknown'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50">
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button onClick={signOut} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
