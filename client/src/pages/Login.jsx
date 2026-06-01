import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary font-heading">Welcome Back</h2>
        <p className="text-xs text-slate-400">Log in to your AapnaGhar account to manage stays.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-danger p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-655 mb-1">Email Address</label>
          <div className="flex items-center gap-2 border border-border px-3.5 py-2.5 rounded-xl bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-secondary transition-colors">
            <Mail className="w-4 h-4 text-slate-400" />
            <input 
              type="email" 
              placeholder="e.g. khushal@email.com"
              className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-bold text-slate-655">Password</label>
            <Link to="/forgot-password" className="text-[10px] text-secondary font-bold hover:underline">
              Forgot Password?
            </Link>
          </div>
          <div className="flex items-center gap-2 border border-border px-3.5 py-2.5 rounded-xl bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-secondary transition-colors">
            <Lock className="w-4 h-4 text-slate-400" />
            <input 
              type="password" 
              placeholder="Enter Password"
              className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-smooth pt-3 mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-slate-400 mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-secondary font-bold hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
