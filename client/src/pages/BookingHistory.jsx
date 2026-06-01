import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, Loader2 } from 'lucide-react';

// Helper to determine Stay Type based on title keywords
const getStayType = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('haveli')) return 'Heritage Haveli';
  if (t.includes('homestay')) return 'Ancestral Homestay';
  if (t.includes('farm')) return 'Farm Stay';
  if (t.includes('villa')) return 'Modern Villa';
  return 'Heritage Stay';
};

export default function BookingHistory({ bookings = [], onCancel, loading }) {
  const [activeSubTab, setActiveSubTab] = useState('upcoming'); // 'upcoming', 'cancelled', 'completed'

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'payment_submitted': return 'bg-blue-500';
      case 'pending_payment': return 'bg-amber-500';
      case 'completed': return 'bg-slate-400';
      case 'cancelled':
      case 'expired': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Payment Verified';
      case 'payment_submitted': return 'Awaiting Host Approval';
      case 'pending_payment': return 'Awaiting Payment';
      case 'completed': return 'Completed Stay';
      case 'cancelled':
      case 'expired': return 'Cancelled';
      default: return status;
    }
  };

  // Frontend Print Invoice Helper
  const handleDownloadInvoice = (booking) => {
    const printWindow = window.open('', '_blank');
    const invoiceHTML = `
      <html>
        <head>
          <title>Invoice - AapnaGhar Booking #${booking._id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
            .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #0F172A; }
            .logo span { color: #14B8A6; }
            .invoice-details { text-align: right; font-size: 14px; color: #64748b; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; }
            .info-block p { margin: 4px 0; font-size: 14px; font-weight: 600; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th { background: #f8fafc; padding: 12px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; text-align: left; }
            .table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .totals { text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold; }
            .totals span { color: #14B8A6; font-size: 20px; font-weight: 800; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 60px; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              .invoice-box { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header" style="align-items: center;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="/logo.png" alt="ApnaGhar Logo" style="height: 50px; width: auto; object-fit: contain;" />
                <span class="logo">Aapna<span>Ghar</span></span>
              </div>
              <div class="invoice-details">
                <strong>Invoice #:</strong> ${booking._id.substring(0, 8).toUpperCase()}<br/>
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}<br/>
                <strong>UTR Reference:</strong> ${booking.paymentDetails?.utrNumber || 'N/A'}
              </div>
            </div>
            
            <div class="details-grid">
              <div class="info-block">
                <div class="section-title">Billed To (Traveler)</div>
                <p>${booking.user?.name || 'AapnaGhar Guest'}</p>
                <p>${booking.user?.email || ''}</p>
                <p>${booking.user?.phoneNumber || ''}</p>
              </div>
              <div class="info-block" style="text-align: right;">
                <div class="section-title">Property Details</div>
                <p>${booking.listing?.title}</p>
                <p>${booking.listing?.location?.city}, ${booking.listing?.location?.state}</p>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Stay at ${booking.listing?.title} (${booking.guests} Guests)</td>
                  <td>${new Date(booking.checkIn).toLocaleDateString('en-IN')}</td>
                  <td>${new Date(booking.checkOut).toLocaleDateString('en-IN')}</td>
                  <td style="text-align: right; font-weight: bold;">₹${booking.totalPrice?.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              Total Paid: <span>₹${booking.totalPrice?.toLocaleString('en-IN')}</span>
            </div>

            <div class="footer">
              Thank you for choosing AapnaGhar Stay Network! Direct-to-Host UPI payment verified.<br/>
              This is a computer generated invoice and does not require signature.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  // Categorize bookings using current local date
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter((b) => {
    const isNotCancelled = b.status !== 'cancelled' && b.status !== 'expired';
    const isFutureOrToday = new Date(b.checkOut) >= now;
    return isNotCancelled && isFutureOrToday;
  });

  const cancelledBookings = bookings.filter((b) => {
    return b.status === 'cancelled' || b.status === 'expired';
  });

  const completedBookings = bookings.filter((b) => {
    const isCompletedStatus = b.status === 'completed';
    const isPastConfirmed = b.status === 'confirmed' && new Date(b.checkOut) < now;
    return isCompletedStatus || isPastConfirmed;
  });

  // Get active subset based on selected sub-tab
  const getActiveListingsings = () => {
    switch (activeSubTab) {
      case 'upcoming': return upcomingBookings;
      case 'cancelled': return cancelledBookings;
      case 'completed': return completedBookings;
      default: return [];
    }
  };

  const activeListings = getActiveListingsings();

  return (
    <div className="space-y-6">
      <div className="classic-header-strip">
        <Calendar className="w-4 h-4 text-white" />
        <span>Traveler Booking History & Schedules</span>
      </div>

      {/* Tabbed Navigation */}
      <div className="flex gap-2 border-b border-slate-300 pb-2">
        {[
          { id: 'upcoming', label: 'UPCOMING', count: upcomingBookings.length },
          { id: 'cancelled', label: 'CANCELLED', count: cancelledBookings.length },
          { id: 'completed', label: 'COMPLETED', count: completedBookings.length }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border rounded-none ${
              activeSubTab === tab.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-primary hover:border-slate-400'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-2 py-0.5 ${
              activeSubTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#14B8A6] animate-spin" />
        </div>
      ) : activeListings.length > 0 ? (
        <div className="overflow-x-auto border border-slate-300">
          <table className="w-full text-left border-collapse text-xs font-semibold">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-300">
                <th className="p-3 border-r border-slate-300">Stay Details</th>
                <th className="p-3 border-r border-slate-300">Check-in Date</th>
                <th className="p-3 border-r border-slate-300">Check-out Date</th>
                <th className="p-3 border-r border-slate-300 text-right">Amount</th>
                <th className="p-3 border-r border-slate-300 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeListings.map((booking) => (
                <tr key={booking._id} className="hover:bg-slate-50 border-b border-slate-200">
                  {/* Left edge teal status strip indicator on row */}
                  <td className="p-3 border-r border-slate-200 min-w-[220px]">
                    <div className="flex items-center gap-3">
                      <img 
                        src={booking.listing?.images?.[0] || 'https://images.unsplash.com/photo-1598977123418-45f04b615e0e?auto=format&fit=crop&w=300&q=80'} 
                        alt={booking.listing?.title} 
                        className="w-12 h-12 object-cover bg-slate-100 border border-slate-300 rounded-none flex-shrink-0" 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1598977123418-45f04b615e0e?auto=format&fit=crop&w=300&q=80'; }}
                      />
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1 text-xs">
                          {booking.listing?.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {booking.listing?.location?.city || 'India'}, {booking.listing?.location?.state || 'Stay'}
                        </p>
                        <div className="text-[9px] text-slate-400 font-mono">
                          ID: {booking._id} | Stay Type: {getStayType(booking.listing?.title)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 border-r border-slate-200 whitespace-nowrap">
                    <div className="font-bold text-slate-800">
                      {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-400">12:00 PM Check-in</div>
                  </td>
                  <td className="p-3 border-r border-slate-200 whitespace-nowrap">
                    <div className="font-bold text-slate-800">
                      {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-400">11:00 AM Check-out</div>
                  </td>
                  <td className="p-3 border-r border-slate-200 text-right font-extrabold text-primary whitespace-nowrap">
                    ₹{booking.totalPrice?.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 border-r border-slate-200 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase bg-slate-50 border border-slate-300 px-2 py-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${getStatusColor(booking.status)}`} />
                      <span className="text-slate-600">{getStatusLabel(booking.status)}</span>
                    </div>
                    {booking.paymentDetails?.utrNumber && booking.paymentDetails.utrNumber !== 'Not Submitted' && (
                      <span className="block text-[8px] font-mono text-slate-400 mt-0.5">UTR: {booking.paymentDetails.utrNumber}</span>
                    )}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-center justify-center max-w-[120px] mx-auto">
                      {booking.status === 'pending_payment' ? (
                        <Link 
                          to={`/checkout/${booking._id}`}
                          className="bg-primary hover:bg-[#0D9488] text-white text-[10px] font-bold py-1 px-2.5 rounded-none text-center transition-all w-full"
                        >
                          Proceed to Pay
                        </Link>
                      ) : (
                        <Link 
                          to={`/listings/${booking.listing?._id}`}
                          className="bg-primary hover:bg-[#0D9488] text-white text-[10px] font-bold py-1 px-2.5 rounded-none text-center transition-all w-full"
                        >
                          View Stay
                        </Link>
                      )}

                      {booking.status !== 'pending_payment' && (
                        <button 
                          type="button"
                          onClick={() => handleDownloadInvoice(booking)}
                          className="text-[10px] font-bold text-slate-600 hover:text-primary flex items-center justify-center gap-1 transition-colors py-1 px-2.5 bg-slate-105 hover:bg-teal-50 border border-slate-300 rounded-none w-full"
                        >
                          <span className="text-red-500 font-extrabold text-[8px] tracking-tight">PDF</span> 
                          <span>Invoice</span>
                        </button>
                      )}

                      {(booking.status === 'pending' || booking.status === 'pending_payment' || booking.status === 'payment_submitted') && (
                        <button 
                          onClick={() => onCancel(booking._id)}
                          className="text-[10px] font-extrabold text-red-500 hover:text-red-700 transition-colors py-0.5 w-full text-center"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white border border-[#E2E8F0] rounded-none shadow-sm max-w-xl mx-auto w-full">
          <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-[#4B5563]" />
          </div>
          <h3 className="font-heading text-base font-black text-[#111827] uppercase tracking-wide">No Bookings Found</h3>
          <p className="text-xs text-[#4B5563] mt-2 max-w-sm mx-auto leading-relaxed">
            There are no reservations listed in this tab at the moment. Explore our heritage stays to plan your next authentic journey.
          </p>
          <div className="mt-5 flex justify-center">
            <Link 
              to="/search" 
              className="classic-btn px-5 py-2.5 text-xs font-bold uppercase flex items-center gap-1.5"
            >
              Explore Stay Listings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
