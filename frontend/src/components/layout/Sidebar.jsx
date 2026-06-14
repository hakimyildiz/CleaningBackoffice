import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import requestService from '../../features/requests/services/requestService';
import { 
  LayoutDashboard, 
  Users, 
  Contact, 
  Building2, 
  Sparkles, 
  Calendar, 
  Receipt, 
  Settings,
  Briefcase,
  UserCog,
  DollarSign,
  CreditCard,
  ClipboardList
} from 'lucide-react';
import { ROLES } from '../../utils/constants';

export const Sidebar = () => {
  const { role } = useAuth();
  const location = useLocation();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
      const fetchCount = async () => {
        try {
          const result = await requestService.getRequests({ limit: 1, status: 'pending' });
          setPendingRequestsCount(result.pagination?.pendingCount || 0);
        } catch (e) {
          console.error('Failed to fetch requests count:', e);
        }
      };

      fetchCount();
      const interval = setInterval(fetchCount, 60000);
      return () => clearInterval(interval);
    }
  }, [role]);

  const allItems = [
    {
      label: 'Dashboard',
      path: role === ROLES.CLEANER ? '/dashboard' : '/',
      icon: LayoutDashboard,
      roles: [
        ROLES.ADMIN, ROLES.MANAGER, ROLES.CLEANER_MANAGER, ROLES.CLEANER,
        ROLES.CUSTOMER, ROLES.AGENCY_MANAGER, ROLES.AGENCY_BOOKKEEPER, ROLES.AGENCY_STAFF
      ]
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: Users,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: Contact,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CLEANER_MANAGER]
    },
    {
      label: 'Agency Staff',
      path: '/agency-staff',
      icon: Briefcase,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    },
    {
      label: 'Users',
      path: '/users',
      icon: UserCog,
      roles: [ROLES.ADMIN]
    },
    {
      label: 'Agencies',
      path: '/agencies',
      icon: Building2,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    },
    {
      label: 'Services',
      path: '/services',
      icon: Sparkles,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CLEANER_MANAGER]
    },
    {
      label: 'Schedule',
      path: '/schedule',
      icon: Calendar,
      roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CLEANER_MANAGER]
    },
    {
      label: 'My Schedule',
      path: '/schedule',
      icon: Calendar,
      roles: [ROLES.CLEANER]
    },
    {
      label: 'Invoices',
      path: '/invoices',
      icon: Receipt,
      roles: [
        ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER,
        ROLES.AGENCY_MANAGER, ROLES.AGENCY_BOOKKEEPER
      ]
    },
    {
      label: 'Payments',
      path: '/payments',
      icon: DollarSign,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    },
    {
      label: 'Employee Payments',
      path: '/employee-payments',
      icon: CreditCard,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    },
    {
      label: 'Requests',
      path: '/requests',
      icon: ClipboardList,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    },
    {
      isHeader: true,
      label: 'Settings',
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    },
    {
      label: 'Service Options',
      path: '/settings/service-options',
      icon: Settings,
      roles: [ROLES.ADMIN, ROLES.MANAGER]
    }
  ];

  // Filter based on user's role
  const menuItems = allItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-brand-dark text-slate-300 flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-brand-primary/50 flex items-center gap-3">
        <span className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent">
          <Sparkles className="w-5 h-5" />
        </span>
        <span className="text-xl font-bold tracking-wider text-white">Mopsy</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          if (item.isHeader) {
            return (
              <div 
                key={index} 
                className="pt-4 pb-1.5 text-slate-500 text-[9px] font-bold uppercase tracking-widest pl-4 select-none"
              >
                {item.label}
              </div>
            );
          }
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-brand-accent text-brand-dark shadow-md shadow-brand-accent/10'
                  : 'hover:bg-brand-primary hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.label === 'Requests' && pendingRequestsCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center h-5 w-5 text-[10px] font-black text-white bg-amber-500 rounded-full animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-brand-primary/50 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Mopsy Portal
      </div>
    </aside>
  );
};

export default Sidebar;
