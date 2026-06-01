import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, Heart, Sparkles, Compass, HelpCircle, LogOut, ChevronDown, Landmark, Home as HomeIcon, Leaf, Plus, Calendar } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();
  const isAuthenticated = !!user;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-customBg">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <img src="/logo.png" alt="ApnaGhar Logo" className="h-16 w-auto object-contain scale-110 transition-transform duration-200 group-hover:scale-115" />
                <span className="font-heading font-black text-3xl tracking-tight text-slate-800 block leading-none select-none">
                  Aapna<span className="text-[#14B8A6]">Ghar</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 h-full">

              <NavLink 
                to="/search" 
                className={({ isActive }) => 
                  `flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-2 border-b-2 transition-all ${
                    isActive 
                      ? 'border-primary text-primary font-black' 
                      : 'border-transparent text-slate-700 hover:text-primary hover:border-primary'
                  }`
                }
              >
                <Compass className="w-4 h-4" />
                Find Stays
              </NavLink>

              <NavLink 
                to="/planner" 
                className={({ isActive }) => 
                  `flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-2 border-b-2 transition-all ${
                    isActive 
                      ? 'border-primary text-primary font-black' 
                      : 'border-transparent text-slate-700 hover:text-primary hover:border-primary'
                  }`
                }
              >
                <Sparkles className="w-4 h-4 text-accent" />
                AI Trip Planner
              </NavLink>
              
              <NavLink 
                to={isAuthenticated ? "/dashboard/bookings" : "/login?redirect=/dashboard/bookings"}
                className={({ isActive }) => 
                  `flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-2 border-b-2 transition-all ${
                    isActive 
                      ? 'border-primary text-primary font-black' 
                      : 'border-transparent text-slate-700 hover:text-primary hover:border-primary'
                  }`
                }
              >
                <Calendar className="w-4 h-4" />
                My Bookings
              </NavLink>
            </nav>

            {/* Profile Dropdown & CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                to={isAuthenticated ? "/dashboard/list-ghar" : "/login?redirect=/dashboard/list-ghar"}
                className="classic-btn flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                Add Ghar
              </Link>
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-none transition-colors"
                >
                  <img 
                    src={user?.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"} 
                    alt={`${user?.name || 'Khushal'} Profile`} 
                    className="w-7 h-7 rounded-none object-cover border border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{user?.name || 'Khushal'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-600" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-none shadow-md border border-slate-300 py-2 z-50">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-2 border-b border-slate-200 text-left">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Logged in as</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[8px] border border-slate-300 bg-slate-105 text-slate-600 px-2 py-0.5 rounded-none font-bold uppercase">
                            {user.role}
                          </span>
                        </div>
                        
                        <Link to="/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary font-bold uppercase tracking-wide text-left transition-colors">
                          My Dashboard
                        </Link>

                        {user.role === 'admin' && (
                          <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary font-bold uppercase tracking-wide text-left transition-colors">
                            Admin Dashboard
                          </Link>
                        )}

                        <Link to="/dashboard/wishlist" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary font-bold uppercase tracking-wide text-left transition-colors">
                          My Wishlist
                        </Link>
                        
                        <div className="border-t border-slate-200 mt-2 pt-2">
                          <button 
                            onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                            className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-danger hover:bg-red-50 font-bold uppercase tracking-wide transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2 border-b border-slate-200 text-left">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Guest User</p>
                          <p className="text-xs font-bold text-slate-800">Browse AapnaGhar Stays</p>
                        </div>
                        
                        <Link to="/login" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary font-bold uppercase tracking-wide text-left transition-colors">
                          Log In
                        </Link>
                        <Link to="/signup" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-primary font-bold uppercase tracking-wide text-left transition-colors">
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-800 hover:text-primary transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <NavLink 
              to="/search" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-none text-xs font-bold uppercase text-slate-700 hover:bg-slate-50"
            >
              <Compass className="w-5 h-5 text-slate-600" />
              Find Stays
            </NavLink>
            <NavLink 
              to="/planner" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-none text-xs font-bold uppercase text-slate-700 hover:bg-slate-50"
            >
              <Sparkles className="w-5 h-5 text-accent" />
              AI Trip Planner
            </NavLink>
            <NavLink 
              to={isAuthenticated ? "/dashboard/bookings" : "/login?redirect=/dashboard/bookings"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-none text-xs font-bold uppercase text-slate-700 hover:bg-slate-50"
            >
              <Calendar className="w-5 h-5 text-slate-600" />
              My Bookings
            </NavLink>

            <div className="border-t border-slate-200 pt-4 space-y-2">
              <Link 
                to={isAuthenticated ? "/dashboard/list-ghar" : "/login?redirect=/dashboard/list-ghar"}
                onClick={() => setIsOpen(false)}
                className="classic-btn w-full flex items-center justify-center gap-2 py-3"
              >
                <Plus className="w-4 h-4 text-white" />
                Add Ghar
              </Link>
              {/* Profile Block */}
              <div className="bg-slate-50 p-3 rounded-none border border-slate-200 flex items-center gap-3">
                <img 
                  src={user?.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-none object-cover border border-slate-200"
                />
                <div className="text-left">
                  <p className="font-bold text-slate-800 text-sm leading-tight">{user?.name || 'Khushal'}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{user?.email || 'khushal@aapnaghar.com'}</p>
                </div>
              </div>

              {isAuthenticated ? (
                <div className="space-y-1 pt-2">
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-none text-xs font-bold uppercase text-slate-700 hover:bg-slate-50 text-left">
                    Dashboard
                  </Link>
                  <Link to="/dashboard/wishlist" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-none text-xs font-bold uppercase text-slate-700 hover:bg-slate-50 text-left">
                    My Wishlist
                  </Link>
                  <button 
                    onClick={() => { setIsOpen(false); handleLogout(); }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-none text-xs font-bold uppercase text-danger hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="text-center px-4 py-2 border border-slate-200 rounded-none font-bold uppercase text-xs text-slate-700 hover:bg-slate-50">
                    Login
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)} className="text-center px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] rounded-none font-bold uppercase text-xs text-white">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Body Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 text-left">
              <Link to="/" className="flex items-center gap-3 select-none group">
                <img src="/logo.png" alt="ApnaGhar Logo" className="h-12 w-auto object-contain brightness-0 invert opacity-90 transition-opacity group-hover:opacity-100" />
                <span className="font-heading font-black text-2xl text-white tracking-tight block leading-none">
                  Aapna<span className="text-[#14B8A6]">Ghar</span>
                </span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stay Like a Local, Not a Tourist. We connect travelers with authentic local stays and verified cultural experiences across India.
              </p>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Discover</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/search" className="hover:text-primary transition-colors">Heritage Homestays</Link></li>
                <li><Link to="/search" className="hover:text-primary transition-colors">Houseboats & Eco-Lodges</Link></li>
                <li><Link to="/search" className="hover:text-primary transition-colors">Local Guides</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Features</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/planner" className="hover:text-primary transition-colors">Smart Trip Planner</Link></li>
                <li><Link to="/dashboard/bookings" className="hover:text-primary transition-colors">My Bookings</Link></li>
                <li><Link to="/planner" className="hover:text-primary transition-colors">Cost Estimator</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Support</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-primary transition-colors">Safety Guidelines</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Host Guidelines</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 uppercase font-bold tracking-wider gap-4">
            <p>&copy; {new Date().getFullYear()} AapnaGhar Stay Network. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Service</a>
              <a href="#" className="hover:text-primary">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
