import React from 'react';
import { Check, Users, Info } from 'lucide-react';

export const SeatClassSelector = ({
  classes = [],
  inventories = [],
  selectedClass,
  isVerified = false,
  onSelectClass,
}) => {
  if (!classes || classes.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {classes.map((cls) => {
        const isSelected = selectedClass === cls.class_code;
        // Check if matching inventory exists
        const matchedInv = inventories.find(
          (inv) => inv.class_code === cls.class_code || inv.train_class === cls.id
        );
        const availSeats = matchedInv ? matchedInv.available_seats : cls.total_seats - 10;
        const isLowSeats = availSeats > 0 && availSeats < 15;
        const isSoldOut = availSeats <= 0;
        const fareNumber = Number(cls.total_fare || cls.base_fare || 0);

        return (
          <button
            key={cls.class_code}
            type="button"
            disabled={isSoldOut}
            onClick={() => onSelectClass(cls)}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              isSelected
                ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-600/30 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            } ${isSoldOut ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <span>{cls.class_code}</span>
              <span className="text-[10px] font-normal text-slate-500 uppercase">
                {cls.class_code === '1A' ? '1st AC' : cls.class_code === '2A' ? '2-Tier' : cls.class_code === '3A' ? '3-Tier' : cls.class_code}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate" title={cls.class_name}>
              {cls.class_name}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="font-black text-slate-900 text-sm">
                  ₹{Math.round(fareNumber).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-medium ml-1">
                  {isVerified ? 'verified' : 'demo'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold flex items-center gap-0.5 ${
                  isSoldOut
                    ? 'text-rose-600'
                    : isLowSeats
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}
              >
                <Users className="w-2.5 h-2.5" />
                {isSoldOut ? 'WL' : `AVL ${availSeats}`}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
