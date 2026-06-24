'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CommissionLevelForm({ type }: { type: 'deposit' | 'withdraw' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ number: '', personal_investment: '', team_deposit: '', group_deposit: '', commission_percent: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/admin/commissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, number: Number(form.number), personal_investment: Number(form.personal_investment), team_deposit: Number(form.team_deposit), group_deposit: Number(form.group_deposit), commission_percent: Number(form.commission_percent) }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  };

  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>Add Level</Button>;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add {type === 'deposit' ? 'Deposit' : 'Withdrawal'} Commission Level</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Level Number" type="number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
          <Input label="Personal Investment ($)" type="number" step="0.01" value={form.personal_investment} onChange={(e) => setForm({ ...form, personal_investment: e.target.value })} required />
          <Input label="Team Deposit ($)" type="number" step="0.01" value={form.team_deposit} onChange={(e) => setForm({ ...form, team_deposit: e.target.value })} required />
          <Input label="Group Deposit ($)" type="number" step="0.01" value={form.group_deposit} onChange={(e) => setForm({ ...form, group_deposit: e.target.value })} required />
          <Input label="Commission %" type="number" step="0.01" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} required />
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={loading}>Create</Button>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
