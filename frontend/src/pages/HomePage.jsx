import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Train,
  Sparkles,
  ArrowRight,
  Calendar,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  TrendingUp,
  Radio,
  Search,
  Gauge,
  CheckCircle2
} from 'lucide-react';
import { trainsApi } from '../api/trainsApi';
import { Badge } from '../components/Badge';

export const HomePage = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [source, setSource] = useState('NDLS');
  const [destination, setDestination] = useState('MMCT');
  const [journeyDate, setJourneyDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [travelClass, setTravelClass] = useState('');
  const [passengers, setPassengers] = useState(1);

  useEffect(() => {
    trainsApi.getStations().then((res) => {
      setStations(res.data.results || res.data || []);
    }).catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      source,
      destination,
      date: journeyDate,
      passengers: String(passengers),
    });
    if (travelClass) params.append('travel_class', travelClass);
    navigate(`/results?${params.toString()}`);
  };

  const handleSwapStations = () => {
    setSource(destination);
    setDestination(source);
  };

  const popularRoutes = [
    {
      from: 'NDLS',
      fromCity: 'New Delhi',
      to: 'MMCT',
      toCity: 'Mumbai',
      time: '15h 35m',
      fare: '₹1,920',
      image: '/images/trains/rajdhani.jpg',
      badge: 'Rajdhani Express',
      speed: '130 km/h',
    },
    {
      from: 'NDLS',
      fromCity: 'New Delhi',
      to: 'BSB',
      toCity: 'Varanasi',
      time: '8h 00m',
      fare: '₹1,280',
      vandeBharat: true,
      image: '/images/trains/vande-bharat.jpg',
      badge: 'Vande Bharat',
      speed: '160 km/h',
    },
    {
      from: 'MMCT',
      fromCity: 'Mumbai',
      to: 'ADI',
      toCity: 'Ahmedabad',
      time: '5h 15m',
      fare: '₹1,280',
      vandeBharat: true,
      image: '/images/trains/tejas.jpg',
      badge: 'Tejas Superfast',
      speed: '130 km/h',
    },
    {
      from: 'SBC',
      fromCity: 'Bengaluru',
      to: 'MAS',
      toCity: 'Chennai',
      time: '4h 25m',
      fare: '₹980',
      image: '/images/trains/shatabdi.jpg',
      badge: 'Shatabdi Express',
      speed: '130 km/h',
    },
  ];

  const featuredTrains = [
    {
      name: 'Vande Bharat Express',
      subtitle: 'Semi High-Speed Flagship (160 km/h)',
      image: '/images/trains/vande-bharat.jpg',
      desc: 'Indigenous aerodynamic trainset featuring European-grade passenger comfort, automatic plug doors, and bio-vacuum toilets.',
      source: 'NDLS',
      destination: 'BSB',
    },
    {
      name: 'Mumbai Rajdhani Express',
      subtitle: 'Iconic Premier Overnight Link',
      image: '/images/trains/rajdhani.jpg',
      desc: 'Legendary Indian Railways superfast express connecting New Delhi & Mumbai with premier LHB AC sleeper coaches and complimentary meals.',
      source: 'NDLS',
      destination: 'MMCT',
    },
    {
      name: 'Tejas Superfast Express',
      subtitle: 'Modern Smart Coach Travel',
      image: '/images/trains/tejas.jpg',
      desc: 'High-speed air-conditioned chair car service equipped with modern onboard infotainment, smart sensors, and enhanced seating.',
      source: 'MMCT',
      destination: 'ADI',
    },
    {
      name: 'Dudhsagar Falls Express Corridor',
      subtitle: 'Scenic Western Ghats Railway',
      image: '/images/trains/dudhsagar.jpg',
      desc: 'Iconic Indian railway route traversing the historic arched viaduct bridge over the four-tiered cascading Dudhsagar waterfalls.',
      source: 'SBC',
      destination: 'MAS',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-[#0f2444] text-white p-6 sm:p-10 overflow-hidden shadow-2xl border border-slate-700/50">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Grid with Train Showcase Banner */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-8">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-orange-400 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Machine Learning Reservation Core</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
              Smart Railway Booking, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                Powered by RailBook AI
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base mb-4 leading-relaxed max-w-xl">
              Book confirmed seats with authentic Indian Railways fare verification, waitlist probability analysis,
              and live status tracking across Vande Bharat, Rajdhani, and Superfast express trains.
            </p>

            {/* Indian Railways Pillars badge */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-1 rounded-md">
                ✓ Safety
              </span>
              <span className="font-bold text-amber-300 bg-amber-950/60 border border-amber-700/60 px-2.5 py-1 rounded-md">
                ✓ Security
              </span>
              <span className="font-bold text-sky-400 bg-sky-950/60 border border-sky-700/60 px-2.5 py-1 rounded-md">
                ✓ Punctuality
              </span>
            </div>
          </div>

          {/* Hero Visual: Vande Bharat & Platform Feature */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl h-64 group bg-slate-950">
              <img
                src="/images/trains/vande-bharat.jpg"
                alt="Indian Railways Vande Bharat Express"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-blue-900 shadow flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Flagship Vande Bharat Express</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  Indian Railways Semi High-Speed
                </div>
                <div className="text-sm font-extrabold text-white">
                  160 km/h Aerodynamic Trainset
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Booking Search Form */}
        <div className="relative z-10 bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Source Station */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  From Station
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  >
                    {stations.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                    {stations.length === 0 && (
                      <>
                        <option value="NDLS">New Delhi (NDLS)</option>
                        <option value="MMCT">Mumbai Central (MMCT)</option>
                        <option value="BSB">Varanasi (BSB)</option>
                        <option value="SBC">Bengaluru (SBC)</option>
                        <option value="MAS">Chennai Central (MAS)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Station Swap Button */}
              <div className="md:col-span-1 flex justify-center pt-5">
                <button
                  type="button"
                  onClick={handleSwapStations}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                  title="Swap Stations"
                >
                  <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                </button>
              </div>

              {/* Destination Station */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  To Station
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  >
                    {stations.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                    {stations.length === 0 && (
                      <>
                        <option value="MMCT">Mumbai Central (MMCT)</option>
                        <option value="NDLS">New Delhi (NDLS)</option>
                        <option value="BSB">Varanasi (BSB)</option>
                        <option value="SBC">Bengaluru (SBC)</option>
                        <option value="MAS">Chennai Central (MAS)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Journey Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="date"
                    value={journeyDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setJourneyDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="md:col-span-2 pt-5">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Trains</span>
                </button>
              </div>
            </div>

            {/* Sub filters */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Class:</span>
                  <select
                    value={travelClass}
                    onChange={(e) => setTravelClass(e.target.value)}
                    className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700"
                  >
                    <option value="">All Classes</option>
                    <option value="1A">AC First (1A)</option>
                    <option value="2A">AC 2-Tier (2A)</option>
                    <option value="3A">AC 3-Tier (3A)</option>
                    <option value="SL">Sleeper (SL)</option>
                    <option value="CC">AC Chair Car (CC)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">Passengers:</span>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} Passenger{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero Booking Fee & Authentic Railway Fare Verification</span>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">AI Smart Train Picking</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Multi-attribute decision optimization evaluates authentic fares, travel duration, departure timings,
            and seat availability to spotlight top-value trains.
          </p>
          <Link
            to="/ai-recommendations"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 mt-4 hover:underline"
          >
            Explore AI Engine <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">Demand & Waitlist Forecast</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Machine learning model predicts passenger rush, seat surge multipliers,
            and RAC/Waitlist confirmation probability over the upcoming booking window.
          </p>
          <Link
            to="/analytics"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 mt-4 hover:underline"
          >
            View Demand Curves <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">Live Train Running Status</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Real-time status architecture tracks delays, current station halts,
            and on-time reliability with data freshness indicators.
          </p>
          <Link
            to="/live-status"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-4 hover:underline"
          >
            Track Train Live <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Popular Routes Section with Train Photos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Popular Express Corridors</h2>
            <p className="text-xs text-slate-500">Quickly book high-frequency Rajdhani, Vande Bharat & Shatabdi trains</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1">
            All Routes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularRoutes.map((r, i) => (
            <div
              key={i}
              onClick={() => {
                setSource(r.from);
                setDestination(r.to);
                navigate(`/results?source=${r.from}&destination=${r.to}&date=${journeyDate}&passengers=1`);
              }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg hover:border-blue-400 transition cursor-pointer group overflow-hidden flex flex-col justify-between"
            >
              {/* Train Photo Thumbnail */}
              <div className="relative h-36 w-full overflow-hidden bg-slate-950">
                <img
                  src={r.image}
                  alt={r.badge}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-black text-white bg-blue-600/90 px-2 py-0.5 rounded shadow">
                    {r.from} ➔ {r.to}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px]">
                  <span className="font-bold bg-black/60 px-2 py-0.5 rounded">
                    {r.badge}
                  </span>
                  <span className="font-semibold text-amber-300">
                    {r.speed}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition">
                    {r.fromCity} to {r.toCity}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Duration: {r.time}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">{r.fare}</span>
                  <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                    <span>Book</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Iconic Trains Gallery */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Flagship Trains & Iconic Journeys
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Experience the evolution of Indian Railways with state-of-the-art trainsets and scenic corridors
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredTrains.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col sm:flex-row group"
            >
              <div className="sm:w-1/2 relative h-48 sm:h-auto overflow-hidden bg-slate-950">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent sm:hidden" />
              </div>
              <div className="sm:w-1/2 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {item.subtitle}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1.5 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {item.source} ➔ {item.destination}
                  </span>
                  <button
                    onClick={() => {
                      setSource(item.source);
                      setDestination(item.destination);
                      navigate(`/results?source=${item.source}&destination=${item.destination}&date=${journeyDate}&passengers=1`);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                  >
                    <span>Check Fares</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
