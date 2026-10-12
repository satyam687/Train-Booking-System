import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { trainsApi } from '../api/trainsApi';
import { TrainCard } from '../components/TrainCard';
import { TrainCardSkeleton } from '../components/LoadingSkeleton';
import {
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';

export const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const source = searchParams.get('source') || 'NDLS';
  const destination = searchParams.get('destination') || 'MMCT';
  const journeyDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const travelClass = searchParams.get('travel_class') || '';
  const passengers = searchParams.get('passengers') || '1';

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and sorting states
  const [selectedPeriod, setSelectedPeriod] = useState(searchParams.get('departure_period') || '');
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('available_only') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'departure_asc');

  useEffect(() => {
    fetchTrains();
  }, [searchParams]);

  const fetchTrains = () => {
    setLoading(true);
    setError(null);

    const query = {
      source,
      destination,
      date: journeyDate,
      passengers,
      sort_by: sortBy,
    };
    if (travelClass) query.travel_class = travelClass;
    if (selectedPeriod) query.departure_period = selectedPeriod;
    if (availableOnly) query.available_only = 'true';

    trainsApi
      .searchTrains(query)
      .then((res) => {
        setTrains(res.data.results || []);
      })
      .catch((err) => {
        setError('Failed to fetch train search results. Please verify your connection.');
      })
      .finally(() => setLoading(false));
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handlePeriodChange = (period) => {
    const val = selectedPeriod === period ? '' : period;
    setSelectedPeriod(val);
    updateParam('departure_period', val);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    updateParam('sort_by', newSort);
  };

  const handleDateShift = (days) => {
    const d = new Date(journeyDate);
    d.setDate(d.getDate() + days);
    const nextDate = d.toISOString().split('T')[0];
    updateParam('date', nextDate);
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Route Search</span>
            <span>•</span>
            <span>{passengers} Passenger(s)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>{source}</span>
            <span className="text-slate-400 font-normal">→</span>
            <span>{destination}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Journey Date: {journeyDate}</span>
          </p>
        </div>

        {/* Date Stepper */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => handleDateShift(-1)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white text-slate-700 transition"
          >
            ← Previous Day
          </button>
          <span className="text-xs font-bold px-2 text-blue-900">{journeyDate}</span>
          <button
            onClick={() => handleDateShift(1)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white text-slate-700 transition"
          >
            Next Day →
          </button>
        </div>
      </div>

      {/* Main Content Layout: Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filters</span>
            </h3>
            <button
              onClick={() => {
                setSelectedPeriod('');
                setAvailableOnly(false);
                setSortBy('departure_asc');
                setSearchParams(new URLSearchParams({ source, destination, date: journeyDate, passengers }));
              }}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="departure_asc">Departure Time (Earliest First)</option>
              <option value="fare_asc">Lowest Fare</option>
              <option value="fare_desc">Highest Fare</option>
              <option value="duration_asc">Shortest Duration (Fastest)</option>
            </select>
          </div>

          {/* Departure Period Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Departure Time
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'morning', label: 'Morning (06:00 - 12:00)' },
                { id: 'afternoon', label: 'Afternoon (12:00 - 18:00)' },
                { id: 'evening', label: 'Evening (18:00 - 24:00)' },
                { id: 'early_morning', label: 'Night (00:00 - 06:00)' },
              ].map((p) => {
                const active = selectedPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePeriodChange(p.id)}
                    className={`p-2 rounded-xl text-left font-medium border transition ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => {
                  setAvailableOnly(e.target.checked);
                  updateParam('available_only', e.target.checked ? 'true' : '');
                }}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-800">Available Seats Only</span>
            </label>
          </div>
        </div>

        {/* Results List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
            <span>Showing <strong className="text-slate-900">{trains.length}</strong> available trains</span>
            <div className="flex items-center gap-1.5">
              {trains.some((t) => t.fare_info?.is_verified) ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authorized Railway Fare Integration Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Fare provider unconfigured — displaying labeled demo benchmarks</span>
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <TrainCardSkeleton />
              <TrainCardSkeleton />
              <TrainCardSkeleton />
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-900">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="font-bold">{error}</p>
              <button
                onClick={fetchTrains}
                className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          ) : trains.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">No Trains Found for this Route</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No direct trains matched your specific date or filters ({source} to {destination}).
                Try searching nearby dates or clearing class filters.
              </p>
              <button
                onClick={() => {
                  setSearchParams(new URLSearchParams({ source: 'NDLS', destination: 'MMCT', date: journeyDate, passengers: '1' }));
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                Search Popular Corridor (NDLS - MMCT)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {trains.map((train) => (
                <TrainCard
                  key={train.id}
                  train={train}
                  journeyDate={journeyDate}
                  passengerCount={passengers}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
