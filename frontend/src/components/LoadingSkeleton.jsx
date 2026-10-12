import React from 'react';

export const LoadingSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 rounded-md"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
};

export const TrainCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-4 w-32 bg-slate-100 rounded-md" />
        </div>
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
      </div>
      <div className="flex justify-between items-center py-4 border-y border-slate-100">
        <div className="space-y-1">
          <div className="h-6 w-16 bg-slate-200 rounded-md" />
          <div className="h-4 w-24 bg-slate-100 rounded-md" />
        </div>
        <div className="h-4 w-28 bg-slate-200 rounded-md" />
        <div className="space-y-1 text-right">
          <div className="h-6 w-16 bg-slate-200 rounded-md ml-auto" />
          <div className="h-4 w-24 bg-slate-100 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 pt-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-16 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
};
