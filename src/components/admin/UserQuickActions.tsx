'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, MinusCircle, History, LogIn, Ban, Key, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';

interface Props {
  userId: number;
  username: string;
  status: number;
}

export default function UserQuickActions({ userId, username, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState('');

  const handleImpersonate = async () => {
    setLoading('impersonate');
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        // Open in new tab
        window.open(`/impersonate?token=${data.token}`, '_blank');
      } else {
        alert(data.message || 'Failed to impersonate');
      }
    } catch { alert('Failed'); }
    setLoading('');
  };

  const handleBan = async () => {
    const action = status === 1 ? 'ban' : 'unban';
    if (!confirm(`Are you sure you want to ${action} @${username}?`)) return;
    setLoading('ban');
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_status', user_id: userId }),
    });
    setLoading('');
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to DELETE @${username}? This user will not be able to login anymore.`)) return;
    if (!confirm(`This action cannot be undone. Type confirm to proceed.`)) return;
    setLoading('delete');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_user', user_id: userId }),
    });
    const data = await res.json();
    setLoading('');
    if (data.success) {
      router.push('/admin/users');
    } else {
      alert(data.message || 'Failed to delete user');
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => scrollTo('balance-section')} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-medium rounded-lg hover:from-emerald-600 hover:to-emerald-700 shadow-sm transition-all">
        <DollarSign size={14} /> Add Balance
      </button>
      <button onClick={() => scrollTo('balance-section')} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 shadow-sm transition-all">
        <MinusCircle size={14} /> Subtract Balance
      </button>
      <button onClick={() => router.push(`/admin/reports?type=logins&search=${username}`)} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all">
        <History size={14} /> Login History
      </button>
      <button onClick={handleImpersonate} disabled={loading === 'impersonate'} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-indigo-600 hover:to-indigo-700 shadow-sm transition-all disabled:opacity-50">
        <LogIn size={14} /> {loading === 'impersonate' ? 'Loading...' : 'Login as User'}
      </button>
      <button onClick={handleBan} disabled={loading === 'ban'} className={`flex items-center gap-1.5 px-3 py-2 text-white text-xs font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 ${status === 1 ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'}`}>
        {status === 1 ? <><Ban size={14} /> Ban User</> : <><CheckCircle size={14} /> Unban User</>}
      </button>
      <button onClick={() => scrollTo('info-section')} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-xs font-medium rounded-lg hover:from-violet-600 hover:to-violet-700 shadow-sm transition-all">
        <Key size={14} /> Change Password
      </button>
      <button onClick={handleDelete} disabled={loading === 'delete'} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-medium rounded-lg hover:from-rose-700 hover:to-rose-800 shadow-sm transition-all disabled:opacity-50">
        <Trash2 size={14} /> {loading === 'delete' ? 'Deleting...' : 'Delete User'}
      </button>
    </div>
  );
}
