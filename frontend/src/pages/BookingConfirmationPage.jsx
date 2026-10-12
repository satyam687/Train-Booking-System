import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsApi } from '../api/bookingsApi';
import {
  CheckCircle2,
  Ticket,
  Printer,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const BookingConfirmationPage = () => {
  const { reference } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi
      .getBookingDetail(reference)
      .then((res) => setBooking(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reference]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-center sm:text-left">
      {/* Success Hero Header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 sm:p-10 text-emerald-950 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto sm:mx-0 shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
            Payment Completed • Confirmed
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2">
            Booking Confirmed!
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Your e-ticket has been successfully issued. A confirmation notification has been sent.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <div className="bg-white/90 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-800">
            Booking Reference: <span className="font-mono text-blue-900">{booking?.booking_reference}</span>
          </div>
          <div className="bg-white/90 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-800">
            Status: <span className="text-emerald-700">CONFIRMED</span>
          </div>
        </div>
      </div>

      {/* Train & Journey Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-extrabold text-blue-900 uppercase">#{booking?.train_number}</span>
            <h3 className="text-xl font-bold text-slate-900">{booking?.train_name}</h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Class Reserved</span>
            <span className="font-extrabold text-slate-900 text-sm">{booking?.class_name} ({booking?.class_code})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium">Boarding</span>
            <div className="font-bold text-slate-900 text-sm">{booking?.source_station_name} ({booking?.source_station_code})</div>
            <div className="text-slate-600">Departure: {booking?.departure_time ? String(booking.departure_time).substring(0, 5) : '06:00'}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium">Destination</span>
            <div className="font-bold text-slate-900 text-sm">{booking?.destination_station_name} ({booking?.destination_station_code})</div>
            <div className="text-slate-600">Arrival: {booking?.arrival_time ? String(booking.arrival_time).substring(0, 5) : '14:00'}</div>
          </div>
        </div>

        {/* Passenger Seats Allocated Table */}
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-3">Allocated Coach & Seat Numbers</h4>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {booking?.passengers?.map((p, idx) => (
              <div key={idx} className="p-3.5 bg-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">{p.full_name}</span>
                    <span className="text-slate-400">{p.age} Yrs, {p.gender === 'M' ? 'Male' : 'Female'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                    Seat: {p.seat_number || 'Confirmed'}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.berth_preference}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/ticket/${booking?.booking_reference}`}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>View & Print E-Ticket</span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <Link to="/my-bookings" className="text-slate-600 hover:text-slate-900">
              Go to My Bookings
            </Link>
            <span>•</span>
            <Link to="/search" className="text-blue-600 hover:text-blue-800">
              Book Another Journey
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
