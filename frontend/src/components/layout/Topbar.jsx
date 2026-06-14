import React from 'react';
import useAuth from '../../hooks/useAuth';
import { LogOut, User as UserIcon } from 'lucide-react';
import { ROLE_LABELS } from '../../utils/constants';

export const Topbar = () => {
  const { user, role, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">Bella Clean Management Portal</h2>
      </div>

      <div className="flex items-center gap-6">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-200">
              <UserIcon className="w-4 h-4" />
            </div>

            <div className="text-left">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {user.FirstName} {user.SureName}
              </p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-primary/10 text-brand-primary mt-0.5">
                {ROLE_LABELS[role] || role}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-all duration-150 text-sm font-semibold border border-slate-200"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
