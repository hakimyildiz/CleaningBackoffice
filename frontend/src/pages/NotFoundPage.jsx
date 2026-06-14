import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { ShieldAlert } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light px-4 text-center">
      <div className="p-4 bg-amber-50 text-amber-500 rounded-3xl mb-6 border border-amber-100 shadow-inner">
        <ShieldAlert className="w-10 h-10 animate-bounce" />
      </div>
      <h1 className="text-3xl font-black text-slate-800 tracking-tight">Page Not Found</h1>
      <p className="mt-3 text-sm text-slate-500 max-w-sm font-medium leading-relaxed">
        The page you are looking for does not exist or has been moved to a different URL.
      </p>
      <Link to="/" className="mt-8">
        <Button variant="primary" size="md" className="px-6 font-bold">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
