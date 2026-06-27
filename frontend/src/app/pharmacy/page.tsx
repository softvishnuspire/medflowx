'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

const API_BASE = (import.meta.env.NEXT_PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api') as string;
const SOCKET_BASE = (import.meta.env.NEXT_PUBLIC_SOCKET_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000') as string;

interface Medicine {
  id: number;
  medicine_name: string;
  generic_name: string;
  strength: string;
  manufacturer: string;
  unit: string;
  reorder_level: number;
  total_stock: number;
  unit_price: number;
  batches: any[];
}

interface Visit {
  id: number;
  visit_number: string;
  visit_date: string;
  token_no: number;
  status: string;
  patients: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    gender: string;
    age: number;
    dob: string;
  };
  doctors: {
    id: number;
    profiles: {
      full_name: string;
    };
  };
  diagnoses: Array<{
    diagnosis: string;
    doctor_notes: string;
  }>;
  prescriptions: Array<{
    id: number;
    advice: string;
    prescription_items: Array<{
      id: number;
      medicine_id: number;
      medicines: {
        medicine_name: string;
        generic_name: string;
        strength: string;
        unit: string;
      };
      dosage: string;
      frequency: string;
      duration: string;
      quantity: number;
      instructions: string;
    }>;
  }>;
}

export default function PharmacyPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'inventory'>('queue');
  
  // Real-time & Queue State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [queue, setQueue] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingQueue, setLoadingQueue] = useState(true);

  // Inventory State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [medSearchQuery, setMedSearchQuery] = useState('');

  // Add Medicine Form State
  const [newMed, setNewMed] = useState({
    medicine_name: '',
    generic_name: '',
    strength: '',
    manufacturer: '',
    unit: 'Tablets',
    reorder_level: 10,
  });
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [submittingMed, setSubmittingMed] = useState(false);

  // Add Stock Form State
  const [stockEntry, setStockEntry] = useState({
    medicine_id: '',
    batch_no: '',
    expiry_date: '',
    purchase_price: '',
    selling_price: '',
    quantity: '',
  });
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [submittingStock, setSubmittingStock] = useState(false);

  // Checkout / Billing State
  const [checkoutItems, setCheckoutItems] = useState<Array<{
    medicine_id: number;
    medicine_name: string;
    quantity: number;
    unit_price: number;
    original_price: number;
  }>>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [checkingOut, setCheckingOut] = useState(false);

  // Fetch Pharmacy Queue
  const fetchQueue = async () => {
    try {
      setLoadingQueue(true);
      const res = await fetch(`${API_BASE}/pharmacy/queue`);
      if (!res.ok) throw new Error('Failed to fetch queue');
      const data = await res.json();
      setQueue(data);
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  // Fetch Medicines
  const fetchMedicines = async () => {
    try {
      setLoadingMeds(true);
      const res = await fetch(`${API_BASE}/medicines`);
      if (!res.ok) throw new Error('Failed to fetch medicines');
      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoadingMeds(false);
    }
  };

  // Setup Socket Connection
  useEffect(() => {
    const s = io(SOCKET_BASE);

    s.on('connect', () => {
      setSocketConnected(true);
      console.log('Connected to WebSocket server');
      s.emit('join-room', 'pharmacy');
    });

    s.on('disconnect', () => {
      setSocketConnected(false);
    });

    s.on('queue-update', (data) => {
      console.log('Queue update received:', data);
      fetchQueue();
      fetchMedicines();
      // If the currently selected visit was checked out by someone else, clear selection
      if (selectedVisit && selectedVisit.id === data.visit_id) {
        setSelectedVisit(null);
        alert('This prescription was processed or updated elsewhere.');
      }
    });

    setSocket(s);

    fetchQueue();
    fetchMedicines();

    return () => {
      s.disconnect();
    };
  }, []);

  // When selected visit changes, prepare checkout items
  useEffect(() => {
    if (selectedVisit && selectedVisit.prescriptions && selectedVisit.prescriptions[0]) {
      const items = selectedVisit.prescriptions[0].prescription_items.map((pi) => {
        // Find corresponding medicine in state to get the active price
        const medInState = medicines.find((m) => m.id === pi.medicine_id);
        const activePrice = medInState ? medInState.unit_price : 0;
        return {
          medicine_id: pi.medicine_id,
          medicine_name: pi.medicines?.medicine_name || 'Unknown',
          quantity: pi.quantity,
          unit_price: activePrice,
          original_price: activePrice,
        };
      });
      setCheckoutItems(items);
      setDiscount(0);
    } else {
      setCheckoutItems([]);
      setDiscount(0);
    }
  }, [selectedVisit, medicines]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter((v) => {
      const fullName = `${v.patients?.first_name || ''} ${v.patients?.last_name || ''}`.toLowerCase();
      const phone = (v.patients?.phone || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || phone.includes(query);
    });
  }, [queue, searchQuery]);

  // Filtered Medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const name = m.medicine_name.toLowerCase();
      const generic = (m.generic_name || '').toLowerCase();
      const query = medSearchQuery.toLowerCase();
      return name.includes(query) || generic.includes(query);
    });
  }, [medicines, medSearchQuery]);

  // Handle Checkout / Billing Submission
  const handleCheckout = async () => {
    if (!selectedVisit) return;
    try {
      setCheckingOut(true);
      const payload = {
        visit_id: selectedVisit.id,
        patient_id: selectedVisit.patients.id,
        discount,
        payment_mode: paymentMode,
        items: checkoutItems.map((item) => ({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      const res = await fetch(`${API_BASE}/pharmacy/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Checkout failed');

      alert('Prescription dispensed and payment logged successfully!');
      setSelectedVisit(null);
      fetchQueue();
      fetchMedicines();
    } catch (err: any) {
      console.error(err);
      alert(`Error during checkout: ${err.message}`);
    } finally {
      setCheckingOut(false);
    }
  };

  // Add Medicine Form Submission
  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingMed(true);
      const res = await fetch(`${API_BASE}/medicines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create medicine');

      alert('Medicine registered successfully!');
      setNewMed({
        medicine_name: '',
        generic_name: '',
        strength: '',
        manufacturer: '',
        unit: 'Tablets',
        reorder_level: 10,
      });
      setShowAddMedModal(false);
      fetchMedicines();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmittingMed(false);
    }
  };

  // Add Stock Form Submission
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingStock(true);
      const payload = {
        medicine_id: parseInt(stockEntry.medicine_id),
        batch_no: stockEntry.batch_no,
        expiry_date: stockEntry.expiry_date,
        purchase_price: parseFloat(stockEntry.purchase_price),
        selling_price: parseFloat(stockEntry.selling_price),
        quantity: parseInt(stockEntry.quantity),
      };

      const res = await fetch(`${API_BASE}/medicines/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add stock');

      alert('Stock batch added successfully!');
      setStockEntry({
        medicine_id: '',
        batch_no: '',
        expiry_date: '',
        purchase_price: '',
        selling_price: '',
        quantity: '',
      });
      setShowAddStockModal(false);
      fetchMedicines();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmittingStock(false);
    }
  };

  // Calculate bill values
  const billSummary = useMemo(() => {
    const subtotal = checkoutItems.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0);
    const finalTotal = Math.max(0, subtotal - discount);
    return { subtotal, finalTotal };
  }, [checkoutItems, discount]);

  // Check stock warnings
  const getStockStatus = (medicineId: number, requestedQty: number) => {
    const med = medicines.find((m) => m.id === medicineId);
    if (!med) return { label: 'Unknown', color: 'text-gray-400', disabled: true };
    if (med.total_stock === 0) return { label: 'Out of Stock', color: 'text-red-400 font-semibold', disabled: true };
    if (med.total_stock < requestedQty) return { label: `Shortage (Avail: ${med.total_stock})`, color: 'text-amber-400 font-semibold', disabled: true };
    return { label: `In Stock (${med.total_stock})`, color: 'text-emerald-400', disabled: false };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
            MedflowX Pharmacy
          </h1>
          <p className="text-slate-400 mt-1">Dispensation queue, automated billing, and live stock tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
            socketConnected 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'} `}></span>
            {socketConnected ? 'Real-time Linked' : 'Reconnecting...'}
          </div>

          <button 
            onClick={() => setActiveTab('queue')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'queue' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Patients Queue ({queue.length})
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'inventory' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Stock Registry ({medicines.length})
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'queue' ? (
          /* =========================================================================
             QUEUE WORKSPACE
             ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Queue Panel */}
            <div className="lg:col-span-5 border border-slate-800/80 bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 flex flex-col h-[750px]">
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-3 text-slate-200">Patient Queue</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search patient by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              </div>

              {loadingQueue ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span>Syncing queue...</span>
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <svg className="w-12 h-12 mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                  <span>No patients waiting in queue.</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                  {filteredQueue.map((visit) => {
                    const isSelected = selectedVisit?.id === visit.id;
                    const patientName = `${visit.patients?.first_name || ''} ${visit.patients?.last_name || ''}`;
                    const timeAgo = new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={visit.id}
                        onClick={() => setSelectedVisit(visit)}
                        className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-900/30 border-indigo-500 shadow-md shadow-indigo-950' 
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            Token #{visit.token_no}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{timeAgo}</span>
                        </div>
                        <h3 className="font-bold text-slate-100 text-base">{patientName}</h3>
                        <div className="text-xs text-slate-400 mt-1 flex flex-col gap-0.5">
                          <span>Phone: {visit.patients?.phone || 'N/A'}</span>
                          <span>Age/Gender: {visit.patients?.age} yrs / {visit.patients?.gender}</span>
                          <span className="text-teal-400/90 mt-1">Diagnosis: {visit.diagnoses[0]?.diagnosis || 'Consultation'}</span>
                          <span className="text-slate-500 text-[11px] mt-1 italic">
                            By {visit.doctors?.profiles?.full_name || 'Consultant Doctor'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Dispensation/Checkout Panel */}
            <div className="lg:col-span-7 border border-slate-800/80 bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 flex flex-col h-[750px]">
              {selectedVisit ? (
                <div className="flex flex-col h-full">
                  {/* Selected Patient Details Header */}
                  <div className="border-b border-slate-800 pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {selectedVisit.visit_number}
                        </span>
                        <h2 className="text-2xl font-extrabold text-white">
                          {selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Diagnosis: <span className="text-teal-400 font-semibold">{selectedVisit.diagnoses[0]?.diagnosis || 'N/A'}</span>
                      </p>
                      {selectedVisit.diagnoses[0]?.doctor_notes && (
                        <p className="text-xs text-slate-500 mt-1 italic bg-slate-950/40 p-2 rounded border border-slate-850">
                          Notes: {selectedVisit.diagnoses[0]?.doctor_notes}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedVisit(null)}
                      className="text-slate-500 hover:text-slate-300 text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 transition"
                    >
                      Deselect
                    </button>
                  </div>

                  {/* Prescription Items Grid */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Prescribed Medications</h3>
                    {checkoutItems.length === 0 ? (
                      <p className="text-slate-500 text-sm">No medicines prescribed for this visit.</p>
                    ) : (
                      <div className="space-y-3">
                        {checkoutItems.map((item, idx) => {
                          const originalItem = selectedVisit.prescriptions[0].prescription_items[idx];
                          const stockStatus = getStockStatus(item.medicine_id, item.quantity);

                          return (
                            <div key={item.medicine_id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-850/80 flex flex-col gap-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-slate-100">{item.medicine_name}</h4>
                                  <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-x-3">
                                    <span>Dosage: <strong className="text-slate-200">{originalItem.dosage}</strong></span>
                                    <span>Freq: <strong className="text-slate-200">{originalItem.frequency}</strong></span>
                                    <span>Duration: <strong className="text-slate-200">{originalItem.duration}</strong></span>
                                  </div>
                                  {originalItem.instructions && (
                                    <p className="text-[11px] text-slate-500 mt-1">Instructions: {originalItem.instructions}</p>
                                  )}
                                </div>
                                <span className={`text-xs ${stockStatus.color}`}>
                                  {stockStatus.label}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-4 border-t border-slate-900 pt-3 items-center">
                                <div>
                                  <label className="block text-[10px] text-slate-500 uppercase">Quantity</label>
                                  <span className="text-sm font-bold text-slate-200">{item.quantity} Tablets</span>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 uppercase">Unit Price (INR)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={item.unit_price}
                                    onChange={(e) => {
                                      const updatedVal = parseFloat(e.target.value) || 0;
                                      const newItems = [...checkoutItems];
                                      newItems[idx].unit_price = updatedVal;
                                      setCheckoutItems(newItems);
                                    }}
                                    className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-indigo-400 font-bold focus:outline-none focus:border-indigo-500 w-24"
                                  />
                                </div>
                                <div className="text-right">
                                  <label className="block text-[10px] text-slate-500 uppercase">Total</label>
                                  <span className="text-sm font-bold text-indigo-300">
                                    ₹{(item.quantity * item.unit_price).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Bill Details & Payment */}
                  <div className="border-t border-slate-800 pt-4 mt-4 bg-slate-950/20 p-4 rounded-xl border border-slate-900">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Left: Discount & Payment Mode */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">Discount Amount (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={discount || ''}
                            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Payment Mode</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['Cash', 'UPI', 'Card'] as const).map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setPaymentMode(mode)}
                                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  paymentMode === mode 
                                    ? 'bg-teal-500/25 border-teal-500 text-teal-300' 
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing Summary */}
                      <div className="flex flex-col justify-end text-right space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Subtotal:</span>
                          <span>₹{billSummary.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Discount:</span>
                          <span className="text-amber-400">-₹{discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-slate-850 pt-1.5 text-white">
                          <span>Final Amount:</span>
                          <span className="text-teal-400">₹{billSummary.finalTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={checkingOut || checkoutItems.some((item) => getStockStatus(item.medicine_id, item.quantity).disabled)}
                      className={`w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all ${
                        checkoutItems.some((item) => getStockStatus(item.medicine_id, item.quantity).disabled)
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-slate-950 font-black shadow-lg shadow-teal-950/20 active:scale-[0.99]'
                      }`}
                    >
                      {checkingOut ? 'Processing Checkout...' : 'Dispense & Complete Sale'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 border-2 border-dashed border-indigo-500/30 rounded-full animate-spin"></div>
                    <svg className="w-6 h-6 text-indigo-400/50 absolute left-5 top-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-400">No Patient Selected</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                    Select a patient from the waiting queue on the left to review prescriptions, apply discounts, and complete billing.
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* =========================================================================
             INVENTORY / STOCK REGISTRY WORKSPACE
             ========================================================================= */
          <div className="border border-slate-800/80 bg-slate-900/40 backdrop-blur-md rounded-2xl p-6">
            
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search medicine by name..."
                  value={medSearchQuery}
                  onChange={(e) => setMedSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                />
                <svg className="w-5 h-5 absolute left-3 top-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setShowAddMedModal(true)}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-950/50"
                >
                  + Add New Medicine
                </button>
                <button
                  onClick={() => setShowAddStockModal(true)}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-teal-950/50"
                >
                  + Top-up Stock Batch
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            {loadingMeds ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span>Syncing stock registry...</span>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                <span>No medicines found. Click Add Medicine to create one.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-3.5 px-4">Medicine Name</th>
                      <th className="py-3.5 px-4">Generic Name</th>
                      <th className="py-3.5 px-4">Strength / Unit</th>
                      <th className="py-3.5 px-4">Manufacturer</th>
                      <th className="py-3.5 px-4 text-center">Available Qty</th>
                      <th className="py-3.5 px-4 text-right">Active Price</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredMedicines.map((med) => {
                      const isLowStock = med.total_stock <= med.reorder_level;
                      const isOutOfStock = med.total_stock === 0;

                      return (
                        <tr key={med.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-100">{med.medicine_name}</td>
                          <td className="py-4 px-4 text-slate-400 font-mono text-xs">{med.generic_name || 'N/A'}</td>
                          <td className="py-4 px-4 text-slate-300">
                            {med.strength} <span className="text-[11px] text-slate-500 font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">{med.unit}</span>
                          </td>
                          <td className="py-4 px-4 text-slate-400">{med.manufacturer || 'N/A'}</td>
                          <td className="py-4 px-4 text-center font-bold text-slate-100">{med.total_stock}</td>
                          <td className="py-4 px-4 text-right text-indigo-400 font-bold">₹{med.unit_price.toFixed(2)}</td>
                          <td className="py-4 px-4 text-center">
                            {isOutOfStock ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
         ADD MEDICINE MODAL
         ========================================================================= */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold mb-4 text-slate-100">Register New Medicine</h3>
            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol"
                  value={newMed.medicine_name}
                  onChange={(e) => setNewMed({ ...newMed, medicine_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1">Generic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acetaminophen"
                  value={newMed.generic_name}
                  onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg"
                    value={newMed.strength}
                    onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Unit Type</label>
                  <select
                    value={newMed.unit}
                    onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Tablets">Tablets</option>
                    <option value="Capsules">Capsules</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injections">Injections</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Cipla"
                    value={newMed.manufacturer}
                    onChange={(e) => setNewMed({ ...newMed, manufacturer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Reorder Level (Units)</label>
                  <input
                    type="number"
                    value={newMed.reorder_level}
                    onChange={(e) => setNewMed({ ...newMed, reorder_level: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMed}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition"
                >
                  {submittingMed ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         ADD STOCK MODAL
         ========================================================================= */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 relative">
            <h3 className="text-xl font-bold mb-4 text-slate-100">Top-up Stock Batch</h3>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1">Select Medicine *</label>
                <select
                  required
                  value={stockEntry.medicine_id}
                  onChange={(e) => setStockEntry({ ...stockEntry, medicine_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.medicine_name} ({m.strength})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH123"
                    value={stockEntry.batch_no}
                    onChange={(e) => setStockEntry({ ...stockEntry, batch_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={stockEntry.expiry_date}
                    onChange={(e) => setStockEntry({ ...stockEntry, expiry_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Purchase Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={stockEntry.purchase_price}
                    onChange={(e) => setStockEntry({ ...stockEntry, purchase_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={stockEntry.selling_price}
                    onChange={(e) => setStockEntry({ ...stockEntry, selling_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    placeholder="Total Qty"
                    value={stockEntry.quantity}
                    onChange={(e) => setStockEntry({ ...stockEntry, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStock}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition"
                >
                  {submittingStock ? 'Adding Stock...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
