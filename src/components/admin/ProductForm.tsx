'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface Props {
  platforms: any[];
  product?: any;
}

export default function ProductForm({ platforms, product }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    name: product?.name || '',
    platform_id: String(product?.platform_id || ''),
    price: String(product?.price || ''),
    quantity: String(product?.quantity || '1'),
    status: String(product?.status ?? '1'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const res = await fetch('/api/admin/products', {
      method: product ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: product?.id, platform_id: Number(form.platform_id), price: Number(form.price), quantity: Number(form.quantity), status: Number(form.status) }),
    });
    const data = await res.json();
    setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    setLoading(false);
    if (data.success) setTimeout(() => router.push('/admin/products'), 1000);
  };

  return (
    <Card>
      <CardContent className="py-6">
        {msg.text && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <Input id="name" label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select value={form.platform_id} onChange={(e) => setForm({ ...form, platform_id: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500" required>
              <option value="">Select platform</option>
              {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <Input id="price" label="Price ($)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input id="quantity" label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <Button type="submit" loading={loading}>{product ? 'Update Product' : 'Create Product'}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
