import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  User, Calendar, Heart, Shield, Landmark, Home, 
  Check, X, Users, MapPin, Loader2, ListPlus, Edit, Trash2, CheckCircle2, AlertCircle, CloudUpload, UploadCloud, Compass 
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import BookingHistory from './BookingHistory';
import HostReservations from './HostReservations';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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

// Client-side image compression using HTML5 Canvas
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG at 70% quality to keep it under 100kb
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Frontend Cloudinary unsigned upload with compressed base64 fallback
const uploadImageToCloud = async (file) => {
  try {
    const compressedBase64 = await compressImage(file);
    
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    const formData = new FormData();
    formData.append('file', compressedBase64);
    formData.append('upload_preset', uploadPreset || 'ml_default');
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName || 'demo'}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.secure_url;
    } else {
      const errData = await response.json().catch(() => ({}));
      console.warn('Cloudinary upload failed, fallback to local base64:', errData);
    }
  } catch (err) {
    console.warn('Cloudinary upload unsuccessful, using compressed base64 local fallback:', err);
  }
  
  // Return small compressed local base64 fallback
  return await compressImage(file);
};

export default function UserDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, checkAuth } = useAuthStore();

  // Route-synced active tab determination
  const activeTab = location.pathname.endsWith('/bookings') ? 'bookings' :
                    location.pathname.endsWith('/wishlist') ? 'wishlist' :
                    location.pathname.endsWith('/list-ghar') ? 'list-ghar' :
                    location.pathname.endsWith('/my-ghars') ? 'my-ghars' :
                    location.pathname.endsWith('/reservations') ? 'reservations' : 'profile';

  // Global loading states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data Arrays
  const [myBookings, setMyBookings] = useState([]);
  const [myWishlist, setMyWishlist] = useState([]);
  const [myStays, setMyStays] = useState([]);
  const [receivedReservations, setReceivedReservations] = useState([]);

  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phoneNumber || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Property Form States (Create / Edit)
  const [editingListingId, setEditingListingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerNight, setPricePerNight] = useState(3500);
  const [maxGuests, setMaxGuests] = useState(4);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [lat, setLat] = useState(26.9124);
  const [lng, setLng] = useState(75.7873);
  const [imageUrls, setImageUrls] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [uploadingPropertyImage, setUploadingPropertyImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const [indianFilters, setIndianFilters] = useState({
    nearRailway: false,
    nearMetro: false,
    nearAirport: false,
    nearTemple: false,
    nearTouristPlace: true,
    vegFoodNearby: true,
    jainFoodNearby: false
  });
  const [safetyIndicators, setSafetyIndicators] = useState({
    familySafe: true,
    soloSafe: true,
    womenFriendly: true
  });
  const [submittingStay, setSubmittingStay] = useState(false);

  // Payout Setup States
  const [payoutMethod, setPayoutMethod] = useState('upi_qr'); // 'upi_qr' or 'bank_transfer'
  const [upiId, setUpiId] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Auto-Geocoding States
  const [searchLocation, setSearchLocation] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  // Proximity & Food Tags
  const [proximityTags, setProximityTags] = useState([]);

  // Auto-Geocoding search handler
  const handleGeocodeSearch = async () => {
    if (!searchLocation.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&addressdetails=1&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        setLat(latitude);
        setLng(longitude);
        
        // Populate inputs based on address details returned
        const addr = result.address || {};
        const houseNum = addr.house_number || '';
        const road = addr.road || addr.suburb || addr.neighbourhood || '';
        const streetAddress = [houseNum, road].filter(Boolean).join(', ') || result.display_name.split(',')[0];
        setAddress(streetAddress || searchLocation);

        const cityName = addr.city || addr.town || addr.village || addr.municipality || '';
        if (cityName) setCity(cityName);

        const stateName = addr.state || addr.region || '';
        if (stateName) setState(stateName);
      } else {
        setGeocodeError('Location not found. Please refine your search address (e.g. add city/state).');
      }
    } catch (error) {
      console.error('Geocoding search error:', error);
      setGeocodeError('Geocoding service unavailable. Please search again or use a simpler address.');
    } finally {
      setGeocoding(false);
    }
  };

  // Fetch data depending on active tab
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    try {
      if (activeTab === 'profile') {
        const res = await api.get('/bookings/user');
        if (res.data?.success) {
          setMyBookings(res.data.data || []);
        }
      } else if (activeTab === 'bookings') {
        const res = await api.get('/bookings/user');
        if (res.data?.success) {
          setMyBookings(res.data.data || []);
        }
      } else if (activeTab === 'wishlist') {
        const res = await api.get('/wishlists');
        if (res.data?.success) {
          setMyWishlist(res.data.data || []);
        }
      } else if (activeTab === 'my-ghars') {
        const res = await api.get('/listings');
        if (res.data?.success) {
          // Filter listings matching current logged in user ID
          const userStays = (res.data.data || []).filter(
            stay => stay.host === user.id || stay.host?._id === user.id
          );
          setMyStays(userStays);
        }
      } else if (activeTab === 'reservations') {
        const res = await api.get('/bookings/host');
        if (res.data?.success) {
          setReceivedReservations(res.data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard tab data:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load information from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, user]);

  // Sync profile details if user model changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phoneNumber || '');
    }
  }, [user]);

  // Profile Update handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put('/auth/profile', {
        name: profileName,
        phoneNumber: profilePhone
      });
      if (res.data?.success) {
        setSuccessMsg('Your personal details have been updated successfully!');
        // Refresh Zustand auth profile
        await checkAuth();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Booking Cancellation handler
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      if (res.data?.success) {
        setSuccessMsg('Booking cancelled successfully.');
        fetchData();
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  // Wishlist Remove handler
  const handleToggleWishlist = async (listingId) => {
    try {
      const res = await api.post('/wishlists/toggle', { listingId });
      if (res.data?.success) {
        setMyWishlist(prev => prev.filter(item => item._id !== listingId));
        setSuccessMsg('Property removed from wishlist.');
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  // Listing creation & updating handler
  const handleCreateOrUpdateListing = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmittingStay(true);

    try {
      const imagesArray = Array.isArray(imageUrls) ? imageUrls : (imageUrls || '').split('\n').map(url => url.trim()).filter(Boolean);
      if (imagesArray.length < 3) {
        setFormError('Stay registration requires at least 3 high-quality images');
        setSubmittingStay(false);
        return;
      }

      const mappedIndianFilters = {
        nearRailway: proximityTags.some(t => t.toLowerCase().includes('railway')),
        nearMetro: proximityTags.some(t => t.toLowerCase().includes('metro')),
        nearAirport: proximityTags.some(t => t.toLowerCase().includes('airport')),
        nearTemple: proximityTags.some(t => t.toLowerCase().includes('temple')),
        nearTouristPlace: proximityTags.some(t => t.toLowerCase().includes('tourist')),
        vegFoodNearby: proximityTags.some(t => /veg|kitchen|cook/.test(t.toLowerCase())),
        jainFoodNearby: proximityTags.some(t => t.toLowerCase().includes('jain'))
      };

      const payload = {
        title,
        description,
        pricePerNight: Number(pricePerNight),
        maxGuests: Number(maxGuests),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        location: {
          address,
          city,
          state,
          coordinates: {
            lat: Number(lat),
            lng: Number(lng)
          }
        },
        amenities: Array.isArray(amenities) ? amenities.map(a => typeof a === 'string' ? a.trim() : a).filter(Boolean) : (amenities || '').split(',').map(a => a.trim()).filter(Boolean),
        images: imagesArray,
        indianFilters: mappedIndianFilters,
        proximityTags,
        safetyIndicators: {
          ...safetyIndicators,
          safetyIndex: 9.0 // default safety index rating
        },
        payoutDetails: {
          upiId,
          bankDetails: {
            bankAccount,
            ifscCode
          },
          qrCodeUrl
        }
      };

      let response;
      if (editingListingId) {
        response = await api.put(`/listings/${editingListingId}`, payload);
      } else {
        response = await api.post('/listings', payload);
      }

      if (response.data?.success) {
        setFormSuccess(
          editingListingId 
            ? 'Stay listing updated successfully!' 
            : 'Stay listing registered successfully! Added to AapnaGhar.'
        );
        
        // Reset states
        resetListingForm();

        // Redirect directly to search page on success
        navigate('/search');
      }
    } catch (err) {
      console.error('Error saving stay listing:', err);
      setFormError(err.response?.data?.message || 'Failed to save stay listing. Check all parameters.');
    } finally {
      setSubmittingStay(false);
    }
  };

  // Helper to reset form inputs
  const resetListingForm = () => {
    setEditingListingId(null);
    setTitle('');
    setDescription('');
    setPricePerNight(3500);
    setMaxGuests(4);
    setBedrooms(2);
    setBathrooms(2);
    setAddress('');
    setCity('');
    setState('');
    setLat(26.9124);
    setLng(75.7873);
    setAmenities([]);
    setImageUrls([]);
    setIndianFilters({
      nearRailway: false,
      nearMetro: false,
      nearAirport: false,
      nearTemple: false,
      nearTouristPlace: true,
      vegFoodNearby: true,
      jainFoodNearby: false
    });
    setSafetyIndicators({
      familySafe: true,
      soloSafe: true,
      womenFriendly: true
    });
    setProximityTags([]);
    setSearchLocation('');
    setGeocodeError('');
    setUpiId('');
    setBankAccount('');
    setIfscCode('');
    setQrCodeUrl('');
  };

  // Edit action
  const handleEditClick = (listing) => {
    setEditingListingId(listing._id);
    setTitle(listing.title || '');
    setDescription(listing.description || '');
    setPricePerNight(listing.pricePerNight || 0);
    setMaxGuests(listing.maxGuests || 1);
    setBedrooms(listing.bedrooms || 1);
    setBathrooms(listing.bathrooms || 1);
    setAddress(listing.location?.address || '');
    setCity(listing.location?.city || '');
    setState(listing.location?.state || '');
    setLat(listing.location?.coordinates?.lat || 26.9124);
    setLng(listing.location?.coordinates?.lng || 75.7873);
    setAmenities(listing.amenities || []);
    setImageUrls(listing.images || []);
    setIndianFilters({
      nearRailway: listing.indianFilters?.nearRailway || false,
      nearMetro: listing.indianFilters?.nearMetro || false,
      nearAirport: listing.indianFilters?.nearAirport || false,
      nearTemple: listing.indianFilters?.nearTemple || false,
      nearTouristPlace: listing.indianFilters?.nearTouristPlace || false,
      vegFoodNearby: listing.indianFilters?.vegFoodNearby || false,
      jainFoodNearby: listing.indianFilters?.jainFoodNearby || false
    });
    setSafetyIndicators({
      familySafe: listing.safetyIndicators?.familySafe || false,
      soloSafe: listing.safetyIndicators?.soloSafe || false,
      womenFriendly: listing.safetyIndicators?.womenFriendly || false
    });

    const tags = [];
    if (listing.indianFilters?.nearRailway) tags.push('Near Railway Station');
    if (listing.indianFilters?.nearMetro) tags.push('Near Metro');
    if (listing.indianFilters?.nearAirport) tags.push('Near Airport');
    if (listing.indianFilters?.nearTemple) tags.push('Near Temple');
    if (listing.indianFilters?.nearTouristPlace) tags.push('Near Tourist Place');
    if (listing.indianFilters?.vegFoodNearby) tags.push('Pure Veg Kitchen');
    if (listing.indianFilters?.jainFoodNearby) tags.push('Jain Food Available');
    setProximityTags(tags);
    setSearchLocation(`${listing.location?.address || ''}, ${listing.location?.city || ''}, ${listing.location?.state || ''}`);
    setUpiId(listing.payoutDetails?.upiId || '');
    setBankAccount(listing.payoutDetails?.bankDetails?.bankAccount || '');
    setIfscCode(listing.payoutDetails?.bankDetails?.ifscCode || '');
    setQrCodeUrl(listing.payoutDetails?.qrCodeUrl || '');

    navigate('/dashboard/list-ghar');
  };

  // Delete listing action
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this stay listing from AapnaGhar?')) return;
    try {
      const res = await api.delete(`/listings/${listingId}`);
      if (res.data?.success) {
        setSuccessMsg('Stay removed successfully.');
        setMyStays(prev => prev.filter(item => item._id !== listingId));
      }
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert(err.response?.data?.message || 'Failed to remove listing stay.');
    }
  };

  // Manage Guest Reservations
  const handleReservationStatus = async (bookingId, status) => {
    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status });
      if (res.data?.success) {
        setSuccessMsg(`Reservation ${status === 'confirmed' ? 'approved' : 'declined'} successfully!`);
        fetchData();
      }
    } catch (err) {
      console.error('Error updating reservation:', err);
      alert(err.response?.data?.message || 'Failed to update reservation status.');
    }
  };

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  return (
    <div className="space-y-8 text-left">
      
      {/* Alert Notices */}
      {successMsg && (
        <div className="bg-green-50 border-2 border-green-600 text-green-800 p-4 rounded-none text-sm font-semibold flex items-center justify-between transition-all duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-green-600 hover:text-green-800 text-xs font-bold uppercase">Dismiss</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border-2 border-danger text-danger p-4 rounded-none text-sm font-semibold flex items-center justify-between transition-all duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-danger" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-danger hover:text-red-800 text-xs font-bold uppercase">Dismiss</button>
        </div>
      )}


      {activeTab === 'profile' && (
        <div className="bg-white border-2 border-slate-300 p-6 rounded-none space-y-6 text-left">
          <div className="classic-header-strip -mx-6 -mt-6 mb-4">
            <User className="w-4 h-4 text-white" />
            <span>My Profile & Reward Parameters</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Details Update Form Card */}
            <form onSubmit={handleUpdateProfile} className="lg:col-span-2 bg-white border border-slate-300 p-5 rounded-none space-y-4 text-left">
              <span className="block text-xs font-extrabold text-primary uppercase tracking-wide border-b border-slate-200 pb-1.5">Personal Details</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white text-slate-800" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="w-full border border-slate-200 px-3 py-2 rounded-none text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Phone Number</label>
                  <input 
                    type="text" 
                    value={profilePhone} 
                    onChange={(e) => setProfilePhone(e.target.value)} 
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white text-slate-800" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Account Role</label>
                  <input 
                    type="text" 
                    value={user?.role || 'user'} 
                    disabled 
                    className="w-full border border-slate-200 px-3 py-2 rounded-none text-xs font-semibold bg-slate-100 text-slate-400 capitalize cursor-not-allowed" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={updatingProfile}
                className="classic-btn px-6 py-2.5"
              >
                {updatingProfile ? 'Updating...' : 'Update Details'}
              </button>
            </form>

            {/* Traveler Stats Card */}
            <div className="bg-white border border-slate-300 p-5 rounded-none space-y-4 flex flex-col justify-between text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-primary/10 text-primary border border-primary/20">
                    <Compass className="w-4 h-4" />
                  </span>
                  <span className="font-extrabold text-xs text-primary uppercase tracking-wide">Traveler Statistics</span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Earn reward points and track stay count verified on AapnaGhar stay network.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 py-1">
                <div className="bg-slate-50 p-3 border border-slate-300 text-center">
                  <span className="text-[8px] text-slate-400 font-bold block uppercase">Total Stays</span>
                  <span className="text-xl font-black text-primary block mt-0.5">{myBookings.length}</span>
                </div>
                <div className="bg-slate-50 p-3 border border-slate-300 text-center">
                  <span className="text-[8px] text-slate-400 font-bold block uppercase">Travel Points</span>
                  <span className="text-xl font-black text-primary block mt-0.5">{(myBookings.length * 150) + 500}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 border border-slate-300 text-[10px] space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Reward Tier:</span>
                  <span className="text-primary uppercase font-black">
                    {myBookings.length >= 5 ? 'Gold Tier' : myBookings.length >= 2 ? 'Silver Tier' : 'Bronze Tier'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 border border-slate-350 rounded-none overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (myBookings.length / 5) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">
                  {myBookings.length >= 5 ? 'Unlocked Gold rewards!' : `${5 - myBookings.length} stays left to Gold Tier.`}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <BookingHistory 
          bookings={myBookings} 
          onCancel={handleCancelBooking} 
          loading={loading} 
        />
      )}

      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <div className="classic-header-strip">
            <Heart className="w-4 h-4 text-white" />
            <span>My Saved Stay Wishlist</span>
          </div>

          {myWishlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myWishlist.map((stay) => (
                <div key={stay._id} className="bg-white rounded-none border border-[#E2E8F0] overflow-hidden flex flex-col relative hover:border-[#1E293B] transition-all duration-300">
                  <div className="relative aspect-[4/3]">
                    <img 
                      src={stay.images?.[0] || 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=600&q=80'} 
                      alt={stay.title} 
                      className="w-full h-full object-cover bg-slate-100" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=600&q=80'; }}
                    />
                    <button 
                      onClick={() => handleToggleWishlist(stay._id)} 
                      className="absolute top-3 right-3 p-1.5 bg-white border border-primary text-danger hover:scale-105 transition-transform"
                    >
                      <Heart className="w-4 h-4 fill-danger text-danger" />
                    </button>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stay.location?.city}, {stay.location?.state}</span>
                      <h4 className="font-bold text-sm text-primary line-clamp-1">{stay.title}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold pt-1">
                        <span>★ {stay.safetyIndicators?.safetyIndex || 9.0}/10 Safety Index</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold leading-none">Per Night</span>
                        <span className="text-sm font-extrabold text-primary">₹{stay.pricePerNight?.toLocaleString('en-IN')}</span>
                      </div>
                      <Link 
                        to={`/listings/${stay._id}`} 
                        className="classic-btn px-4 py-2 text-xs"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white border border-[#E2E8F0] rounded-none shadow-sm max-w-xl mx-auto w-full">
              <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-[#4B5563]" />
              </div>
              <h3 className="font-heading text-base font-black text-[#111827] uppercase tracking-wide">Your Wishlist is Empty</h3>
              <p className="text-xs text-[#4B5563] mt-2 max-w-sm mx-auto leading-relaxed">
                Tap the heart icon on any heritage homestay listings to save them here for quick access later.
              </p>
              <div className="mt-5 flex justify-center">
                <Link 
                  to="/search"
                  className="classic-btn px-5 py-2.5 text-xs font-bold uppercase flex items-center gap-1.5"
                >
                  Browse Stay Listings
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'list-ghar' && (
        <form onSubmit={handleCreateOrUpdateListing} className="bg-white border-2 border-slate-350 p-6 rounded-none text-left space-y-6 max-w-4xl mx-auto shadow-none">
          <div className="classic-header-strip -mx-6 -mt-6 mb-4">
            <ListPlus className="w-4 h-4 text-white" />
            <span>{editingListingId ? 'Edit Stay Listing' : 'Register New Stay Listing'}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-primary uppercase">
                {editingListingId ? 'Modify Registered Parameters' : 'Add Property Profile Details'}
              </h3>
              <p className="text-[10px] text-slate-500">All direct booking parameters mapped to host banking UPI keys.</p>
            </div>
            {editingListingId && (
              <button 
                type="button" 
                onClick={resetListingForm} 
                className="text-[10px] font-bold text-danger border border-danger px-3 py-1 hover:bg-red-50"
              >
                Cancel Editing
              </button>
            )}
          </div>

          {formError && (
            <div className="bg-red-50 border border-danger text-danger p-3 rounded-none text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="bg-green-50 border border-green-600 text-green-700 p-3 rounded-none text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Section 1: Stay Basics */}
          <fieldset className="border border-slate-300 p-4 rounded-none space-y-4">
            <legend className="text-primary font-bold text-xs uppercase px-2 font-heading">1. Stay Basics</legend>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Stay Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. 150-Year-Old Royal Heritage Palace"
                  className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white text-slate-800"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Description Details</label>
                <textarea 
                  rows="3" 
                  placeholder="Tell travelers about stay rooms, history, hospitality, food, and rules..."
                  className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white text-slate-800"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Price Per Night (₹)</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white text-slate-800"
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Max Guests Capacity</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white text-slate-800"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Bedrooms Count</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white text-slate-800"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Bathrooms Count</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white text-slate-800"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section 2: Physical Location & Geolocation */}
          <fieldset className="border border-slate-300 p-4 rounded-none space-y-4">
            <legend className="text-primary font-bold text-xs uppercase px-2 font-heading">2. Location Details</legend>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Location Search (Auto-pickup coordinates)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="e.g. Johri Bazar, Jaipur, Rajasthan"
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeSearch}
                    disabled={geocoding}
                    className="bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold px-4 py-2 rounded-none flex items-center gap-1.5 transition-colors flex-shrink-0"
                  >
                    {geocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                  </button>
                </div>
                {geocodeError && <p className="text-red-500 text-[11px] mt-1 font-semibold">{geocodeError}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Physical Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. 32, Johri Bazar Road, Old City"
                  className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">City</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Jaipur"
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">State</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rajasthan"
                    className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Map Preview Visual */}
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-slate-700 uppercase">Map Visual Verification</span>
                <div className="bg-slate-100 rounded-none overflow-hidden border border-slate-300 h-48 relative z-10">
                  <MapContainer 
                    key={`${lat}-${lng}`}
                    center={[lat, lng]} 
                    zoom={14} 
                    className="w-full h-full z-10"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lng]}>
                      <Popup>
                        <div className="text-xs font-bold">{title || 'Stay Location Pin'}</div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
                  <span>Lat: {lat.toFixed(4)}</span>
                  <span>Lng: {lng.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section 3: Amenities & Proximity features */}
          <fieldset className="border border-slate-300 p-4 rounded-none space-y-4">
            <legend className="text-primary font-bold text-xs uppercase px-2 font-heading">3. Features & Proximity Tags</legend>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Amenities (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Free Wi-Fi, Pure Veg Meals, AC, Power Backup"
                  className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                  value={Array.isArray(amenities) ? amenities.join(', ') : (amenities || '')}
                  onChange={(e) => setAmenities(e.target.value.split(','))}
                />
              </div>

              {/* Predefined Tags Selection */}
              <div className="space-y-2">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Quick Add Proximity Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Near Temple', 'Near Railway Station', 'Near Metro', 
                    'Pure Veg Kitchen', 'Jain Food Available', 'Home-cooked Meals',
                    'Near Airport', 'Near Tourist Place'
                  ].map((tag) => {
                    const isSelected = proximityTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setProximityTags(prev => prev.filter(t => t !== tag));
                          } else {
                            setProximityTags(prev => [...prev, tag]);
                          }
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-none border transition-all ${
                          isSelected 
                            ? 'bg-[#14B8A6] text-white border-transparent' 
                            : 'bg-white text-slate-650 border-slate-300 hover:border-primary'
                        }`}
                      >
                        {isSelected ? '✓' : '+'} {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags input bar */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-slate-450 font-bold uppercase">Custom Proximity/Food tags (Type and press Enter)</label>
                <div className="flex flex-wrap gap-2 border border-slate-300 p-2 rounded-none bg-white min-h-[40px] items-center">
                  {proximityTags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 border border-slate-300 rounded-none">
                      {tag}
                      <button
                        type="button"
                        onClick={() => setProximityTags(prev => prev.filter(t => t !== tag))}
                        className="text-slate-450 hover:text-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={proximityTags.length === 0 ? "Add proximity tags..." : ""}
                    className="flex-1 min-w-[120px] bg-transparent text-xs font-semibold focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val && !proximityTags.includes(val)) {
                          setProximityTags(prev => [...prev, val]);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Safety options checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="block text-[10px] text-slate-700 font-bold uppercase">AapnaGhar Safety Index Indicators</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-705 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-secondary w-4 h-4 border-slate-300 focus:ring-0"
                      checked={safetyIndicators.familySafe}
                      onChange={(e) => setSafetyIndicators({...safetyIndicators, familySafe: e.target.checked})}
                    />
                    Family Safe Stay
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-705 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-secondary w-4 h-4 border-slate-300 focus:ring-0"
                      checked={safetyIndicators.soloSafe}
                      onChange={(e) => setSafetyIndicators({...safetyIndicators, soloSafe: e.target.checked})}
                    />
                    Solo Safe Stay
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-705 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded-none text-secondary w-4 h-4 border-slate-300 focus:ring-0"
                      checked={safetyIndicators.womenFriendly}
                      onChange={(e) => setSafetyIndicators({...safetyIndicators, womenFriendly: e.target.checked})}
                    />
                    ♀️ Women-Friendly Verified
                  </label>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section 4: Property Stay Images */}
          <fieldset className="border border-slate-300 p-4 rounded-none space-y-4 bg-slate-50">
            <legend className="text-primary font-bold text-xs uppercase px-2 font-heading">4. Property Images</legend>
            
            <div className="space-y-4">
              <span className="block text-[10px] text-slate-500 font-bold">Please attach at least 3 high-quality pictures of the stay.</span>

              {/* Thumbnail grid */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-[4/3] rounded-none overflow-hidden border border-slate-300 bg-white">
                      <img 
                        src={url} 
                        alt={`Property image ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=300&q=80'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 p-1 bg-white border border-danger text-danger hover:bg-red-50"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 right-1 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5">
                        IMG {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File input uploader panel */}
                <div className="relative border border-dashed border-slate-300 p-6 rounded-none flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-slate-105 transition-colors">
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setUploadingPropertyImage(true);
                      setFormError('');
                      try {
                        const newUrls = [];
                        for (const file of files) {
                          const url = await uploadImageToCloud(file);
                          newUrls.push(url);
                        }
                        setImageUrls(prev => [...prev, ...newUrls]);
                      } catch (err) {
                        console.error(err);
                        setFormError('Failed to upload property images.');
                      } finally {
                        setUploadingPropertyImage(false);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <CloudUpload className="w-6 h-6 text-primary mb-1" />
                  <span className="text-[10px] text-primary font-bold">
                    {uploadingPropertyImage ? 'Uploading & Optimizing...' : 'Click to Upload Stay Images'}
                  </span>
                  <span className="text-[9px] text-slate-450 mt-1">Supports multiple image selections</span>
                </div>

                {/* URL paste uploader */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">Or Enter Direct Image URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="https://example.com/image.jpg"
                      className="w-full border border-slate-300 px-3 py-2 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customImageUrl.trim() && !imageUrls.includes(customImageUrl.trim())) {
                          setImageUrls(prev => [...prev, customImageUrl.trim()]);
                          setCustomImageUrl('');
                        }
                      }}
                      className="bg-primary hover:bg-[#0D9488] text-white text-xs font-bold px-4 py-2 rounded-none transition-colors"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Section 5: Payout Details Setup */}
          <fieldset className="border border-slate-300 p-4 rounded-none space-y-4 bg-slate-50">
            <legend className="text-primary font-bold text-xs uppercase px-2 font-heading">5. Host Payout Setup</legend>
            
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <p className="text-[10px] text-slate-500 font-semibold">Select direct bank settlements path for guest bookings.</p>
              </div>

              {/* Payout Method Toggle Choice */}
              <div className="flex gap-4 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('upi_qr')}
                  className={`text-xs font-bold px-4 py-2 rounded-none transition-all border ${
                    payoutMethod === 'upi_qr'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-primary'
                  }`}
                >
                  Pay via UPI QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutMethod('bank_transfer')}
                  className={`text-xs font-bold px-4 py-2 rounded-none transition-all border ${
                    payoutMethod === 'bank_transfer'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-primary'
                  }`}
                >
                  Pay via Bank Account
                </button>
              </div>

              {/* payout method panel details */}
              {payoutMethod === 'upi_qr' ? (
                <div className="space-y-4">
                  <div className="max-w-md">
                    <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Host UPI ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. username@okaxis"
                      className="w-full border border-slate-300 px-3 py-2.5 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required={payoutMethod === 'upi_qr'}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* QR Upload */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">UPI Personal QR Code Upload</label>
                      <div className="relative border border-dashed border-slate-300 p-4 rounded-none flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-slate-100/50">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setSubmittingStay(true);
                            try {
                              const url = await uploadImageToCloud(file);
                              setQrCodeUrl(url);
                            } catch (err) {
                              console.error('QR code upload error:', err);
                              setFormError('Failed to upload QR code screenshot.');
                            } finally {
                              setSubmittingStay(false);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <CloudUpload className="w-5 h-5 text-primary mb-1" />
                        <span className="text-[10px] text-primary font-bold">Choose QR Code Screenshot</span>
                      </div>
                    </div>

                    {/* QR URL Fallback */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">OR Enter QR Code Image URL</label>
                      <input 
                        type="text" 
                        placeholder="https://example.com/my-qr.png"
                        className="w-full border border-slate-300 px-3 py-2.5 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                        value={qrCodeUrl?.startsWith('data:') ? '' : qrCodeUrl}
                        onChange={(e) => setQrCodeUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  {qrCodeUrl && (
                    <div className="p-3 bg-white rounded-none border border-slate-300 flex items-center justify-between mt-2 max-w-md">
                      <div className="flex items-center gap-2">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code Preview" 
                          className="w-12 h-12 object-cover rounded-none border border-slate-300"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">QR Code Attached</span>
                          <span className="text-[10px] text-slate-600 font-semibold">Image loaded successfully</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setQrCodeUrl('')}
                        className="text-danger hover:text-red-800 text-xs font-bold uppercase px-2 py-1 border border-danger hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Account Holder Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Sharma"
                      className="w-full border border-slate-300 px-3 py-2.5 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      required={payoutMethod === 'bank_transfer'}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Bank Account Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 91809012345678"
                      className="w-full border border-slate-300 px-3 py-2.5 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      required={payoutMethod === 'bank_transfer'}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">Bank IFSC Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. UTIB0001234"
                      className="w-full border border-slate-300 px-3 py-2.5 rounded-none text-xs font-semibold focus:outline-none focus:border-primary bg-white"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      required={payoutMethod === 'bank_transfer'}
                    />
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          <div className="flex gap-4 pt-2 justify-end">
            <button 
              type="submit"
              disabled={submittingStay}
              className="bg-primary hover:bg-[#0D9488] text-white font-bold text-xs px-6 py-3 rounded-none disabled:bg-slate-300 transition-colors flex items-center gap-2"
            >
              {submittingStay ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 border-t-transparent rounded-full animate-spin" />
                  Saving Stay...
                </>
              ) : (
                editingListingId ? 'Update Stay Listing' : 'Register Stay'
              )}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'my-ghars' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-slate-300">
            <div>
              <h1 className="text-xl font-extrabold text-primary uppercase font-heading">My Listed Ghars</h1>
              <p className="text-xs text-slate-500 font-body">Manage property listings you have registered on AapnaGhar.</p>
            </div>
            <Link 
              to="/dashboard/list-ghar" 
              className="classic-btn flex items-center gap-1.5"
            >
              <ListPlus className="w-4 h-4 text-white" /> Add Stay
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#14B8A6] animate-spin" /></div>
          ) : myStays.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {myStays.map((stay) => (
                <div key={stay._id} className="bg-white rounded-none border border-[#E2E8F0] overflow-hidden flex flex-col hover:border-[#1E293B] transition-all duration-300">
                  <div className="relative aspect-[4/3]">
                    <img 
                      src={stay.images?.[0] || 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=600&q=80'} 
                      alt={stay.title} 
                      className="w-full h-full object-cover bg-slate-100" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=600&q=80'; }}
                    />
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col justify-between text-left">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{stay.location?.city}, {stay.location?.state}</span>
                      <h4 className="font-bold text-base text-primary line-clamp-1">{stay.title}</h4>
                      <p className="text-xs text-slate-500 font-semibold">₹{stay.pricePerNight}/night | {stay.maxGuests} guests max</p>
                    </div>

                    <div className="flex items-center gap-3 border-t border-slate-200 mt-4 pt-3">
                      <button 
                        onClick={() => handleEditClick(stay)}
                        className="flex-1 flex justify-center items-center gap-1 bg-slate-100 hover:bg-slate-250 text-slate-800 text-xs font-bold py-2 rounded-none border border-slate-300 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Stay
                      </button>
                      <button 
                        onClick={() => handleDeleteListing(stay._id)}
                        className="flex-1 flex justify-center items-center gap-1 bg-red-50 hover:bg-red-100 text-danger text-xs font-bold py-2 rounded-none border border-red-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white border border-[#E2E8F0] rounded-none shadow-sm max-w-xl mx-auto w-full">
              <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Landmark className="w-7 h-7 text-[#4B5563]" />
              </div>
              <h3 className="font-heading text-base font-black text-[#111827] uppercase tracking-wide">No Stays Listed Yet</h3>
              <p className="text-xs text-[#4B5563] mt-2 max-w-sm mx-auto leading-relaxed">
                You haven't registered any property stays on ApnaGhar yet. Share your local heritage and host travelers by registering your space!
              </p>
              <div className="mt-5 flex justify-center">
                <button 
                  onClick={() => setActiveTab('list-ghar')}
                  className="classic-btn px-5 py-2.5 text-xs font-bold uppercase flex items-center gap-1.5"
                >
                  List My Ghar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reservations' && (
        <HostReservations 
          reservations={receivedReservations} 
          onStatusUpdate={handleReservationStatus} 
          loading={loading} 
        />
      )}
    </div>
  );
}
