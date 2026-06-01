import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Landmark } from 'lucide-react';

export default function AuthLayout() {
  const location = useLocation();
  const isSignup = location.pathname.includes('/signup');
  
  // Custom travel background images for login vs signup
  const bgImage = isSignup
    ? 'https://images.pexels.com/photos/30519147/pexels-photo-30519147.jpeg'
    : 'https://images.pexels.com/photos/12533178/pexels-photo-12533178.jpeg';

  const bgOpacity = isSignup ? 0.55 : 0.45;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Brand Left Panel (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 bg-primary relative p-12 flex-col justify-between overflow-hidden">
        {/* Premium Background Image with adjustable opacity for readability */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 ease-in-out"
          style={{ 
            backgroundImage: `url(${bgImage})`,
            opacity: bgOpacity 
          }}
        />

        {/* Dark overlay layer for extra text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/40 z-0"></div>

        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 z-0"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 z-0"></div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="ApnaGhar Logo" className="h-16 w-auto object-contain bg-white p-1.5 rounded-sm transition-transform duration-200 group-hover:scale-105" />
            <span className="font-heading font-black text-3xl tracking-tight text-white block leading-none select-none">
              Aapna<span className="text-[#14B8A6]">Ghar</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 my-auto max-w-md">
          <h1 className="font-heading text-4xl font-bold text-white leading-tight mb-4">
            Stay Like a Local, Not a Tourist.
          </h1>
          <p className="text-slate-300 text-lg">
            Connect with native hosts, discover verified regional homestays, and enrich your journeys with handpicked cultural activities.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} AapnaGhar. Indian Hospitality Redefined.
        </div>
      </div>

      {/* Form Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex justify-center md:hidden mb-8">
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="ApnaGhar Logo" className="h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105" />
              <span className="font-heading font-black text-2xl tracking-tight text-slate-800 block leading-none select-none">
                Aapna<span className="text-[#14B8A6]">Ghar</span>
              </span>
            </Link>
          </div>

          {/* Form wrapper */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-border shadow-xl relative overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
