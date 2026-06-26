'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { searchPatients } from '@/services/reception';
import { Patient } from '@/types/reception';
import { useKeyboardNav } from '@/hooks/use-keyboard-nav';
import { Search, User, Phone, Eye, CalendarPlus, UserCheck } from 'lucide-react';

interface GlobalSearchViewProps {
  onViewProfile: (id: number) => void;
  onCreateVisit: (patient: Patient) => void;
}

export default function GlobalSearchView({ onViewProfile, onCreateVisit }: GlobalSearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = async (val: string) => {
    setQuery(val);
    if (!val || val.trim().length < 2) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const data = await searchPatients(val);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePatientSelect = (pat: Patient) => {
    onViewProfile(pat.id);
  };

  // Keyboard navigation for results list
  const { activeIndex, handleKeyDown, resetIndex } = useKeyboardNav({
    itemCount: results.length,
    onSelect: (idx) => {
      handlePatientSelect(results[idx]);
    },
    onClose: () => {
      setResults([]);
      setQuery('');
      resetIndex();
    },
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto font-body text-zinc-700">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Global Search</h1>
        <p className="text-sm text-zinc-500 mt-1">Look up patient profiles by Code, Phone, Name, or Card details.</p>
      </div>

      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search phone number, code (MED-...), or patient name..."
          value={query}
          onKeyDown={handleKeyDown}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full h-12 pl-12 pr-4 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all placeholder-zinc-400 font-sans"
        />
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
        
        {isSearching && (
          <div className="absolute right-4 top-3.5">
            <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 ? (
        <Card className="shadow-sm border border-zinc-150/70 bg-white rounded-xl overflow-hidden">
          <CardContent className="p-0 divide-y divide-zinc-100">
            {results.map((pat, idx) => (
              <div
                key={pat.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                  idx === activeIndex 
                    ? 'bg-primary/5 border-l-4 border-primary pl-3' 
                    : 'hover:bg-zinc-50 border-l-4 border-transparent'
                }`}
              >
                <div 
                  className="cursor-pointer flex-1"
                  onClick={() => handlePatientSelect(pat)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-950 text-sm">
                      {pat.first_name} {pat.last_name || ''}
                    </span>
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-650">
                      {pat.patient_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1.5 font-semibold">
                    <span className="flex items-center gap-1 text-primary">
                      <Phone className="h-3.5 w-3.5" />
                      {pat.phone}
                    </span>
                    <span>Gender: {pat.gender}</span>
                    <span>Age: {pat.age || 'N/A'} yrs</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onViewProfile(pat.id)}
                    className="h-8 px-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Profile
                  </button>
                  <button
                    onClick={() => onCreateVisit(pat)}
                    className="h-8 px-3 bg-cta hover:opacity-90 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Create Visit
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : query && !isSearching ? (
        <Card className="border-dashed border-zinc-200 bg-white rounded-xl shadow-xs">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-450 mb-2">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="text-zinc-500 text-xs font-medium block">No patient records match "{query}"</span>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <div className="p-4 border border-zinc-150/60 rounded-xl bg-white text-zinc-700 text-xs space-y-1.5 shadow-xs">
            <span className="font-bold text-zinc-800 uppercase block tracking-wider text-[10px] font-heading">Keyboard Shortcuts</span>
            <p>⌨️ <span className="font-semibold text-zinc-900">Arrow Down / Up</span> to navigate results list</p>
            <p>⌨️ <span className="font-semibold text-zinc-900">Enter</span> to view select patient profile</p>
            <p>⌨️ <span className="font-semibold text-zinc-900">Escape</span> to clear search text</p>
          </div>
          <div className="p-4 border border-zinc-150/60 rounded-xl bg-white text-zinc-700 text-xs space-y-1.5 shadow-xs">
            <span className="font-bold text-zinc-800 uppercase block tracking-wider text-[10px] font-heading">Quick Tips</span>
            <p>🔍 Search by 10-digit mobile phone number for instant unique matches.</p>
            <p>📝 Click "Create Visit" from the actions panel to immediately open OPD scheduler.</p>
          </div>
        </div>
      )}
    </div>
  );
}
