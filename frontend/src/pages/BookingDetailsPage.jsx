import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../api/bookingsApi';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  Train,
  Calendar,
  Clock,
  Printer,
  ChevronLeft,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Ban,
  ShieldCheck
} from 'lucide-react';

export const BookingDetailsPage = () => {
  const { reference } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [reference]);

  const fetchBooking = () => {
    setLoading(true);
    bookingsApi
      .getBookingDetail(reference)
      .then((res) => setBooking(res.data))
      .catch((err) => {
        toast.error('Could not load booking details.');
      })
      .finally(() => setLoading(false));
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    try {
      await bookingsApi.cancelBooking(reference);
      toast.success('Booking cancelled and seats restored to inventory.');
      setShowCancelModal(false);
      fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-white rounded-3xl border border-slate-200">
        <h3 className="font-bold text-lg text-slate-900">Booking Record Not Found</h3>
        <Link to="/my-bookings" className="mt-4 inline-block text-xs font-bold text-blue-600">
          Back to My Bookings
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.booking_status === 'CONFIRMED';
  const isCancelled = booking.booking_status === 'CANCELLED';
  const isPending = booking.booking_status === 'PENDING';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/my-bookings')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="w-4 h-4" /> Back to My Bookings
      </button>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-extrabold bg-slate-100 text-slate-800 px-2.5 py-1 rounded">
                {booking.booking_reference}
              </span>
              <Badge variant={isConfirmed ? 'success' : isCancelled ? 'danger' : 'warning'}>
                {booking.booking_status}
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              #{booking.train_number} — {booking.train_name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isConfirmed && (
              <Link
                to={`/ticket/${booking.booking_reference}`}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>View E-Ticket</span>
              </Link>
            )}

            {isPending && (
              <Link
                to={`/payment/${booking.booking_reference}`}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow"
              >
                Pay Now
              </Link>
            )}

            {!isCancelled && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs transition"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>

        {/* Route Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Boarding Station</span>
            <div className="font-bold text-slate-900 text-sm">{booking.source_station_name} ({booking.source_station_code})</div>
            <div className="text-slate-600">Departure: {booking.departure_time ? String(booking.departure_time).substring(0, 5) : '06:00'} hrs</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Arrival Station</span>
            <div className="font-bold text-slate-900 text-sm">{booking.destination_station_name} ({booking.destination_station_code})</div>
            <div className="text-slate-600">Arrival: {booking.arrival_time ? String(booking.arrival_time).substring(0, 5) : '14:00'} hrs</div>
          </div>
        </div>

        {/* Passengers Table */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-3">Passenger Roster & Seat Allocations</h3>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Age / Gender</th>
                  <th className="p-3">Berth Preference</th>
                  <th className="p-3 text-right">Coach & Seat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {booking.passengers?.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{p.full_name}</td>
                    <td className="p-3">{p.age} Yrs / {p.gender === 'M' ? 'Male' : 'Female'}</td>
                    <td className="p-3 text-slate-500">{p.berth_preference || 'No Preference'}</td>
                    <td className="p-3 text-right">
                      <span className="font-black text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-900 border border-blue-200">
                        {p.seat_number || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
          <h4 className="font-bold text-slate-900">Payment Breakdown</h4>
          <div className="flex justify-between text-slate-600">
            <span>Base Fare ({booking.passenger_count} Pax):</span>
            <span>₹{Math.round(booking.base_fare_per_passenger * booking.passenger_count)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Service Charges & GST:</span>
            <span>₹{Math.round(booking.service_fee || 25)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
            <span>Total Fare:</span>
            <span className="text-orange-600 text-base">₹{Math.round(booking.total_fare)}</span>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-xl text-slate-900">Confirm Ticket Cancellation</h3>
              <p className="text-xs text-slate-500 mt-1">
                Cancelling will release all seats back to the public inventory and refund the fare per policy.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50"
              >
                No, Keep
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow"
              >
                {cancelling ? 'Processing...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
