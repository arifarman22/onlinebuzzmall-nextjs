'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface Props {
  user: { id: number; status: number; balance: number; freeze_amount: number; username: string };
}

export default function UserDetailActions({ user }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [balanceForm, setBalanceForm] = useState({ amount: '', type: 'add', remark: '' });
  const [freezeAmount, setFreezeAmount] = useState(String(user.freeze_amount));

  const apiCall = async (body: any, key: string) => {
    setLoading(key);
    setMsg({ type: '', text: '' });
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    setMsg({ type: data.success ? 'success' : 'error', text: data.message });
    setLoading('');
    if (data.success) router.refresh();
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  return (
    <div className="space-y-4">
      {msg.text && (
        <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ban/Unban */}
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Account Status</h3></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Current: <strong>{user.status === 1 ? 'Active' : 'Banned'}</strong></p>
            <Button
              variant={user.status === 1 ? 'danger' : 'primary'}
              loading={loading === 'status'}
              onClick={() => apiCall({ action: 'toggle_status', user_id: user.id }, 'status')}
            >
              {user.status === 1 ? 'Ban User' : 'Unban User'}
            </Button>
          </CardContent>
        </Card>

        {/* Adjust Balance */}
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Adjust Balance</h3></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <select value={balanceForm.type} onChange={(e) => setBalanceForm({ ...balanceForm, type: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="add">Add</option>
                <option value="sub">Subtract</option>
              </select>
              <Input placeholder="Amount" type="number" step="0.01" value={balanceForm.amount} onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })} />
            </div>
            <Input placeholder="Remark (optional)" value={balanceForm.remark} onChange={(e) => setBalanceForm({ ...balanceForm, remark: e.target.value })} />
            <Button loading={loading === 'balance'} onClick={() => apiCall({ action: 'adjust_balance', user_id: user.id, ...balanceForm, amount: Number(balanceForm.amount) }, 'balance')}>
              Apply
            </Button>
          </CardContent>
        </Card>

        {/* Freeze Balance */}
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Freeze Balance</h3></CardHeader>
          <CardContent className="space-y-3">
            <Input label="Freeze Amount" type="number" step="0.01" value={freezeAmount} onChange={(e) => setFreezeAmount(e.target.value)} />
            <Button loading={loading === 'freeze'} onClick={() => apiCall({ action: 'freeze_balance', user_id: user.id, amount: Number(freezeAmount) }, 'freeze')}>
              Update Freeze
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
