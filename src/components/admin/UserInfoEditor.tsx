'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Save, Eye, EyeOff } from 'lucide-react';

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
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showWithdrawPw, setShowWithdrawPw] = useState(false);

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
    <Card>
      <CardHeader><h3 className="font-semibold text-gray-900">Information of User</h3></CardHeader>
      <CardContent className="space-y-4">
        {msg.text && (
          <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Read-only fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{user.firstname} {user.lastname}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Referral ID</span>
            <span className="font-medium text-gray-900">{user.ref_by || 'None'}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Withdrawal Address</span>
            <span className="font-medium text-gray-900">{user.withdrawal_password ? 'Set' : 'Not set'}</span>
          </div>
        </div>

        {/* Editable: Daily Order Limit */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="block text-xs font-medium text-gray-500 mb-2">Daily Order Limit</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="10000"
              value={orderLimit}
              onChange={(e) => setOrderLimit(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => handleAction('change_order_limit', { daily_order_limit: Number(orderLimit) }, 'order_limit')}
              disabled={loading === 'order_limit'}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {loading === 'order_limit' ? '...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Editable: Withdrawal Password */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="block text-xs font-medium text-gray-500 mb-2">Change Withdrawal Password</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showWithdrawPw ? 'text' : 'password'}
                value={withdrawalPassword}
                onChange={(e) => setWithdrawalPassword(e.target.value)}
                placeholder="Enter new withdrawal password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowWithdrawPw(!showWithdrawPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showWithdrawPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={() => handleAction('change_withdrawal_password', { withdrawal_password: withdrawalPassword }, 'withdraw_pw')}
              disabled={loading === 'withdraw_pw' || !withdrawalPassword}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {loading === 'withdraw_pw' ? '...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Leave empty and save to clear the withdrawal password</p>
        </div>

        {/* Editable: Login Password */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <label className="block text-xs font-medium text-gray-500 mb-2">Change Login Password</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showLoginPw ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter new login password (min 6 chars)"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowLoginPw(!showLoginPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={() => handleAction('change_password', { password: loginPassword }, 'login_pw')}
              disabled={loading === 'login_pw' || loginPassword.length < 6}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {loading === 'login_pw' ? '...' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Minimum 6 characters required</p>
        </div>
      </CardContent>
    </Card>
  );
}
