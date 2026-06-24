'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function WithdrawalActions({ withdrawalId, userId, amount }: { withdrawalId: number; userId: number; amount: number }) {
  const [loading, setLoading] = useState('');

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this withdrawal?`)) return;
    setLoading(action);
    const res = await fetch('/api/admin/withdrawals/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ withdrawal_id: withdrawalId, action, user_id: userId, amount }),
    });
    const data = await res.json();
    setLoading('');
    if (data.success) {
      window.location.reload();
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => handleAction('approve')} loading={loading === 'approve'}>
        Approve
      </Button>
      <Button size="sm" variant="danger" onClick={() => handleAction('reject')} loading={loading === 'reject'}>
        Reject
      </Button>
    </div>
  );
}
