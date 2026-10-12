import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { trainsApi } from '../api/trainsApi';
import { bookingsApi } from '../api/bookingsApi';
import {
  Train,
  User,
  Users,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  LogIn,
  CheckCircle2
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { FareVerificationBadge, formatRelativeTime } from '../components/FareVerificationBadge';
import { getTrainImageUrl } from '../utils/trainImageHelper';

export const PassengerBookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuth();
  const toast = useToast();

  const trainId = searchParams.get('train_id') || '1';
  const classCode = searchParams.get('class') || '3A';
  const journeyDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [train, setTrain] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [selectedClassObj, setSelectedClassObj] = useState(null);
  const [fareQuote, setFareQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Quick login modal state if unauthenticated
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [demoLoginLoading, setDemoLoginLoading] = useState(false);

  // Passenger state
  const [passengers, setPassengers] = useState([
    { full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '', age: 28, gender: 'M', berth_preference: 'No Preference' }
  ]);

  useEffect(() => {
    trainsApi
      .getTrainDetail(trainId)
      .then((res) => {
        const t = res.data;
        setTrain(t);
        const cls = t.classes?.find((c) => c.class_code === classCode) || t.classes?.[0];
        setSelectedClassObj(cls);

        // Fetch or create schedule for this date
        return trainsApi.searchTrains({
          source: t.source_station_detail?.code,
          destination: t.destination_station_detail?.code,
          date: journeyDate,
        });
      })
      .then((searchRes) => {
        const found = searchRes?.data?.results?.find((item) => String(item.id) === String(trainId));
        if (found && found.schedule) {
          setSchedule(found.schedule);
        }
      })
      .catch((err) => {
        toast.error('Could not load train schedule for booking.');
      })
      .finally(() => setLoading(false));
  }, [trainId, classCode, journeyDate]);

  const handleAddPassenger = () => {
    if (passengers.length >= 6) {
      toast.warning('Maximum 6 passengers allowed per booking.');
      return;
    }
    setPassengers([
      ...passengers,
      { full_name: '', age: 25, gender: 'M', berth_preference: 'No Preference' }
    ]);
  };

  const handleRemovePassenger = (index) => {
    if (passengers.length <= 1) {
      toast.warning('At least 1 passenger is required.');
      return;
    }
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleQuickDemoLogin = async () => {
    setDemoLoginLoading(true);
    try {
      await login('passenger', 'pass123');
      toast.success('Signed in as demo passenger Rahul Sharma!');
      setShowLoginModal(false);
    } catch (e) {
      toast.error('Quick login failed.');
    } finally {
      setDemoLoginLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Validation
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].full_name.trim()) {
        toast.error(`Please enter full name for Passenger ${i + 1}`);
        return;
      }
      if (passengers[i].age < 1 || passengers[i].age > 120) {
        toast.error(`Please enter valid age for Passenger ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const scheduleId = schedule?.id || 1;
      const payload = {
        schedule_id: scheduleId,
        class_code: selectedClassObj?.class_code || classCode,
        expected_fare: totalAmount,
        passengers: passengers.map((p) => ({
          full_name: p.full_name.trim(),
          age: Number(p.age),
          gender: p.gender,
          berth_preference: p.berth_preference,
        })),
      };

      const res = await bookingsApi.createBooking(payload);
      const booking = res.data;
      toast.success(`Booking ${booking.booking_reference} created! Proceed to payment.`);
      navigate(`/payment/${booking.booking_reference}`);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.reason === 'FARE_CHANGED') {
        toast.warning(err.response?.data?.detail || 'Fare has changed. Please review the updated fare.');
        if (train) {
          trainsApi.getFare({
            train_number: train.train_number,
            source: train.source_station_detail?.code,
            destination: train.destination_station_detail?.code,
            date: journeyDate,
            travel_class: selectedClassObj?.class_code || classCode,
            passengers: passengers.length,
          }).then((r) => setFareQuote(r.data)).catch(() => {});
        }
      } else {
        const detail = err.response?.data?.detail || 'Booking creation failed. Please check inventory.';
        toast.error(detail);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  const isVerifiedFare = Boolean(fareQuote && fareQuote.is_verified && fareQuote.verified_fare);
  const verifiedFare = fareQuote?.verified_fare;

  const baseFare = isVerifiedFare
    ? Number(verifiedFare.base_fare)
    : (selectedClassObj ? Number(selectedClassObj.base_fare) : 1000);
  const subtotal = baseFare * passengers.length;
  const serviceFee = isVerifiedFare
    ? ((Number(verifiedFare.reservation_charge) + Number(verifiedFare.superfast_charge) + Number(verifiedFare.gst_amount))) * passengers.length
    : 25.00;
  const totalAmount = isVerifiedFare
    ? (Number(verifiedFare.total_fare) * passengers.length)
    : (subtotal + serviceFee);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Passenger Details & Reservation
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Enter passenger names and ID details for your confirmed e-ticket.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Passenger Information Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            {passengers.map((p, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Passenger {index + 1}
                    </h3>
                  </div>

                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePassenger(index)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                      title="Remove Passenger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Name */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Full Name (As per Govt ID)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={p.full_name}
                      onChange={(e) => handlePassengerChange(index, 'full_name', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* Age */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={p.age}
                      onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* Gender */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Gender
                    </label>
                    <select
                      value={p.gender}
                      onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>

                  {/* Berth Preference */}
                  <div className="sm:col-span-12">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Berth Preference
                    </label>
                    <select
                      value={p.berth_preference}
                      onChange={(e) => handlePassengerChange(index, 'berth_preference', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="No Preference">No Preference</option>
                      <option value="Lower">Lower Berth</option>
                      <option value="Middle">Middle Berth</option>
                      <option value="Upper">Upper Berth</option>
                      <option value="Side Lower">Side Lower</option>
                      <option value="Window Seat">Window Seat (CC/2S)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Passenger Button */}
            {passengers.length < 6 && (
              <button
                type="button"
                onClick={handleAddPassenger}
                className="w-full py-3.5 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Passenger (+1)</span>
              </button>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl font-bold text-base bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Reserving Seats Safely...' : `Proceed to Payment • ₹${Math.round(totalAmount)}`}
            </button>
          </form>
        </div>

        {/* Fare Summary & Trip Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 flex items-center gap-2">
              <Train className="w-4 h-4 text-blue-600" />
              <span>Trip Summary</span>
            </h3>

            {train && (
              <div className="relative h-28 rounded-2xl overflow-hidden bg-slate-900">
                <img
                  src={train.image_url || train.display_image_url || getTrainImageUrl(train)}
                  alt={train.train_name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/images/trains/vande-bharat.jpg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px]">
                  <span className="font-extrabold bg-blue-600/90 px-2 py-0.5 rounded shadow">
                    #{train.train_number}
                  </span>
                  <span className="font-bold text-amber-300 drop-shadow">
                    {train.source_station_detail?.code} ➔ {train.destination_station_detail?.code}
                  </span>
                </div>
              </div>
            )}

            <div>
              <div className="font-bold text-slate-900 text-sm">{train?.train_name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {train?.source_station_detail?.name} to {train?.destination_station_detail?.name}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Class:</span>
                <strong className="text-slate-900 font-bold">{selectedClassObj?.class_name} ({selectedClassObj?.class_code})</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date:</span>
                <strong className="text-slate-900 font-bold">{journeyDate}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Passengers:</span>
                <strong className="text-slate-900 font-bold">{passengers.length} Person(s)</strong>
              </div>
            </div>

            {/* Fare Status and Price Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="mb-2">
                <FareVerificationBadge fareInfo={fareQuote} />
              </div>

              {isVerifiedFare ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Base Distance Fare ({passengers.length} × ₹{Math.round(baseFare)}):</span>
                    <span>₹{Math.round(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Superfast, Res Fee & Taxes:</span>
                    <span>₹{Math.round(serviceFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                    <span>Total Authentic Fare:</span>
                    <span className="text-orange-600 text-base">₹{Math.round(totalAmount)}</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold pt-1">
                    ✓ Verified via {verifiedFare.source || 'Authorized Provider'} • Last verified {formatRelativeTime(verifiedFare.retrieval_timestamp)}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Demo Base ({passengers.length} × ₹{Math.round(baseFare)}):</span>
                    <span>₹{Math.round(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Benchmark Service & Taxes:</span>
                    <span>₹{Math.round(serviceFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                    <span>Demo Payable Total:</span>
                    <span className="text-orange-600 text-base">₹{Math.round(totalAmount)}</span>
                  </div>
                  <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                    <strong>Unverified demo benchmark.</strong> Connect an authorized railway fare provider in backend environment for live pricing.
                  </div>
                </>
              )}
            </div>

            {/* Requirement 12: Clear Reservation Disclaimer */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Sandbox Reservation Engine</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Notice: Reservation is created in demonstration sandbox mode. Official government CRIS/IRCTC confirmed PNRs require connection to an authorized railway ticketing gateway.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Login Modal if not logged in */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-xl text-slate-900">Login Required to Book</h3>
              <p className="text-xs text-slate-500">
                RailBook AI requires passenger authentication to generate certified e-tickets.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={demoLoginLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{demoLoginLoading ? 'Signing in...' : 'Sign In as Demo Passenger (1-Click)'}</span>
              </button>

              <Link
                to="/login"
                className="block text-center w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
              >
                Sign In with Other Account
              </Link>
            </div>

            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
