import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { collectPayment } from '@/services/reception';
import { useToast } from '@/components/ui/toast';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { 
  IndianRupee, 
  CreditCard, 
  Coins, 
  Smartphone, 
  CheckCircle,
  FileCheck2
} from 'lucide-react-native';

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

  const handlePaymentSubmit = async () => {
    if (amount > 0 && (paymentMethod === 'UPI' || paymentMethod === 'Card') && !transactionRef.trim()) {
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
          <View className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner animate-pulse">
            <CheckCircle className="h-10 w-10" />
          </View>
          
          <View className="space-y-2">
            <Text className="text-2xl font-bold text-zinc-950 font-heading">Payment Received!</Text>
            <Text className="text-sm font-semibold text-emerald-600">Patient sent to Doctor</Text>
          </View>

          <View className="bg-primary/5 border border-primary/10 rounded-xl p-4 w-full text-sm space-y-2 text-left">
            <View className="flex-row justify-between text-xs text-zinc-500 border-b border-zinc-100 pb-2">
              <Text>Visit Number:</Text>
              <Text className="font-mono font-bold text-zinc-700">{visitNumber}</Text>
            </View>
            <View className="flex-row justify-between text-xs text-zinc-500 border-b border-zinc-100 pb-2">
              <Text>Patient:</Text>
              <Text className="font-semibold text-zinc-750">{patientName}</Text>
            </View>
            <View className="flex-row justify-between text-xs text-zinc-500 border-b border-zinc-100 pb-2">
              <Text>Amount Paid:</Text>
              <Text className="font-bold text-zinc-900">₹{amount}</Text>
            </View>
            <View className="flex-row justify-between text-xs text-zinc-500">
              <Text>Payment Method:</Text>
              <Text className="font-semibold text-zinc-800">{paymentMethod}</Text>
            </View>
          </View>

          <View className="w-full">
            <TouchableOpacity
              onPress={onSuccess}
              className="w-full h-10 bg-cta hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer items-center justify-center"
            >
              <Text className="text-white font-semibold">Go to Today's Queue</Text>
            </TouchableOpacity>
          </View>
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
    <View className="space-y-6 max-w-lg mx-auto font-body text-zinc-700">
      <View>
        <Text className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Collect Consultation Fee</Text>
        <Text className="text-sm text-zinc-500 mt-1">Record consultation payment to activate the visit in the queue.</Text>
      </View>

      <Card className="border border-zinc-150/70 shadow-sm bg-white rounded-xl">
        <CardContent className="p-6">
          <View className="space-y-6">
            <View className="flex-row items-center gap-2 border-b border-zinc-100 pb-3 text-sm font-semibold text-zinc-800 font-heading">
              <IndianRupee className="h-4.5 w-4.5 text-primary" />
              <Text>Payment Details</Text>
            </View>

            {/* Visit Info Summary */}
            <View className="grid grid-cols-2 gap-4 p-4 bg-primary/5 border border-primary/10 rounded-xl text-sm">
              <View>
                <Text className="text-xs text-zinc-455 font-semibold block font-heading">Patient Name</Text>
                <Text className="font-bold text-zinc-800">{patientName}</Text>
              </View>
              <View>
                <Text className="text-xs text-zinc-455 font-semibold block font-heading">Visit Number</Text>
                <Text className="font-mono font-bold text-zinc-800">{visitNumber}</Text>
              </View>
            </View>

            {/* Amount display */}
            <View className="text-center py-6 border border-zinc-200 rounded-xl bg-white shadow-inner">
              <Text className="text-xs text-zinc-500 font-bold uppercase tracking-wider block font-heading">Total Amount Due</Text>
              <Text className="text-4xl font-extrabold text-cta tracking-tight mt-1 inline-block">₹{amount}</Text>
              {amount === 0 ? (
                <Text className="block text-[10px] text-emerald-600 mt-1.5 font-bold uppercase font-heading">Repeat Patient - Free Consultation</Text>
              ) : (
                <Text className="block text-[10px] text-zinc-400 mt-1.5 font-medium">Consultation fee only. Includes basic OPD taxes.</Text>
              )}
            </View>

            {/* Select Method */}
            <View className="space-y-2">
              <Text className="block text-xs font-bold text-zinc-500 font-heading">Select Payment Method</Text>
              <View className="grid grid-cols-3 gap-3">
                {paymentModes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.mode;
                  return (
                    <TouchableOpacity
                      key={item.mode}
                      onPress={() => {
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
                      <Text className="text-xs font-semibold">{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Ref Code for Digital Modes */}
            {(paymentMethod === 'UPI' || paymentMethod === 'Card') && (
              <View className="space-y-1.5">
                <Text className="block text-xs font-bold text-zinc-500 font-heading">
                  Transaction Reference / UTR Number *
                </Text>
                <TextInput
                  placeholder="Enter 12-digit transaction ID or reference"
                  value={transactionRef}
                  onChangeText={(text) => setTransactionRef(text)}
                  className="w-full h-10 px-3 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-zinc-400"
                />
              </View>
            )}

            {/* Submit */}
            <View className="pt-2">
              <TouchableOpacity
                onPress={handlePaymentSubmit}
                disabled={isSubmitting}
                className="w-full h-10 bg-cta hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex flex-row items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" className="mr-1.5" />
                    <Text className="text-white font-semibold">Processing...</Text>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="h-4.5 w-4.5 text-white" />
                    <Text className="text-white font-semibold">{amount === 0 ? 'Confirm Free Visit' : 'Confirm Consultation Payment'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
