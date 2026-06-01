import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Compass, MapPin, Star, Flame, Shield, AlertTriangle, ArrowRight, 
  Loader2, X, Edit, Trash2, Check, AlertCircle, Calendar, Users, Heart 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon issue in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Search() {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapListing, setMapListing] = useState(null); // holds listing coordinates for Leaflet modal
  
  // Paging states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Sorting
  const [sortBy, setSortBy] = useState('newest');

  // Stays edit form modal state
  const [editListing, setEditListing] = useState(null); 
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPricePerNight, setEditPricePerNight] = useState(3500);
  const [editMaxGuests, setEditMaxGuests] = useState(4);
  const [editBedrooms, setEditBedrooms] = useState(2);
  const [editBathrooms, setEditBathrooms] = useState(2);
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editLat, setEditLat] = useState(26.9124);
  const [editLng, setEditLng] = useState(75.7873);
  const [editAmenities, setEditAmenities] = useState('');
  const [editImages, setEditImages] = useState('');
  const [editIndianFilters, setEditIndianFilters] = useState({
    nearRailway: false,
    nearMetro: false,
    nearAirport: false,
    nearTemple: false,
    nearTouristPlace: false,
    vegFoodNearby: false,
    jainFoodNearby: false
  });
  const [editSafetyIndicators, setEditSafetyIndicators] = useState({
    familySafe: false,
    soloSafe: false,
    womenFriendly: false
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [formError, setFormError] = useState('');

  // Sidebar Filter States
  const [propertyTypes, setPropertyTypes] = useState({
    'Heritage Haveli': false,
    'Ancestral Homestay': false,
    'Farm Stay': false,
    'Modern Villa': false
  });

  const [filters, setFilters] = useState({
    nearRailway: false,
    nearTemple: false,
    vegFoodNearby: false,
    jainFoodNearby: false,
    womenFriendly: false,
    wifi: false,
    ac: false,
    maxBudget: 10000,
  });

  const fetchListings = async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const searchVal = searchParams.get('search') || '';
      const cityVal = searchParams.get('city') || '';
      const stateVal = searchParams.get('state') || '';
      
      const selectedTypes = Object.keys(propertyTypes).filter(k => propertyTypes[k]).join(',');

      const params = {
        search: searchVal,
        city: cityVal,
        state: stateVal,
        maxPrice: filters.maxBudget === 10000 ? 999999 : filters.maxBudget, // ₹10,000+ means no limit
        nearRailway: filters.nearRailway,
        nearTemple: filters.nearTemple,
        vegFoodNearby: filters.vegFoodNearby,
        jainFoodNearby: filters.jainFoodNearby,
        womenFriendly: filters.womenFriendly,
        wifi: filters.wifi,
        ac: filters.ac,
        propertyTypes: selectedTypes,
        sort: sortBy,
        page: pageNum,
        limit: 5 // load 5 stays per page
      };

      const response = await api.get('/listings', { params });
      if (response.data?.success) {
        const stays = response.data.data || [];
        if (append) {
          setListings(prev => [...prev, ...stays]);
        } else {
          setListings(stays);
        }

        // If returned stays count is less than our limit, there are no more pages
        if (stays.length < 5) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (error) {
      console.error('Error fetching stay listings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync / Reset listing searches when filters modify
  useEffect(() => {
    setPage(1);
    fetchListings(1, false);
  }, [searchParams, filters, propertyTypes, sortBy]);

  // Load More pagination trigger
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage, true);
  };

  // Delete stays handler (Owner only check on backend verify)
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to remove this stay property listing from AapnaGhar?')) return;
    try {
      const res = await api.delete(`/listings/${listingId}`);
      if (res.data?.success) {
        alert('Stay listing removed successfully!');
        setPage(1);
        fetchListings(1, false);
      }
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert(err.response?.data?.message || 'Failed to remove listing. Verification ownership error.');
    }
  };

  // Pre-populate editing modal state
  const handleEditClick = (listing) => {
    setEditListing(listing);
    setEditTitle(listing.title || '');
    setEditDescription(listing.description || '');
    setEditPricePerNight(listing.pricePerNight || 0);
    setEditMaxGuests(listing.maxGuests || 1);
    setEditBedrooms(listing.bedrooms || 1);
    setEditBathrooms(listing.bathrooms || 1);
    setEditAddress(listing.location?.address || '');
    setEditCity(listing.location?.city || '');
    setEditState(listing.location?.state || '');
    setEditLat(listing.location?.coordinates?.lat || 26.9124);
    setEditLng(listing.location?.coordinates?.lng || 75.7873);
    setEditAmenities(listing.amenities?.join(', ') || '');
    setEditImages(listing.images?.join('\n') || '');
    setEditIndianFilters({
      nearRailway: listing.indianFilters?.nearRailway || false,
      nearMetro: listing.indianFilters?.nearMetro || false,
      nearAirport: listing.indianFilters?.nearAirport || false,
      nearTemple: listing.indianFilters?.nearTemple || false,
      nearTouristPlace: listing.indianFilters?.nearTouristPlace || false,
      vegFoodNearby: listing.indianFilters?.vegFoodNearby || false,
      jainFoodNearby: listing.indianFilters?.jainFoodNearby || false
    });
    setEditSafetyIndicators({
      familySafe: listing.safetyIndicators?.familySafe || false,
      soloSafe: listing.safetyIndicators?.soloSafe || false,
      womenFriendly: listing.safetyIndicators?.womenFriendly || false
    });
  };

  // Submit edit patch details
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmittingEdit(true);

    const imagesArray = editImages.split('\n').map(url => url.trim()).filter(Boolean);
    if (imagesArray.length < 3) {
      setFormError('Stay editing requires at least 3 high-quality images');
      setSubmittingEdit(false);
      return;
    }

    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        pricePerNight: Number(editPricePerNight),
        maxGuests: Number(editMaxGuests),
        bedrooms: Number(editBedrooms),
        bathrooms: Number(editBathrooms),
        location: {
          address: editAddress,
          city: editCity,
          state: editState,
          coordinates: {
            lat: Number(editLat),
            lng: Number(editLng)
          }
        },
        amenities: editAmenities.split(',').map(a => a.trim()).filter(Boolean),
        images: imagesArray,
        indianFilters: editIndianFilters,
        safetyIndicators: {
          ...editSafetyIndicators,
          safetyIndex: editListing.safetyIndicators?.safetyIndex || 9.0
        }
      };

      const res = await api.put(`/listings/${editListing._id}`, payload);
      if (res.data?.success) {
        setEditListing(null);
        setPage(1);
        fetchListings(1, false);
      }
    } catch (err) {
      console.error('Error updating stay details:', err);
      setFormError(err.response?.data?.message || 'Failed to update stay details.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handlePropertyTypeChange = (type) => {
    setPropertyTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const resetFilters = () => {
    setPropertyTypes({
      'Heritage Haveli': false,
      'Ancestral Homestay': false,
      'Farm Stay': false,
      'Modern Villa': false
    });
    setFilters({
      nearRailway: false,
      nearTemple: false,
      vegFoodNearby: false,
      jainFoodNearby: false,
      womenFriendly: false,
      wifi: false,
      ac: false,
      maxBudget: 10000,
    });
  };

  return (
    <div className="bg-customBg min-h-screen pb-16 font-body">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Main Split Grid (1/4 Sidebar, 3/4 Results list) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* A. Sidebar Filter UI (Left Column) */}
          <aside className="bg-white border border-slate-300 p-5 rounded-none shadow-none text-left h-fit space-y-5">
            <div className="classic-header-strip -mx-5 -mt-5 mb-3">
              <span className="flex-grow">Search Filters</span>
              <button 
                onClick={resetFilters} 
                className="text-[9px] font-bold bg-white text-primary px-2 py-0.5 border border-slate-300 hover:bg-slate-50 transition-colors uppercase"
              >
                Reset All
              </button>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Max Nightly Budget</span>
                <span className="text-primary font-black">
                  {filters.maxBudget === 10000 ? '₹10,000+' : `₹${filters.maxBudget.toLocaleString('en-IN')}`}
                </span>
              </div>
              <input 
                type="range" 
                min="1000" 
                max="10000" 
                step="500" 
                className="w-full h-1 bg-slate-200 rounded-none appearance-none cursor-pointer accent-primary mt-1"
                value={filters.maxBudget}
                onChange={(e) => setFilters({...filters, maxBudget: parseInt(e.target.value)})}
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase pt-0.5">
                <span>₹1,000</span>
                <span>₹10,000+</span>
              </div>
            </div>

            {/* Property Types */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">Property Type</span>
              <div className="space-y-1.5">
                {Object.keys(propertyTypes).map((type) => (
                  <label key={type} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-primary transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-350"
                      checked={propertyTypes[type]}
                      onChange={() => handlePropertyTypeChange(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities & Indian Filters */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">Amenities & Context</span>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-primary transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                    checked={filters.wifi}
                    onChange={(e) => setFilters({...filters, wifi: e.target.checked})}
                  />
                  Wi-Fi Internet
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-primary transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                    checked={filters.ac}
                    onChange={(e) => setFilters({...filters, ac: e.target.checked})}
                  />
                  Air Conditioning
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-primary transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                    checked={filters.vegFoodNearby}
                    onChange={(e) => setFilters({...filters, vegFoodNearby: e.target.checked})}
                  />
                  Veg Food Nearby
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-primary transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                    checked={filters.jainFoodNearby}
                    onChange={(e) => setFilters({...filters, jainFoodNearby: e.target.checked})}
                  />
                  Jain Food Nearby
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-primary transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                    checked={filters.nearRailway}
                    onChange={(e) => setFilters({...filters, nearRailway: e.target.checked})}
                  />
                  Near Railway Station
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-primary transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                    checked={filters.nearTemple}
                    onChange={(e) => setFilters({...filters, nearTemple: e.target.checked})}
                  />
                  Near Temple
                </label>
              </div>
            </div>

            {/* Safety Verified Toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">Safety Verified</span>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer hover:text-primary transition-colors">
                <input 
                  type="checkbox" 
                  className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                  checked={filters.womenFriendly}
                  onChange={(e) => setFilters({...filters, womenFriendly: e.target.checked})}
                />
                <Shield className="w-4 h-4 text-primary" />
                <span>Women-Friendly Homestays</span>
              </label>
            </div>

          </aside>

          {/* B. Stays Results list (Right Column - 3/4 Width) */}
          <main className="lg:col-span-3 space-y-6">
               {/* Sorting Header Bar */}
            <div className="bg-white border border-slate-200 p-4 rounded-none shadow-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
              <div>
                <h4 className="text-xs font-black text-[#111827] uppercase">Available Stay Listings</h4>
                <p className="text-[11px] text-[#4B5563] font-semibold mt-0.5">Found {listings.length} heritage properties matching filters.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[11px] font-bold text-slate-500 flex-shrink-0 uppercase">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-44 border border-slate-200 px-3 py-1.5 rounded-none text-xs font-bold focus:outline-none bg-slate-50 text-slate-700 cursor-pointer"
                >
                  <option value="newest">Newest Stays</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Top Safety Index</option>
                </select>
              </div>
            </div>

            {/* Result Cards Stack (Table-like rows) */}
            <div className="space-y-5">
              {listings.length > 0 ? (
                listings.map((stay) => {
                  const isOwner = user && (stay.host === user.id || stay.host?._id === user.id);
                  const originalPrice = Math.round(stay.pricePerNight * 1.15);
                  
                  const highlights = [];
                  highlights.push(`${stay.bedrooms || 1} Bedrooms / ${stay.bathrooms || 1} Bath`);
                  if (stay.indianFilters?.nearRailway) highlights.push("Near Railway Stn");
                  if (stay.indianFilters?.nearTemple) highlights.push("Near Temple");
                  if (stay.indianFilters?.vegFoodNearby) highlights.push("Veg Meals Nearby");

                  return (
                    <div 
                      key={stay._id}
                      className="bg-white border border-slate-200 rounded-none flex flex-col md:flex-row items-stretch overflow-hidden relative text-left shadow-xs hover:border-primary"
                    >
                      {/* Owner actions in top-right corner */}
                      {isOwner && (
                        <div className="absolute top-3 right-3 flex gap-1 z-20">
                          <button 
                            onClick={() => handleEditClick(stay)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 rounded-none transition-colors"
                            title="Edit stay"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteListing(stay._id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-danger rounded-none transition-colors"
                            title="Delete stay"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Column 1: Image container */}
                      <div className="w-full md:w-72 aspect-[4/3] flex-shrink-0 relative overflow-hidden bg-slate-100">
                        <img 
                          src={stay.images?.[0] || 'https://images.unsplash.com/photo-1598977123418-45f04b615e0e?auto=format&fit=crop&w=800&q=80'} 
                          alt={stay.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1598977123418-45f04b615e0e?auto=format&fit=crop&w=800&q=80'; }}
                        />
                        {stay.safetyIndicators?.safetyIndex >= 9.0 && (
                          <div className="absolute top-2 left-2 bg-[#F59E0B] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-none shadow-xs tracking-wider flex items-center gap-0.5 z-10">
                            <Flame className="w-2.5 h-2.5 fill-white" />
                            <span>High Demand</span>
                          </div>
                        )}
                      </div>

                      {/* Content Wrapper */}
                      <div className="flex-1 p-5 flex flex-col md:flex-row justify-between items-stretch gap-4">
                        {/* Column 2: Property Info */}
                        <div className="flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <span className="text-[9px] text-[#4B5563] font-bold uppercase tracking-wide">{stay.location?.city}, {stay.location?.state}</span>
                            <h3 className="font-heading font-black text-base text-[#111827] uppercase mt-0.5 line-clamp-1 hover:text-primary transition-colors">{stay.title}</h3>
                            
                            {/* Host info badge */}
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="w-4 h-4 bg-primary/10 rounded-none flex items-center justify-center font-bold text-[8px] text-primary uppercase border border-primary/20">
                                {stay.host?.name?.substring(0,2) || 'LH'}
                              </div>
                              <span className="text-[9px] text-[#4B5563] font-bold">Host: {stay.host?.name || 'Local Host'}</span>
                            </div>
                          </div>

                          {/* Rating row + Map triggers */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1 text-amber-700 font-bold text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-none">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Safety Index: {stay.safetyIndicators?.safetyIndex || 8.5}/10</span>
                            </div>
                            
                            <button 
                              onClick={() => setMapListing(stay)}
                              className="text-[#14B8A6] hover:text-[#0D9488] text-[10px] font-bold flex items-center gap-0.5 uppercase"
                            >
                              📍 View on Map
                            </button>
                          </div>
                        </div>

                        {/* Column 3: Highlights */}
                        <div className="flex-1 bg-slate-50/70 p-3 rounded-none border border-slate-200 flex flex-col justify-center space-y-1.5">
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Stay Highlights</span>
                          <ul className="text-[11px] text-[#4B5563] font-semibold space-y-1">
                            {highlights.map((h, index) => (
                              <li key={index} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-none bg-primary flex-shrink-0"></span>
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Column 4: Pricing */}
                        <div className="w-full md:w-44 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-3 flex-shrink-0">
                          <div className="text-left md:text-right">
                            <span className="text-slate-400 text-[8px] block font-bold uppercase">Stay Deal</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-[10px] text-slate-400 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                              <span className="text-base font-black text-[#111827]">₹{stay.pricePerNight?.toLocaleString('en-IN')}</span>
                            </div>
                            <span className="inline-block mt-0.5 text-[8px] bg-green-50 text-green-700 border border-green-200 px-1 py-0.2 rounded-none font-bold uppercase">
                              15% OFF
                            </span>
                          </div>

                          <Link 
                            to={`/listings/${stay._id}`}
                            className="classic-btn w-full px-4 py-2"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 px-4 bg-white border border-[#E2E8F0] rounded-none shadow-sm max-w-xl mx-auto w-full">
                  <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Compass className="w-7 h-7 text-[#4B5563]" />
                  </div>
                  <h3 className="font-heading text-base font-black text-[#111827] uppercase tracking-wide">No Stay Properties Found</h3>
                  <p className="text-xs text-[#4B5563] mt-2 max-w-sm mx-auto leading-relaxed">
                    No heritage properties match your active search filters at the moment. Try resetting your tags or expanding your budget range.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <button 
                      onClick={resetFilters}
                      className="classic-btn px-5 py-2.5 text-xs font-bold uppercase flex items-center gap-1.5"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination Load More Button */}
            {hasMore && listings.length > 0 && (
              <div className="flex justify-center pt-4">
                <button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="classic-btn px-8 py-3 w-full md:w-auto flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}

          </main>

        </div>
      </div>

      {/* Map modal pop-up */}
      {mapListing && mapListing.location?.coordinates && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-none w-full max-w-2xl shadow-lg relative border border-slate-300 flex flex-col h-[480px]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0 text-left">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase">{mapListing.title}</h3>
                <p className="text-[10px] text-slate-550">{mapListing.location.address}, {mapListing.location.city}</p>
              </div>
              <button 
                onClick={() => setMapListing(null)} 
                className="p-1 border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors rounded-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 relative bg-slate-100 z-10">
              <MapContainer 
                center={[mapListing.location.coordinates.lat, mapListing.location.coordinates.lng]} 
                zoom={14} 
                className="w-full h-full z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[mapListing.location.coordinates.lat, mapListing.location.coordinates.lng]}>
                  <Popup>
                    <div className="text-xs font-bold">{mapListing.title}</div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Stays Update Form Modal (Classic fields layout) */}
      {editListing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-none w-full max-w-3xl shadow-lg relative border-2 border-slate-350 flex flex-col my-8 max-h-[90vh]">
            <div className="p-5 border-b border-slate-300 flex justify-between items-center bg-slate-50 flex-shrink-0 text-left">
              <div>
                <h3 className="font-heading font-black text-base text-slate-850 uppercase">Edit Property Stay Listing</h3>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Update stay details for {editListing.title}.</p>
              </div>
              <button 
                onClick={() => setEditListing(null)} 
                className="p-1 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-none transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-left">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-danger p-3 rounded-none text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form elements wrapped in Fieldsets */}
              <fieldset className="border border-slate-300 p-4 rounded-none space-y-4">
                <legend className="text-primary font-bold text-xs uppercase px-2 tracking-wide">Stay Basic Information</legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Stay Title</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-slate-50 text-slate-800"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Price (₹)</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50"
                        value={editPricePerNight}
                        onChange={(e) => setEditPricePerNight(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Bedrooms</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50"
                        value={editBedrooms}
                        onChange={(e) => setEditBedrooms(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Guests Cap</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50"
                        value={editMaxGuests}
                        onChange={(e) => setEditMaxGuests(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Description Details</label>
                  <textarea 
                    rows="3" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-slate-50 text-slate-800"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                  />
                </div>
              </fieldset>

              <fieldset className="border border-slate-300 p-4 rounded-none space-y-4">
                <legend className="text-primary font-bold text-xs uppercase px-2 tracking-wide">Location Details</legend>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Physical Address</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">City</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">State</label>
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Latitude</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50"
                      value={editLat}
                      onChange={(e) => setEditLat(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Longitude</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50"
                      value={editLng}
                      onChange={(e) => setEditLng(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-slate-300 p-4 rounded-none space-y-4">
                <legend className="text-primary font-bold text-xs uppercase px-2 tracking-wide">Stay Facilities & Images</legend>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Amenities (comma-separated)</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50"
                    value={editAmenities}
                    onChange={(e) => setEditAmenities(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Images list (one URL per line, min 3)</label>
                  <textarea 
                    rows="3" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none bg-slate-50 text-slate-800"
                    value={editImages}
                    onChange={(e) => setEditImages(e.target.value)}
                    required
                  />
                </div>
              </fieldset>

              <fieldset className="border border-slate-300 p-4 rounded-none space-y-4 bg-slate-50">
                <legend className="text-primary font-bold text-xs uppercase px-2 tracking-wide">Indian Proximity & Safety Parameters</legend>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                      checked={editIndianFilters.nearRailway}
                      onChange={(e) => setEditIndianFilters({...editIndianFilters, nearRailway: e.target.checked})}
                    />
                    Near Railway
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                      checked={editIndianFilters.nearMetro}
                      onChange={(e) => setEditIndianFilters({...editIndianFilters, nearMetro: e.target.checked})}
                    />
                    Near Metro
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                      checked={editIndianFilters.nearTemple}
                      onChange={(e) => setEditIndianFilters({...editIndianFilters, nearTemple: e.target.checked})}
                    />
                    Near Temple
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                      checked={editIndianFilters.vegFoodNearby}
                      onChange={(e) => setEditIndianFilters({...editIndianFilters, vegFoodNearby: e.target.checked})}
                    />
                    Veg Food Nearby
                  </label>
                </div>

                <div className="border-t border-slate-200 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                      checked={editSafetyIndicators.familySafe}
                      onChange={(e) => setEditSafetyIndicators({...editSafetyIndicators, familySafe: e.target.checked})}
                    />
                    Family Safe
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                      checked={editSafetyIndicators.soloSafe}
                      onChange={(e) => setEditSafetyIndicators({...editSafetyIndicators, soloSafe: e.target.checked})}
                    />
                    Solo Safe
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-primary focus:ring-primary w-4 h-4 border-slate-300"
                      checked={editSafetyIndicators.womenFriendly}
                      onChange={(e) => setEditSafetyIndicators({...editSafetyIndicators, womenFriendly: e.target.checked})}
                    />
                    ♀️ Women-Friendly
                  </label>
                </div>
              </fieldset>

              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setEditListing(null)}
                  className="classic-btn-secondary px-5 py-2.5"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingEdit}
                  className="classic-btn px-6 py-2.5"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
