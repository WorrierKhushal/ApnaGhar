import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Calendar, Heart, Shield, LayoutDashboard, Menu, X, Landmark, Home, DollarSign, LogOut, FileText } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

export default function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasListings, setHasListings] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();

  useEffect(() => {
    const checkUserListings = async () => {
      if (!user) return;
      try {
        const res = await api.get('/listings');
        if (res.data?.success) {
          const userStays = (res.data.data || []).filter(
            stay => stay.host === user.id || stay.host?._id === user.id
          );
          setHasListings(userStays.length > 0);
        }
      } catch (err) {
        console.error('Error checking user listings status:', err);
      }
    };
    checkUserListings();
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isAdminSection = location.pathname.startsWith('/admin');

  // Sidebar Links Configuration
  const getSidebarLinks = () => {
    if (isAdminSection) {
      return [
        { path: '/admin', label: 'Overview', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Manage Users', icon: User },
        { path: '/admin/listings', label: 'Manage Listings', icon: Home },
        { path: '/admin/bookings', label: 'Monitor Bookings', icon: Calendar },
      ];
    }

    // Unified Traveler Profile & Host Dashboard Links
    const baseLinks = [
      { path: '/dashboard', label: 'My Profile', icon: User },
      { path: '/dashboard/bookings', label: 'Booking History', icon: Calendar },
      { path: '/dashboard/wishlist', label: 'Wishlist', icon: Heart },
      { path: '/dashboard/my-ghars', label: 'My Listed Ghars', icon: Home },
    ];

    if (hasListings) {
      baseLinks.push({ path: '/dashboard/reservations', label: 'Received Reservations', icon: FileText });
    }

    return baseLinks;
  };

  const links = getSidebarLinks();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-customBg flex flex-col md:flex-row">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex justify-between items-center bg-white px-6 py-4 border-b border-slate-200 z-40">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="ApnaGhar Logo" className="h-14 w-auto object-contain scale-110" />
          <span className="font-heading font-black text-2xl text-slate-800 tracking-tight block leading-none">
            Aapna<span className="text-[#14B8A6]">Ghar</span>
          </span>
        </Link>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-800">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-72 p-6 z-50 flex flex-col justify-between transition-transform duration-300 transform
        md:translate-x-0 md:relative
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-8">
          
          {/* Logo / Header */}
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="ApnaGhar Logo" className="h-16 w-auto object-contain scale-110 transition-transform duration-200 group-hover:scale-115" />
              <span className="font-heading font-black text-2xl text-slate-800 tracking-tight block leading-none select-none">
                Aapna<span className="text-[#14B8A6]">Ghar</span>
              </span>
            </Link>
            <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Capsule */}
          <div className="bg-slate-50 p-4 rounded-none border border-slate-200">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Role</p>
            <h4 className="font-bold text-slate-800 text-xs uppercase mt-0.5">{user.name}</h4>
            <span className="inline-block mt-1 text-[9px] border border-slate-300 bg-slate-100 text-slate-705 font-bold uppercase px-2.5 py-0.5 rounded-none">
              {isAdminSection ? 'Administrator' : 'Traveler'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-none text-xs font-bold uppercase tracking-wider transition-all duration-150
                    ${isActive 
                      ? 'bg-primary text-white border-l-4 border-primary-dark pl-3 font-extrabold shadow-xs' 
                      : 'text-slate-650 hover:bg-slate-100 hover:text-primary'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Options */}
        <div className="border-t border-slate-200 pt-6 space-y-2">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white hover:bg-red-50 border border-red-500 text-xs font-bold uppercase tracking-wider text-danger rounded-none transition-colors duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto bg-customBg">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>


    </div>
  );
}
