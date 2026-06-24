'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function EditPageCMS() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [form, setForm] = useState({ name: '', slug: '', secs: '' });

  useEffect(() => {
    fetch(`/api/admin/pages?id=${params.id}`).then(r => r.json()).then(data => {
      if (data.success) {
        setForm({ name: data.data.name || '', slug: data.data.slug || '', secs: JSON.stringify(data.data.secs || [], null, 2) });
      }
      setFetching(false);
    });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    let secs;
    try { secs = JSON.parse(form.secs || '[]'); } catch { secs = []; }

    const res = await fetch('/api/admin/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(params.id), name: form.name, slug: form.slug, secs }),
    });
    const data = await res.json();
    setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    setLoading(false);
  };

  if (fetching) return <p className="text-gray-500 py-8 text-center">Loading...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Edit Page</h2>

      {msg.text && <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}

      <Card>
        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Page Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sections (JSON)</label>
              <textarea
                value={form.secs}
                onChange={(e) => setForm({ ...form, secs: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono outline-none focus:border-indigo-500 min-h-[300px]"
              />
              <p className="mt-1 text-xs text-gray-500">Define page sections as JSON array</p>
            </div>
            <Button type="submit" loading={loading}>Save Page</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
