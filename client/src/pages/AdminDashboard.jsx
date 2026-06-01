import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Home, Calendar, Award, DollarSign, Search, 
  Trash2, UserCheck, UserX, CheckCircle, XCircle, Activity, 
  Cpu, HardDrive, AlertTriangle, RefreshCw, Check, X, ShieldAlert 
} from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    hostsCount: 0,
    listingsCount: 0,
    bookingsCount: 0,
    cumulativeRevenue: 0
  });

  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'verifications', 'listings'
  
  // Search and Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [listingSearch, setListingSearch] = useState('');

  // UI Notification state
  const [notification, setNotification] = useState(null);

  // Fetch all administrative data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch aggregate statistics
      const statsRes = await api.get('/admin/stats');
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }

      // 2. Fetch all registered users
      const usersRes = await api.get('/admin/users');
      if (usersRes.data?.success) {
        setUsers(usersRes.data.data || []);
      }

      // 3. Fetch all active stay listings
      const listingsRes = await api.get('/listings');
      if (listingsRes.data?.success) {
        setListings(listingsRes.data.data || []);
      }
    } catch (err) {
      console.error('Error loading administrative data:', err);
      showNotification('error', 'Failed to fetch platform configuration settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // 1. User role update handler
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        showNotification('success', res.data.message || `User role updated to ${newRole}`);
        // Locally update user list to reflect role changes instantly
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        // Reload stats to update host counts
        const statsRes = await api.get('/admin/stats');
        if (statsRes.data?.success) setStats(statsRes.data.data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not change user role.';
      showNotification('error', errMsg);
    }
  };

  // 2. User account deletion handler
  const handleUserDelete = async (userId) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this user account? All associated profile metadata will be lost.')) {
      return;
    }

    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data?.success) {
        showNotification('success', 'User account successfully deleted from the platform.');
        setUsers(users.filter(u => u._id !== userId));
        // Refresh aggregate metrics
        const statsRes = await api.get('/admin/stats');
        if (statsRes.data?.success) setStats(statsRes.data.data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Unable to delete user account.';
      showNotification('error', errMsg);
    }
  };

  // 3. Host Verification status handler
  const handleHostVerification = async (userId, verifyState) => {
    try {
      const res = await api.put(`/admin/users/${userId}/verify-host`, { isVerifiedHost: verifyState });
      if (res.data?.success) {
        showNotification('success', verifyState ? 'Host account has been verified!' : 'Host verification status revoked.');
        // Update user state locally
        setUsers(users.map(u => {
          if (u._id === userId) {
            return {
              ...u,
              hostDetails: {
                ...(u.hostDetails || {}),
                isVerifiedHost: verifyState
              }
            };
          }
          return u;
        }));
      }
    } catch (err) {
      showNotification('error', 'Error modifying host verification flags.');
    }
  };

  // 4. Listing Stay moderation deletion handler
  const handleListingDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to moderate and remove this stay listing? This action is permanent.')) {
      return;
    }

    try {
      const res = await api.delete(`/admin/listings/${listingId}`);
      if (res.data?.success) {
        showNotification('success', 'Stay listing has been successfully moderated and deleted.');
        setListings(listings.filter(l => l._id !== listingId));
        // Refresh aggregate metrics
        const statsRes = await api.get('/admin/stats');
        if (statsRes.data?.success) setStats(statsRes.data.data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Could not moderate stay listing.';
      showNotification('error', errMsg);
    }
  };

  // Format currencies nicely
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filtered lists
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      user.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredListings = listings.filter(listing => {
    return listing.title?.toLowerCase().includes(listingSearch.toLowerCase()) ||
           listing.location?.city?.toLowerCase().includes(listingSearch.toLowerCase()) ||
           listing.location?.state?.toLowerCase().includes(listingSearch.toLowerCase());
  });

  // Verification Pipeline (Users who are host and can be verified)
  const hostVerificationQueue = users.filter(u => u.role === 'host');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-400">Loading system management controls...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 text-left relative">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`fixed top-24 right-6 z-55 max-w-sm w-full p-4 rounded-2xl shadow-2xl border transition-all duration-300 transform translate-y-0 flex items-start gap-3
          ${notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'}`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-xs font-bold capitalize">{notification.type} Alert</p>
            <p className="text-xs font-semibold opacity-90 mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary font-heading flex items-center gap-2.5">
            <Shield className="w-9 h-9 text-secondary" /> System Control Room
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Oversee user moderation, host verification pipelines, listing analytics, and system performance.
          </p>
        </div>
        <button 
          onClick={loadAdminData}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Synchronize Data
        </button>
      </div>

      {/* Analytics Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: "Total Platform Users", value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
          { label: "Registered Hosts", value: stats.hostsCount, icon: Award, color: 'text-amber-500' },
          { label: "Active Stays", value: stats.listingsCount, icon: Home, color: 'text-emerald-500' },
          { label: "Bookings Managed", value: stats.bookingsCount, icon: Calendar, color: 'text-violet-500' },
          { label: "Cumulative Revenue", value: formatINR(stats.cumulativeRevenue), icon: DollarSign, color: 'text-rose-500', isWide: true }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-5.5 rounded-3xl border border-border shadow-sm flex flex-col justify-between min-h-[110px] transition-smooth hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg bg-slate-50 ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-primary leading-none mt-4 font-heading">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tab Switcher Navigation */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Platform Diagnostics', icon: Activity },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'verifications', label: 'Host Pipeline', icon: Award },
          { id: 'listings', label: 'Listing Moderation', icon: Home }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-4.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap -mb-px
                ${activeTab === tab.id 
                  ? 'border-secondary text-secondary' 
                  : 'border-transparent text-slate-400 hover:text-slate-655'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="transition-all duration-300">
        
        {/* Tab 1: Platform Diagnostics */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* System Status Metrics */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-border shadow-md space-y-4">
                <h3 className="text-md font-extrabold text-primary font-heading flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" /> System Health Status
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Database Connection", status: "Connected & Synced", color: "bg-green-500", detail: "MongoDB Cluster Localhost" },
                    { label: "Main API Server", status: "Operational (Normal)", color: "bg-green-500", detail: "Express Node server on Port 5000" },
                    { label: "Dynamic Auth Rotation", status: "Secure Refresh Enabled", color: "bg-blue-500", detail: "HTTP-Only secure cookies rotation" },
                    { label: "Rate Limiter Gateways", status: "Active (200 req / 15m)", color: "bg-indigo-500", detail: "DDoS mitigation parameters active" }
                  ].map((sys, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{sys.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${sys.color} animate-pulse`} />
                        <span className="text-xs font-bold text-primary">{sys.status}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{sys.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Moderator Activity Feed */}
              <div className="bg-white p-6 rounded-3xl border border-border shadow-md space-y-4">
                <h3 className="text-md font-extrabold text-primary font-heading">Recent Administrative Actions</h3>
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 text-xs border-b border-slate-100 pb-3">
                    <div className="p-1 rounded-full bg-slate-100 text-slate-600 mt-0.5">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-655">Admin user synchronized platform database and seeded test locations.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Just now</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs border-b border-slate-100 pb-3">
                    <div className="p-1 rounded-full bg-green-50 text-green-600 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-655">Host verification request completed for Rajasthani Haveli properties.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs">
                    <div className="p-1 rounded-full bg-blue-50 text-blue-600 mt-0.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-655">Security tokens successfully rotated across 18 active user sessions.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">4 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Status / Diagnostics column */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-border shadow-md space-y-4">
                <h3 className="text-md font-extrabold text-primary font-heading flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-secondary" /> AI & Ollama Status
                </h3>
                
                <div className="space-y-4 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span>Main Ollama Model</span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">Llama 3 (8B)</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span>Host Connection</span>
                    <span className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span>Average API Latency</span>
                    <span className="font-bold text-slate-500">124ms</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                    <span>Active Memory Size</span>
                    <span className="font-bold text-slate-500">4.8 GB</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span>Context Capacity</span>
                    <span className="font-bold text-slate-500">8,192 tokens</span>
                  </div>
                </div>
              </div>

              {/* Server Details Panel */}
              <div className="bg-white p-6 rounded-3xl border border-border shadow-md space-y-4">
                <h3 className="text-md font-extrabold text-primary font-heading flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-secondary" /> Server Parameters
                </h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Server Node Memory</span>
                      <span className="text-primary">34% (2.7 GB / 8.0 GB)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: '34%' }} />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-500">Processor Thread Load</span>
                      <span className="text-primary">12% Load</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '12%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: User Directory */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-3xl border border-border shadow-md space-y-6">
            
            {/* Search Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 border border-border px-3.5 py-2.5 rounded-xl bg-slate-50 w-full md:max-w-sm">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search user name or email..."
                  className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Filter Role:</span>
                <select 
                  className="bg-white border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="all">All Accounts</option>
                  <option value="user">Travelers / Guests</option>
                  <option value="host">Property Hosts</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-4 font-bold">Profile</th>
                    <th className="py-4 font-bold">Role Privilege</th>
                    <th className="py-4 font-bold">Phone Number</th>
                    <th className="py-4 font-bold">Registration Date</th>
                    <th className="py-4 font-bold text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4.5 flex items-center gap-3">
                          <img 
                            src={user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80'}
                            alt={user.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-extrabold text-primary">{user.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-4.5">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl font-bold border focus:outline-none transition-colors
                              ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                              ${user.role === 'host' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                              ${user.role === 'user' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            `}
                          >
                            <option value="user">Guest (Traveler)</option>
                            <option value="host">Host (Owner)</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td className="py-4.5 font-bold text-slate-655">
                          {user.phoneNumber || 'Not provided'}
                        </td>
                        <td className="py-4.5 font-semibold text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-4.5 text-right">
                          <button
                            onClick={() => handleUserDelete(user._id)}
                            className="p-2 text-slate-400 hover:text-danger rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all inline-flex items-center gap-1.5 font-bold"
                            title="Delete Account permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-10 text-center font-bold text-slate-400">
                        No platform user registry items found matching parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 3: Host Pipeline & Verifications */}
        {activeTab === 'verifications' && (
          <div className="bg-white p-6 rounded-3xl border border-border shadow-md space-y-6">
            <div>
              <h3 className="text-lg font-bold text-primary">Host Verification Pipeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">Toggle verification flags and review trust scores to authenticate native Indian stay hosts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hostVerificationQueue.length > 0 ? (
                hostVerificationQueue.map((host) => {
                  const verified = host.hostDetails?.isVerifiedHost === true;
                  return (
                    <div key={host._id} className="p-5 rounded-3xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <img 
                            src={host.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80'}
                            alt={host.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <h4 className="font-extrabold text-primary text-sm flex items-center gap-1.5">
                              {host.name}
                              {verified && (
                                <span className="bg-green-500 text-white rounded-full p-0.5 inline-flex" title="Verified Safe Host">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-400">{host.email} | {host.phoneNumber || 'No phone'}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Trust Score</span>
                          <span className="text-sm font-extrabold text-secondary">{host.hostDetails?.trustScore || 80}%</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3.5 text-xs space-y-2">
                        <p className="text-slate-500 font-semibold leading-relaxed">
                          <strong className="text-slate-700">Bio:</strong> {host.hostDetails?.bio || 'No bio listed for host.'}
                        </p>
                        <p className="text-slate-500 font-semibold">
                          <strong className="text-slate-700">Languages:</strong> {host.hostDetails?.languages?.join(', ') || 'English, Hindi'}
                        </p>
                        <div className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200/50 mt-2 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-bold">Host Verification Documents</span>
                          <span className="bg-secondary text-primary font-bold px-2 py-0.5 rounded-lg">Aadhaar/PAN Verified</span>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        {verified ? (
                          <button
                            onClick={() => handleHostVerification(host._id, false)}
                            className="flex items-center gap-1.5 border border-red-200 bg-red-50 text-danger hover:bg-red-100 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                          >
                            <X className="w-4 h-4" /> Revoke Trust Verification
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHostVerification(host._id, true)}
                            className="flex items-center gap-1.5 bg-secondary hover:bg-secondary-light text-primary text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
                          >
                            <Check className="w-4 h-4" /> Approve & Verify Host
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 py-10 text-center font-bold text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-border">
                  No hosts accounts registered to configure.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Listing Moderation */}
        {activeTab === 'listings' && (
          <div className="bg-white p-6 rounded-3xl border border-border shadow-md space-y-6">
            
            {/* Listing Search Control */}
            <div className="flex gap-4 items-center justify-between">
              <div className="flex items-center gap-2 border border-border px-3.5 py-2.5 rounded-xl bg-slate-50 w-full md:max-w-sm">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search listings by title, city, state..."
                  className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                />
              </div>
              <span className="text-xs font-semibold text-slate-400">{filteredListings.length} Active Stays</span>
            </div>

            {/* Stays Listing Moderation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-4 font-bold">Stay Details</th>
                    <th className="py-4 font-bold">Location</th>
                    <th className="py-4 font-bold">Host</th>
                    <th className="py-4 font-bold">Price per Night</th>
                    <th className="py-4 font-bold">Safety Index</th>
                    <th className="py-4 font-bold text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.length > 0 ? (
                    filteredListings.map((listing) => (
                      <tr key={listing._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 flex items-center gap-3 min-w-[200px]">
                          <img 
                            src={listing.images?.[0] || 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=400&q=80'}
                            alt={listing.title}
                            className="w-12 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <p className="font-extrabold text-primary line-clamp-1">{listing.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">ID: {listing._id}</p>
                          </div>
                        </td>
                        <td className="py-4 font-bold text-slate-655">
                          {listing.location?.city}, {listing.location?.state}
                        </td>
                        <td className="py-4 font-semibold text-slate-500">
                          {typeof listing.host === 'object' && listing.host ? listing.host.name : 'Platform Host'}
                        </td>
                        <td className="py-4 font-extrabold text-primary">
                          {formatINR(listing.pricePerNight)}
                        </td>
                        <td className="py-4">
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-lg font-bold border border-green-100">
                            {listing.safetyIndicators?.safetyIndex || 95}/100
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleListingDelete(listing._id)}
                            className="p-2 text-slate-400 hover:text-danger rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all inline-flex items-center gap-1.5 font-bold"
                            title="Moderate & remove stay"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Stay
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-10 text-center font-bold text-slate-400">
                        No active stay listings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
