import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../api/bookingsApi';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  Ticket,
  Calendar,
  Clock,
  Train,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Printer,
  Ban
} from 'lucide-react';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [cancellingRef, setCancellingRef] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    setLoading(true);
    bookingsApi
      .getMyBookings()
      .then((res) => {
        setBookings(res.data);
      })
      .catch(() => {
        toast.error('Could not load bookings list.');
      })
      .finally(() => setLoading(false));
  };

  const handleCancel = async () => {
    if (!cancellingRef) return;
    setCancelLoading(true);
    try {
      await bookingsApi.cancelBooking(cancellingRef);
      toast.success(`Booking ${cancellingRef} cancelled successfully. Seats restored.`);
      setCancellingRef(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel booking.');
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'ALL') return true;
    return b.booking_status === filterStatus;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Bookings & Journeys
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage your past and upcoming train reservations, cancel bookings, and download e-tickets.
          </p>
        </div>

        <Link
          to="/search"
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white shadow transition self-start sm:self-auto"
        >
          Book New Train
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Trips' },
          { id: 'CONFIRMED', label: 'Confirmed' },
          { id: 'PENDING', label: 'Pending Payment' },
          { id: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 rounded-xl transition ${
              filterStatus === tab.id
                ? 'bg-[#0f2444] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton lines={4} />
          <LoadingSkeleton lines={4} />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">No Bookings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any {filterStatus !== 'ALL' ? filterStatus.toLowerCase() : ''} bookings at the moment.
          </p>
          <Link
            to="/search"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
          >
            Find Trains Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isConfirmed = b.booking_status === 'CONFIRMED';
            const isCancelled = b.booking_status === 'CANCELLED';
            const isPending = b.booking_status === 'PENDING';

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                      {b.booking_reference}
                    </span>
                    <span className="text-xs text-slate-400">
                      Booked on {new Date(b.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <Badge
                    variant={
                      isConfirmed ? 'success' : isCancelled ? 'danger' : 'warning'
                    }
                  >
                    {b.booking_status}
                  </Badge>
                </div>

                {/* Train and Route Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-blue-900 uppercase">#{b.train_number}</div>
                    <h3 className="font-bold text-slate-900 text-base">{b.train_name}</h3>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{b.source_station_name}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-slate-800">{b.destination_station_name}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs space-y-1">
                    <div className="text-slate-500">Journey Date: <strong className="text-slate-800">{b.journey_date}</strong></div>
                    <div className="text-slate-500">Class: <strong className="text-slate-800">{b.class_code} ({b.passenger_count} Pax)</strong></div>
                    <div className="text-sm font-extrabold text-slate-900">Total: ₹{Math.round(b.total_fare)}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <Link
                    to={`/bookings/${b.booking_reference}`}
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    <span>View Booking Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <Link
                        to={`/payment/${b.booking_reference}`}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                      >
                        Complete Payment
                      </Link>
                    )}

                    {isConfirmed && (
                      <Link
                        to={`/ticket/${b.booking_reference}`}
                        className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200 flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>E-Ticket</span>
                      </Link>
                    )}

                    {!isCancelled && (
                      <button
                        onClick={() => setCancellingRef(b.booking_reference)}
                        className="px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold transition"
                      >
                        Cancel Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingRef && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-xl text-slate-900">Cancel Booking?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel booking <strong className="font-mono text-slate-800">{cancellingRef}</strong>?
                The allocated seats will be immediately restored to the inventory pool.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={() => setCancellingRef(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
