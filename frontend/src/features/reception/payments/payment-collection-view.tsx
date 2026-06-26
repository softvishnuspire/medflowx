'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { collectPayment } from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { 
  IndianRupee, 
  CreditCard, 
  Coins, 
  Smartphone, 
  CheckCircle,
  FileCheck2
} from 'lucide-react';

interface PaymentCollectionViewProps {
  visitId: number;
  invoiceId: number;
  amount: number;
  patientName: string;
  visitNumber: string;
  onSuccess: () => void;
}

type PaymentMethod = 'Cash' | 'UPI' | 'Card';

export default function PaymentCollectionView({
  visitId,
  invoiceId,
  amount,
  patientName,
  visitNumber,
  onSuccess,
}: PaymentCollectionViewProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const { toast } = useToast();

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((paymentMethod === 'UPI' || paymentMethod === 'Card') && !transactionRef.trim()) {
      toast('Please enter a transaction reference number', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await collectPayment({
        visit_id: visitId,
        invoice_id: invoiceId,
        amount: amount,
        payment_mode: paymentMethod,
        transaction_reference: transactionRef || undefined,
        payment_status: 'Paid',
      });

      setIsPaidSuccess(true);
      toast('Payment collected successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      toast(err.message || 'Failed to record payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPaidSuccess) {
    return (
      <Card className="max-w-md mx-auto border border-zinc-150 shadow-md py-10 bg-white rounded-xl font-body">
        <CardContent className="flex flex-col items-center justify-center text-center space-y-6 p-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner animate-pulse">
            <CheckCircle className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-950 font-heading">Payment Received!</h2>
            <p className="text-sm font-semibold text-emerald-600">Patient sent to Doctor</p>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 w-full text-sm space-y-2 text-left">
            <div className="flex justify-between text-xs text-zinc-500 border-b border-zinc-100 pb-2">
              <span>Visit Number:</span>
              <span className="font-mono font-bold text-zinc-700">{visitNumber}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 border-b border-zinc-100 pb-2">
              <span>Patient:</span>
              <span className="font-semibold text-zinc-750">{patientName}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 border-b border-zinc-100 pb-2">
              <span>Amount Paid:</span>
              <span className="font-bold text-zinc-900">₹{amount}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Payment Method:</span>
              <span className="font-semibold text-zinc-800">{paymentMethod}</span>
            </div>
          </div>

          <div className="w-full">
            <button
              onClick={onSuccess}
              className="w-full h-10 bg-cta hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              Go to Today's Queue
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const paymentModes = [
    { mode: 'Cash' as const, label: 'Cash', icon: Coins },
    { mode: 'UPI' as const, label: 'UPI / Scan', icon: Smartphone },
    { mode: 'Card' as const, label: 'Card Swipe', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 max-w-lg mx-auto font-body text-zinc-700">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Collect Consultation Fee</h1>
        <p className="text-sm text-zinc-500 mt-1">Record consultation payment to activate the visit in the queue.</p>
      </div>

      <Card className="border border-zinc-150/70 shadow-sm bg-white rounded-xl">
        <CardContent className="p-6">
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-sm font-semibold text-zinc-800 font-heading">
              <IndianRupee className="h-4.5 w-4.5 text-primary" />
              <span>Payment Details</span>
            </div>

            {/* Visit Info Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-primary/5 border border-primary/10 rounded-xl text-sm">
              <div>
                <span className="text-xs text-zinc-455 font-semibold block font-heading">Patient Name</span>
                <span className="font-bold text-zinc-800">{patientName}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-455 font-semibold block font-heading">Visit Number</span>
                <span className="font-mono font-bold text-zinc-800">{visitNumber}</span>
              </div>
            </div>

            {/* Amount display */}
            <div className="text-center py-6 border border-zinc-200 rounded-xl bg-white shadow-inner">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-heading">Total Amount Due</span>
              <span className="text-4xl font-extrabold text-cta tracking-tight mt-1 inline-block">₹{amount}</span>
              <span className="block text-[10px] text-zinc-400 mt-1.5 font-medium">Consultation fee only. Includes basic OPD taxes.</span>
            </div>

            {/* Select Method */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 font-heading font-heading">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {paymentModes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.mode;
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(item.mode);
                        setTransactionRef(''); // reset ref when mode changes
                      }}
                      className={`p-3 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs'
                          : 'border-zinc-200 hover:border-primary/45 hover:bg-primary/5/10 text-zinc-650'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-zinc-550'}`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ref Code for Digital Modes */}
            {(paymentMethod === 'UPI' || paymentMethod === 'Card') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-500 font-heading">
                  Transaction Reference / UTR Number *
                </label>
                <input
                  type="text"
                  placeholder="Enter 12-digit transaction ID or reference"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-zinc-400"
                />
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-cta hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <FileCheck2 className="h-4.5 w-4.5" />
                    Confirm Consultation Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
