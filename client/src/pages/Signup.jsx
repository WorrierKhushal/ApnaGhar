import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signup, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await signup(name, email, password, phone, role);
    if (result.success) {
      setSuccess(result.message || 'Registration successful!');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary font-heading">Create Account</h2>
        <p className="text-xs text-slate-400">Join AapnaGhar to find stays and experience regional cultures.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-danger p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-655 mb-1">Full Name</label>
          <div className="flex items-center gap-2 border border-border px-3.5 py-2.5 rounded-xl bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-secondary transition-colors">
            <User className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="e.g. Khushal"
              className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

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
          <label className="block text-xs font-bold text-slate-655 mb-1">Phone Number</label>
          <div className="flex items-center gap-2 border border-border px-3.5 py-2.5 rounded-xl bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-secondary transition-colors">
            <Phone className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="e.g. +91 98765 43210"
              className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-655 mb-1">Password</label>
          <div className="flex items-center gap-2 border border-border px-3.5 py-2.5 rounded-xl bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-secondary transition-colors">
            <Lock className="w-4 h-4 text-slate-400" />
            <input 
              type="password" 
              placeholder="Min. 8 characters"
              className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Role Toggle Select */}
        <div>
          <label className="block text-xs font-bold text-slate-655 mb-1.5">Account Role</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`py-3.5 rounded-xl text-xs font-bold border transition-smooth
                ${role === 'user' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-550 border-slate-200'}`}
            >
              Traveler / Guest
            </button>
            <button
              type="button"
              onClick={() => setRole('host')}
              className={`py-3.5 rounded-xl text-xs font-bold border transition-smooth
                ${role === 'host' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-555 border-slate-200'}`}
            >
              Property Host
            </button>
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
              Registering...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-slate-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-secondary font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
