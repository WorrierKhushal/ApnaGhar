import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSent(false);
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSent(true);
      
      // Console log mock reset token to facilitate user transitions
      if (response.data.resetToken) {
        console.log("SIMULATED RESET TOKEN:", response.data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset request failed. Verify email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary font-heading">Reset Password</h2>
        <p className="text-xs text-slate-400">Enter your email and we'll send a recovery link.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-danger p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!sent ? (
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

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-smooth pt-3 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? 'Sending...' : 'Send Recovery Link'}
          </button>
        </form>
      ) : (
        <div className="bg-green-50 text-green-800 p-6 rounded-2xl border border-green-200 text-center space-y-2">
          <p className="font-bold text-sm">Recovery Link Sent!</p>
          <p className="text-xs text-green-700">Check your inbox at <strong>{email}</strong> for instructions to change your password.</p>
        </div>
      )}

      <div className="text-center mt-6">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-secondary font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
