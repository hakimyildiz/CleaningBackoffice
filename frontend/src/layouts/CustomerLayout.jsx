import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { LayoutDashboard, Building2, Calendar, Receipt, LogOut, User, Sparkles } from 'lucide-react';

export const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/customer-portal', icon: LayoutDashboard },
    { label: 'My Properties', path: '/customer-portal/properties', icon: Building2 },
    { label: 'Schedule', path: '/customer-portal/schedule', icon: Calendar },
    { label: 'Invoices', path: '/customer-portal/invoices', icon: Receipt }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800 pb-16 md:pb-0">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-brand-accent/10 rounded-xl text-brand-accent">
            <Sparkles className="w-5 h-5" />
          </span>
          <span className="text-lg font-black tracking-tight text-slate-800">
            BellaClean
          </span>
          <span className="hidden sm:inline bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
            Customer Portal
          </span>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/50 p-1 rounded-2xl">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 py-1.5 px-3 rounded-full hover:bg-slate-100 transition-colors focus:outline-hidden"
          >
            <div className="w-7 h-7 bg-brand-accent/20 text-brand-accent rounded-full flex items-center justify-center font-bold text-xs">
              {user?.FirstName ? user.FirstName[0].toUpperCase() : 'C'}
            </div>
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">
              {user?.FirstName || 'Customer'}
            </span>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signed in as</p>
                  <p className="text-xs font-black text-slate-800 truncate">{user?.FirstName} {user?.SureName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden flex justify-around items-center py-2 shadow-lg">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1.5 px-3 py-1 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-brand-accent font-black'
                  : 'text-slate-400 font-bold'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default CustomerLayout;
