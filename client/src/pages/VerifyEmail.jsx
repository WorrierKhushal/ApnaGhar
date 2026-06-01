import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    // Simulate API check
    const timer = setTimeout(() => {
      if (token) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <div className="space-y-6 text-center">
      {status === 'verifying' && (
        <div className="space-y-4 py-8">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold text-primary font-heading">Verifying Your Email</h2>
          <p className="text-xs text-slate-400">Verifying authenticity token with database...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6 py-6">
          <ShieldCheck className="w-16 h-16 text-success mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-primary font-heading">Email Verified!</h2>
            <p className="text-xs text-slate-450">Thank you. Your account is now fully verified. You can now explore homestays and book local activities.</p>
          </div>
          <Link 
            to="/login"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-light text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-smooth"
          >
            Go to Sign In <ArrowRight className="w-4 h-4 text-secondary" />
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6 py-6">
          <ShieldAlert className="w-16 h-16 text-danger mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-primary font-heading">Verification Failed</h2>
            <p className="text-xs text-slate-450">The token is invalid, expired, or corrupted. Please request a new verification link from your profile dashboard.</p>
          </div>
          <Link 
            to="/"
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-primary font-bold px-6 py-3 rounded-xl text-xs border border-border"
          >
            Back to Homepage
          </Link>
        </div>
      )}
    </div>
  );
}
