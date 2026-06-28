'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  LayoutDashboard,
  Pill,
  Package,
  Search,
  Plus,
  User,
  LogOut,
  Stethoscope,
  Menu,
  X,
  RotateCw,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';

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

type Tab = 'queue' | 'inventory';

export default function PharmacyPage() {
  const [activeTab, setActiveTab] = useState<Tab>('queue');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      s.emit('join-room', 'hospital');
    });

    s.on('disconnect', () => {
      setSocketConnected(false);
    });

    s.on('queue-update', (data) => {
      console.log('Queue update received:', data);
      fetchQueue();
      fetchMedicines();
      if (selectedVisit && selectedVisit.id === data.visit_id) {
        setSelectedVisit(null);
        alert('This prescription was processed or updated elsewhere.');
      }
    });

    s.on('queue-updated', (data) => {
      console.log('Queue updated notification received:', data);
      fetchQueue();
      fetchMedicines();
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
    if (!med) return { label: 'Unknown', color: 'text-zinc-400', disabled: true };
    if (med.total_stock === 0) return { label: 'Out of Stock', color: 'text-rose-600 font-bold', disabled: true };
    if (med.total_stock < requestedQty) return { label: `Shortage (Avail: ${med.total_stock})`, color: 'text-amber-600 font-bold', disabled: true };
    return { label: `In Stock (${med.total_stock})`, color: 'text-emerald-600', disabled: false };
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'queue' as const, label: 'Dispensation Queue', icon: ShoppingCart },
    { id: 'inventory' as const, label: 'Stock Registry', icon: Package },
  ];

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
              <div className="p-2 rounded-lg bg-primary text-white shadow-sm transition-transform duration-200 hover:scale-105">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-zinc-900 tracking-tight text-lg font-heading">
                Medflow<span className="text-primary">X</span>
              </span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-lg md:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 font-body">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-md font-bold'
                      : 'text-zinc-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                  {item.id === 'queue' && queue.length > 0 && (
                    <span className={`ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      {queue.length}
                    </span>
                  )}
                </button>
              );
            })}
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
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              Pharmacy
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-wider font-heading">
            <div className={`h-2.5 w-2.5 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20' : 'bg-rose-500 ring-4 ring-rose-500/20'}`} />
            <span>{socketConnected ? 'PHARMACY LIVE' : 'RECONNECTING...'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-l border-zinc-200 pl-4 font-body">
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-bold text-zinc-800 leading-tight">Pharmacy Desk</span>
                <span className="block text-[10px] text-zinc-400 font-semibold font-heading uppercase">Dispensation Counter</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm shadow-inner border border-primary/20">
                <Pill className="h-4 w-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Inner Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto font-body">
          
          {activeTab === 'queue' ? (
            /* ═══════════════════════ QUEUE WORKSPACE ═══════════════════════ */
            <div className="flex gap-6 h-[calc(100vh-160px)]">
              
              {/* Left: Patient Queue List */}
              <div className="w-[340px] shrink-0 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-zinc-200">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search patient..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-zinc-50 text-zinc-800 text-[11px] rounded-lg border border-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loadingQueue ? (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                      <RotateCw className="h-5 w-5 animate-spin mb-2 text-primary" />
                      <span className="text-[11px] font-medium">Syncing queue...</span>
                    </div>
                  ) : filteredQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                      <User className="h-8 w-8 text-zinc-200 mb-2" />
                      <p className="text-[11px] font-semibold text-zinc-500">No patients waiting</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Prescriptions will appear here.</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredQueue.map((visit) => {
                        const isSelected = selectedVisit?.id === visit.id;
                        const patientName = `${visit.patients?.first_name || ''} ${visit.patients?.last_name || ''}`;
                        const timeAgo = new Date(visit.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                          <button
                            key={visit.id}
                            onClick={() => setSelectedVisit(visit)}
                            className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 cursor-pointer relative ${
                              isSelected
                                ? 'bg-primary text-white shadow-md'
                                : 'hover:bg-zinc-50 text-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
                              }`}>
                                {visit.token_no}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`font-bold text-[13px] truncate leading-tight ${isSelected ? 'text-white' : 'text-zinc-800'}`}>
                                  {patientName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>
                                    {visit.patients?.age}y • {visit.patients?.gender}
                                  </span>
                                  <span className={`text-[10px] ${isSelected ? 'text-white/60' : 'text-zinc-400'}`}>
                                    • {timeAgo}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {!isSelected && (
                              <p className="mt-1.5 text-[10px] text-zinc-400 truncate pl-[42px]">
                                Dx: {visit.diagnoses[0]?.diagnosis || 'Consultation'} • By {visit.doctors?.profiles?.full_name || 'Doctor'}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Dispensation / Checkout Panel */}
              <div className="flex-1 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                {selectedVisit ? (
                  <div className="flex flex-col h-full">
                    {/* Patient Header */}
                    <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-bold text-zinc-900 font-heading leading-none">
                              {selectedVisit.patients?.first_name} {selectedVisit.patients?.last_name}
                            </h2>
                            <span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 border border-zinc-200 font-bold">
                              {selectedVisit.visit_number}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1 font-medium">
                            <span>{selectedVisit.patients?.age} Yrs / {selectedVisit.patients?.gender}</span>
                            <span className="text-zinc-300">•</span>
                            <span>Dx: <strong className="text-primary">{selectedVisit.diagnoses[0]?.diagnosis || 'N/A'}</strong></span>
                            <span className="text-zinc-300">•</span>
                            <span>Dr. {selectedVisit.doctors?.profiles?.full_name || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedVisit(null)}
                        className="text-zinc-400 hover:text-zinc-700 p-2 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Prescription Items */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full" />
                        Prescribed Medications
                      </h3>

                      {checkoutItems.length === 0 ? (
                        <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center text-zinc-400 text-xs bg-zinc-50/50">
                          No medicines prescribed for this visit.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {checkoutItems.map((item, idx) => {
                            const originalItem = selectedVisit.prescriptions[0].prescription_items[idx];
                            const stockStatus = getStockStatus(item.medicine_id, item.quantity);

                            return (
                              <div key={item.medicine_id} className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-300 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-bold text-zinc-800 text-sm">{item.medicine_name}</h4>
                                    <div className="text-[11px] text-zinc-500 mt-0.5 flex flex-wrap gap-x-3 font-medium">
                                      <span>Dosage: <strong className="text-zinc-700">{originalItem.dosage}</strong></span>
                                      <span>Freq: <strong className="text-zinc-700">{originalItem.frequency}</strong></span>
                                      <span>Duration: <strong className="text-zinc-700">{originalItem.duration}</strong></span>
                                    </div>
                                    {originalItem.instructions && (
                                      <p className="text-[10px] text-primary mt-1 font-semibold">* {originalItem.instructions}</p>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    stockStatus.disabled 
                                      ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  }`}>
                                    {stockStatus.label}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 pt-3 items-center">
                                  <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quantity</label>
                                    <span className="text-xs font-bold text-zinc-700 mt-0.5 block">{item.quantity} {originalItem.medicines?.unit || 'Units'}</span>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Unit Price (₹)</label>
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
                                      className="w-24 py-1.5 px-2.5 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all font-bold"
                                    />
                                  </div>
                                  <div className="text-right">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total</label>
                                    <span className="text-sm font-bold text-primary mt-0.5 block">
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

                    {/* Bill & Payment Footer */}
                    <div className="border-t border-zinc-200 p-5 bg-zinc-50/30 shrink-0">
                      <div className="grid grid-cols-2 gap-5 mb-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Discount (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={discount || ''}
                              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-full py-2 px-3 bg-white text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Payment Mode</label>
                            <div className="grid grid-cols-3 gap-2">
                              {(['Cash', 'UPI', 'Card'] as const).map((mode) => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => setPaymentMode(mode)}
                                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                    paymentMode === mode
                                      ? 'bg-primary/10 border-primary text-primary'
                                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                                  }`}
                                >
                                  {mode}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end text-right space-y-1.5">
                          <div className="flex justify-between text-xs text-zinc-500">
                            <span>Subtotal:</span>
                            <span className="font-semibold">₹{billSummary.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-zinc-500">
                            <span>Discount:</span>
                            <span className="text-amber-600 font-semibold">-₹{discount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold border-t border-zinc-200 pt-2 text-zinc-900">
                            <span>Total:</span>
                            <span className="text-primary">₹{billSummary.finalTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleCheckout}
                        disabled={checkingOut || checkoutItems.some((item) => getStockStatus(item.medicine_id, item.quantity).disabled)}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          checkoutItems.some((item) => getStockStatus(item.medicine_id, item.quantity).disabled)
                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                            : 'bg-cta hover:bg-cta/90 text-white shadow-sm'
                        }`}
                      >
                        {checkingOut ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        {checkingOut ? 'Processing...' : 'Dispense & Complete Sale'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-xs">
                      <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-primary">
                        <Pill className="h-7 w-7" />
                      </div>
                      <h3 className="text-sm font-bold text-zinc-800 mb-1.5">Select a Patient</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Choose a patient from the queue to review their prescription, adjust pricing, and dispense medicines.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ═══════════════════════ INVENTORY / STOCK REGISTRY ═══════════════════════ */
            <div className="space-y-5">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search medicine by name..."
                    value={medSearchQuery}
                    onChange={(e) => setMedSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white text-zinc-800 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowAddMedModal(true)}
                    className="flex-1 md:flex-none px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Medicine
                  </button>
                  <button
                    onClick={() => setShowAddStockModal(true)}
                    className="flex-1 md:flex-none px-4 py-2.5 bg-cta hover:bg-cta/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" /> Top-up Stock
                  </button>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                {loadingMeds ? (
                  <div className="py-16 flex flex-col items-center justify-center text-zinc-400">
                    <RotateCw className="h-5 w-5 animate-spin mb-2 text-primary" />
                    <span className="text-xs font-medium">Loading stock registry...</span>
                  </div>
                ) : filteredMedicines.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-zinc-400">
                    <Package className="h-8 w-8 text-zinc-200 mb-2" />
                    <span className="text-xs">No medicines found. Add one to get started.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50">
                          <th className="py-3 px-4 font-bold text-[10px] text-zinc-400 uppercase tracking-wider">Medicine</th>
                          <th className="py-3 px-4 font-bold text-[10px] text-zinc-400 uppercase tracking-wider">Generic Name</th>
                          <th className="py-3 px-4 font-bold text-[10px] text-zinc-400 uppercase tracking-wider">Strength / Unit</th>
                          <th className="py-3 px-4 font-bold text-[10px] text-zinc-400 uppercase tracking-wider">Manufacturer</th>
                          <th className="py-3 px-4 font-bold text-[10px] text-zinc-400 uppercase tracking-wider text-center">Available</th>
                          <th className="py-3 px-4 font-bold text-[10px] text-zinc-400 uppercase tracking-wider text-right">Price</th>
                          <th className="py-3 px-4 font-bold text-[10px] text-zinc-400 uppercase tracking-wider text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredMedicines.map((med) => {
                          const isLowStock = med.total_stock <= med.reorder_level;
                          const isOutOfStock = med.total_stock === 0;

                          return (
                            <tr key={med.id} className="hover:bg-zinc-50 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-zinc-800">{med.medicine_name}</td>
                              <td className="py-3.5 px-4 text-zinc-500 font-mono text-[10px]">{med.generic_name || 'N/A'}</td>
                              <td className="py-3.5 px-4 text-zinc-600">
                                {med.strength}{' '}
                                <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 font-bold">{med.unit}</span>
                              </td>
                              <td className="py-3.5 px-4 text-zinc-500">{med.manufacturer || 'N/A'}</td>
                              <td className="py-3.5 px-4 text-center font-bold text-zinc-800">{med.total_stock}</td>
                              <td className="py-3.5 px-4 text-right text-primary font-bold">₹{med.unit_price.toFixed(2)}</td>
                              <td className="py-3.5 px-4 text-center">
                                {isOutOfStock ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                    Out of Stock
                                  </span>
                                ) : isLowStock ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                    Low Stock
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
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
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════ ADD MEDICINE MODAL ═══════════════════════ */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-zinc-800 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Register New Medicine
            </h3>
            <form onSubmit={handleAddMedicine} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol"
                  value={newMed.medicine_name}
                  onChange={(e) => setNewMed({ ...newMed, medicine_name: e.target.value })}
                  className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Generic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acetaminophen"
                  value={newMed.generic_name}
                  onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })}
                  className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg"
                    value={newMed.strength}
                    onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                    className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Unit Type</label>
                  <select
                    value={newMed.unit}
                    onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })}
                    className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary cursor-pointer transition-all"
                  >
                    <option value="Tablets">Tablets</option>
                    <option value="Capsules">Capsules</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injections">Injections</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Cipla"
                    value={newMed.manufacturer}
                    onChange={(e) => setNewMed({ ...newMed, manufacturer: e.target.value })}
                    className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={newMed.reorder_level}
                    onChange={(e) => setNewMed({ ...newMed, reorder_level: parseInt(e.target.value) || 0 })}
                    className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMed}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-white transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {submittingMed ? <RotateCw className="h-3 w-3 animate-spin" /> : null}
                  {submittingMed ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════ ADD STOCK MODAL ═══════════════════════ */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-zinc-800 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-cta rounded-full" />
              Top-up Stock Batch
            </h3>
            <form onSubmit={handleAddStock} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Select Medicine *</label>
                <select
                  required
                  value={stockEntry.medicine_id}
                  onChange={(e) => setStockEntry({ ...stockEntry, medicine_id: e.target.value })}
                  className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary cursor-pointer transition-all"
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.medicine_name} ({m.strength})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Batch No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH123"
                    value={stockEntry.batch_no}
                    onChange={(e) => setStockEntry({ ...stockEntry, batch_no: e.target.value })}
                    className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={stockEntry.expiry_date}
                    onChange={(e) => setStockEntry({ ...stockEntry, expiry_date: e.target.value })}
                    className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Purchase ₹ *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={stockEntry.purchase_price}
                    onChange={(e) => setStockEntry({ ...stockEntry, purchase_price: e.target.value })}
                    className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Selling ₹ *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={stockEntry.selling_price}
                    onChange={(e) => setStockEntry({ ...stockEntry, selling_price: e.target.value })}
                    className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Qty *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={stockEntry.quantity}
                    onChange={(e) => setStockEntry({ ...stockEntry, quantity: e.target.value })}
                    className="w-full py-2 px-3 bg-zinc-50 text-zinc-800 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStock}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-cta hover:bg-cta/90 text-white transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  {submittingStock ? <RotateCw className="h-3 w-3 animate-spin" /> : null}
                  {submittingStock ? 'Adding...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
