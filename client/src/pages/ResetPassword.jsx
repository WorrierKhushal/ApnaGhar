import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await api.post('/auth/reset-password', { token, password });
      alert("Password updated successfully! Redirecting to Sign In.");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Token might be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary font-heading">Choose New Password</h2>
        <p className="text-xs text-slate-400">Set a secure password for your account.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-danger p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-655 mb-1">New Password</label>
          <div className="flex items-center gap-2 border border-border px-3.5 py-2.5 rounded-xl bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-secondary transition-colors">
            <Lock className="w-4 h-4 text-slate-400" />
            <input 
              type="password" 
              placeholder="Enter new password"
              className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-655 mb-1">Confirm New Password</label>
          <div className="flex items-center gap-2 border border-border px-3.5 py-2.5 rounded-xl bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-secondary transition-colors">
            <Lock className="w-4 h-4 text-slate-400" />
            <input 
              type="password" 
              placeholder="Confirm new password"
              className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-smooth pt-3 mt-4 flex items-center justify-center gap-2"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
