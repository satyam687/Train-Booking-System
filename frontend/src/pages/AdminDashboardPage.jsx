import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { useToast } from '../context/ToastContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  ShieldCheck,
  TrendingUp,
  Ticket,
  Train,
  MapPin,
  CreditCard,
  RefreshCw,
  Cpu,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const AdminDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    setLoading(true);
    Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getBookingAnalytics(),
    ])
      .then(([sumRes, anaRes]) => {
        setSummary(sumRes.data);
        setAnalytics(anaRes.data);
      })
      .catch((err) => {
        toast.error('Failed to load operations dashboard metrics.');
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-bold mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
            <span>Operations & Administration Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            RailBook AI Hub
          </h1>
          <p className="text-slate-600 text-sm mt-0.5">
            Real-time reservation metrics, revenue reports, and railway system operations.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Revenue
          </span>
          <div className="text-2xl font-black text-slate-900">
            ₹{summary ? Math.round(summary.total_revenue).toLocaleString() : 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Settled Demo Revenue</span>
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Bookings
          </span>
          <div className="text-2xl font-black text-slate-900">
            {summary?.total_bookings || 0}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">
            {summary?.confirmed_bookings || 0} Confirmed
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Active Trains
          </span>
          <div className="text-2xl font-black text-slate-900">
            {summary?.active_trains || 32}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Across 26 Hub Stations
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Connected Stations
          </span>
          <div className="text-2xl font-black text-slate-900">
            {summary?.total_stations || 26}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Pan-India Network
          </span>
        </div>
      </div>

      {/* 7-Day Revenue & Bookings Bar Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Last 7 Days Reservation Volume
        </h3>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.daily_trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f2444', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
              />
              <Bar dataKey="bookings" name="Bookings" fill="#0f2444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Travel Class & Payment Method Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Booking Distribution by Class
          </h3>
          <div className="space-y-3">
            {analytics?.class_distribution?.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">{c.class_code}</span>
                <span className="text-slate-500">{c.count} bookings (₹{Math.round(c.revenue).toLocaleString()})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Payment Mode Breakdown
          </h3>
          <div className="space-y-3">
            {analytics?.payment_distribution?.map((pm, i) => (
              <div key={i} className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">{pm.payment_method}</span>
                <span className="text-slate-500">{pm.count} transactions (₹{Math.round(pm.total_amount).toLocaleString()})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Recent System Bookings
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Train</th>
                <th className="p-3">Route</th>
                <th className="p-3">Date</th>
                <th className="p-3">Fare</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summary?.recent_bookings?.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-900">
                    <Link to={`/bookings/${b.booking_reference}`} className="hover:underline">
                      {b.booking_reference}
                    </Link>
                  </td>
                  <td className="p-3 font-semibold text-slate-900">{b.train_number} - {b.train_name}</td>
                  <td className="p-3">{b.source_station_code} → {b.destination_station_code}</td>
                  <td className="p-3">{b.journey_date}</td>
                  <td className="p-3 font-bold">₹{Math.round(b.total_fare)}</td>
                  <td className="p-3">
                    <Badge variant={b.booking_status === 'CONFIRMED' ? 'success' : 'warning'}>
                      {b.booking_status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
