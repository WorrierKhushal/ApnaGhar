import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Calendar, Users, Sparkles, Compass, Shield,
  Flame, Zap, ArrowRight, Star, Award, CheckCircle2, Loader2
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState({
    destination: '',
    dates: '',
    guests: 1
  });

  const [featuredStays, setFeaturedStays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStays = async () => {
      try {
        const res = await api.get('/listings');
        if (res.data?.success) {
          setFeaturedStays(res.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching stays for homepage:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStays();
  }, []);

  const trendingDestinations = [
    { name: "Jaipur", subtitle: "The Pink City Vibe", state: "Rajasthan", image: "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=600&q=80", count: 42 },
    { name: "Kerala Backwaters", subtitle: "Coconut Palms", state: "Kerala", image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80", count: 36 },
    { name: "Varanasi", subtitle: "Holy River Ghats", state: "Uttar Pradesh", image: "https://images.unsplash.com/photo-1705952484283-19c31e37e0e4?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", count: 28 },
    { name: "Leh Ladakh", subtitle: "High Mountain Passes", state: "Ladakh", image: "https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=600&q=80", count: 19 },
    { name: "Goa Coast", subtitle: "Heritage Homestays", state: "Goa", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80", count: 54 }
  ];

  const localExperiences = [
    {
      id: 101,
      title: "Rajasthani Pottery & Block Printing Workshop",
      host: "Mahesh Chandra",
      hostTitle: "Master Craftsman",
      price: 750,
      duration: "3 hours",
      image: "https://plus.unsplash.com/premium_photo-1679852311462-733ae167dbc3?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      type: "Cultural Workshop"
    },
    {
      id: 102,
      title: "Guided Old Delhi Street Food Walk",
      host: "Karan Gupta",
      hostTitle: "Culinary Explorer",
      price: 1200,
      duration: "4 hours",
      image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80",
      type: "Culinary Safari"
    },
    {
      id: 103,
      title: "Organic Farm-to-Table Lunch & Spice Tour",
      host: "Ammini Amma",
      hostTitle: "Native Agriculturist",
      price: 950,
      duration: "2.5 hours",
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80",
      type: "Rural Experience"
    }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?destination=${searchQuery.destination}`);
  };

  return (
    <div className="bg-customBg space-y-16 pb-20 overflow-hidden font-body">

      {/* 1. HERO SECTION (Heritage Palace by Lake Theme) */}
      <section
        className="relative pt-12 pb-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center overflow-hidden border-b border-slate-350"
        style={{ backgroundImage: "url('https://images.pexels.com/photos/12112985/pexels-photo-12112985.jpeg')" }}
      >
        {/* Dark opacity overlay to ensure readability */}
        <div className="absolute inset-0 bg-slate-900/70"></div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Column: Typography & Search Console */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
                  ✨ AUTHENTIC INDIAN HOMESTAYS
                </div>
                <h1 className="font-heading text-4xl sm:text-5xl font-black text-white leading-tight uppercase">
                  Stay Like a Local, <br />
                  <span className="text-amber-400 font-extrabold italic">Not a Tourist.</span>
                </h1>
                <p className="text-slate-200 text-xs sm:text-sm max-w-xl leading-relaxed">
                  Discover verified ancestral homestays, royal heritage havelis, and native experience hosts. Skip the generic hotel grids.
                </p>
              </div>

              {/* Custom Search Console (Classic Portal style) */}
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white p-5 rounded-none border-2 border-slate-350 shadow-sm space-y-4 max-w-2xl"
              >
                <div className="classic-header-strip -mx-5 -mt-5 mb-2">
                  <Search className="w-4 h-4 text-white" />
                  <span>Search Stay Bookings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-none border border-slate-200 focus-within:border-primary focus-within:bg-white">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="w-full text-left">
                      <span className="block text-[8px] text-slate-400 font-bold uppercase">Where to?</span>
                      <input
                        type="text"
                        placeholder="Jaipur, Varanasi..."
                        className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400"
                        value={searchQuery.destination}
                        onChange={(e) => setSearchQuery({ ...searchQuery, destination: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-none border border-slate-200 focus-within:border-primary focus-within:bg-white">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="w-full text-left">
                      <span className="block text-[8px] text-slate-400 font-bold uppercase">Duration</span>
                      <input
                        type="text"
                        placeholder="June 15 - June 18"
                        className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400"
                        value={searchQuery.dates}
                        onChange={(e) => setSearchQuery({ ...searchQuery, dates: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-none border border-slate-200 focus-within:border-primary focus-within:bg-white">
                    <Users className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="w-full text-left">
                      <span className="block text-[8px] text-slate-400 font-bold uppercase">Guests</span>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
                        value={searchQuery.guests}
                        onChange={(e) => setSearchQuery({ ...searchQuery, guests: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2.5 border-t border-slate-150 gap-3">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-slate-650 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-350"
                      defaultChecked
                    />
                    Women-Friendly verified indicators
                  </label>
                  <button
                    type="submit"
                    className="classic-btn w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6"
                  >
                    <Search className="w-3.5 h-3.5 text-white" /> Search Stays
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Udaipur Lake Palace Phone Mockup & Floating Card */}
            <div className="lg:col-span-5 relative flex justify-center items-center h-[380px] w-full mt-4 lg:mt-0">

              {/* Udaipur map phone mockup */}
              <div
                className="relative w-64 h-[320px] bg-slate-900 rounded-none p-2 shadow-lg border-2 border-slate-350 overflow-hidden z-10"
              >
                <img
                  src="https://images.pexels.com/photos/12112985/pexels-photo-12112985.jpeg"
                  alt="Udaipur Lake Palace Map View"
                  className="w-full h-full object-cover rounded-none opacity-85"
                />

                {/* Floating Map Pin */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <MapPin className="w-12 h-12 text-primary fill-slate-900 stroke-primary drop-shadow-md" />
                  </div>
                </div>
              </div>

              {/* Floating "Weekend Getaway?" Card */}
              <div
                className="absolute bottom-6 left-2 bg-white p-4 rounded-none border border-slate-300 shadow-sm max-w-[200px] text-left z-20"
              >
                <span className="text-[9px] text-primary font-bold uppercase tracking-wider block">Special Offer</span>
                <h4 className="font-bold text-xs text-slate-800 uppercase mt-1">Weekend Getaway?</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Escape to Udaipur's serene waters this Friday.</p>
                <button
                  onClick={() => navigate('/search?destination=Udaipur')}
                  className="mt-3 bg-primary hover:bg-primary-dark text-white text-[9px] font-bold uppercase px-3 py-1.5 rounded-none flex items-center gap-1"
                >
                  Explore Udaipur <ArrowRight className="w-3 h-3 text-white" />
                </button>
              </div>

            </div>

          </div>

          {/* Balanced Icon Set footer */}
          <div className="border-t border-slate-700 pt-6 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300 text-xs font-semibold text-left">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Verified Homes</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <span>Trusted Hosts</span>
            </div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <span>Local Experiences</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Safety Indicators</span>
            </div>
          </div>

        </div>
      </section>      {/* 3. TRENDING DESTINATIONS LINK GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 text-left border-b border-slate-200 pb-3">
          <div className="space-y-1">
            <span className="text-[#4B5563] text-xs font-bold uppercase tracking-wide">Wanderlist</span>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111827]">Discover Homestays By Region</h2>
            <p className="text-xs text-[#4B5563]">Instantly discover verified homestays across Indian states.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {trendingDestinations.map((dest) => (
            <Link
              key={dest.name}
              to={`/search?destination=${dest.name}`}
              className="group relative h-60 rounded-none overflow-hidden border border-slate-200 shadow-xs block"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              {/* Dark overlay layer for text legibility */}
              <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/50 transition-colors duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-4 text-left z-10">
                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">{dest.subtitle}</span>
                <h4 className="text-white text-base font-black uppercase">{dest.name}</h4>
                <p className="text-[10px] text-slate-200 font-bold mt-0.5">{dest.count} stays verified</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. AI TRIP PLANNER (Premium Soft Mint Section) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#E6F4F1] rounded-none p-6 sm:p-10 border border-slate-200 shadow-xs">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1E293B] text-white text-[9px] font-bold uppercase">
                <Sparkles className="w-3 h-3 text-white fill-white" /> AI Custom Concierge
              </span>
              <h2 className="text-2xl font-bold uppercase text-[#111827] leading-tight">
                Plan Your Entire Indian Journey in Seconds
              </h2>
              <p className="text-[#4B5563] text-xs leading-relaxed">
                Submit your destinations, durations, and local interests. Our local Llama model predicts day-wise tours, food spots, and estimates cost parameters without premium API keys.
              </p>

              <div className="pt-2">
                <Link
                  to="/planner"
                  className="classic-btn px-5 py-3 inline-flex items-center gap-2"
                >
                  Create Custom AI Itinerary <ArrowRight className="w-3.5 h-3.5 text-white" />
                </Link>
              </div>
            </div>

            {/* Hand-sketched Journal Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="bg-white p-5 rounded-none border-2 border-slate-250 shadow-xs w-full max-w-sm relative text-left">
                <div className="absolute top-0 bottom-0 left-4 w-px bg-slate-100"></div>

                <div className="space-y-4 pl-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-xs uppercase text-slate-800">Jaipur Itinerary Plan</span>
                    <span className="text-[#4B5563] font-bold text-[9px] uppercase border border-slate-300 px-1.5">3 Days</span>
                  </div>

                  <div className="space-y-2.5 text-[11px] font-semibold text-slate-600">
                    <div className="p-2.5 bg-slate-50 border border-slate-200">
                      <p className="font-bold text-[#1E293B] text-xs uppercase">Day 1: Old City Frescoes</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Explore Johri Bazar's pottery lanes and watch Ganga aarti sunset.</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200">
                      <p className="font-bold text-[#1E293B] text-xs uppercase">Day 2: Clay Potter Workshop</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Traditional pottery work and authentic dinner at Haveli courtyard.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURED HOMESTAYS (Sticker-Style Tags & Ratings) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 text-left border-b border-slate-200 pb-3">
          <div className="space-y-1">
            <span className="text-[#4B5563] text-xs font-bold uppercase tracking-wide">Heritage Escapes</span>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111827]">Featured Local Stays</h2>
            <p className="text-xs text-[#4B5563]">Each property has been vetted for local heritage authenticity and staff safety guidelines.</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-[#1E293B] hover:text-[#0F172A] hover:underline uppercase">
            Browse All Homestays
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 flex justify-center py-10"><Loader2 className="w-8 h-8 text-[#1E293B] animate-spin" /></div>
          ) : featuredStays.length > 0 ? (
            featuredStays.slice(0, 3).map((stay) => {
              const DemandIcon = stay.demandIndicator === 'High' ? Flame : Zap;
              const demandColor = stay.demandIndicator === 'High'
                ? "text-red-700 bg-red-50 border-red-200"
                : "text-amber-700 bg-amber-50 border-amber-200";
              const stayImage = stay.images?.[0] || 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=600&q=80';
              const stayLocation = `${stay.location?.city || ''}, ${stay.location?.state || ''}`;

              const stayTags = [
                stay.location?.city,
                stay.safetyIndicators?.womenFriendly ? "Women-Friendly" : "",
                stay.indianFilters?.vegFoodNearby ? "Veg Food" : ""
              ].filter(Boolean);
              const finalTags = stayTags.length > 0 ? stayTags.slice(0, 3) : ["Verified Stay", "Indian Homestay"];

              return (
                <div
                  key={stay._id}
                  className="bg-white rounded-none border border-[#E2E8F0] flex flex-col h-full transition-smooth hover:border-[#1E293B] text-left"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 border-b border-slate-150">
                    <img
                      src={stayImage}
                      alt={stay.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1598977123418-45f04b615e0e?auto=format&fit=crop&w=800&q=80'; }}
                    />
                    <span className={`absolute top-3 left-3 flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[9px] font-bold border shadow-xs ${demandColor}`}>
                      <DemandIcon className="w-3 h-3" />
                      {stay.demandIndicator || 'Medium'} Demand
                    </span>
                    <span className="absolute top-3 right-3 bg-slate-900/90 text-white px-2.5 py-0.5 rounded-none text-[9px] font-bold border border-slate-700">
                      Safety Index: {stay.safetyIndicators?.safetyIndex || 8.5}/10
                    </span>
                  </div>

                  <div className="p-5 space-y-3.5 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-[#4B5563] font-bold uppercase truncate max-w-[150px]">{stayLocation}</span>
                        <div className="flex items-center gap-1 text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 border border-amber-200 rounded-none">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {stay.safetyIndicators?.safetyIndex || 8.5}
                        </div>
                      </div>

                      <Link to={`/listings/${stay._id}`} className="block">
                        <h3 className="font-heading text-base font-bold text-[#111827] hover:text-[#1E293B] transition-colors line-clamp-1 uppercase">
                          {stay.title}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {finalTags.map(tag => (
                          <span key={tag} className="bg-slate-50 text-slate-650 px-2 py-0.5 rounded-none text-[9px] font-bold border border-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-150">
                      <div>
                        <span className="text-slate-400 text-[8px] font-bold block uppercase">Per Night</span>
                        <p className="text-base font-black text-[#111827]">₹{stay.pricePerNight?.toLocaleString('en-IN')}</p>
                      </div>

                      <Link
                        to={`/listings/${stay._id}`}
                        className="classic-btn px-4 py-2"
                      >
                        Book Stay
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-16 px-4 bg-white border border-[#E2E8F0] rounded-none shadow-sm max-w-xl mx-auto w-full">
              <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-7 h-7 text-[#4B5563]" />
              </div>
              <h3 className="font-heading text-base font-black text-[#111827] uppercase tracking-wide">No Homestays Available</h3>
              <p className="text-xs text-[#4B5563] mt-2 max-w-sm mx-auto leading-relaxed">
                We are currently preparing our regional stay network. Register your own property stay now or check back later!
              </p>
              <div className="mt-5 flex justify-center">
                <Link to="/dashboard/list-ghar" className="classic-btn px-5 py-2.5 text-xs font-bold uppercase flex items-center gap-1.5">
                  Register My Stay
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. LOCAL EXPERIENCES MARKETPLACE (Warm Mint Container) */}
      <section className="bg-slate-100 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 text-left border-b border-slate-200 pb-3">
            <div className="space-y-1">
              <span className="text-[#4B5563] text-xs font-bold uppercase tracking-wide">Experience Market</span>
              <h2 className="text-2xl font-bold uppercase tracking-tight text-[#111827]">Authentic Regional Experiences</h2>
              <p className="text-xs text-[#4B5563]">Book verified workshops and guided street food walks led directly by native hosts.</p>
            </div>
            <a href="#" className="text-xs font-bold text-[#1E293B] hover:text-[#0F172A] hover:underline uppercase">
              Explore Host Experiences
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {localExperiences.map((exp) => (
              <div
                key={exp.id}
                className="bg-[#FFFBEB] rounded-none border border-amber-200 flex flex-col h-full text-left"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100 border-b border-amber-200">
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-3 left-3 bg-white text-[#1E293B] text-[9px] font-bold px-2 py-0.5 border border-amber-200">
                    {exp.type}
                  </span>
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-800 font-extrabold uppercase">Hosted by {exp.host} ({exp.hostTitle})</p>
                    <h4 className="font-heading font-black text-sm text-[#0F172A] leading-snug line-clamp-2 uppercase">{exp.title}</h4>
                    <p className="text-[10px] text-slate-700 font-bold">Duration: {exp.duration}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-amber-250">
                    <span className="text-xs font-extrabold text-[#0F172A]">₹{exp.price} / person</span>
                    <button
                      onClick={() => alert("Added to itinerary simulator.")}
                      className="bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold text-[10px] px-3 py-1 rounded-xs transition-colors uppercase"
                    >
                      Add +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
