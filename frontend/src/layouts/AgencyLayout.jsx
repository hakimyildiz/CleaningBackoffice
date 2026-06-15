import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { 
  LayoutDashboard, Building2, Calendar, 
  Receipt, ClipboardList, UserCheck, 
  LogOut, Menu, X, Sparkles 
} from 'lucide-react';

export const AgencyLayout = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Define sidebar items by role
  const getNavItems = () => {
    const common = [{ label: 'Home', path: '/agency-portal', icon: LayoutDashboard }];
    
    if (role === 'agency_staff') {
      return [
        ...common,
        { label: 'My Properties', path: '/agency-portal/properties', icon: Building2 },
        { label: 'Schedule', path: '/agency-portal/schedule', icon: Calendar },
        { label: 'Requests', path: '/agency-portal/requests', icon: ClipboardList }
      ];
    }
    
    if (role === 'agency_bookkeeper') {
      return [
        ...common,
        { label: 'Properties', path: '/agency-portal/properties', icon: Building2 },
        { label: 'Invoices', path: '/agency-portal/invoices', icon: Receipt }
      ];
    }
    
    if (role === 'agency_manager') {
      return [
        ...common,
        { label: 'Properties', path: '/agency-portal/properties', icon: Building2 },
        { label: 'Schedule', path: '/agency-portal/schedule', icon: Calendar },
        { label: 'Invoices', path: '/agency-portal/invoices', icon: Receipt },
        { label: 'Requests', path: '/agency-portal/requests', icon: ClipboardList },
        { label: 'Assignments', path: '/agency-portal/staff-assignments', icon: UserCheck }
      ];
    }
    
    return common;
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Mobile Top Navigation Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="p-1.5 bg-brand-accent/10 rounded-lg text-brand-accent">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="font-bold tracking-tight text-sm">Agency Portal</span>
        </div>

        <button 
          onClick={handleLogout} 
          className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transform transition-transform duration-200 md:translate-x-0 md:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-brand-accent/20 rounded-xl text-brand-accent">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-white font-black text-sm tracking-tight">BellaClean</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Agency Dashboard</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-accent text-slate-900 shadow-lg shadow-brand-accent/10'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar User Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
              {user?.FirstName ? user.FirstName[0].toUpperCase() : 'A'}
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-white leading-tight truncate max-w-[120px]">
                {user?.FirstName} {user?.SureName}
              </p>
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                {role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 hover:bg-slate-800 text-red-400 hover:text-red-300 rounded-lg"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden pt-16 md:pt-0">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b border-slate-200/80 px-8 py-4 items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Logged in Agency Staff
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-black text-slate-800">{user?.FirstName} {user?.SureName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {role?.replace('_', ' ')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent font-bold text-xs flex items-center justify-center">
              {user?.FirstName ? user.FirstName[0].toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AgencyLayout;
