'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';

interface WithdrawFormProps {
  methods: any[];
  balance: number;
}

export default function WithdrawForm({ methods, balance }: WithdrawFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ method_id: '', amount: '' });

  const selected = methods.find((m) => String(m.id) === form.method_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/withdraw/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method_id: Number(form.method_id), amount: Number(form.amount) }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Withdrawal request submitted!' });
        setForm({ method_id: '', amount: '' });
        setTimeout(() => router.refresh(), 1500);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">New Withdrawal</h3>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Method Dropdown */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Withdrawal Method</label>
          <div className="relative">
            <select
              value={form.method_id}
              onChange={(e) => setForm({ ...form, method_id: e.target.value })}
              className="w-full appearance-none px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-emerald-500 pr-10"
              required
            >
              <option value="">Select method</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.currency})</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Amount (USDT)</label>
          <input
            type="number"
            step="0.01"
            min={selected?.min_limit || 0}
            max={Math.min(selected?.max_limit || balance, balance)}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-emerald-500 placeholder:text-slate-600"
            placeholder="Enter amount"
            required
          />
        </div>

        {/* Method Details */}
        {selected && (
          <div className="p-3 bg-slate-800 rounded-xl text-xs space-y-2">
            {selected.description && (
              <div className="text-slate-400 mb-2" dangerouslySetInnerHTML={{ __html: selected.description }} />
            )}
            <div className="flex justify-between text-slate-400">
              <span>Min</span>
              <span className="text-slate-200">${selected.min_limit}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Max</span>
              <span className="text-slate-200">${selected.max_limit}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Charge</span>
              <span className="text-slate-200">${selected.fixed_charge} + {selected.percent_charge}%</span>
            </div>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">Submit Withdrawal</Button>
      </form>
    </div>
  );
}
