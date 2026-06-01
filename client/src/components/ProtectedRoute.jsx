import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Shield } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, initialized } = useAuthStore();

  // Show a premium glassmorphic loader while Zustand checks startup cookies
  if (!initialized) {
    return (
      <div className="min-h-screen bg-customBg flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-secondary" /> Verifying AapnaGhar Session...
        </p>
      </div>
    );
  }

  // Redirect to Sign In if no user profile is active
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is authorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Render children/sub-routes
  return <Outlet />;
}
