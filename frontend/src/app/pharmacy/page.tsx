'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { submitPhysicalPrescription, searchPatients, getPatientById } from '@/services/reception';
import {
  Pill,
  Search,
  User,
  LogOut,
  Stethoscope,
  Menu,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileImage,
  IndianRupee,
  Phone,
  Calendar,
  RotateCw,
  Trash2
} from 'lucide-react';

interface Patient {
  id: string | number;
  patient_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  age: number;
}

interface Visit {
  id: string | number;
  visit_date: string;
  token_no: number;
  chief_complaint: string;
  status: string;
  prescription_image_front?: string | null;
  prescription_image_back?: string | null;
  prescription_amount?: number | null;
  doctors?: {
    profiles?: {
      full_name: string;
    };
  };
}

export default function PharmacyPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  
  // Selection state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVisits, setPatientVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // Upload Form State
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Initial load: recent patients
  useEffect(() => {
    const saved = localStorage.getItem('medflowx_logged_in_user');
    if (!saved) {
      window.location.href = '/auth';
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (parsed.role !== 'Pharmacy') {
        window.location.href = '/auth';
        return;
      }
    } catch (e) {
      window.location.href = '/auth';
      return;
    }
    handleSearch('');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('medflowx_logged_in_user');
    window.location.href = '/auth';
  };

  const handleSearch = async (query: string) => {
    try {
      setSearching(true);
      const results = await searchPatients(query);
      setSearchResults(results as unknown as Patient[]);
    } catch (err: any) {
      console.error('Error searching patients:', err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedVisit(null);
    setFrontPhoto(null);
    setFrontPreview(null);
    setBackPhoto(null);
    setBackPreview(null);
    setAmount('');
    try {
      setLoadingVisits(true);
      const res = await getPatientById(patient.id);
      const visits = (res.visits || []) as unknown as Visit[];
      setPatientVisits(visits);
      if (visits.length > 0) {
        setSelectedVisit(visits[0]); // Select most recent visit by default
      }
    } catch (err: any) {
      console.error('Error fetching patient visits:', err.message);
    } fontFinally: {
      setLoadingVisits(false);
    }
  };

  // Image Selection Handlers (JPEG & PNG only)
  const handleFrontPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type.toLowerCase())) {
      alert('Only JPEG and PNG image formats are allowed.');
      return;
    }

    setFrontPhoto(file);
    setFrontPreview(URL.createObjectURL(file));
  };

  const handleBackPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type.toLowerCase())) {
      alert('Only JPEG and PNG image formats are allowed.');
      return;
    }

    setBackPhoto(file);
    setBackPreview(URL.createObjectURL(file));
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVisit) {
      alert('Please select a visit to attach the prescription.');
      return;
    }

    if (!frontPhoto) {
      alert('Front photo of physical prescription is required.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      await submitPhysicalPrescription({
        visitId: selectedVisit.id,
        frontImage: frontPhoto,
        backImage: backPhoto,
        amount: numericAmount,
      });

      alert('Physical prescription uploaded and transaction recorded successfully!');

      // Reset form & reload visits
      setFrontPhoto(null);
      setFrontPreview(null);
      setBackPhoto(null);
      setBackPreview(null);
      setAmount('');
      
      if (selectedPatient) {
        const res = await getPatientById(selectedPatient.id);
        setPatientVisits(res.visits as unknown as Visit[]);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error submitting prescription: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pharmacy-theme font-body text-text-custom bg-bg-custom flex h-screen overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-66 bg-white border-r border-zinc-200 flex flex-col justify-between shrink-0 shadow-md transition-transform duration-250 md:static md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col flex-1">
          {/* Logo Brand */}
          <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary text-white shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-zinc-900 tracking-tight text-lg font-heading">
                Medflow<span className="text-primary">X</span>
              </span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg md:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 font-body">
            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold bg-primary text-white shadow-md">
              <Pill className="h-5 w-5 text-white" />
              <span>Physical Rx Counter</span>
            </div>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 space-y-1.5 bg-zinc-50/70">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50/80 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-bg-custom">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-200 bg-white px-6 md:px-8 flex items-center justify-between shrink-0 shadow-sm z-30 font-heading">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              Pharmacy Desk
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-wider font-heading">
            <span>PHYSICAL PRESCRIPTION UPLOADER</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-bold text-zinc-800 leading-tight">Pharmacist Desk</span>
              <span className="block text-[10px] text-zinc-400 font-semibold uppercase">Prescription Intake</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm shadow-inner border border-primary/20">
              <Pill className="h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto font-body">
          <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
            
            {/* Left: Patient Search Column (4 cols) */}
            <div className="lg:col-span-4 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden h-full">
              <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 font-heading">
                  Search Patient
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search Name or Phone Number..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-white text-zinc-800 text-xs rounded-xl border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Patient List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {searching ? (
                  <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                    <RotateCw className="h-5 w-5 animate-spin mb-2 text-primary" />
                    <span className="text-xs font-medium">Searching records...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
                    <User className="h-8 w-8 mb-2 text-zinc-300" />
                    <p className="text-xs font-bold text-zinc-600">No patient found</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Try entering full phone number or name.</p>
                  </div>
                ) : (
                  searchResults.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    return (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-white border-zinc-200 hover:border-primary/40 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className={`font-bold text-sm leading-tight ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                            {patient.first_name} {patient.last_name || ''}
                          </h4>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {patient.patient_code}
                          </span>
                        </div>
                        <div className={`flex items-center gap-3 text-xs mt-1.5 font-medium ${isSelected ? 'text-white/80' : 'text-zinc-500'}`}>
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {patient.phone}</span>
                          <span>•</span>
                          <span>{patient.age ? `${patient.age} Yrs` : '—'} / {patient.gender}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Upload Physical Prescription Desk (8 cols) */}
            <div className="lg:col-span-8 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden h-full">
              {selectedPatient ? (
                <div className="flex flex-col h-full overflow-y-auto">
                  {/* Selected Patient Header */}
                  <div className="p-6 border-b border-zinc-200 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div>
                      <span className="text-[10px] font-bold text-primary uppercase font-heading tracking-wider block mb-1">
                        Active Patient Selected
                      </span>
                      <h2 className="text-xl font-bold text-zinc-900 font-heading">
                        {selectedPatient.first_name} {selectedPatient.last_name || ''}
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        Phone: <strong className="text-zinc-700">{selectedPatient.phone}</strong> • Code: <strong className="text-primary font-mono">{selectedPatient.patient_code}</strong>
                      </p>
                    </div>

                    {/* Visit Selector */}
                    {patientVisits.length > 0 && (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-heading">
                          Select Visit Record:
                        </label>
                        <select
                          value={selectedVisit?.id || ''}
                          onChange={(e) => {
                            const found = patientVisits.find(v => String(v.id) === e.target.value);
                            if (found) setSelectedVisit(found);
                          }}
                          className="bg-white border border-zinc-200 text-xs font-bold text-zinc-800 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
                        >
                          {patientVisits.map((v) => (
                            <option key={v.id} value={v.id}>
                              Visit: {new Date(v.visit_date).toLocaleDateString()} ({v.chief_complaint || 'General Visit'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Upload Form */}
                  <form onSubmit={handleSubmitPrescription} className="p-6 space-y-6 flex-1">
                    
                    {/* Prescription Photos Section */}
                    <div>
                      <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1 font-heading flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-primary" />
                        Physical Prescription Photos (JPEG / PNG Only)
                      </h3>
                      <p className="text-xs text-zinc-500 mb-4 font-medium">
                        Upload photos of the paper prescription presented by the patient.
                      </p>

                      <div className="grid sm:grid-cols-2 gap-5">
                        
                        {/* Front Photo (Mandatory) */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-zinc-700">
                            Front Photo <span className="text-rose-500">* (Required)</span>
                          </label>
                          
                          {frontPreview ? (
                            <div className="relative aspect-4/3 rounded-xl overflow-hidden border-2 border-primary bg-zinc-100 group shadow-xs">
                              <img src={frontPreview} alt="Front Prescription" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setFrontPhoto(null);
                                  setFrontPreview(null);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                                title="Remove Image"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center aspect-4/3 rounded-xl border-2 border-dashed border-zinc-200 hover:border-primary/50 bg-zinc-50/50 hover:bg-primary/5 cursor-pointer transition-all p-4 text-center">
                              <Upload className="h-8 w-8 text-primary mb-2" />
                              <span className="text-xs font-bold text-zinc-700">Upload Front Photo</span>
                              <span className="text-[10px] text-zinc-400 mt-1">JPEG or PNG formats</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleFrontPhotoSelect}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        {/* Back Photo (Optional) */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-zinc-700">
                            Back Photo <span className="text-zinc-400 font-normal">(Optional)</span>
                          </label>
                          
                          {backPreview ? (
                            <div className="relative aspect-4/3 rounded-xl overflow-hidden border-2 border-primary bg-zinc-100 group shadow-xs">
                              <img src={backPreview} alt="Back Prescription" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setBackPhoto(null);
                                  setBackPreview(null);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                                title="Remove Image"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center aspect-4/3 rounded-xl border-2 border-dashed border-zinc-200 hover:border-primary/50 bg-zinc-50/50 hover:bg-primary/5 cursor-pointer transition-all p-4 text-center">
                              <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                              <span className="text-xs font-bold text-zinc-700">Upload Back Photo</span>
                              <span className="text-[10px] text-zinc-400 mt-1">JPEG or PNG formats</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleBackPhotoSelect}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount / Cost Input */}
                    <div className="space-y-2 border-t border-zinc-150 pt-5">
                      <label className="block text-xs font-bold text-zinc-800 font-heading">
                        Prescription Amount / Cost (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative max-w-sm">
                        <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="Enter prescription cost (e.g. 350)"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white text-zinc-900 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all font-bold"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={submitting || !frontPhoto || !amount}
                        className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                          submitting || !frontPhoto || !amount
                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-dark text-white hover:scale-[1.01]'
                        }`}
                      >
                        {submitting ? (
                          <>
                            <RotateCw className="h-4 w-4 animate-spin" />
                            <span>Uploading Prescription...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Submit Prescription & Log Transaction</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <User className="h-8 w-8" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-800 font-heading">Select a Patient</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                    Search by patient name or phone number on the left panel to upload their physical paper prescription and enter cost details.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
