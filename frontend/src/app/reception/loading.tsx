import React from 'react';

export default function ReceptionLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white min-h-[400px]">
      {/* Visual loader spinner */}
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-100 border-t-emerald-600 animate-spin" />
        <div className="absolute w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <svg className="h-3 w-3 text-emerald-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>
      <h3 className="text-zinc-800 font-semibold mt-4 text-sm tracking-tight">Loading MedflowX Reception...</h3>
      <p className="text-zinc-400 text-xs mt-1">Establishing secure connection to clinical database.</p>
    </div>
  );
}
