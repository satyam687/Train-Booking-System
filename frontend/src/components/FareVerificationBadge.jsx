import React from 'react';
import { ShieldCheck, AlertCircle, Clock, Info } from 'lucide-react';

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'recently';
  try {
    const diffSeconds = Math.max(0, Math.floor((new Date() - new Date(timestamp)) / 1000));
    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return 'recently';
  }
};

export const FareVerificationBadge = ({ fareInfo, compact = false, className = '' }) => {
  if (!fareInfo) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Fare unavailable — connect an authorized fare provider.</span>
      </span>
    );
  }

  if (fareInfo.is_verified && fareInfo.verified_fare) {
    const timeStr = formatRelativeTime(fareInfo.retrieval_timestamp);
    return (
      <span
        title={`Verified via ${fareInfo.source || 'Authorized Railway Provider'} at ${new Date(fareInfo.retrieval_timestamp).toLocaleString()}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Verified via {fareInfo.source || 'Railway Provider'}</span>
        <span className="text-emerald-600 font-normal">• verified {timeStr}</span>
      </span>
    );
  }

  // Unavailable / unconfigured
  return (
    <div className={`space-y-1 ${className}`}>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>{fareInfo.detail || 'Fare unavailable — connect an authorized fare provider.'}</span>
      </span>
      {fareInfo.demo_fare && !compact && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
          <Info className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Demo estimate shown separately below. Never presented as authentic pricing.</span>
        </div>
      )}
    </div>
  );
};
