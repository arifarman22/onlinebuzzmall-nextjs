'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface Props { platforms: any[]; userRanks: any[]; orderSet?: any; }

export default function OrderSetForm({ platforms, userRanks, orderSet }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    name: orderSet?.name || '',
    platform_id: String(orderSet?.platform_id || ''),
    user_rank_id: String(orderSet?.user_rank_id || ''),
    total_profit: String(orderSet?.total_profit || '0'),
    status: String(orderSet?.status ?? '1'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/order-sets', {
      method: orderSet ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: orderSet?.id, platform_id: Number(form.platform_id) || null, user_rank_id: Number(form.user_rank_id) || null, total_profit: Number(form.total_profit), status: Number(form.status) }),
    });
    const data = await res.json();
    setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    setLoading(false);
    if (data.success) setTimeout(() => router.push('/admin/order-sets'), 1000);
  };

  return (
    <Card>
      <CardContent className="py-6">
        {msg.text && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <Input id="name" label="Order Set Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select value={form.platform_id} onChange={(e) => setForm({ ...form, platform_id: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="">Select platform</option>
              {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Rank</label>
            <select value={form.user_rank_id} onChange={(e) => setForm({ ...form, user_rank_id: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="">Select rank (optional)</option>
              {userRanks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <Input id="total_profit" label="Total Profit %" type="number" step="0.01" value={form.total_profit} onChange={(e) => setForm({ ...form, total_profit: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <Button type="submit" loading={loading}>{orderSet ? 'Update' : 'Create'} Order Set</Button>
        </form>
      </CardContent>
    </Card>
  );
}
