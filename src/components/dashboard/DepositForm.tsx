'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import CopyButton from './CopyButton';

const CRYPTO_GATEWAYS = [
  { id: 'coingate', name: 'CoinGate (Auto)', description: 'Pay with BTC, ETH, LTC, USDT and 70+ coins' },
  { id: 'nowpayments', name: 'NOWPayments (Auto)', description: 'Pay with 150+ cryptocurrencies' },
  { id: 'coinbase', name: 'Coinbase Commerce (Auto)', description: 'Pay with BTC, ETH, USDC, DAI' },
  { id: 'manual', name: 'Manual Transfer', description: 'Send crypto to wallet address (admin approval)' },
];

const MANUAL_CURRENCIES = [
  { id: 'btc', name: 'Bitcoin (BTC)', network: 'Bitcoin' },
  { id: 'eth', name: 'Ethereum (ETH)', network: 'ERC-20' },
  { id: 'usdt_trc20', name: 'USDT (TRC-20)', network: 'Tron' },
  { id: 'usdt_erc20', name: 'USDT (ERC-20)', network: 'Ethereum' },
  { id: 'bnb', name: 'BNB', network: 'BSC' },
  { id: 'ltc', name: 'Litecoin (LTC)', network: 'Litecoin' },
];

const NOWPAY_CURRENCIES = [
  { id: 'btc', name: 'Bitcoin (BTC)' },
  { id: 'eth', name: 'Ethereum (ETH)' },
  { id: 'usdttrc20', name: 'USDT (TRC-20)' },
  { id: 'usdterc20', name: 'USDT (ERC-20)' },
  { id: 'ltc', name: 'Litecoin (LTC)' },
  { id: 'bnbbsc', name: 'BNB (BSC)' },
  { id: 'trx', name: 'Tron (TRX)' },
  { id: 'xrp', name: 'Ripple (XRP)' },
];

interface DepositFormProps {
  gateways: any[];
}

export default function DepositForm({ gateways }: DepositFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ gateway: '', amount: '', pay_currency: '' });
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/deposit/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: form.gateway,
          amount: Number(form.amount),
          pay_currency: form.pay_currency,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.data.payment_url) {
          // Redirect to payment page
          window.open(data.data.payment_url, '_blank');
          setMessage({ type: 'success', text: 'Payment page opened. Complete the payment there.' });
        } else {
          // Show wallet address
          setPaymentData(data.data);
          setStep('payment');
        }
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'payment' && paymentData) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Send Payment</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Send the exact amount to the address below. Your balance will be credited after confirmation.
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Amount (USD)</p>
            <p className="text-2xl font-bold text-gray-900">${form.amount}</p>
          </div>

          {paymentData.amount_crypto && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Amount ({paymentData.currency})</p>
              <p className="text-lg font-bold text-indigo-600">{paymentData.amount_crypto} {paymentData.currency}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-gray-100 rounded-lg text-sm font-mono break-all">{paymentData.wallet_address}</code>
              <CopyButton text={paymentData.wallet_address} />
            </div>
          </div>

          {paymentData.trx && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Transaction Reference</p>
              <code className="block p-3 bg-gray-100 rounded-lg text-sm font-mono">{paymentData.trx}</code>
            </div>
          )}

          <div className="pt-4">
            <Button variant="outline" onClick={() => { setStep('form'); setPaymentData(null); }} className="w-full">
              Back to Deposit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Crypto Deposit</h3>
      </CardHeader>
      <CardContent>
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Gateway Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CRYPTO_GATEWAYS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setForm({ ...form, gateway: g.id, pay_currency: '' })}
                  className={`p-3 rounded-lg border text-left transition-all ${form.gateway === g.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <p className="text-sm font-medium text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Currency selection for NOWPayments */}
          {form.gateway === 'nowpayments' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pay With</label>
              <select
                value={form.pay_currency}
                onChange={(e) => setForm({ ...form, pay_currency: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select cryptocurrency</option>
                {NOWPAY_CURRENCIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Currency selection for manual */}
          {form.gateway === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cryptocurrency</label>
              <select
                value={form.pay_currency}
                onChange={(e) => setForm({ ...form, pay_currency: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select cryptocurrency</option>
                {MANUAL_CURRENCIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.network})</option>
                ))}
              </select>
            </div>
          )}

          <Input
            id="amount"
            label="Amount (USD)"
            type="number"
            step="0.01"
            min="10"
            placeholder="Minimum $10"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />

          <Button type="submit" loading={loading} disabled={!form.gateway || !form.amount} className="w-full">
            {form.gateway === 'manual' ? 'Get Wallet Address' : 'Pay with Crypto'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
