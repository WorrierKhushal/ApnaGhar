import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Components & guards
import ProtectedRoute from './components/ProtectedRoute';

// State Stores
import useAuthStore from './store/useAuthStore';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import ListingDetails from './pages/ListingDetails';
import TripPlanner from './pages/TripPlanner';
import Checkout from './pages/Checkout';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// Dashboard Pages
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Check active cookies and renew sessions on app boot
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Views Layout */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="listings/:id" element={<ListingDetails />} />
          <Route path="planner" element={<TripPlanner />} />
          {/* Catch-all back to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Authentication Flow Layout */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-email" element={<VerifyEmail />} />
        </Route>

        {/* Unified Dashboard Section */}
        <Route element={<ProtectedRoute allowedRoles={['user', 'host', 'admin']} />}>
          <Route path="checkout/:bookingId" element={<Checkout />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="bookings" element={<UserDashboard />} />
            <Route path="wishlist" element={<UserDashboard />} />
            <Route path="list-ghar" element={<UserDashboard />} />
            <Route path="my-ghars" element={<UserDashboard />} />
            <Route path="reservations" element={<UserDashboard />} />
          </Route>
        </Route>

        {/* Admin Dashboard Section */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="listings" element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminDashboard />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
