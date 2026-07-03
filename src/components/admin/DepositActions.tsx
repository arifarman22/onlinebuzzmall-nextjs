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
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [customAmount, setCustomAmount] = useState(String(amount));
  const [rejectAmount, setRejectAmount] = useState(String(amount));
  const [rejectReason, setRejectReason] = useState('');

  const handleConfirmApprove = async () => {
    setShowApproveDialog(false);
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

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) { alert('Please enter a rejection reason.'); return; }
    setLoading('reject');
    const res = await fetch('/api/admin/deposits/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deposit_id: depositId,
        action: 'reject',
        rejected_amount: Number(rejectAmount),
        reject_reason: rejectReason.trim(),
      }),
    });
    const data = await res.json();
    setLoading('');
    if (data.success) window.location.reload();
    else alert(data.message);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { setCustomAmount(String(amount)); setShowApproveDialog(true); }} loading={loading === 'approve'}>
          Approve
        </Button>
        <Button size="sm" variant="danger" onClick={() => { setRejectAmount(String(amount)); setShowRejectForm(true); }} loading={loading === 'reject'}>
          Reject
        </Button>
      </div>

      {/* Approve Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Confirm Deposit Approval</h3>
            <p className="text-sm text-gray-600">
              Approving deposit of <span className="font-semibold text-indigo-600">${amount}</span> for <span className="font-semibold">{userName}</span>.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approved Amount</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0" step="0.01"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleConfirmApprove} className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                OK — Approve
              </button>
              <button onClick={() => setShowApproveDialog(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Form */}
      {showRejectForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Reject Deposit</h3>
              <button onClick={() => setShowRejectForm(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            <p className="text-sm text-gray-500">
              Rejecting deposit for <span className="font-semibold text-gray-700">{userName}</span>. The user will be notified with the details below.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejected Amount</label>
              <input
                type="number"
                value={rejectAmount}
                onChange={(e) => setRejectAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                min="0" step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Payment proof not valid, incorrect amount sent..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirmReject}
                disabled={loading === 'reject'}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {loading === 'reject' ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button onClick={() => setShowRejectForm(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
