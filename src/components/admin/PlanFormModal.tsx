'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function PlanFormModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', bv: '0', ref_com: '0', tree_com: '0' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price), bv: Number(form.bv), ref_com: Number(form.ref_com), tree_com: Number(form.tree_com) }),
    });
    setLoading(false);
    setOpen(false);
    setForm({ name: '', price: '', bv: '0', ref_com: '0', tree_com: '0' });
    router.refresh();
  };

  if (!open) return <Button onClick={() => setOpen(true)}>Create Plan</Button>;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create Plan</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Price ($)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="BV" type="number" value={form.bv} onChange={(e) => setForm({ ...form, bv: e.target.value })} />
          <Input label="Referral Commission ($)" type="number" step="0.01" value={form.ref_com} onChange={(e) => setForm({ ...form, ref_com: e.target.value })} />
          <Input label="Tree Commission ($)" type="number" step="0.01" value={form.tree_com} onChange={(e) => setForm({ ...form, tree_com: e.target.value })} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={loading}>Create</Button>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
