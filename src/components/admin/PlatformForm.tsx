'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface Props { platform?: any; }

export default function PlatformForm({ platform }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    name: platform?.name || '',
    description: platform?.description || '',
    status: String(platform?.status ?? '1'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/platforms', {
      method: platform ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: platform?.id, status: Number(form.status) }),
    });
    const data = await res.json();
    setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    setLoading(false);
    if (data.success) setTimeout(() => router.push('/admin/platforms'), 1000);
  };

  return (
    <Card>
      <CardContent className="py-6">
        {msg.text && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <Input id="name" label="Platform Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 min-h-[100px]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <Button type="submit" loading={loading}>{platform ? 'Update' : 'Create'} Platform</Button>
        </form>
      </CardContent>
    </Card>
  );
}
