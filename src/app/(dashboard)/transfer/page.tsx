'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function TransferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ username: '', amount: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const res = await fetch('/api/user/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, amount: Number(form.amount) }),
    });
    const data = await res.json();
    setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    setLoading(false);
    if (data.success) { setForm({ username: '', amount: '' }); router.refresh(); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Transfer Balance</h2>
        <p className="mt-1 text-gray-600">Send balance to another user</p>
      </div>

      <Card>
        <CardContent className="py-6">
          {msg.text && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <Input id="username" label="Recipient Username" placeholder="Enter username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <Input id="amount" label="Amount ($)" type="number" step="0.01" min="1" placeholder="Enter amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            <Button type="submit" loading={loading} className="w-full">Transfer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
