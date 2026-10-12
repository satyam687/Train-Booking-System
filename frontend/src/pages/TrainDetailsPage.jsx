import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { trainsApi } from '../api/trainsApi';
import { Badge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { FareVerificationBadge, formatRelativeTime } from '../components/FareVerificationBadge';
import {
  Train,
  Clock,
  MapPin,
  Calendar,
  Radio,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Wifi,
  Utensils,
  Wind,
  Zap
} from 'lucide-react';
import { getTrainImageUrl, getTrainTypeBadge, getTrainAmenities } from '../utils/trainImageHelper';

export const TrainDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const journeyDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [train, setTrain] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [fareInfo, setFareInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      trainsApi.getTrainDetail(id),
      trainsApi.getLiveStatus(id, journeyDate).catch(() => ({ data: null })),
    ])
      .then(([trainRes, statusRes]) => {
        const trainData = trainRes.data;
        setTrain(trainData);
        if (statusRes && statusRes.data) {
          setLiveStatus(statusRes.data);
        }

        // Fetch authentic railway fare inquiry
        return trainsApi.getFare({
          train_number: trainData.train_number,
          source: trainData.source_station_detail?.code,
          destination: trainData.destination_station_detail?.code,
          date: journeyDate,
          travel_class: trainData.classes?.[0]?.class_code || '3A',
        }).then((fRes) => {
          setFareInfo(fRes.data);
        }).catch(() => {});
      })
      .catch((err) => {
        setError('Train details could not be retrieved.');
      })
      .finally(() => setLoading(false));
  }, [id, journeyDate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200">
          <LoadingSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (error || !train) {
    return (
      <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Train Not Found</h2>
        <p className="text-sm text-slate-600">{error || 'Could not locate train record.'}</p>
        <Link to="/search" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Back to Search
        </Link>
      </div>
    );
  }

  const durationHours = Math.floor(train.duration_minutes / 60);
  const durationMins = train.duration_minutes % 60;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Results
        </button>
        <Link
          to={`/booking/new?train_id=${train.id}&date=${journeyDate}`}
          className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
        >
          Book This Train
        </Link>
      </div>

      {/* Main Train Hero Card with Panoramic Image */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm space-y-6">
        {/* Panoramic Train Image Banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950">
          <img
            src={train.image_url || train.display_image_url || getTrainImageUrl(train)}
            alt={train.train_name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/images/trains/vande-bharat.jpg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />

          {/* Banner Overlays */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-3 py-1 rounded-lg bg-blue-600 text-white shadow">
                #{train.train_number}
              </span>
              <span className={`text-xs font-bold text-white px-3 py-1 rounded-lg bg-gradient-to-r ${getTrainTypeBadge(train).gradient} shadow`}>
                {getTrainTypeBadge(train).label}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 font-bold text-xs bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-amber-300 border border-white/10">
              <Gauge className="w-3.5 h-3.5" />
              <span>Max Speed: {getTrainTypeBadge(train).speed}</span>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4 text-white">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-1">
                Indian Railways Express
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                {train.train_name}
              </h1>
            </div>

            {liveStatus && (
              <div className="bg-slate-900/90 backdrop-blur-md border border-white/15 px-4 py-2 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white">
                    {liveStatus.running_status === 'ON_TIME' ? 'Running On Time' : `Delay: ${liveStatus.delay_minutes} mins`}
                  </div>
                  <div className="text-slate-400 text-[11px]">Location: {liveStatus.current_location || 'En Route'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Onboard Amenities Bar */}
        <div className="px-6 sm:px-8 pt-2 pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Features:</span>
            <div className="flex flex-wrap gap-2">
              {getTrainAmenities(train).map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700"
                >
                  {a.id === 'wifi' && <Wifi className="w-3 h-3 text-blue-600" />}
                  {a.id === 'food' && <Utensils className="w-3 h-3 text-orange-600" />}
                  {a.id === 'ac' && <Wind className="w-3 h-3 text-cyan-600" />}
                  {a.id === 'power' && <Zap className="w-3 h-3 text-amber-600" />}
                  <span>{a.label}</span>
                </span>
              ))}
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">Standard Rake Composition: LHB / Train-18</span>
        </div>

        <div className="p-6 sm:p-8 pt-0 space-y-6">

        {/* Route Timing Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-2">
          {/* Source */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departure</span>
            <div className="text-3xl font-black text-slate-900">{String(train.departure_time).substring(0, 5)}</div>
            <div className="font-bold text-slate-800">{train.source_station_detail?.name}</div>
            <div className="text-xs text-slate-500">{train.source_station_detail?.city}, {train.source_station_detail?.state}</div>
          </div>

          {/* Duration */}
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" /> {durationHours} Hours {durationMins} Mins
            </span>
            <div className="w-full flex items-center px-4">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2" />
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            </div>
            <span className="text-[11px] text-slate-400">Total Route Distance</span>
          </div>

          {/* Destination */}
          <div className="text-left md:text-right space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Arrival</span>
            <div className="text-3xl font-black text-slate-900">{String(train.arrival_time).substring(0, 5)}</div>
            <div className="font-bold text-slate-800">{train.destination_station_detail?.name}</div>
            <div className="text-xs text-slate-500">{train.destination_station_detail?.city}, {train.destination_station_detail?.state}</div>
          </div>
        </div>

        {/* Running Days */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Running Schedule:</span>
            <div className="flex gap-1">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => {
                const runs = train.running_days?.includes(day);
                return (
                  <span
                    key={day}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      runs ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="text-slate-500">
            Booking Available for Journey Date: <strong className="text-slate-800">{journeyDate}</strong>
          </div>
        </div>
      </div>

      {/* Classes & Real Fares Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Railway Fare Structure</h3>
            <p className="text-xs text-slate-500">Itemized passenger ticket fare with IRCTC superfast, reservation, and tax components</p>
          </div>
          <FareVerificationBadge fareInfo={fareInfo} />
        </div>

        {!fareInfo?.is_verified && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Fare unavailable — connect an authorized fare provider.</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Authentic Indian Railways fares require authorized API credentials configured in the backend environment. The figures below are unverified demonstration benchmarks and are never presented as authentic pricing.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {train.classes?.map((cls) => {
            const base = Number(cls.base_fare);
            const sf = cls.superfast_charge ?? (['1A', '2A', '3A', 'CC', 'EC'].includes(cls.class_code) ? 45 : 30);
            const res = cls.reservation_charge ?? ({ '1A': 60, 'EC': 60, '2A': 50, '3A': 40, 'CC': 40, 'SL': 20, '2S': 15 }[cls.class_code] || 30);
            const gst = cls.gst_amount ?? (['1A', '2A', '3A', 'CC', 'EC'].includes(cls.class_code) ? Math.round(base * 0.05) : 0);
            const total = cls.total_fare ? Number(cls.total_fare) : (base + sf + res + gst);

            return (
              <div key={cls.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded">{cls.class_code}</span>
                  <span className="text-xs text-slate-500 font-semibold">{cls.total_seats} Total Seats</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{cls.class_name}</div>

                <div className="pt-2 border-t border-slate-200 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Distance Fare:</span>
                    <strong className="text-slate-800">₹{Math.round(base)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Superfast Surcharge:</span>
                    <span>₹{sf}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reservation Fee:</span>
                    <span>₹{res}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5% AC):</span>
                    <span>₹{gst}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                    <span>Net Ticket Fare:</span>
                    <span className="text-orange-600 text-base">₹{Math.round(total)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* Intermediate Halts Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Intermediate Stations & Halts</h3>
        {train.intermediate_stations && train.intermediate_stations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Halt #</th>
                  <th className="p-3">Station Code</th>
                  <th className="p-3">Station Name</th>
                  <th className="p-3">Halt Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {train.intermediate_stations.map((stop, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-500">{i + 1}</td>
                    <td className="p-3 font-extrabold text-blue-800">{stop.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{stop.name}</td>
                    <td className="p-3 font-medium text-slate-600">{stop.halt_minutes || 3} mins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No intermediate commercial halts scheduled.</p>
        )}
      </div>
    </div>
  );
};
