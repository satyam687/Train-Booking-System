import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsApi } from '../api/bookingsApi';
import { paymentsApi } from '../api/paymentsApi';
import { useToast } from '../context/ToastContext';
import {
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Lock,
  Train,
  CheckCircle2
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const PaymentDemoPage = () => {
  const { reference } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    bookingsApi
      .getBookingDetail(reference)
      .then((res) => {
        setBooking(res.data);
        if (res.data.booking_status === 'CONFIRMED' && res.data.payment_status === 'PAID') {
          navigate(`/booking/confirmed/${reference}`);
        }
      })
      .catch((err) => {
        toast.error('Could not load booking details.');
      })
      .finally(() => setLoading(false));
  }, [reference]);

  const handlePay = async () => {
    setProcessing(true);
    try {
      const res = await paymentsApi.processDemoPayment(reference, paymentMethod);
      toast.success('Demo payment confirmed! Your e-ticket is ready.');
      navigate(`/booking/confirmed/${reference}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment simulation failed.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-lg text-slate-900">Booking Not Found</h3>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Complete Payment
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Finalize your reservation for booking reference: <strong className="text-blue-900">{booking.booking_reference}</strong>
        </p>
      </div>

      {/* Safety & Demo Disclaimer Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-0.5">DEMO PAYMENT SIMULATION GATEWAY</strong>
          <span>
            This is a secure mock sandbox. No actual currency, debit, or bank accounts are accessed.
            Select any demo payment mode below and click confirm to complete your instant booking.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Payment Methods */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Choose Payment Method
          </h3>

          <div className="space-y-3">
            {[
              { id: 'UPI', name: 'Unified Payments Interface (UPI)', desc: 'Instant QR Code or VPA (GPay / PhonePe / Paytm)', icon: QrCode },
              { id: 'CREDIT_CARD', name: 'Credit / Debit Card (Demo)', desc: 'Simulated Visa, Mastercard, RuPay', icon: CreditCard },
              { id: 'NET_BANKING', name: 'Internet Banking (Demo)', desc: 'SBI, HDFC, ICICI, Axis Bank', icon: Building2 },
              { id: 'WALLET', name: 'IRCTC e-Wallet / PayZapp', desc: 'Pre-paid railway digital wallet', icon: Wallet },
            ].map((method) => {
              const active = paymentMethod === method.id;
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                    active
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-sm">{method.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{method.desc}</div>
                  </div>
                  <div className="pt-1">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Demo Form Field */}
          {paymentMethod === 'UPI' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <label className="block font-semibold text-slate-700">Virtual Payment Address (VPA / UPI ID)</label>
              <input
                type="text"
                readOnly
                value="passenger@railbook.upi"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
              />
              <span className="text-[11px] text-slate-500">Auto-authorized sandbox simulation handle</span>
            </div>
          )}

          {paymentMethod === 'CREDIT_CARD' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Simulated Card Number</label>
                <input
                  type="text"
                  readOnly
                  value="4111 •••• •••• 1111"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid Thru</label>
                  <input type="text" readOnly value="12/28" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-700" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CVV</label>
                  <input type="password" readOnly value="***" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-700" />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-4 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{processing ? 'Authorizing Demo Payment...' : `Confirm & Pay ₹${Math.round(booking.total_fare)}`}</span>
          </button>
        </div>

        {/* Order Details Panel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
            <Train className="w-4 h-4 text-blue-600" />
            <span>Booking Details</span>
          </h3>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-blue-900 uppercase">#{booking.train_number}</span>
            <div className="font-bold text-slate-900 text-sm">{booking.train_name}</div>
            <div className="text-xs text-slate-500">{booking.source_station_name} → {booking.destination_station_name}</div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Class:</span>
              <strong className="text-slate-900">{booking.class_name} ({booking.class_code})</strong>
            </div>
            <div className="flex justify-between">
              <span>Journey Date:</span>
              <strong className="text-slate-900">{booking.journey_date}</strong>
            </div>
            <div className="flex justify-between">
              <span>Passengers:</span>
              <strong className="text-slate-900">{booking.passenger_count}</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-black">
            <span className="text-xs text-slate-700">Total Payable:</span>
            <span className="text-xl text-slate-900 font-extrabold">₹{Math.round(booking.total_fare)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
