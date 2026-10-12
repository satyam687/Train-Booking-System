import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mlApi } from '../api/mlApi';
import { trainsApi } from '../api/trainsApi';
import { useToast } from '../context/ToastContext';
import {
  Sparkles,
  Zap,
  TrendingDown,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Calendar,
  MapPin,
  Train,
  HelpCircle
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const AiRecommendationsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [stations, setStations] = useState([]);
  const [source, setSource] = useState('NDLS');
  const [destination, setDestination] = useState('MMCT');
  const [priority, setPriority] = useState('balanced');
  const [departurePref, setDeparturePref] = useState('any');

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    trainsApi.getStations().then((res) => {
      setStations(res.data.results || res.data || []);
    }).catch(() => {});
    // Initial fetch
    handleGetRecommendations();
  }, []);

  const handleGetRecommendations = () => {
    setLoading(true);
    setSearched(true);
    mlApi
      .getRecommendations({
        source,
        destination,
        priority,
        departure_preference: departurePref,
      })
      .then((res) => {
        setRecommendations(res.data.recommendations || []);
      })
      .catch((err) => {
        toast.error('Failed to compute AI train recommendations.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0f2444] via-[#163560] to-[#0f2444] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-700">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-xs font-bold text-orange-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Attribute Decision Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Intelligent Train Recommendations
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Our machine learning scoring algorithm balances ticket price, travel duration,
            historical on-time status, and seat confirmation chances to rank the best trains for your journey.
          </p>
        </div>
      </div>

      {/* Control Panel: Route & Preferences */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Origin */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Origin Station
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {stations.map((s) => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
              {stations.length === 0 && (
                <>
                  <option value="NDLS">New Delhi (NDLS)</option>
                  <option value="MMCT">Mumbai Central (MMCT)</option>
                </>
              )}
            </select>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Destination Station
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {stations.map((s) => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
              {stations.length === 0 && (
                <>
                  <option value="MMCT">Mumbai Central (MMCT)</option>
                  <option value="NDLS">New Delhi (NDLS)</option>
                </>
              )}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              AI Optimization Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="balanced">Balanced (Overall Best Value)</option>
              <option value="cheapest">Cheapest Fares First</option>
              <option value="fastest">Fastest Travel Duration</option>
              <option value="timing">Preferred Timing Window</option>
            </select>
          </div>

          {/* Departure Preference */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Time Window
            </label>
            <select
              value={departurePref}
              onChange={(e) => setDeparturePref(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="any">Any Departure Time</option>
              <option value="morning">Morning (06:00 - 12:00)</option>
              <option value="afternoon">Afternoon (12:00 - 18:00)</option>
              <option value="evening">Evening (18:00 - 24:00)</option>
              <option value="night">Night (00:00 - 06:00)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Evaluating Scoring Models...' : 'Calculate AI Recommendations'}</span>
        </button>
      </div>

      {/* Recommendations Results List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Ranked AI Recommendations</span>
          <span className="text-xs text-slate-400 font-normal">
            (Optimized for: <strong className="text-blue-900 uppercase">{priority}</strong>)
          </span>
        </h2>

        {loading ? (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><LoadingSkeleton lines={4} /></div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><LoadingSkeleton lines={4} /></div>
          </div>
        ) : recommendations.length === 0 && searched ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs text-slate-500">No trains matched this route configuration.</p>
          </div>
        ) : (
          recommendations.map((rec, idx) => {
            const t = rec.train_data;
            const hours = Math.floor(t.duration_minutes / 60);
            const mins = t.duration_minutes % 60;

            return (
              <div
                key={t.id || idx}
                className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-sm transition space-y-5 ${
                  rec.ai_rank === 1
                    ? 'border-orange-300 ring-2 ring-orange-500/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Rank Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#0f2444] text-white font-extrabold text-xs flex items-center justify-center">
                      #{rec.ai_rank}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-blue-900 uppercase">#{t.train_number}</div>
                      <h3 className="font-extrabold text-slate-900 text-base">{t.train_name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={rec.ai_rank === 1 ? 'accent' : 'primary'} size="lg">
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-orange-500" />
                      {rec.badge} • AI Score: {rec.ai_score}/100
                    </Badge>
                  </div>
                </div>

                {/* Sub Scores Bar */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-[11px] text-slate-600">
                  <div>Fare Value: <strong className="text-slate-900">{rec.fare_score}%</strong></div>
                  <div>Speed Index: <strong className="text-slate-900">{rec.speed_score}%</strong></div>
                  <div>Seat Odds: <strong className="text-slate-900">{rec.availability_score}%</strong></div>
                </div>

                {/* Route timing bar */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="text-lg font-black text-slate-900">{t.departure_time}</div>
                    <div className="font-semibold text-slate-700">{t.source} ({t.source_code})</div>
                  </div>

                  <div className="text-center text-slate-400">
                    <Clock className="w-3.5 h-3.5 mx-auto mb-0.5" />
                    <span>{hours}h {mins}m</span>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">{t.arrival_time}</div>
                    <div className="font-semibold text-slate-700">{t.destination} ({t.destination_code})</div>
                  </div>
                </div>

                {/* Recommendation Reasons */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {rec.reasons?.map((reason, rIdx) => (
                    <span
                      key={rIdx}
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {reason}
                    </span>
                  ))}
                </div>

                {/* Footer action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Starting Fare</span>
                    <span className="text-xl font-black text-slate-900">₹{Math.round(t.min_fare)}</span>
                  </div>

                  <button
                    onClick={() => navigate(`/booking/new?train_id=${t.id}&class=3A`)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-500 hover:bg-orange-600 text-white shadow transition cursor-pointer"
                  >
                    Book AI Picked Seat
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
