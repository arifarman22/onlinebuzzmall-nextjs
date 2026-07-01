'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, MinusCircle, Lock, Ban, CheckCircle, X } from 'lucide-react';

interface Props {
  user: { id: number; status: number; balance: number; freeze_amount: number; username: string };
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function UserDetailActions({ user }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<'balance' | 'freeze' | 'ban' | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [balanceForm, setBalanceForm] = useState({ amount: '', type: 'add', remark: '' });
  const [freezeAmount, setFreezeAmount] = useState(String(user.freeze_amount));

  const close = () => { setModal(null); setMsg({ type: '', text: '' }); };

  const apiCall = async (body: any) => {
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMsg({ type: data.success ? 'success' : 'error', text: data.message });
      if (data.success) {
        router.refresh();
        setTimeout(() => close(), 1200);
      }
    } catch {
      setMsg({ type: 'error', text: 'Request failed' });
    }
    setLoading(false);
  };

  const btnBase = 'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50';

  return (
    <>
      {/* Action Buttons */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-sm font-semibold text-gray-900">Balance & Account Actions</h3>
          <p className="text-xs text-gray-400 mt-0.5">Adjust balance, freeze funds or change account status</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => setModal('balance')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 shadow-sm transition-all">
            <DollarSign size={15} /> Adjust Balance
          </button>
          <button onClick={() => setModal('freeze')} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all">
            <Lock size={15} /> Freeze Balance
          </button>
          <button onClick={() => setModal('ban')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-medium shadow-sm transition-all ${user.status === 1 ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'}`}>
            {user.status === 1 ? <><Ban size={15} /> Ban User</> : <><CheckCircle size={15} /> Unban User</>}
          </button>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {modal === 'balance' && (
        <Modal title="Adjust Balance" onClose={close}>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Balance</span>
              <span className="text-sm font-bold text-gray-900">${user.balance.toFixed(2)}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Action</label>
              <div className="grid grid-cols-2 gap-2">
                {['add', 'sub'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setBalanceForm({ ...balanceForm, type: t })}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${balanceForm.type === t ? (t === 'add' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-red-500 text-white border-red-500') : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {t === 'add' ? '+ Add' : '− Subtract'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={balanceForm.amount}
                onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Remark (optional)</label>
              <input
                type="text"
                placeholder="e.g. Manual adjustment"
                value={balanceForm.remark}
                onChange={(e) => setBalanceForm({ ...balanceForm, remark: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-gray-50"
              />
            </div>
            {msg.text && (
              <div className={`p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {msg.text}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={() => apiCall({ action: 'adjust_balance', user_id: user.id, ...balanceForm, amount: Number(balanceForm.amount) })}
                disabled={loading || !balanceForm.amount}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${balanceForm.type === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? 'Applying...' : `${balanceForm.type === 'add' ? 'Add' : 'Subtract'} Balance`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Freeze Balance Modal */}
      {modal === 'freeze' && (
        <Modal title="Freeze Balance" onClose={close}>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
              <span className="text-sm text-gray-500">Current Frozen</span>
              <span className="text-sm font-bold text-blue-600">${user.freeze_amount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500">Set the amount to freeze from the user's balance. Frozen funds cannot be withdrawn.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Freeze Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={freezeAmount}
                onChange={(e) => setFreezeAmount(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 bg-gray-50"
              />
            </div>
            {msg.text && (
              <div className={`p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {msg.text}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={() => apiCall({ action: 'freeze_balance', user_id: user.id, amount: Number(freezeAmount) })}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Freeze'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ban/Unban Modal */}
      {modal === 'ban' && (
        <Modal title={user.status === 1 ? 'Ban User' : 'Unban User'} onClose={close}>
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${user.status === 1 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center gap-3">
                {user.status === 1
                  ? <Ban size={20} className="text-red-500 flex-shrink-0" />
                  : <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                }
                <div>
                  <p className={`text-sm font-semibold ${user.status === 1 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {user.status === 1 ? `Ban @${user.username}?` : `Unban @${user.username}?`}
                  </p>
                  <p className={`text-xs mt-0.5 ${user.status === 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {user.status === 1
                      ? 'The user will not be able to login or perform any actions.'
                      : 'The user will regain full access to their account.'}
                  </p>
                </div>
              </div>
            </div>
            {msg.text && (
              <div className={`p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {msg.text}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={() => apiCall({ action: 'toggle_status', user_id: user.id })}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${user.status === 1 ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {loading ? 'Processing...' : user.status === 1 ? 'Yes, Ban User' : 'Yes, Unban User'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
