import React, { useState } from 'react';
import Button from '../../../components/common/Button';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export const LoginForm = ({ onSubmit, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onSubmit({ username: username.trim(), password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center justify-center font-semibold animate-pulse">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <User className="w-4 h-4" />
          </span>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full bg-brand-primary border border-slate-700/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all duration-200"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Lock className="w-4 h-4" />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-brand-primary border border-slate-700/60 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all duration-200"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 focus:outline-none"
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full text-brand-dark py-3 text-sm font-bold tracking-wide mt-3"
      >
        Sign in to Mopsy
      </Button>
    </form>
  );
};

export default LoginForm;
