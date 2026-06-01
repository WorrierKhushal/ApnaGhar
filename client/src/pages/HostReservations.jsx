import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, Loader2, Check, X, ShieldAlert } from 'lucide-react';

// Helper to determine Stay Type based on title keywords
const getStayType = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('haveli')) return 'Heritage Haveli';
  if (t.includes('homestay')) return 'Ancestral Homestay';
  if (t.includes('farm')) return 'Farm Stay';
  if (t.includes('villa')) return 'Modern Villa';
  return 'Heritage Stay';
};

export default function HostReservations({ reservations = [], onStatusUpdate, loading }) {
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
      case 'confirmed': return 'Confirmed / Paid';
      case 'payment_submitted': return 'Awaiting Verification';
      case 'pending_payment': return 'Awaiting Guest Payment';
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
                <div class="section-title">Guest Details</div>
                <p>${booking.user?.name || 'AapnaGhar Guest'}</p>
                <p>${booking.user?.email || ''}</p>
                <p>${booking.user?.phoneNumber || ''}</p>
              </div>
              <div class="info-block" style="text-align: right;">
                <div class="section-title">Property Details</div>
                <p>${booking.listing?.title}</p>
                <p>Host Dashboard Payout Verification</p>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th style="text-align: right;">Payout Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Stay Reservation for ${booking.user?.name || 'Guest'} (${booking.guests} Guests)</td>
                  <td>${new Date(booking.checkIn).toLocaleDateString('en-IN')}</td>
                  <td>${new Date(booking.checkOut).toLocaleDateString('en-IN')}</td>
                  <td style="text-align: right; font-weight: bold;">₹${booking.totalPrice?.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              Total Payout: <span>₹${booking.totalPrice?.toLocaleString('en-IN')}</span>
            </div>

            <div class="footer">
              This invoice details a Direct-to-Host UPI reservation transaction confirmed on AapnaGhar.
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

  // Categorize reservations using current local date
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingReservations = reservations.filter((r) => {
    const isNotCancelled = r.status !== 'cancelled' && r.status !== 'expired';
    const isFutureOrToday = new Date(r.checkOut) >= now;
    return isNotCancelled && isFutureOrToday;
  });

  const cancelledReservations = reservations.filter((r) => {
    return r.status === 'cancelled' || r.status === 'expired';
  });

  const completedReservations = reservations.filter((r) => {
    const isCompletedStatus = r.status === 'completed';
    const isPastConfirmed = r.status === 'confirmed' && new Date(r.checkOut) < now;
    return isCompletedStatus || isPastConfirmed;
  });

  // Get active subset based on selected sub-tab
  const getActiveReservations = () => {
    switch (activeSubTab) {
      case 'upcoming': return upcomingReservations;
      case 'cancelled': return cancelledReservations;
      case 'completed': return completedReservations;
      default: return [];
    }
  };

  const activeReservations = getActiveReservations();

  return (
    <div className="space-y-6">
      <div className="classic-header-strip">
        <Calendar className="w-4 h-4 text-white" />
        <span>Received Reservations & Payout Verification</span>
      </div>

      {/* Tabbed Navigation */}
      <div className="flex gap-2 border-b border-slate-300 pb-2">
        {[
          { id: 'upcoming', label: 'UPCOMING', count: upcomingReservations.length },
          { id: 'cancelled', label: 'CANCELLED', count: cancelledReservations.length },
          { id: 'completed', label: 'COMPLETED', count: completedReservations.length }
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
      ) : activeReservations.length > 0 ? (
        <div className="overflow-x-auto border border-slate-300">
          <table className="w-full text-left border-collapse text-xs font-semibold">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-300">
                <th className="p-3 border-r border-slate-300">Stay & Guest Details</th>
                <th className="p-3 border-r border-slate-300">Check-in Date</th>
                <th className="p-3 border-r border-slate-300">Check-out Date</th>
                <th className="p-3 border-r border-slate-300 text-right">Payout Amount</th>
                <th className="p-3 border-r border-slate-300 text-center">Submitted UTR</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeReservations.map((booking) => {
                const utr = booking.paymentDetails?.utrNumber || booking.paymentDetails?.transactionId || '';
                const hasUtr = utr && utr !== 'Not Submitted';
                
                return (
                  <tr key={booking._id} className="hover:bg-slate-50 border-b border-slate-200">
                    {/* Left edge teal status strip indicator on row */}
                    <td className="p-3 border-r border-slate-200 min-w-[260px]">
                      <div className="flex items-start gap-3">
                        <img 
                          src={booking.listing?.images?.[0] || 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=300&q=80'} 
                          alt={booking.listing?.title} 
                          className="w-12 h-12 object-cover bg-slate-100 border border-slate-300 rounded-none flex-shrink-0" 
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=300&q=80'; }}
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 line-clamp-1 text-xs">
                            {booking.listing?.title}
                          </h4>
                          <div className="text-[10px] text-slate-655 font-bold">
                            Guest: <span className="text-slate-900">{booking.user?.name || 'Traveler'}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 font-medium">
                            {booking.user?.email || 'N/A'} {booking.user?.phoneNumber ? `| Cell: ${booking.user.phoneNumber}` : ''}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                            ID: {booking._id} | Type: {getStayType(booking.listing?.title)}
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
                      {hasUtr ? (
                        <span className="text-slate-700 font-mono font-extrabold text-[10px] bg-slate-50 px-2 py-0.5 border border-slate-200 inline-block truncate max-w-[120px]" title={utr}>
                          {utr}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Awaiting Payment</span>
                      )}
                      <div className="inline-flex items-center gap-1.5 text-[8px] font-extrabold uppercase mt-1 block">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${getStatusColor(booking.status)}`} />
                        <span className="text-slate-500">{getStatusLabel(booking.status)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-center justify-center max-w-[130px] mx-auto">
                        {(booking.status === 'pending' || booking.status === 'payment_submitted' || booking.status === 'pending_payment') ? (
                          <>
                            <button 
                              onClick={() => onStatusUpdate(booking._id, 'confirmed')}
                              className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white text-[10px] font-bold py-1 px-2.5 rounded-none text-center transition-all flex items-center justify-center gap-1"
                              title="Verify UTR and Confirm Booking"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirm Payout</span>
                            </button>
                            <button 
                              onClick={() => onStatusUpdate(booking._id, 'cancelled')}
                              className="w-full bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 text-[10px] font-bold py-1 px-2 rounded-none text-center transition-all flex items-center justify-center gap-1"
                              title="Decline Reservation request"
                            >
                              <X className="w-3 h-3" />
                              <span>Decline Stay</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-400 text-[10px] italic">No actions pending</span>
                            {booking.status === 'confirmed' && (
                              <button 
                                type="button"
                                onClick={() => handleDownloadInvoice(booking)}
                                className="text-[10px] font-bold text-slate-650 hover:text-primary flex items-center justify-center gap-1 transition-colors py-1 px-2.5 bg-slate-50 hover:bg-slate-100 rounded-none border border-slate-350 w-full"
                              >
                                <span>Receipt Invoice</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white border border-[#E2E8F0] rounded-none shadow-sm max-w-xl mx-auto w-full">
          <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-[#4B5563]" />
          </div>
          <h3 className="font-heading text-base font-black text-[#111827] uppercase tracking-wide">No Reservations Received</h3>
          <p className="text-xs text-[#4B5563] mt-2 max-w-sm mx-auto leading-relaxed">
            Stays listed on AapnaGhar will display Guest reservation and payment requests here once submitted.
          </p>
        </div>
      )}
    </div>
  );
}
