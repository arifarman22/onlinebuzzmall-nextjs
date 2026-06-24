'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Crown, Layers, Plus, Trash2, CheckCircle } from 'lucide-react';

interface Props {
  userId: number;
  currentRankId: number;
}

export default function UserRankAndAssignment({ userId, currentRankId }: Props) {
  const [ranks, setRanks] = useState<any[]>([]);
  const [rankId, setRankId] = useState(currentRankId);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [allOrderSets, setAllOrderSets] = useState<any[]>([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const showMsg = (type: string, text: string) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/ranks').then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`/api/admin/assign-order-set?user_id=${userId}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
    ]).then(([ranksData, assignData]) => {
      if (ranksData.success) setRanks(ranksData.data);
      if (assignData.success) {
        setAssignments(assignData.data.assignments);
        setAllOrderSets(assignData.data.allOrderSets);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  const handleUpdateRank = async () => {
    setSaving('rank');
    try {
      const res = await fetch('/api/admin/ranks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_user_rank', user_id: userId, rank_id: Number(rankId) }),
      });
      const data = await res.json();
      showMsg(data.success ? 'success' : 'error', data.message);
    } catch { showMsg('error', 'Failed'); }
    setSaving('');
  };

  const handleAssign = async () => {
    if (!selectedSet) return;
    setSaving('assign');
    try {
      const res = await fetch('/api/admin/assign-order-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', user_id: userId, order_set_id: Number(selectedSet) }),
      });
      const data = await res.json();
      showMsg(data.success ? 'success' : 'error', data.message);
      if (data.success) {
        setSelectedSet('');
        // Refresh assignments
        const r = await fetch(`/api/admin/assign-order-set?user_id=${userId}`);
        const d = await r.json();
        if (d.success) { setAssignments(d.data.assignments); setAllOrderSets(d.data.allOrderSets); }
      }
    } catch { showMsg('error', 'Failed'); }
    setSaving('');
  };

  const handleRemove = async (orderSetId: number) => {
    if (!confirm('Remove this assignment?')) return;
    setSaving('remove');
    try {
      const res = await fetch('/api/admin/assign-order-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', user_id: userId, order_set_id: orderSetId }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignments((prev) => prev.filter((a) => a.orderSet?.id !== orderSetId));
        showMsg('success', 'Removed');
      }
    } catch {}
    setSaving('');
  };

  const seedRanks = async () => {
    try {
      await fetch('/api/admin/ranks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'seed' }) });
      const r = await fetch('/api/admin/ranks');
      if (!r.ok) throw new Error();
      const d = await r.json();
      if (d.success) setRanks(d.data);
      showMsg('success', 'VIP ranks seeded');
    } catch { showMsg('error', 'Failed to seed ranks. Restart server with: npx prisma generate'); }
  };

  // Filter out already-assigned order sets
  const availableSets = allOrderSets.filter((os) => !assignments.some((a) => a.order_set_id === os.id));

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {msg.text && <div className={`col-span-full p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}

      {/* VIP Rank */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">User VIP Rank</h3>
          </div>
          {ranks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400 mb-2">No VIP ranks configured</p>
              <button onClick={seedRanks} className="text-xs text-indigo-600 hover:underline">Seed Default Ranks</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <select value={rankId} onChange={(e) => setRankId(Number(e.target.value))} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500">
                <option value={0}>No Rank</option>
                {ranks.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.commission}% commission)</option>)}
              </select>
              <button onClick={handleUpdateRank} disabled={saving === 'rank'} className="px-4 py-2.5 bg-amber-500 text-white text-xs font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50">
                {saving === 'rank' ? '...' : 'Update'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Order Set */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-900">Assign Order Set</h3>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-indigo-500">
              <option value="">Select Order Set...</option>
              {availableSets.map((os) => (
                <option key={os.id} value={os.id}>{os.name} ({os.platform?.name}) — {os._count?.orders || 0} orders</option>
              ))}
            </select>
            <button onClick={handleAssign} disabled={!selectedSet || saving === 'assign'} className="flex items-center gap-1 px-3 py-2.5 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50">
              <Plus size={13} /> {saving === 'assign' ? '...' : 'Assign'}
            </button>
          </div>

          {/* Assigned List */}
          {assignments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No order sets assigned</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.orderSet?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{a.orderSet?.platform?.name || ''} · {a.percentage_completed?.toFixed(0)}% complete</p>
                  </div>
                  <button onClick={() => handleRemove(a.order_set_id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
