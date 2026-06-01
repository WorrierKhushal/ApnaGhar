import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Clock, CreditCard, Smartphone, CheckCircle2, AlertCircle, 
  ArrowLeft, Copy, Check, ShieldCheck, HelpCircle, Lock 
} from 'lucide-react';
import api from '../services/api';

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  // Booking & payment states
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Timer state (seconds remaining)
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [isExpired, setIsExpired] = useState(false);

  // Form states
  const [paymentMethod, setPaymentMethod] = useState('upi_app'); // 'upi_app' or 'qr_code'
  const [utrNumber, setUtrNumber] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Submission states
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch booking details
  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/bookings/${bookingId}`);
      if (res.data?.success) {
        const data = res.data.data;
        setBooking(data);
        
        // Calculate remaining seconds
        const createdAt = new Date(data.createdAt).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - createdAt) / 1000);
        const remainingSeconds = 600 - elapsedSeconds;

        if (data.status === 'cancelled' || data.status === 'expired') {
          setIsExpired(true);
          setTimeLeft(0);
        } else if (data.status !== 'pending_payment') {
          // If already paid or confirmed, redirect to dashboard
          navigate('/dashboard/bookings');
        } else if (remainingSeconds <= 0) {
          setIsExpired(true);
          setTimeLeft(0);
          handleExpireBooking();
        } else {
          setTimeLeft(remainingSeconds);
        }
      }
    } catch (err) {
      console.error('Error fetching booking for checkout:', err);
      setError(err.response?.data?.message || 'Could not fetch booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Live Countdown Timer logic
  useEffect(() => {
    if (loading || error || isExpired || timeLeft <= 0 || !booking) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          handleExpireBooking();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, isExpired, timeLeft, booking]);

  // Expire booking handler
  const handleExpireBooking = async () => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      if (booking) {
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (err) {
      console.error('Error auto-cancelling booking:', err);
    }
  };

  // UTR Numeric Validation and setter
  const handleUtrChange = (e) => {
    const val = e.target.value;
    // Allow only numeric digits
    if (/^\d*$/.test(val)) {
      setUtrNumber(val);
    }
  };

  // Handle transaction submission
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!utrNumber.trim()) {
      setFormError('Please enter the 12-digit UTR Number.');
      return;
    }
    if (utrNumber.length !== 12) {
      setFormError('UTR Number must be exactly 12 numeric digits.');
      return;
    }

    setSubmittingPayment(true);

    try {
      const res = await api.put(`/bookings/${bookingId}/submit-payment`, {
        utrNumber: utrNumber.trim()
      });

      if (res.data?.success) {
        setSuccessMsg('UPI Transaction UTR submitted successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard/bookings');
        }, 2500);
      }
    } catch (err) {
      console.error('Error submitting payment details:', err);
      setFormError(err.response?.data?.message || 'Failed to submit payment UTR. Please check parameters.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Copy UPI ID helper
  const handleCopyUpi = (upiId) => {
    navigator.clipboard.writeText(upiId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 space-y-4 bg-slate-50 min-h-screen">
        <Clock className="w-10 h-10 text-[#14B8A6] animate-spin" />
        <p className="text-sm font-bold text-slate-500">Loading secure checkout workspace...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-32 p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-lg">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-heading font-bold text-lg text-slate-900">Checkout Error</h3>
        <p className="text-xs text-slate-500 font-semibold">{error || 'Booking details could not be loaded.'}</p>
        <Link to="/search" className="inline-block px-5 py-2.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white text-xs font-bold rounded-xl shadow-md transition-colors">
          Back to Stay Search
        </Link>
      </div>
    );
  }

  const { listing, totalPrice } = booking;
  const hostUpi = listing?.payoutDetails?.upiId || 'apnaghar@okaxis';
  const bankAccount = listing?.payoutDetails?.bankDetails?.bankAccount || 'N/A';
  const ifscCode = listing?.payoutDetails?.bankDetails?.ifscCode || 'N/A';
  const hostQr = listing?.payoutDetails?.qrCodeUrl;

  // Generate real UPI deep-link
  const upiLink = `upi://pay?pa=${encodeURIComponent(hostUpi)}&pn=${encodeURIComponent('AapnaGhar Booking')}&am=${totalPrice}&cu=INR`;
  // Generate public dynamic QR code API fallback if custom QR screenshot not available
  const qrImageSrc = hostQr || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16 text-left font-body">
      
      {/* Trust Gradient Header */}
      <div className="bg-[#0F172A] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Link to="/dashboard/bookings" className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-[#14B8A6] text-slate-900 p-2 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold font-heading tracking-tight">Bharat UPI Payment Gateway</h1>
                <p className="text-xs text-slate-400 font-semibold">Secure Direct-to-Host Verification System</p>
              </div>
            </div>
          </div>

          {/* Secure Trust Badge */}
          <div className="flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/50">
            <Lock className="w-4 h-4 text-[#14B8A6]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">256-Bit Encrypted P2P</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* TIMER BAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div className="text-xs font-semibold text-slate-500">
            Awaiting Verification for Booking ID: <span className="font-bold text-slate-700">{booking._id}</span>
          </div>
          
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border font-bold text-xs ${
            isExpired 
              ? 'bg-red-50 border-red-200 text-red-600' 
              : timeLeft < 120 
                ? 'bg-amber-50 border-amber-200 text-amber-600 animate-pulse' 
                : 'bg-teal-50 border-teal-200 text-[#14B8A6] animate-pulse'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isExpired ? 'Session Expired' : `Expires In: ${formatTime(timeLeft)}`}
            </span>
          </div>
        </div>

        {isExpired ? (
          <div className="bg-white p-12 rounded-[32px] border border-slate-200 shadow-lg text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="font-heading font-extrabold text-xl text-slate-900">Payment Window Expired</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                To keep calendars open for all travelers, reservation checkout slots are held for exactly 10 minutes. 
                This reservation has expired and dates have been released. Please place a new booking.
              </p>
            </div>
            <Link to="/search" className="inline-block bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-colors">
              Rebook Stays
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT COLUMN: PAYOUT & UTR ENTRY */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* PAYMENT GUIDE ALERT */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇮🇳</span>
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">UPI Verification Process</span>
                </div>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  1. Launch any UPI app (GPay, PhonePe, Paytm, BHIM) on your mobile.<br/>
                  2. Scan the host's QR code or click <strong>'Pay Now via UPI App'</strong> on mobile.<br/>
                  3. Enter transaction amount: <strong className="text-[#14B8A6]">₹{totalPrice?.toLocaleString('en-IN')}</strong>.<br/>
                  4. After successful payment, copy the **12-digit UTR / Transaction ID** from the payment details page and submit it below.
                </p>
              </div>

              {/* DUAL PAYMENT SETUP */}
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-md space-y-6">
                <div className="flex border-b border-slate-100 pb-3 gap-4">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('upi_app')}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-colors ${
                      paymentMethod === 'upi_app' 
                        ? 'border-[#14B8A6] text-[#14B8A6]' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> UPI Intent Pay (Mobile)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('qr_code')}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-colors ${
                      paymentMethod === 'qr_code' 
                        ? 'border-[#14B8A6] text-[#14B8A6]' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Scan QR / Bank Account
                  </button>
                </div>

                {paymentMethod === 'upi_app' ? (
                  <div className="space-y-6 text-center py-4">
                    <div className="max-w-sm mx-auto space-y-4">
                      <p className="text-xs text-slate-500 font-semibold">
                        If you are booking from a smartphone, tap below to launch your default UPI banking applications (GPay, Paytm, BHIM etc.) with booking amount pre-filled.
                      </p>
                      
                      {/* Deep Link Button */}
                      <a 
                        href={upiLink}
                        className="w-full inline-flex justify-center items-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md transition-colors text-xs"
                      >
                        <Smartphone className="w-4 h-4" /> Pay Now via UPI App (₹{totalPrice?.toLocaleString('en-IN')})
                      </a>

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                        <span className="relative bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or transfer manually</span>
                      </div>

                      {/* Manual UPI details */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex items-center justify-between text-left">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Host UPI ID</span>
                          <span className="text-slate-900 font-extrabold text-xs">{hostUpi}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleCopyUpi(hostUpi)}
                          className="text-[#14B8A6] hover:text-[#0D9488] text-xs font-bold flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Scan QR block */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-center space-y-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Scan to Pay (Any App)</span>
                      <img 
                        src={qrImageSrc} 
                        alt="Host Payment QR Code" 
                        className="w-48 h-48 object-contain bg-white p-2 rounded-xl shadow-sm border border-slate-100" 
                      />
                      <span className="text-[9px] text-slate-400 font-semibold">UPI ID: {hostUpi}</span>
                    </div>

                    {/* Bank Details block */}
                    <div className="space-y-4 text-left">
                      <span className="text-xs font-bold text-slate-700 block border-b border-slate-100 pb-2">Direct Bank Transfer Details</span>
                      
                      <div className="space-y-3 text-xs font-semibold">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Bank Account Number</span>
                          <span className="text-slate-900 font-extrabold">{bankAccount}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">IFSC Code</span>
                          <span className="text-slate-900 font-extrabold">{ifscCode}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Account Holder</span>
                          <span className="text-slate-900 font-extrabold">{listing.host?.name || 'AapnaGhar Host'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* UTR ONLY SUBMISSION FORM */}
              <form onSubmit={handleSubmitPayment} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-md space-y-6">
                
                <div className="text-center max-w-md mx-auto space-y-4">
                  <div className="flex justify-center items-center gap-2">
                    <span className="bg-[#14B8A6]/10 text-[#14B8A6] p-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">UPI P2P Secure</span>
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-slate-900 font-heading">Verify Your Payment</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Enter the 12-digit transaction reference number (UTR) generated by your UPI payment application.
                  </p>
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-600 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Centered UTR Input Panel */}
                <div className="max-w-md mx-auto space-y-3 text-center">
                  <div className="relative">
                    <input 
                      type="text" 
                      maxLength="12"
                      placeholder="Enter 12-Digit UTR / Transaction ID"
                      value={utrNumber}
                      onChange={handleUtrChange}
                      className="w-full text-center border-2 border-slate-200 px-4 py-4 rounded-2xl text-lg font-bold tracking-[0.2em] focus:outline-none focus:border-[#14B8A6] bg-slate-50 placeholder:tracking-normal placeholder:text-sm transition-all"
                      required
                    />
                    
                    {/* Tooltip & Help */}
                    <div className="absolute right-3.5 top-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowTooltip(!showTooltip)}
                        className="text-slate-400 hover:text-[#14B8A6] transition-colors"
                        title="Where to find UTR?"
                      >
                        <HelpCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {showTooltip && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-left text-xs font-semibold text-slate-500 space-y-2 relative animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <Smartphone className="w-4 h-4 text-[#14B8A6]" />
                        <span>Finding Your UTR Number</span>
                      </div>
                      <p className="leading-relaxed">
                        The UTR (Unique Transaction Reference) is a <strong>12-digit number</strong> containing only digits. 
                        It appears on the successful transfer receipt page of Google Pay, PhonePe, Paytm, or BHIM. 
                        It is also referred to as <strong>'Ref No.'</strong>, <strong>'Transaction ID'</strong>, or <strong>'UPI Ref No'</strong>.
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setShowTooltip(false)}
                        className="text-[#14B8A6] hover:underline block text-[10px] font-bold uppercase tracking-wider mt-1"
                      >
                        Got it
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Digits: {utrNumber.length} / 12
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={submittingPayment || utrNumber.length !== 12}
                  className="w-full bg-[#14B8A6] hover:bg-[#0D9488] disabled:bg-slate-200 text-white font-extrabold py-4 rounded-2xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {submittingPayment ? (
                    'Validating & Registering Transaction...'
                  ) : (
                    'Verify & Submit Payment UTR'
                  )}
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: BOOKING SUMMARY */}
            <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-md space-y-5">
              <h3 className="text-base font-bold text-slate-900 font-heading border-b border-slate-100 pb-3">Stay Reservation Info</h3>
              
              <div className="flex gap-3">
                <img 
                  src={listing?.images?.[0] || 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=300&q=80'} 
                  alt={listing?.title} 
                  className="w-20 h-16 object-cover rounded-xl bg-slate-100 flex-shrink-0" 
                />
                <div>
                  <h4 className="font-heading font-bold text-xs text-slate-900 line-clamp-2 leading-tight">{listing?.title}</h4>
                  <span className="text-[9px] text-slate-450 font-bold uppercase mt-1 block">{listing?.location?.city}, {listing?.location?.state}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Check-In</span>
                  <span className="text-slate-900 font-bold">{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-Out</span>
                  <span className="text-slate-900 font-bold">{new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Travelers Count</span>
                  <span className="text-slate-900 font-bold">{booking.guests} Guests</span>
                </div>
                
                {booking.experiencesBooked?.length > 0 && (
                  <div className="border-t border-slate-55 pt-2 space-y-1 text-slate-500">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Experiences Add-ons</span>
                    {booking.experiencesBooked.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="line-clamp-1">{item.experience?.title || 'Native Tour'}</span>
                        <span>₹{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-extrabold text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-[#14B8A6] font-extrabold text-base">₹{totalPrice?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
