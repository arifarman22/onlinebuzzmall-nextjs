'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function AssignOrderSetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ username: '', order_set_id: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const res = await fetch('/api/admin/order-sets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign', ...form, order_set_id: Number(form.order_set_id) }),
    });
    const data = await res.json();
    setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Assign Order Set to User</h2>
      <Card>
        <CardContent className="py-6">
          {msg.text && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <Input id="username" label="Username" placeholder="Enter username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            <Input id="order_set_id" label="Order Set ID" type="number" placeholder="Enter order set ID" value={form.order_set_id} onChange={(e) => setForm({ ...form, order_set_id: e.target.value })} required />
            <Button type="submit" loading={loading}>Assign Order Set</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
