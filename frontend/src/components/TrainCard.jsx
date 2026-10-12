import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  Radio,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Calendar,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Wifi,
  Utensils,
  Zap,
  Wind,
  Gauge
} from 'lucide-react';
import { Badge } from './Badge';
import { SeatClassSelector } from './SeatClassSelector';
import { FareVerificationBadge, formatRelativeTime } from './FareVerificationBadge';
import { getTrainImageUrl, getTrainTypeBadge, getTrainAmenities } from '../utils/trainImageHelper';

export const TrainCard = ({
  train,
  journeyDate,
  passengerCount = 1,
  aiRecommendation = null,
  onSelectBooking,
}) => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState(
    train.classes && train.classes.length > 0 ? train.classes[0] : null
  );
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [imageError, setImageError] = useState(false);

  const durationHours = Math.floor(train.duration_minutes / 60);
  const durationMins = train.duration_minutes % 60;

  const liveStatus = train.live_status;
  const isDelayed = liveStatus && liveStatus.delay_minutes > 0;

  const numPax = Math.max(1, Number(passengerCount) || 1);

  // External authentic fare data from backend
  const fareInfo = train.fare_info;
  const isVerifiedFare = Boolean(fareInfo && fareInfo.is_verified && fareInfo.verified_fare);
  const verifiedFare = fareInfo?.verified_fare;

  // Benchmark fallback / demo calculation
  const currentFarePerPax = selectedClass ? Number(selectedClass.base_fare || 0) : Number(train.classes?.[0]?.base_fare || 500);
  
  // Official IRCTC Surcharges for benchmark preview
  const sfCharge = selectedClass?.superfast_charge ?? (['1A', '2A', '3A', 'CC', 'EC'].includes(selectedClass?.class_code) ? 45 : 30);
  const resFee = selectedClass?.reservation_charge ?? ({ '1A': 60, 'EC': 60, '2A': 50, '3A': 40, 'CC': 40, 'SL': 20, '2S': 15 }[selectedClass?.class_code] || 30);
  const gst = selectedClass?.gst_amount ?? (['1A', '2A', '3A', 'CC', 'EC'].includes(selectedClass?.class_code) ? Math.round(currentFarePerPax * 0.05) : 0);
  const demoTotalWithTaxesPerPax = currentFarePerPax + sfCharge + resFee + gst;
  const demoGrandTotal = demoTotalWithTaxesPerPax * numPax;

  // Final payable price
  const displayTotal = isVerifiedFare
    ? Math.round(Number(verifiedFare.total_fare) * numPax)
    : Math.round(demoGrandTotal);

  const trainBadge = getTrainTypeBadge(train);
  const amenities = getTrainAmenities(train);
  const imageUrl = imageError ? '/images/trains/vande-bharat.jpg' : getTrainImageUrl(train);

  const handleBookClick = () => {
    if (onSelectBooking) {
      onSelectBooking(train, selectedClass);
    } else {
      const scheduleId = train.schedule?.id || 1;
      navigate(
        `/booking/new?train_id=${train.id}&schedule_id=${scheduleId}&class=${selectedClass?.class_code || '3A'}&date=${journeyDate || ''}&passengers=${numPax}&expected_fare=${displayTotal}`
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col md:flex-row">
      {/* Train Photo & Amenities Column */}
      <div className="md:w-64 lg:w-72 shrink-0 flex flex-col bg-slate-900 relative">
        <div className="relative h-44 md:h-52 overflow-hidden group">
          <img
            src={imageUrl}
            alt={train.train_name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/40" />

          {/* Train Number & Type Pill */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            <span className="font-extrabold text-white text-xs bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
              #{train.train_number}
            </span>
            <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-gradient-to-r ${trainBadge.gradient} shadow-sm`}>
              {trainBadge.tag}
            </span>
          </div>

          {/* Speed & Live Status Overlays */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 text-[11px] text-white">
            <span className="inline-flex items-center gap-1 font-semibold bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-amber-300">
              <Gauge className="w-3 h-3" />
              <span>{trainBadge.speed}</span>
            </span>

            {liveStatus && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  isDelayed
                    ? 'bg-amber-500/90 text-white'
                    : 'bg-emerald-600/90 text-white'
                }`}
              >
                <Radio className="w-2.5 h-2.5 shrink-0" />
                {isDelayed ? `${liveStatus.delay_minutes}m Late` : 'On Time'}
              </span>
            )}
          </div>
        </div>

        {/* Train Facilities / Amenities row */}
        <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex-1 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Onboard Facilities:</span>
              <span className="text-slate-500">{trainBadge.label.split(' ')[0]}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-200 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60 font-medium"
                >
                  {item.id === 'wifi' && <Wifi className="w-2.5 h-2.5 text-blue-400" />}
                  {item.id === 'food' && <Utensils className="w-2.5 h-2.5 text-orange-400" />}
                  {item.id === 'ac' && <Wind className="w-2.5 h-2.5 text-cyan-400" />}
                  {item.id === 'power' && <Zap className="w-2.5 h-2.5 text-amber-400" />}
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Route:</span>
            <span className="font-bold text-slate-200">
              {train.source_station?.code} ➔ {train.destination_station?.code}
            </span>
          </div>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="flex-1 flex flex-col justify-between p-5 sm:p-6">
        <div>
          {/* Top Header: Train Name, Running Days, AI Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">{train.train_name}</h3>
              {train.running_days && (
                <span className="hidden sm:inline-flex text-[11px] text-slate-500 font-medium">
                  Runs: {train.running_days.join(', ')}
                </span>
              )}
            </div>

            {aiRecommendation && (
              <Badge variant="accent" size="sm" className="font-bold shadow-xs">
                <Sparkles className="w-3 h-3 mr-1 text-orange-500" />
                {aiRecommendation.badge || 'AI Recommended'} ({aiRecommendation.ai_score}%)
              </Badge>
            )}
          </div>

          {/* Journey Timeline */}
          <div className="flex items-center justify-between gap-4 mb-5">
            {/* Departure */}
            <div className="min-w-[90px]">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {train.departure_time ? String(train.departure_time).substring(0, 5) : '06:00'}
              </div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {train.source_station?.code || 'SRC'}
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[140px]">
                {train.source_station?.name}
              </div>
            </div>

            {/* Journey Duration Bar */}
            <div className="flex-1 flex flex-col items-center px-3">
              <span className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {durationHours}h {durationMins > 0 ? `${durationMins}m` : ''}
              </span>
              <div className="w-full relative flex items-center">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-1" />
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                Direct / Express Corridor
              </span>
            </div>

            {/* Arrival */}
            <div className="min-w-[90px] text-right">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {train.arrival_time ? String(train.arrival_time).substring(0, 5) : '14:00'}
              </div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {train.destination_station?.code || 'DST'}
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[140px]">
                {train.destination_station?.name}
              </div>
            </div>
          </div>

          {/* AI Reasons list if present */}
          {aiRecommendation && aiRecommendation.reasons && (
            <div className="mb-4 bg-orange-50/60 border border-orange-100 rounded-xl p-3 flex flex-wrap gap-2 text-xs text-orange-950 font-medium">
              <span className="font-bold text-orange-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Why AI Picked:
              </span>
              {aiRecommendation.reasons.map((r, idx) => (
                <span key={idx} className="bg-white/90 px-2 py-0.5 rounded-md border border-orange-200">
                  {r}
                </span>
              ))}
            </div>
          )}

          {/* Travel Classes Selector */}
          <div className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span>Select Class ({selectedClass?.class_code} Selected):</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFareBreakdown(!showFareBreakdown)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Info className="w-3 h-3" />
                <span>{showFareBreakdown ? 'Hide Fare Details' : 'View Fare Breakdown'}</span>
                {showFareBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <SeatClassSelector
              classes={train.classes}
              inventories={train.schedule?.seat_inventories || []}
              selectedClass={selectedClass?.class_code}
              isVerified={isVerifiedFare}
              onSelectClass={(cls) => setSelectedClass(cls)}
            />

            {/* Expandable Fare Breakdown Box */}
            {showFareBreakdown && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-in fade-in">
                {isVerifiedFare ? (
                  <>
                    <div className="font-bold text-slate-900 flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span>Verified Official Railway Fare ({selectedClass?.class_code} - {selectedClass?.class_name})</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        Verified via {verifiedFare.source || 'Authorized Provider'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                      <div>Base Distance Fare: <strong className="text-slate-900 block font-bold">₹{Math.round(verifiedFare.base_fare)}</strong></div>
                      <div>Superfast Charge: <strong className="text-slate-900 block font-bold">₹{Math.round(verifiedFare.superfast_charge)}</strong></div>
                      <div>Reservation Fee: <strong className="text-slate-900 block font-bold">₹{Math.round(verifiedFare.reservation_charge)}</strong></div>
                      <div>GST (AC): <strong className="text-slate-900 block font-bold">₹{Math.round(verifiedFare.gst_amount)}</strong></div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-800 font-bold">
                      <span>Single Passenger Total: ₹{Math.round(verifiedFare.total_fare)}</span>
                      {numPax > 1 && (
                        <span className="text-blue-900">Total for {numPax} Passengers: ₹{Math.round(Number(verifiedFare.total_fare) * numPax)}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Quote ID: {verifiedFare.provider_quote_id || 'IRCTC-SYNC-PASS'} • Last Verified: {formatRelativeTime(verifiedFare.retrieval_timestamp)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-slate-900 flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span>Benchmark Fare Estimate ({selectedClass?.class_code} - {selectedClass?.class_name})</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                        Unverified Demo Benchmark
                      </span>
                    </div>
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 mb-2">
                      <strong>Notice:</strong> Authentic live railway fare is unavailable because an authorized fare provider is not configured. The values below are synthetic development benchmarks and are never presented as real pricing.
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                      <div>Estimated Base: <strong className="text-slate-900 block font-bold">₹{Math.round(currentFarePerPax)}</strong></div>
                      <div>Superfast Charge: <strong className="text-slate-900 block font-bold">₹{sfCharge}</strong></div>
                      <div>Reservation Fee: <strong className="text-slate-900 block font-bold">₹{resFee}</strong></div>
                      <div>GST: <strong className="text-slate-900 block font-bold">₹{gst}</strong></div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-800 font-bold">
                      <span>Single Passenger Demo Total: ₹{Math.round(demoTotalWithTaxesPerPax)}</span>
                      {numPax > 1 && (
                        <span className="text-blue-900">Total for {numPax} Passengers: ₹{Math.round(demoGrandTotal)}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <Link
            to={`/trains/${train.id}?date=${journeyDate || ''}`}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
          >
            <span>View Route & Halts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            {isVerifiedFare ? (
              <div className="text-right">
                <div className="flex items-baseline gap-1.5 justify-end">
                  <span className="text-2xl font-black text-slate-900">
                    ₹{displayTotal.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {numPax > 1 ? `for ${numPax} pax` : '/ person'}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-700 font-bold mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Indian Railways Fare</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Last verified: {formatRelativeTime(fareInfo.retrieval_timestamp)}
                </span>
              </div>
            ) : (
              <div className="text-right max-w-xs space-y-1">
                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded">
                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Fare unavailable — connect an authorized fare provider.</span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                  <span className="bg-slate-100 text-slate-600 px-1 rounded font-bold">DEMO</span>
                  <span>Estimated ₹{displayTotal.toLocaleString()} (Unverified)</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBookClick}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Book Ticket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
