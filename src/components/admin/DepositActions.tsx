'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface Props {
  depositId: number;
  amount: number;
  userName: string;
}

export default function DepositActions({ depositId, amount, userName }: Props) {
  const [loading, setLoading] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [customAmount, setCustomAmount] = useState(String(amount));

  const handleApproveClick = () => {
    setCustomAmount(String(amount));
    setShowDialog(true);
  };

  const handleConfirmApprove = async () => {
    setShowDialog(false);
    setLoading('approve');
    const res = await fetch('/api/admin/deposits/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deposit_id: depositId, action: 'approve', custom_amount: Number(customAmount) }),
    });
    const data = await res.json();
    setLoading('');
    if (data.success) window.location.reload();
    else alert(data.message);
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this deposit?')) return;
    setLoading('reject');
    const res = await fetch('/api/admin/deposits/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deposit_id: depositId, action: 'reject' }),
    });
    const data = await res.json();
    setLoading('');
    if (data.success) window.location.reload();
    else alert(data.message);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleApproveClick} loading={loading === 'approve'}>
          Approve
        </Button>
        <Button size="sm" variant="danger" onClick={handleReject} loading={loading === 'reject'}>
          Reject
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      {showDialog && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Confirm Deposit Approval</h3>
              <p className="text-sm text-gray-600">
                You are confirming the deposit of <span className="font-semibold text-indigo-600">${amount}</span> for <span className="font-semibold">{userName}</span>.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approved Amount (you can change)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleConfirmApprove} className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                  OK — Approve
                </button>
                <button onClick={() => setShowDialog(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
