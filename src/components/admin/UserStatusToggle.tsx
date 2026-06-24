'use client';

import { useState } from 'react';
import { Ban, CheckCircle } from 'lucide-react';

interface Props {
  userId: number;
  currentStatus: number;
  username: string;
}

export default function UserStatusToggle({ userId, currentStatus, username }: Props) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const action = currentStatus === 1 ? 'ban' : 'unban';
    if (!confirm(`Are you sure you want to ${action} @${username}?`)) return;

    setLoading(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_status', user_id: userId }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.success) {
      window.location.reload();
    } else {
      alert(data.message || 'Action failed');
    }
  };

  if (currentStatus === 1) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
        title="Ban user"
      >
        <Ban size={12} />
        {loading ? '...' : 'Ban'}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 disabled:opacity-50 transition-colors"
      title="Unban user"
    >
      <CheckCircle size={12} />
      {loading ? '...' : 'Unban'}
    </button>
  );
}
