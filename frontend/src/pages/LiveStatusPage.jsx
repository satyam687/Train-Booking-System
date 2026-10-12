import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trainsApi } from '../api/trainsApi';
import { useToast } from '../context/ToastContext';
import {
  Radio,
  Train,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Search
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const LiveStatusPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const trainParam = searchParams.get('train') || '12952';

  const [trainsList, setTrainsList] = useState([]);
  const [selectedTrainNum, setSelectedTrainNum] = useState(trainParam);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    trainsApi.getTrains().then((res) => {
      setTrainsList(res.data.results || res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedTrainNum) {
      fetchStatus(selectedTrainNum);
    }
  }, [selectedTrainNum]);

  const fetchStatus = (trainNum) => {
    setLoading(true);
    trainsApi
      .getLiveStatus(trainNum)
      .then((res) => {
        setStatusData(res.data);
      })
      .catch((err) => {
        toast.error('Failed to fetch train live status.');
      })
      .finally(() => setLoading(false));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await trainsApi.getLiveStatus(selectedTrainNum);
      setStatusData(res.data);
      toast.success('Train status refreshed.');
    } catch (e) {
      toast.error('Could not refresh status.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectedTrainNum(val);
    setSearchParams({ train: val });
  };

  const isDelayed = statusData && statusData.delay_minutes > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Radio className="w-7 h-7 text-emerald-600 animate-pulse" />
          <span>Live Train Running Status</span>
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Track real-time train positions, station delays, and on-schedule performance.
        </p>
      </div>

      {/* Train Selector Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1 max-w-md">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Select Train to Track
          </label>
          <div className="relative">
            <Train className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <select
              value={selectedTrainNum}
              onChange={handleSelectChange}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            >
              {trainsList.map((t) => (
                <option key={t.id} value={t.train_number}>
                  #{t.train_number} — {t.train_name}
                </option>
              ))}
              {trainsList.length === 0 && (
                <>
                  <option value="12952">#12952 — Mumbai Rajdhani Express</option>
                  <option value="22436">#22436 — Vande Bharat Express</option>
                  <option value="12004">#12004 — Lucknow Shatabdi</option>
                </>
              )}
            </select>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Live Status Display Card */}
      {loading ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <LoadingSkeleton lines={6} />
        </div>
      ) : statusData ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-blue-900 text-xs bg-blue-100 px-2 py-0.5 rounded">
                  #{statusData.train_number}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {statusData.source_station} → {statusData.destination_station}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">{statusData.train_name}</h2>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase ${
                  isDelayed
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {isDelayed ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Delayed by {statusData.delay_minutes} mins</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Running On Time</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Current Location Highlight */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Train Position
                </span>
                <div className="text-lg font-black text-slate-900">
                  {statusData.current_location || 'En Route'}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500">
              <div>Last Synced: <strong className="text-slate-700">{new Date(statusData.last_updated).toLocaleTimeString()}</strong></div>
              <div>Freshness: <strong className="text-emerald-700">{statusData.freshness_seconds || 0}s ago</strong></div>
            </div>
          </div>

          {/* Provider Meta & Disclaimer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Provider: <strong>{statusData.provider}</strong></span>
            </div>

            {statusData.is_simulated && (
              <div className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                {statusData.disclaimer}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center">
          <p className="text-sm text-slate-500">No status data available for this train.</p>
        </div>
      )}
    </div>
  );
};
