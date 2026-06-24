'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CreatePageForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setOpen(false);
    setForm({ name: '', slug: '' });
    router.refresh();
  };

  if (!open) return <Button onClick={() => setOpen(true)}>Create Page</Button>;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create Page</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Page Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Slug" placeholder="e.g. about-us" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={loading}>Create</Button>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
