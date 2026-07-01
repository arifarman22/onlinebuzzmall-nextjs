'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, MinusCircle, History, LogIn, Ban, Key, CheckCircle, Trash2 } from 'lucide-react';

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
      <button onClick={() => scrollTo('balance-section')} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors">
        <DollarSign size={14} /> Add Balance
      </button>
      <button onClick={() => scrollTo('balance-section')} className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 text-xs font-medium rounded-lg hover:bg-orange-100 transition-colors">
        <MinusCircle size={14} /> Subtract Balance
      </button>
      <button onClick={() => router.push(`/admin/reports?type=logins&search=${username}`)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors">
        <History size={14} /> Login History
      </button>
      <button onClick={handleImpersonate} disabled={loading === 'impersonate'} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50">
        <LogIn size={14} /> {loading === 'impersonate' ? 'Loading...' : 'Login as User'}
      </button>
      <button onClick={handleBan} disabled={loading === 'ban'} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${status === 1 ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
        {status === 1 ? <><Ban size={14} /> Ban User</> : <><CheckCircle size={14} /> Unban User</>}
      </button>
      <button onClick={() => scrollTo('info-section')} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
        <Key size={14} /> Change Password
      </button>
      <button onClick={handleDelete} disabled={loading === 'delete'} className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50">
        <Trash2 size={14} /> {loading === 'delete' ? 'Deleting...' : 'Delete User'}
      </button>
    </div>
  );
}
