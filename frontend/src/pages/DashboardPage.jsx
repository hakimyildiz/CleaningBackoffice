import React from 'react';
import useAuth from '../hooks/useAuth';
import { ROLE_LABELS, ROLES } from '../utils/constants';
import { 
  Users, 
  Calendar, 
  Receipt, 
  Sparkles, 
  ShieldAlert, 
  TrendingUp, 
  Clock,
  CheckCircle2
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, role } = useAuth();

  const renderRoleCards = () => {
    switch (role) {
      case ROLES.ADMIN:
      case ROLES.MANAGER:
        return (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Customers</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">142</h3>
                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 mt-2">
                  <TrendingUp className="w-3.5 h-3.5" /> +12% this month
                </span>
              </div>
              <div className="p-3 bg-brand-accent/10 text-brand-accent rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cleaners Working</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">28</h3>
                <span className="text-[11px] font-bold text-slate-450 mt-2 block">
                  8 scheduled today
                </span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-550 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Invoices</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">£4,850.00</h3>
                <span className="text-[11px] font-bold text-amber-500 mt-2 block">
                  5 overdue invoices
                </span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-550 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </>
        );
      case ROLES.CLEANER_MANAGER:
        return (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Cleaners</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">32</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-550 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Jobs Today</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">15</h3>
              </div>
              <div className="p-3 bg-teal-50 text-teal-550 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </>
        );
      case ROLES.CLEANER:
        return (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Shift</p>
                <h3 className="text-lg font-black text-slate-800 mt-1">09:00 - 15:00</h3>
                <span className="text-[11px] font-bold text-teal-500 flex items-center gap-1 mt-2">
                  <Clock className="w-3.5 h-3.5" /> Starts in 2h
                </span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-550 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Jobs</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">14</h3>
                <span className="text-[11px] font-bold text-slate-450 mt-2 block">
                  This month
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-550 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </>
        );
      case ROLES.CUSTOMER:
        return (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Scheduled Clean</p>
                <h3 className="text-base font-black text-slate-800 mt-1">Wed, 17 June @ 10:00</h3>
                <span className="text-[11px] font-bold text-slate-450 mt-2 block">
                  Regular Weekly Service
                </span>
              </div>
              <div className="p-3 bg-teal-50 text-teal-550 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Invoice Amount</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">£65.00</h3>
                <span className="text-[11px] font-bold text-emerald-500 mt-2 block">
                  Paid on 10/06/2026
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-550 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </>
        );
      default:
        return (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm col-span-full">
            <p className="text-slate-500 text-sm">Welcome to your dashboard. Select an item from the sidebar to manage your account details.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-brand-primary text-white p-8 rounded-3xl relative overflow-hidden shadow-lg shadow-brand-primary/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full filter blur-3xl" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-accent/20 text-brand-accent border border-brand-accent/30 mb-4 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> Phase 1 Live
          </span>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome back, {user?.FirstName || 'User'}!
          </h1>
          <p className="mt-2 text-sm text-slate-350">
            You are logged in as <span className="text-brand-accent font-bold">{ROLE_LABELS[role] || role}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderRoleCards()}
      </div>

      {/* Phase Info */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-brand-accent" />
          Mopsy System Architecture (Phase 1)
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          The Mopsy monorepo structure has been successfully scaffolded with full authentication functionality. 
          The backend API exposes endpoints at <code>/api/v1/auth/</code> using JWT short-lived access tokens and httpOnly refresh cookies for maximum security.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
            <span className="text-slate-800">Root Directory</span>
            <code>/docker-compose.yml</code>
            <code>/.env</code>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
            <span className="text-slate-800">Database System</span>
            <code>MariaDB Container</code>
            <code>mysql2 connection pool</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
