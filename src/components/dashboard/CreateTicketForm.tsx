'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { DarkCard as Card, DarkCardContent as CardContent, DarkCardHeader as CardHeader } from '@/components/ui/DarkCard';

export default function CreateTicketForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', priority: '2' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/user/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, priority: Number(form.priority) }),
    });
    setLoading(false);
    setOpen(false);
    setForm({ subject: '', message: '', priority: '2' });
    router.refresh();
  };

  if (!open) return <Button onClick={() => setOpen(true)}>New Ticket</Button>;

  return (
    <Card>
      <CardHeader><h3 className="font-semibold text-white">Create Ticket</h3></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500">
              <option value="1">Low</option>
              <option value="2">Medium</option>
              <option value="3">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500 min-h-[120px]" required />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={loading}>Submit</Button>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
