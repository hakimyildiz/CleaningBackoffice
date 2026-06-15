import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import LoginForm from '../components/LoginForm';
import { Sparkles } from 'lucide-react';

import { getPortalRoute } from '../../../components/common/ProtectedRoute';

export const LoginPage = () => {
  const { login, role, accessToken, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get target page path, defaults to dashboard
  const from = location.state?.from?.pathname || '/';

  // If user is already logged in, redirect them immediately
  useEffect(() => {
    if (accessToken && role) {
      const destination = from === '/' || from === '/login' ? getPortalRoute(role) : from;
      navigate(destination, { replace: true });
    }
  }, [accessToken, role, navigate, from]);

  const handleLoginSubmit = async ({ username, password }) => {
    setLoading(true);
    setError('');

    const result = await login(username, password);
    if (!result.success) {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4 py-12 relative overflow-hidden">
      {/* Dynamic ambient lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-accent/5 filter blur-[80px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/20 filter blur-[80px]" />

      <div className="max-w-md w-full space-y-8 bg-brand-primary/40 backdrop-blur-lg p-8 rounded-2xl border border-slate-800/80 shadow-2xl relative z-10">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-brand-accent/10 rounded-2xl text-brand-accent mb-4 ring-1 ring-brand-accent/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest">Mopsy</h1>
          <p className="mt-2 text-xs text-slate-400 text-center font-semibold uppercase tracking-wider">
            Cleaning Service Management Portal
          </p>
        </div>

        <div className="mt-6">
          <LoginForm
            onSubmit={handleLoginSubmit}
            isLoading={loading || authLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
