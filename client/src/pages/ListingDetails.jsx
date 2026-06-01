import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Shield, Landmark, MapPin, Users, Heart, Sparkles, Calendar, Coffee, Award, Compass, MessageSquare, AlertCircle, Loader2, CheckCircle2, ThumbsUp } from 'lucide-react';
import api from '../services/api';

export default function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Wishlist state
  const [isSaved, setIsSaved] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [categoryAverages, setCategoryAverages] = useState({
    cleanliness: 0,
    communication: 0,
    location: 0,
    value: 0,
    localVibe: 0
  });

  // Review submission states
  const [submitRatings, setSubmitRatings] = useState({
    cleanliness: 5,
    communication: 5,
    location: 5,
    value: 5,
    localVibe: 5
  });
  const [submitComment, setSubmitComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Date Helpers
  const getTodayString = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getFutureDateString = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [checkIn, setCheckIn] = useState(getTodayString());
  const [checkOut, setCheckOut] = useState(getFutureDateString(3));
  const [guestsCount, setGuestsCount] = useState(2);
  const [selectedExperiences, setSelectedExperiences] = useState([]);

  // Booking states
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch listing stay profile
      const res = await api.get(`/listings/${id}`);
      if (res.data?.success) {
        const stay = res.data.data;
        setListing(stay);
        
        // 2. Fetch local experiences matching this listing's city coordinates
        const expRes = await api.get('/experiences', {
          params: { city: stay.location?.city }
        });
        if (expRes.data?.success) {
          setExperiences(expRes.data.data || []);
        }

        // 3. Fetch wishlist status
        try {
          const wishRes = await api.get('/wishlists');
          if (wishRes.data?.success) {
            const list = wishRes.data.data || [];
            setIsSaved(list.some(l => l._id === id));
          }
        } catch (wishErr) {
          console.log('User not logged in or wishlist error:', wishErr);
        }

        // 4. Fetch reviews and avg ratings
        try {
          const reviewsRes = await api.get(`/reviews/listing/${id}`);
          if (reviewsRes.data?.success) {
            setReviews(reviewsRes.data.data || []);
            setCategoryAverages(reviewsRes.data.categoryAverages || {
              cleanliness: 0,
              communication: 0,
              location: 0,
              value: 0,
              localVibe: 0
            });
          }
        } catch (revErr) {
          console.error('Error fetching reviews:', revErr);
        }
      }
    } catch (err) {
      console.error('Error fetching stay details:', err);
      setError('Stay listing details could not be loaded at this time.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 space-y-4">
        <Loader2 className="w-10 h-10 text-secondary animate-spin" />
        <p className="text-sm font-bold text-slate-400">Loading stay details and regional activities...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-md mx-auto my-32 p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h3 className="font-heading font-bold text-lg text-primary">Error Loading Details</h3>
        <p className="text-xs text-slate-500 font-semibold">{error || 'The requested listing does not exist.'}</p>
        <Link to="/search" className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md">
          Back to Stays Search
        </Link>
      </div>
    );
  }

  const handleToggleWishlist = async () => {
    try {
      const res = await api.post('/wishlists/toggle', { listingId: id });
      if (res.data?.success) {
        setIsSaved(res.data.saved);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      alert('Please sign in or create an account to save stay listings to your wishlist.');
    }
  };

  const handleToggleExp = (exp) => {
    if (selectedExperiences.some(e => e._id === exp._id)) {
      setSelectedExperiences(selectedExperiences.filter(e => e._id !== exp._id));
    } else {
      setSelectedExperiences([...selectedExperiences, exp]);
    }
  };

  const calculateBookingDays = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end - start;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const bookingDays = calculateBookingDays();
  const baseTotal = (listing.pricePerNight || 0) * bookingDays;
  const experienceTotal = selectedExperiences.reduce((sum, exp) => sum + (exp.price * guestsCount), 0);
  const grandTotal = baseTotal + experienceTotal;

  const safetyIndex = listing.safetyIndicators?.safetyIndex || 8.5;
  const isFamilySafe = listing.safetyIndicators?.familySafe;
  const isSoloSafe = listing.safetyIndicators?.soloSafe;
  const isWomenFriendly = listing.safetyIndicators?.womenFriendly;

  const handleConfirmReservation = async () => {
    if (bookingDays <= 0) {
      setBookingError('Check-out date must be after check-in date.');
      return;
    }

    setSubmitting(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      const payload = {
        listingId: id,
        checkIn,
        checkOut,
        guests: guestsCount,
        experiencesBooked: selectedExperiences.map(exp => ({
          experienceId: exp._id,
          qty: guestsCount,
          price: exp.price
        }))
      };

      const response = await api.post('/bookings', payload);
      if (response.data?.success) {
        const bookingId = response.data.data._id;
        navigate(`/checkout/${bookingId}`);
      }
    } catch (err) {
      console.error('Error submitting reservation:', err);
      setBookingError(err.response?.data?.message || 'Failed to submit stay reservation. Please verify authentication status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    try {
      const response = await api.post('/reviews', {
        listingId: id,
        ratings: submitRatings,
        comment: submitComment
      });

      if (response.data?.success) {
        setReviewSuccess('Review posted successfully!');
        setSubmitComment('');
        // Reload reviews & stay safety score index
        const reviewsRes = await api.get(`/reviews/listing/${id}`);
        if (reviewsRes.data?.success) {
          setReviews(reviewsRes.data.data || []);
          setCategoryAverages(reviewsRes.data.categoryAverages || {
            cleanliness: 0,
            communication: 0,
            location: 0,
            value: 0,
            localVibe: 0
          });
        }
        // Update local listing safety index representation
        const listingRes = await api.get(`/listings/${id}`);
        if (listingRes.data?.success) {
          setListing(listingRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError(err.response?.data?.message || 'You must have a completed or confirmed stay booking for this listing to leave a review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleVoteHelpful = async (reviewId) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`);
      if (response.data?.success) {
        // Toggle the local list representation votes array length safely
        setReviews(reviews.map(r => {
          if (r._id === reviewId) {
            const hasVoted = response.data.hasVoted;
            let updatedVotes = [...r.helpfulVotes];
            if (hasVoted) {
              updatedVotes.push('current-user-placeholder');
            } else {
              updatedVotes.pop();
            }
            return { ...r, helpfulVotes: updatedVotes };
          }
          return r;
        }));
      }
    } catch (err) {
      console.error('Error voting review:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* 1. Header Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-primary font-heading">{listing.title}</h1>
            <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
              <MapPin className="w-4 h-4 text-secondary" /> {listing.location?.address}, {listing.location?.city}, {listing.location?.state}
            </p>
          </div>
          <button 
            onClick={handleToggleWishlist}
            className="flex items-center gap-1.5 px-5 py-2.5 border border-border bg-white hover:bg-slate-50 rounded-full font-bold text-xs shadow-sm transition-all"
          >
            <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
            {isSaved ? 'Saved in Wishlist' : 'Save Stay'}
          </button>
        </div>
 
        {/* Dynamic Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-[450px] rounded-3xl overflow-hidden shadow-sm bg-slate-100">
            <img 
              src={listing.images && listing.images[0] ? listing.images[0] : 'https://images.unsplash.com/photo-1598977123418-45f04b615e0e?auto=format&fit=crop&w=800&q=80'} 
              alt="Haveli facade" 
              className="w-full h-full object-cover" 
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1598977123418-45f04b615e0e?auto=format&fit=crop&w=800&q=80'; }}
            />
          </div>
          <div className="grid grid-rows-2 gap-4 h-[450px]">
            <div className="rounded-3xl overflow-hidden shadow-sm bg-slate-100">
              <img 
                src={listing.images && listing.images[1] ? listing.images[1] : 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=400&q=80'} 
                alt="Haveli room" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=400&q=80'; }}
              />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-sm bg-slate-100">
              <img 
                src={listing.images && listing.images[2] ? listing.images[2] : 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80'} 
                alt="Haveli courtyard" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80'; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Content & Sidebar Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Host Card & Key Badges */}
          <div className="bg-white p-6 rounded-3xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/15 rounded-full flex items-center justify-center font-bold text-secondary text-base uppercase">
                {listing.host?.name?.substring(0, 2) || 'HG'}
              </div>
              <div>
                <h4 className="font-heading font-bold text-primary">Hosted by {listing.host?.name || 'AapnaGhar Host'}</h4>
                <p className="text-xs text-slate-400">
                  Verified Local Host | Response Time: {listing.host?.hostDetails?.responseTime || 'Within a few hours'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Host Trust Score</span>
                <span className="text-base font-extrabold text-secondary">{listing.host?.hostDetails?.trustScore || 95}% Verified</span>
              </div>
              <div className="bg-secondary/10 text-secondary p-2.5 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary font-heading">About this Stay</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Indian Safety Index Indicators */}
          <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200/60 space-y-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 font-heading">
              <Shield className="w-5 h-5 text-secondary animate-pulse" /> AapnaGhar Safety Index: {safetyIndex}/10
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-xs font-bold text-slate-700">Family Safe</span>
                <span className="text-[10px] text-secondary font-bold uppercase mt-1">
                  {isFamilySafe ? 'Highly Recommended' : 'Standard Stay'}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-xs font-bold text-slate-700">Solo Safe</span>
                <span className="text-[10px] text-secondary font-bold uppercase mt-1">
                  {isSoloSafe ? 'Verified Safe' : 'Standard Stay'}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-150 flex flex-col items-center text-center">
                <span className={`text-xs font-bold flex items-center gap-1 ${isWomenFriendly ? 'text-pink-600' : 'text-slate-700'}`}>
                  ♀️ Women Friendly
                </span>
                <span className={`text-[10px] font-bold uppercase mt-1 ${isWomenFriendly ? 'text-pink-500' : 'text-slate-400'}`}>
                  {isWomenFriendly ? 'Verified Safe' : 'Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary font-heading">Amenities</h3>
            <div className="grid grid-cols-2 gap-3.5">
              {listing.amenities && listing.amenities.length > 0 ? (
                listing.amenities.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                    <Coffee className="w-4 h-4 text-secondary/70 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">Standard lodging amenities included.</div>
              )}
            </div>
          </div>

          {/* Experience Marketplace Add-ons */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary font-heading">Book Local Experiences (Add-ons)</h3>
            <p className="text-xs text-slate-400 -mt-2">Cross-promoted activities and tours in {listing.location?.city}. Book together with your stay.</p>
            
            {experiences.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {experiences.map((exp) => {
                  const isSelected = selectedExperiences.some(e => e._id === exp._id);
                  return (
                    <div 
                      key={exp._id}
                      onClick={() => handleToggleExp(exp)}
                      className={`
                        p-4 rounded-2xl border cursor-pointer transition-smooth flex justify-between items-center
                        ${isSelected ? 'border-secondary bg-secondary/5' : 'border-border bg-white hover:bg-slate-50'}
                      `}
                    >
                      <div className="pr-4">
                        <h4 className="font-bold text-sm text-primary leading-tight">{exp.title}</h4>
                        <p className="text-[10px] text-slate-450 mt-0.5">Duration: {exp.duration || '2 hours'} | Type: <span className="capitalize">{exp.type}</span></p>
                        <p className="text-xs text-secondary font-extrabold mt-1">₹{exp.price} / person</p>
                      </div>
                      
                      <button className={`
                        text-xs font-bold px-3 py-1.5 rounded-lg border flex-shrink-0 transition-colors
                        ${isSelected ? 'bg-secondary text-primary border-secondary' : 'bg-transparent text-slate-500 border-slate-300'}
                      `}>
                        {isSelected ? 'Selected' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded-2xl">
                No host-curated native experiences listed in this area yet. More experiences coming soon!
              </div>
            )}
          </div>

          {/* Reviews Matrix & List Section */}
          <div className="space-y-8 pt-4">
            <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="w-full md:w-1/3 text-left space-y-2">
                <h3 className="text-xl font-bold text-primary font-heading">Guest Reviews</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-primary font-heading">
                    {reviews.length > 0 
                      ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
                      : 'N/A'
                    }
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">/ 5.0</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span>{reviews.length} overall rating score entries</span>
                </div>
              </div>

              {/* Category Breakdown Averages */}
              <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
                {Object.entries(categoryAverages).map(([category, rating]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-655 capitalize">
                      <span>{category}</span>
                      <span>{rating.toFixed(1)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full" 
                        style={{ width: `${(rating / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Reviews Cards */}
            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev._id} className="p-6 bg-slate-50/55 border border-slate-200/50 rounded-[20px] text-left space-y-3.5 shadow-sm relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/5 rounded-full flex items-center justify-center font-bold text-primary text-xs uppercase">
                          {rev.user?.name?.substring(0, 2) || 'G'}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-primary">{rev.user?.name || 'Verified Traveler'}</h5>
                          <span className="text-[10px] text-slate-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-white border border-border rounded-lg text-xs font-extrabold text-primary shadow-sm">
                        <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                        <span>{rev.overallRating.toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">{rev.comment}</p>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100/50 text-[10px] font-bold text-slate-400">
                      <button 
                        onClick={() => handleVoteHelpful(rev._id)}
                        className="flex items-center gap-1 hover:text-secondary transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Helpful ({rev.helpfulVotes?.length || 0})</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-6 border border-dashed border-slate-200 rounded-2xl text-center">
                  No verified guest reviews posted for this stay yet.
                </div>
              )}
            </div>

            {/* Leave a Review Form */}
            <form onSubmit={handleReviewSubmit} className="bg-white border border-border p-6 rounded-3xl shadow-sm text-left space-y-4">
              <h4 className="font-heading font-bold text-base text-primary">Leave a Stay Feedback</h4>
              <p className="text-xs text-slate-400 -mt-2">Only guest accounts with completed bookings can submit stay reviews.</p>

              {reviewError && (
                <div className="bg-red-50 border border-red-200 text-danger p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}

              {reviewSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {Object.keys(submitRatings).map((cat) => (
                  <div key={cat} className="flex flex-col space-y-1">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block">{cat}</span>
                    <select 
                      className="border border-border p-2 rounded-xl text-xs font-bold focus:outline-none bg-slate-50 cursor-pointer"
                      value={submitRatings[cat]}
                      onChange={(e) => setSubmitRatings({ ...submitRatings, [cat]: parseInt(e.target.value) })}
                    >
                      {[5, 4, 3, 2, 1].map(star => (
                        <option key={star} value={star}>{star} ⭐</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-2">
                <label className="block text-xs font-bold text-slate-655">Review Comment</label>
                <textarea 
                  rows="3" 
                  placeholder="Share your stay experience, local meals, hospitality, proximity to points of interest..."
                  className="w-full border border-border p-3.5 rounded-2xl text-xs font-semibold focus:outline-none bg-slate-50 focus:bg-white focus:ring-1 focus:ring-secondary transition-colors"
                  value={submitComment}
                  onChange={(e) => setSubmitComment(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={submittingReview}
                className="bg-secondary text-primary font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:bg-secondary-dark disabled:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 border-t-transparent rounded-full animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Checkout Widget */}
        <div className="bg-white p-8 rounded-3xl border border-border shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Price</span>
              <p className="text-2xl font-extrabold text-primary">₹{(listing.pricePerNight || 0).toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500"> / night</span></p>
            </div>
            
            {listing.demandIndicator && (
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  listing.demandIndicator === 'High' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                }`}>
                  🔥 {listing.demandIndicator} Demand
                </span>
              </div>
            )}
          </div>

          {bookingError && (
            <div className="bg-red-50 border border-red-200 text-danger p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {bookingSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>{bookingSuccess}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-655 mb-1.5">Check-In</label>
                <input 
                  type="date" 
                  min={getTodayString()}
                  className="w-full border border-border px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary bg-slate-50 cursor-pointer"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-655 mb-1.5">Check-Out</label>
                <input 
                  type="date" 
                  min={checkIn || getTodayString()}
                  className="w-full border border-border px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary bg-slate-50 cursor-pointer"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-655 mb-1">Guests count</label>
              <input 
                type="number" 
                min="1" 
                max={listing.maxGuests || 4}
                className="w-full border border-border px-3.5 py-2.5 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary bg-slate-50"
                value={guestsCount}
                onChange={(e) => setGuestsCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Pricing Breakdowns */}
          {bookingDays > 0 ? (
            <div className="space-y-2.5 pt-4 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Stay charge (₹{listing.pricePerNight || 0} x {bookingDays} nights)</span>
                <span>₹{baseTotal.toLocaleString('en-IN')}</span>
              </div>
              
              {selectedExperiences.map(exp => (
                <div key={exp._id} className="flex justify-between text-secondary">
                  <span>{exp.title} (₹{exp.price} x {guestsCount} guests)</span>
                  <span>₹{(exp.price * guestsCount).toLocaleString('en-IN')}</span>
                </div>
              ))}

              <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-extrabold text-primary">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-red-500 font-bold">
              Please enter valid booking dates.
            </div>
          )}

          <button 
            onClick={handleConfirmReservation}
            disabled={submitting || bookingDays <= 0}
            className="w-full bg-primary hover:bg-primary-light disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-xs shadow-md transition-smooth flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 border-t-transparent rounded-full animate-spin" />
                Reserving...
              </>
            ) : (
              'Confirm Reservation'
            )}
          </button>

          {listing.bestTimeToBook && (
            <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
              <AlertCircle className="w-3.5 h-3.5" /> Best Time to Book: <span className="text-secondary font-bold">{listing.bestTimeToBook}</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
