'use client';

import { useState } from 'react';
import { Trash2, CheckCircle, RefreshCw } from 'lucide-react';

export default function ClearCachePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: string; text: string } | null>(null);

  const handleClearCache = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/clear-cache', { method: 'POST' });
      const data = await res.json();
      setResult({ type: data.success ? 'success' : 'error', text: data.message });
    } catch {
      setResult({ type: 'error', text: 'Failed to clear cache' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Clear Cache</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">System Cache</h3>
            <p className="text-xs text-gray-500">Clear settings cache, revalidate all pages</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          This will clear the settings cache (logos, site name, etc.) and force all pages to reload fresh data from the database.
        </p>

        {result && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            result.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            <CheckCircle size={14} />
            {result.text}
          </div>
        )}

        <button
          onClick={handleClearCache}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors w-full"
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
          {loading ? 'Clearing...' : 'Clear All Cache'}
        </button>
      </div>
    </div>
  );
}
