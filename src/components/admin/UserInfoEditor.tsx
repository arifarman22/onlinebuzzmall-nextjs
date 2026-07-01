'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, EyeOff, Hash, ShieldCheck, Key, SlidersHorizontal } from 'lucide-react';

interface UserInfo {
  id: number;
  firstname: string | null;
  lastname: string | null;
  email: string;
  ref_by: number | null;
  withdrawal_password: string | null;
  daily_order_limit: number;
  created_at: string;
}

export default function UserInfoEditor({ user }: { user: UserInfo }) {
  const router = useRouter();
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState('');
  const [orderLimit, setOrderLimit] = useState(String(user.daily_order_limit));
  const [loginPassword, setLoginPassword] = useState('');
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(true);
  const [showWithdrawPw, setShowWithdrawPw] = useState(true);

  const handleAction = async (action: string, data: any, key: string) => {
    setLoading(key);
    setMsg({ type: '', text: '' });
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, user_id: user.id, ...data }),
    });
    const result = await res.json();
    setMsg({ type: result.success ? 'success' : 'error', text: result.message });
    setLoading('');
    if (result.success) {
      if (key === 'login_pw') setLoginPassword('');
      if (key === 'withdraw_pw') setWithdrawalPassword('');
      router.refresh();
    }
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  return (
    <div id="info-section" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-sm font-semibold text-gray-900">User Settings</h3>
        <p className="text-xs text-gray-400 mt-0.5">Manage passwords and order limits</p>
      </div>

      <div className="p-6 space-y-5">
        {msg.text && (
          <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Daily Order Limit */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <SlidersHorizontal size={13} className="text-indigo-600" />
            </div>
            <label className="text-sm font-medium text-gray-700">Daily Order Limit</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="10000"
              value={orderLimit}
              onChange={(e) => setOrderLimit(e.target.value)}
              className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white transition-all"
            />
            <button
              onClick={() => handleAction('change_order_limit', { daily_order_limit: Number(orderLimit) }, 'order_limit')}
              disabled={loading === 'order_limit'}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 shadow-sm transition-all"
            >
              <Save size={13} />
              {loading === 'order_limit' ? '...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Withdrawal Password */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <ShieldCheck size={13} className="text-amber-600" />
            </div>
            <label className="text-sm font-medium text-gray-700">Withdrawal Password</label>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showWithdrawPw ? 'text' : 'password'}
                value={withdrawalPassword}
                onChange={(e) => setWithdrawalPassword(e.target.value)}
                placeholder={user.withdrawal_password ? '••••••••' : 'Not set — enter to create'}
                className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowWithdrawPw(!showWithdrawPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showWithdrawPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              onClick={() => handleAction('change_withdrawal_password', { withdrawal_password: withdrawalPassword }, 'withdraw_pw')}
              disabled={loading === 'withdraw_pw' || !withdrawalPassword}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 shadow-sm transition-all"
            >
              <Save size={13} />
              {loading === 'withdraw_pw' ? '...' : 'Save'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Leave empty and save to clear the withdrawal password</p>
        </div>

        {/* Login Password */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
              <Key size={13} className="text-rose-600" />
            </div>
            <label className="text-sm font-medium text-gray-700">Login Password</label>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showLoginPw ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter new login password"
                className="w-full px-3.5 py-2.5 pr-10 border border-rose-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-50 bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowLoginPw(!showLoginPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              onClick={() => handleAction('change_password', { password: loginPassword }, 'login_pw')}
              disabled={loading === 'login_pw' || loginPassword.length < 6}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-medium rounded-xl hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 shadow-sm transition-all"
            >
              <Save size={13} />
              {loading === 'login_pw' ? '...' : 'Save'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Minimum 6 characters required</p>
        </div>
      </div>
    </div>
  );
}
