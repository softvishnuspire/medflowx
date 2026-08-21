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
      <Card className="max-w-md mx-auto border border-slate-100 shadow-sm py-8 bg-white rounded-3xl font-body">
        <CardContent className="flex flex-col items-center justify-center text-center gap-5 p-6">
          <View className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 items-center justify-center">
            <CheckCircle className="h-9 w-9 text-emerald-600" />
          </View>
          
          <View className="items-center gap-1">
            <Text className="text-xl font-black text-slate-900">Payment Received!</Text>
            <Text className="text-xs font-bold text-emerald-600">Patient sent to Doctor Queue</Text>
          </View>

          <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full gap-2">
            <View className="flex-row justify-between text-xs border-b border-slate-200/50 pb-2">
              <Text className="text-slate-400 font-bold">Visit Number:</Text>
              <Text className="font-mono font-black text-slate-800">{visitNumber}</Text>
            </View>
            <View className="flex-row justify-between text-xs border-b border-slate-200/50 pb-2">
              <Text className="text-slate-400 font-bold">Patient:</Text>
              <Text className="font-bold text-slate-900">{patientName}</Text>
            </View>
            <View className="flex-row justify-between text-xs border-b border-slate-200/50 pb-2">
              <Text className="text-slate-400 font-bold">Amount Paid:</Text>
              <Text className="font-black text-emerald-700">₹{amount}</Text>
            </View>
            <View className="flex-row justify-between text-xs">
              <Text className="text-slate-400 font-bold">Payment Method:</Text>
              <Text className="font-black text-cyan-800">{paymentMethod}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onSuccess}
            className="w-full h-12 bg-cyan-600 active:bg-cyan-700 rounded-2xl items-center justify-center shadow-xs"
          >
            <Text className="text-white font-black text-xs">Go to Today's Queue</Text>
          </TouchableOpacity>
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
    <View className="gap-5 max-w-lg mx-auto w-full">
      <View>
        <Text className="text-xl font-black text-slate-900">Collect Consultation Fee</Text>
        <Text className="text-xs text-slate-500 font-medium mt-0.5">Record consultation payment to activate the visit in the queue.</Text>
      </View>

      <Card className="border border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-5 gap-5">
          <View className="flex-row items-center gap-2 border-b border-slate-100 pb-3">
            <IndianRupee className="h-4 w-4 text-cyan-600" />
            <Text className="text-xs font-black text-slate-800 uppercase tracking-wider">Payment Details</Text>
          </View>

          {/* Visit Info Summary */}
          <View className="flex-row gap-3 p-4 bg-cyan-50/60 border border-cyan-100 rounded-2xl">
            <View className="flex-1">
              <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Patient Name</Text>
              <Text className="font-black text-slate-900 text-xs">{patientName}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Visit Number</Text>
              <Text className="font-mono font-black text-cyan-800 text-xs">{visitNumber}</Text>
            </View>
          </View>

          {/* Amount display */}
          <View className="items-center justify-center py-5 border border-slate-200/70 rounded-2xl bg-slate-50/50">
            <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Amount Due</Text>
            <Text className="text-3xl font-black text-slate-900 mt-1">₹{amount}</Text>
            {amount === 0 ? (
              <Text className="text-[10px] text-emerald-600 mt-1 font-black uppercase">Repeat Patient - Free Consultation</Text>
            ) : (
              <Text className="text-[10px] text-slate-400 mt-1 font-medium">Consultation fee only. Includes basic OPD taxes.</Text>
            )}
          </View>

          {/* Select Method */}
          <View className="gap-2">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Payment Method</Text>
            <View className="flex-row gap-2.5">
              {paymentModes.map((item) => {
                const Icon = item.icon;
                const isSelected = paymentMethod === item.mode;
                return (
                  <TouchableOpacity
                    key={item.mode}
                    onPress={() => {
                      setPaymentMethod(item.mode);
                      setTransactionRef('');
                    }}
                    className={`flex-1 p-3 border rounded-2xl items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-50'
                        : 'border-slate-200/70 bg-white active:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-cyan-600' : 'text-slate-400'}`} />
                    <Text className={`text-xs font-bold ${isSelected ? 'text-cyan-900' : 'text-slate-700'}`}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Ref Code for Digital Modes */}
          {(paymentMethod === 'UPI' || paymentMethod === 'Card') && (
            <View className="gap-1">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Transaction Reference / UTR Number *
              </Text>
              <TextInput
                placeholder="Enter 12-digit transaction ID or reference"
                value={transactionRef}
                onChangeText={(text) => setTransactionRef(text)}
                className="w-full h-10 px-3 border border-slate-200/70 rounded-2xl text-xs bg-slate-50 text-slate-900 font-bold"
                placeholderTextColor="#94a3b8"
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handlePaymentSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-cyan-600 active:bg-cyan-700 rounded-2xl flex-row items-center justify-center gap-2 shadow-xs mt-2"
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white font-black text-xs">Processing...</Text>
              </>
            ) : (
              <>
                <FileCheck2 className="h-4 w-4 text-white" />
                <Text className="text-white font-black text-xs">
                  {amount === 0 ? 'Confirm Free Visit' : 'Confirm Consultation Payment'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </CardContent>
      </Card>
    </View>
  );
}
