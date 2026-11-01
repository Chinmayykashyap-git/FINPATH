import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  whatItRepresents: string;
  howToInterpret?: string;
  whyItMatters?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  whatItRepresents,
  howToInterpret,
  whyItMatters,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-1 rounded-md text-[#94A3B8] hover:text-[#22D3EE] hover:bg-[#1E293B]/60 transition-colors"
        aria-label={`Information about ${title}`}
      >
        <Info className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 w-80 p-3.5 rounded-lg bg-[#0F172A] border border-[#334155] shadow-2xl text-xs text-[#F8FAFC] space-y-2">
          <div className="font-semibold text-[#22D3EE] border-b border-[#1E293B] pb-1.5">
            {title}
          </div>
          <div>
            <span className="font-medium text-[#94A3B8]">What it represents: </span>
            <span className="text-slate-200">{whatItRepresents}</span>
          </div>
          {howToInterpret && (
            <div>
              <span className="font-medium text-[#94A3B8]">How to interpret: </span>
              <span className="text-slate-200">{howToInterpret}</span>
            </div>
          )}
          {whyItMatters && (
            <div>
              <span className="font-medium text-[#94A3B8]">Why it matters: </span>
              <span className="text-slate-200">{whyItMatters}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

