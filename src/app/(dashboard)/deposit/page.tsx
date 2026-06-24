'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Copy, CheckCircle, AlertCircle, Upload, ArrowLeft, ArrowRight, Shield, Wallet, ChevronDown } from 'lucide-react';

interface GatewayField { id: number; label: string; field_name: string; placeholder: string | null; type: string; options: any; required: number; }
interface Gateway { id: number; name: string; currency: string | null; logo: string | null; min_amount: number; max_amount: number; exchange_rate: number; qr_code: string | null; wallet_address: string | null; show_copy_btn: boolean; show_charge: boolean; fixed_charge: number; percent_charge: number; instructions: string | null; show_proof: boolean; proof_types: string; proof_max_size: number; fields: GatewayField[]; }

type Step = 'form' | 'payment' | 'proof';

export default function DepositPage() {
  const router = useRouter();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [balance, setBalance] = useState(0);
  const [selected, setSelected] = useState<Gateway | null>(null);
  const [amount, setAmount] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [proofUrl, setProofUrl] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<Step>('form');

  useEffect(() => {
    Promise.all([
      fetch('/api/deposit/gateway').then(r => r.json()),
      fetch('/api/user/balance').then(r => r.json()).catch(() => ({ balance: 0 })),
    ]).then(([gwData, balData]) => {
      if (gwData.success) {
        setGateways(gwData.data);
        if (gwData.data.length > 0) selectGateway(gwData.data[0]);
      }
      if (balData.balance !== undefined) setBalance(balData.balance);
    }).finally(() => setLoading(false));
  }, []);

  const selectGateway = (gw: Gateway) => {
    setSelected(gw);
    setAmount('');
    setProofUrl('');
    setMsg({ type: '', text: '' });
    const d: Record<string, string> = {};
    gw.fields.forEach((f) => { d[f.field_name] = ''; });
    setFields(d);
  };

  const goToPayment = () => {
    if (!selected || !amount) return;
    const a = Number(amount);
    if (a < selected.min_amount || a > selected.max_amount) {
      setMsg({ type: 'error', text: `Amount must be between ${selected.min_amount} and ${selected.max_amount}` });
      return;
    }
    setMsg({ type: '', text: '' });
    setStep('payment');
  };

  const goToProof = () => setStep('proof');
  const goBack = () => {
    if (step === 'payment') setStep('form');
    else if (step === 'proof') setStep('payment');
  };

  const copyWallet = () => {
    if (selected?.wallet_address) {
      navigator.clipboard.writeText(selected.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const uploadProof = async (file: File) => {
    setProofUploading(true);
    const fd = new FormData(); fd.append('file', file); fd.append('type', 'deposit');
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.success) setProofUrl(d.data.path);
      else setMsg({ type: 'error', text: d.message });
    } catch { setMsg({ type: 'error', text: 'Upload failed' }); }
    setProofUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    for (const f of selected.fields) {
      if (f.required === 1 && !fields[f.field_name]?.trim()) {
        setMsg({ type: 'error', text: `${f.label} is required` }); return;
      }
    }
    if (selected.show_proof && !proofUrl) { setMsg({ type: 'error', text: 'Payment proof is required' }); return; }
    setSubmitting(true); setMsg({ type: '', text: '' });
    try {
      const r = await fetch('/api/deposit/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway_id: selected.id, amount: Number(amount), fields, proof_url: proofUrl }),
      });
      const d = await r.json();
      setMsg({ type: d.success ? 'success' : 'error', text: d.message });
      if (d.success) setTimeout(() => router.push('/wallet'), 2000);
    } catch { setMsg({ type: 'error', text: 'Something went wrong' }); }
    setSubmitting(false);
  };

  const charge = selected && selected.show_charge ? selected.fixed_charge + (Number(amount || 0) * selected.percent_charge / 100) : 0;
  const total = selected ? (Number(amount || 0) + charge) * selected.exchange_rate : 0;

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {step !== 'form' && (
          <button onClick={goBack} className="p-2 hover:bg-slate-800 rounded-lg">
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">Deposit Funds</h2>
          <p className="text-xs text-slate-500">Add money to your account</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Shield size={12} className="text-emerald-400" />
          <span>Secure</span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-cyan-700 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">Current Balance</p>
            <p className="text-2xl font-bold mt-0.5">{balance.toFixed(2)} <span className="text-sm font-normal text-white/70">USDT</span></p>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Wallet size={20} className="text-white/80" />
          </div>
        </div>
      </div>

      {/* Messages */}
      {msg.text && (
        <div className={`p-3.5 rounded-xl text-sm flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {msg.text}
        </div>
      )}

      {/* STEP: Form - Select Gateway + Amount */}
      {step === 'form' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-5">
          {/* Gateway Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Payment Method</label>
            <div className="relative">
              <select
                value={selected?.id || ''}
                onChange={(e) => {
                  const gw = gateways.find(g => g.id === Number(e.target.value));
                  if (gw) selectGateway(gw);
                }}
                className="w-full appearance-none px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-emerald-500 pr-10"
              >
                {gateways.map(gw => (
                  <option key={gw.id} value={gw.id}>{gw.name} ({gw.currency}) — Min: {gw.min_amount}, Max: {gw.max_amount}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Amount Input */}
          {selected && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Amount ({selected.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  min={selected.min_amount}
                  max={selected.max_amount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-xl font-bold text-center text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  placeholder="0.00"
                />
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                  Min: {selected.min_amount} — Max: {selected.max_amount} {selected.currency}
                </p>
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                      amount === String(amt)
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* Charge Summary */}
              {selected.show_charge && amount && Number(amount) > 0 && (
                <div className="space-y-2 text-xs bg-slate-800 rounded-xl p-4">
                  <div className="flex justify-between text-slate-400">
                    <span>Amount</span>
                    <span>{Number(amount).toFixed(2)} {selected.currency}</span>
                  </div>
                  {charge > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Fee</span>
                      <span>{charge.toFixed(2)} {selected.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-white border-t border-slate-700 pt-2">
                    <span>Total</span>
                    <span>{total.toFixed(2)} {selected.currency}</span>
                  </div>
                </div>
              )}

              <button
                onClick={goToPayment}
                disabled={!amount || Number(amount) <= 0}
                className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP: Payment Info */}
      {step === 'payment' && selected && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-5">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Send Exactly</p>
            <p className="text-3xl font-black text-white">{total.toFixed(2)} <span className="text-base text-slate-400">{selected.currency}</span></p>
          </div>

          {selected.qr_code && (
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-2xl">
                <img src={selected.qr_code} className="w-44 h-44 rounded-xl" alt="QR Code" />
              </div>
            </div>
          )}

          {selected.wallet_address && (
            <div>
              <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Wallet Address</label>
              <div className="flex items-center gap-2 p-3.5 bg-slate-800 border border-slate-700 rounded-xl">
                <code className="flex-1 text-xs break-all text-slate-200 font-mono select-all">{selected.wallet_address}</code>
                {selected.show_copy_btn && (
                  <button onClick={copyWallet} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors shrink-0">
                    {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
                  </button>
                )}
              </div>
            </div>
          )}

          {selected.instructions && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[10px] font-semibold text-amber-400 mb-1 uppercase">Instructions</p>
              <div className="text-xs text-amber-300/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: selected.instructions }} />
            </div>
          )}

          <button onClick={goToProof} className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
            <CheckCircle size={16} /> I Have Paid
          </button>
        </div>
      )}

      {/* STEP: Proof & Submit */}
      {step === 'proof' && selected && (
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-5">
          <div className="text-center">
            <h3 className="font-bold text-white">Confirm Payment</h3>
            <p className="text-xs text-slate-500 mt-1">Upload proof to complete</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Amount</p>
              <p className="text-sm font-bold text-white">{total.toFixed(2)} {selected.currency}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase">Via</p>
              <p className="text-sm font-medium text-slate-300">{selected.name}</p>
            </div>
          </div>

          {selected.show_proof && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Payment Screenshot *</label>
              {proofUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-700">
                  <img src={proofUrl} className="w-full max-h-56 object-contain bg-slate-800" alt="Proof" />
                  <button type="button" onClick={() => setProofUrl('')} className="absolute top-2 right-2 px-2.5 py-1 bg-black/60 text-white text-[10px] font-medium rounded-lg">Remove</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-all">
                  {proofUploading ? (
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload size={28} className="text-slate-600" />
                      <p className="text-xs text-slate-400 font-medium">Click to upload</p>
                    </>
                  )}
                  <input type="file" className="hidden" accept={selected.proof_types.split(',').map(t => `.${t.trim()}`).join(',')} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadProof(f); }} disabled={proofUploading} />
                </label>
              )}
            </div>
          )}

          {selected.fields.map((field) => (
            <div key={field.id}>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{field.label}{field.required === 1 && ' *'}</label>
              <input
                type={field.type || 'text'}
                value={fields[field.field_name] || ''}
                onChange={(e) => setFields({ ...fields, [field.field_name]: e.target.value })}
                placeholder={field.placeholder || ''}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-emerald-500"
                required={field.required === 1}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={16} />}
            {submitting ? 'Submitting...' : 'Submit Deposit'}
          </button>
        </form>
      )}
    </div>
  );
}
