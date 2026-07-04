'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Clock, Loader2, ShoppingCart, Wallet, X } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import Link from 'next/link';

interface Task {
  id: number;
  orderCompleteId: number | null;
  orderNo: string | null;
  index: number;
  type: string;
  price: number;
  profit: number;
  profitPercent: number;
  status: 'completed' | 'pending' | 'locked';
  products: { name: string; image: string | null; price: number; quantity: number }[];
}

interface Props {
  platform: { id: number; name: string; image: string | null; commission: number };
  tasks: Task[];
  userBalance: number;
  freezeAmount: number;
  todayCommission: number;
  yesterdayCommission: number;
  yesterdayTeamCommission: number;
}

function getImageUrl(image: string | null): string | null {
  if (!image || !image.trim()) return null;
  const img = image.trim();
  if (img.startsWith('http') || img.startsWith('/')) return img;
  return `/${img}`;
}

export default function TasksClient({ platform, tasks, userBalance, freezeAmount, todayCommission, yesterdayCommission, yesterdayTeamCommission }: Props) {
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const pendingTask = tasks.find(t => t.status === 'pending');
  const nextLockedTask = tasks.find(t => t.status === 'locked');
  const activeTask = pendingTask || nextLockedTask;
  const cashGap = activeTask && userBalance < activeTask.price ? activeTask.price - userBalance : 0;

  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    setTimeStr(new Date().toLocaleTimeString('en-US', { hour12: false }));
    const t = setInterval(() => setTimeStr(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          {platform.image ? (
            <img src={getImageUrl(platform.image)!} alt="" className="w-10 h-10 rounded-xl object-cover border" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
          )}
          <h1 className="text-lg font-bold text-gray-900">{platform.name}</h1>
        </div>
      </div>

      {/* Account Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
        <p className="text-xs text-white/70 mb-1">Account Balance</p>
        <p className="text-2xl font-bold">{formatAmount(userBalance)} USDT</p>
      </div>

      {/* Stats Grid — 2x3 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-y-4 gap-x-3">
          {[
            { label: "Today's Time", value: timeStr },
            { label: "Today's Commission", value: `${formatAmount(todayCommission)} USDT` },
            { label: 'Cash Gap', value: `${formatAmount(cashGap)} USDT`, highlight: cashGap > 0 },
            { label: "Yesterday's Commission", value: `${formatAmount(yesterdayCommission)} USDT` },
            { label: "Yesterday's Team Comm.", value: `${formatAmount(yesterdayTeamCommission)} USDT` },
            { label: 'Frozen Amount', value: `${formatAmount(freezeAmount)} USDT`, highlight: freezeAmount > 0 },
          ].map((item) => (
            <div key={item.label} className="flex flex-col">
              <p className={`text-sm font-semibold ${item.highlight ? 'text-red-500' : 'text-gray-900'}`}>{item.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Task */}
      {activeTask ? (
        <ActiveTaskCard task={activeTask} platformId={platform.id} userBalance={userBalance} freezeAmount={freezeAmount} />
      ) : totalCount > 0 && completedCount === totalCount ? (
        <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={24} className="text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">All Tasks Completed! 🎉</h3>
          <p className="text-sm text-gray-500">You have finished all {totalCount} tasks for this session.</p>
        </div>
      ) : null}

      {/* Hints */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-2">Hint:</p>
        <p className="text-xs text-amber-700 leading-relaxed">1: {platform.commission}% of the amount of completed transaction earned.</p>
        <p className="text-xs text-amber-700 leading-relaxed mt-1">2: The system sends tasks randomly. Complete them as soon as possible after matching them to avoid delays.</p>
      </div>

    </div>
  );
}

function ActiveTaskCard({ task, platformId, userBalance, freezeAmount }: {
  task: Task; platformId: number; userBalance: number; freezeAmount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false); // tick animation state

  const availableBalance = userBalance - freezeAmount;
  const canAfford = availableBalance >= task.price;
  const isPending = task.status === 'pending';

  const handleStart = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/orders/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform_id: platformId }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        setMessage(data.message || 'Failed to start');
      }
    } catch {
      setMessage('Something went wrong');
    }
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!task.orderCompleteId) return;
    setShowConfirm(false);
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: task.orderCompleteId, price: task.price }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setMessage(data.message || 'Failed');
      }
    } catch {
      setMessage('Something went wrong');
    }
    setLoading(false);
  };

  if (done) {
    return (
      <>
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 shadow-sm">
          <button disabled className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-300 text-white text-sm font-semibold rounded-xl cursor-not-allowed">
            <ShoppingCart size={15} /> Grab the Order Immediately
          </button>
        </div>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="relative w-24 h-24 mb-5">
              <svg className="w-24 h-24" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="44" fill="none" stroke="#d1fae5" strokeWidth="5" />
                <circle cx="48" cy="48" r="44" fill="none" stroke="#10b981" strokeWidth="5"
                  strokeDasharray="276" strokeLinecap="round"
                  style={{ animation: 'circle-draw 0.6s ease-out forwards', strokeDashoffset: 276 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle size={44} className="text-emerald-500" style={{ animation: 'pop-in 0.3s ease-out 0.5s both' }} />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">The Task is Completed</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Your commission has been credited</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              OK
            </button>
            <style>{`
              @keyframes circle-draw { to { stroke-dashoffset: 0; } }
              @keyframes pop-in { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 shadow-sm">
        {message && <p className="text-xs mb-2 text-red-500">{message}</p>}
        {isPending ? (
          <>
            <button
              onClick={() => canAfford ? setShowConfirm(true) : null}
              disabled={loading || !canAfford}
              className={`w-full flex items-center justify-center gap-2 py-3.5 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors ${!canAfford ? 'bg-gradient-to-br from-indigo-600 to-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
              {loading ? 'Processing...' : !canAfford ? `Need ${formatAmount(task.price - availableBalance)} more` : 'Grab the Order Immediately'}
            </button>
            {!canAfford && (
              <Link href="/deposit" className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                <Wallet size={15} /> Deposit Now
              </Link>
            )}
          </>
        ) : (
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
            {loading ? 'Starting...' : 'Grab the Order Immediately'}
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-white">Confirm Order</h3>
                {task.orderNo && (
                  <p className="text-xs font-mono mt-0.5 text-indigo-200">
                    Order No: <span className="font-bold text-white">#{task.orderNo}</span>
                  </p>
                )}
              </div>
              <button onClick={() => setShowConfirm(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={18} className="text-white" />
              </button>
            </div>

            {/* Product Images */}
            {task.products.length > 0 && (
              <div className="px-5 pt-4 space-y-2">
                {task.products.map((p, i) => {
                  const imgUrl = getImageUrl(p.image);
                  return (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      {imgUrl ? (
                        <img src={imgUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <ShoppingCart size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{formatAmount(p.price)} × {p.quantity}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Order Summary */}
            <div className="px-5 py-4 space-y-3 border-t border-gray-100 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Transaction Time</span>
                <span className="text-sm text-gray-900">{typeof window !== 'undefined' ? new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Order Amount</span>
                <span className="text-sm text-gray-900">{formatAmount(task.price)} USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Commission ({task.profitPercent}%)</span>
                <span className="text-sm text-gray-900">+{formatAmount(task.profit)} USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Expected Income</span>
                <span className="text-sm font-semibold text-indigo-600">{formatAmount(task.price + task.profit)} USDT</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5">
              <button
                onClick={handleComplete}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
