import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsApi } from '../api/bookingsApi';
import {
  Printer,
  Train,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  Download,
  ChevronLeft,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const ETicketPage = () => {
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
      <div className="max-w-3xl mx-auto space-y-6">
        <LoadingSkeleton lines={10} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-3xl text-center border border-slate-200">
        <h3 className="font-bold text-lg text-slate-900">E-Ticket Not Found</h3>
        <Link to="/my-bookings" className="mt-4 inline-block text-xs font-bold text-blue-600">
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Print Controls (Hidden during print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/bookings/${reference}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Booking Overview
        </Link>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-[#0f2444] hover:bg-[#1a3863] text-white text-xs font-bold shadow flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Electronic Reservation Slip (ERS) Printable Container */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-lg p-6 sm:p-10 space-y-6 print:shadow-none print:border-slate-400 print:m-0 print:p-4 text-slate-900">
        {/* Header Branding */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0f2444] text-white flex items-center justify-center font-bold">
              <Train className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#0f2444]">
                RAILBOOK AI — ELECTRONIC RESERVATION SLIP (ERS)
              </h2>
              <p className="text-xs text-slate-600 font-semibold tracking-wide">
                INDIAN RAILWAYS RESERVATION SYSTEM • AUTHORIZED E-TICKET
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Status</div>
            <span className="inline-block px-3 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
              {booking.booking_status}
            </span>
          </div>
        </div>

        {/* Essential Booking Codes Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">PNR / Booking Ref</span>
            <span className="font-mono font-black text-sm text-[#0f2444]">{booking.booking_reference}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Train Number & Name</span>
            <span className="font-bold text-slate-900">{booking.train_number} / {booking.train_name}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Class & Quota</span>
            <span className="font-bold text-slate-900">{booking.class_code} ({booking.class_name}) • GN</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Date of Journey</span>
            <span className="font-bold text-slate-900">{booking.journey_date}</span>
          </div>
        </div>

        {/* Route Details Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-slate-200 rounded-xl p-4">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Boarding Station</span>
            <div className="text-base font-black text-slate-900">{booking.source_station_name} ({booking.source_station_code})</div>
            <div className="text-slate-600">Scheduled Departure: <strong>{booking.departure_time ? String(booking.departure_time).substring(0, 5) : '06:00'} hrs</strong></div>
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Destination Station</span>
            <div className="text-base font-black text-slate-900">{booking.destination_station_name} ({booking.destination_station_code})</div>
            <div className="text-slate-600">Scheduled Arrival: <strong>{booking.arrival_time ? String(booking.arrival_time).substring(0, 5) : '14:00'} hrs</strong></div>
          </div>
        </div>

        {/* Passenger Manifest Table */}
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
            Passenger Details
          </h4>
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Passenger Name</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Berth Preference</th>
                  <th className="p-3 text-right">Coach & Seat Allocated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {booking.passengers?.map((p, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="p-3 font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{p.full_name}</td>
                    <td className="p-3">{p.age} Yrs</td>
                    <td className="p-3">{p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}</td>
                    <td className="p-3 text-slate-600">{p.berth_preference || 'No Preference'}</td>
                    <td className="p-3 text-right">
                      <span className="font-black text-xs px-2.5 py-1 rounded bg-blue-100 text-blue-900 border border-blue-200">
                        {p.seat_number || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment and QR Verification Section */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="sm:col-span-8 space-y-1.5">
            <h5 className="font-bold text-slate-900">Fare Breakdown & Transaction Details</h5>
            <div className="flex justify-between text-slate-600">
              <span>Ticket Fare ({booking.passenger_count} Pax):</span>
              <span>₹{Math.round(booking.base_fare_per_passenger * booking.passenger_count)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Convenience Fee & GST:</span>
              <span>₹{Math.round(booking.service_fee || 25)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Fare Paid:</span>
              <span className="text-emerald-700">₹{Math.round(booking.total_fare)}</span>
            </div>
          </div>

          <div className="sm:col-span-4 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
            <div className="p-2 bg-white rounded-lg border border-slate-300 shadow-xs mb-1">
              <QrCode className="w-16 h-16 text-slate-900" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold">DIGITAL ERS VALIDATED</span>
          </div>
        </div>

        {/* Travel Instructions */}
        <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-200 pt-4 space-y-1">
          <div className="font-bold text-slate-700 uppercase">Important Travel Instructions:</div>
          <p>1. One of the passengers booked on this Electronic Reservation Slip (ERS) is required to present valid Original Identity Proof (Aadhaar Card, Voter ID, Passport, Driving License) during ticket verification by the Ticket Examiner (TTE).</p>
          <p>2. E-ticket cancellations are governed by Railway Refund Rules and can be submitted online up to 4 hours before scheduled departure.</p>
          <p>3. This ticket was booked via RailBook AI smart reservation platform.</p>
        </div>
      </div>
    </div>
  );
};
