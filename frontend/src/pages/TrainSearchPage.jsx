import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainsApi } from '../api/trainsApi';
import {
  Train,
  MapPin,
  Calendar,
  Users,
  Search,
  ArrowRight,
  Filter,
  Sparkles
} from 'lucide-react';

export const TrainSearchPage = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [source, setSource] = useState('NDLS');
  const [destination, setDestination] = useState('MMCT');
  const [journeyDate, setJourneyDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [travelClass, setTravelClass] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    trainsApi.getStations().then((res) => {
      setStations(res.data.results || res.data || []);
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      source,
      destination,
      date: journeyDate,
      passengers: String(passengers),
    });
    if (travelClass) params.append('travel_class', travelClass);
    if (availableOnly) params.append('available_only', 'true');
    navigate(`/results?${params.toString()}`);
  };

  const setDateOffset = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setJourneyDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Find & Book Train Tickets
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Search over 30+ express and superfast routes with real-time seat availability and AI fare insights.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Station Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Origin Station
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-blue-600 absolute left-3.5 top-3" />
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  {stations.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code}) - {s.city}
                    </option>
                  ))}
                  {stations.length === 0 && (
                    <>
                      <option value="NDLS">New Delhi (NDLS)</option>
                      <option value="MMCT">Mumbai Central (MMCT)</option>
                      <option value="BSB">Varanasi (BSB)</option>
                      <option value="SBC">Bengaluru (SBC)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Destination Station
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 text-orange-500 absolute left-3.5 top-3" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  {stations.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code}) - {s.city}
                    </option>
                  ))}
                  {stations.length === 0 && (
                    <>
                      <option value="MMCT">Mumbai Central (MMCT)</option>
                      <option value="NDLS">New Delhi (NDLS)</option>
                      <option value="BSB">Varanasi (BSB)</option>
                      <option value="SBC">Bengaluru (SBC)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Date Selection with quick chips */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Journey Date
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              {/* Date quick chips */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDateOffset(0)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDateOffset(1)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setDateOffset(2)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  +2 Days
                </button>
              </div>
            </div>
          </div>

          {/* Class and Passengers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Travel Class
              </label>
              <select
                value={travelClass}
                onChange={(e) => setTravelClass(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All Travel Classes</option>
                <option value="1A">AC First Class (1A)</option>
                <option value="2A">AC 2 Tier (2A)</option>
                <option value="3A">AC 3 Tier (3A)</option>
                <option value="SL">Sleeper Class (SL)</option>
                <option value="CC">AC Chair Car (CC)</option>
                <option value="EC">Executive Chair Car (EC)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Passengers Count
              </label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} Passenger{n > 1 ? 's' : ''} (Max 6)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkbox option */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="availOnly"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="availOnly" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Show only trains with confirmed seat availability
            </label>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl font-bold text-base bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            <span>Search Available Trains</span>
          </button>
        </form>
      </div>
    </div>
  );
};
