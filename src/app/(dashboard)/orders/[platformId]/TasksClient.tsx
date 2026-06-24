'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Clock, Loader2, ShoppingCart, Wallet, X, PartyPopper } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import Link from 'next/link';

interface Task {
  id: number;
  orderCompleteId: number | null;
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

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

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
        <p className="text-2xl font-bold">{formatAmount(userBalance)} <span className="text-sm font-normal text-white/70">USDT</span></p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-[11px] text-gray-400 mb-1">Today&apos;s Time</p>
          <p className="text-sm font-bold text-gray-900">{timeStr}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-[11px] text-gray-400 mb-1">Today&apos;s Commission</p>
          <p className="text-sm font-bold text-emerald-600">{formatAmount(todayCommission)} USDT</p>
        </div>
      </div>

      {/* Info Rows */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <InfoRow label="Cash gap between tasks" value={`${formatAmount(cashGap)} USDT`} highlight={cashGap > 0} />
        <InfoRow label="Yesterday's commission" value={`${formatAmount(yesterdayCommission)} USDT`} />
        <InfoRow label="Yesterday's team commission" value={`${formatAmount(yesterdayTeamCommission)} USDT`} />
        <InfoRow label="Money frozen in account" value={`${formatAmount(freezeAmount)} USDT`} highlight={freezeAmount > 0} />
      </div>

      {/* Hints */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-2">Hint:</p>
        <p className="text-xs text-amber-700 leading-relaxed">1: {platform.commission}% of the amount of completed transaction earned.</p>
        <p className="text-xs text-amber-700 leading-relaxed mt-1">2: The system sends tasks randomly. Complete them as soon as possible after matching them to avoid delays.</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-500">Tasks Progress</span>
          <span className="font-semibold text-indigo-600">{completedCount}/{totalCount}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
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
          <p className="text-sm text-gray-500">You have finished all {totalCount} tasks for this session. Please wait for new tasks to be assigned.</p>
        </div>
      ) : null}

      {/* Completed Tasks */}
      {completedCount > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 px-1">Completed ({completedCount})</p>
          {tasks.filter(t => t.status === 'completed').map(task => (
            <div key={task.id} className="bg-emerald-50/50 rounded-xl border border-emerald-200 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" />
                <span className="text-xs font-medium text-gray-700">Task #{task.index}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600">+{formatAmount(task.profit)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-red-500' : 'text-gray-900'}`}>{value}</span>
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ profit: number; balance: number } | null>(null);

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
        setSuccessData({ profit: task.profit, balance: data.balance || userBalance + task.profit });
        setShowSuccess(true);
      } else {
        setMessage(data.message || 'Failed');
      }
    } catch {
      setMessage('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-indigo-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900">Task #{task.index}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isPending ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
            {isPending ? 'Active' : 'Next'}
          </span>
        </div>

        {/* Products */}
        {task.products.length > 0 && (
          <div className="space-y-2 mb-4">
            {task.products.map((p, i) => {
              const imgUrl = getImageUrl(p.image);
              return (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                  {imgUrl ? (
                    <img src={imgUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                      <ShoppingCart size={14} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{formatAmount(p.price)} × {p.quantity}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Amount & Profit */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-4">
          <div>
            <p className="text-[10px] text-gray-400">Order Amount</p>
            <p className="text-sm font-bold text-gray-900">{formatAmount(task.price)} USDT</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400">Commission ({task.profitPercent}%)</p>
            <p className="text-sm font-bold text-emerald-600">+{formatAmount(task.profit)} USDT</p>
          </div>
        </div>

        {message && (
          <p className={`text-xs mb-3 text-red-500`}>{message}</p>
        )}

        {isPending ? (
          <>
            <button
              onClick={() => canAfford ? setShowConfirm(true) : null}
              disabled={loading || !canAfford}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              {loading ? 'Processing...' : !canAfford ? `Need ${formatAmount(task.price - availableBalance)} more` : 'Complete Task'}
            </button>
            {!canAfford && (
              <Link
                href="/deposit"
                className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <Wallet size={15} /> Deposit Now
              </Link>
            )}
          </>
        ) : (
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
            {loading ? 'Starting...' : 'Start Task'}
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Confirm Order</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Order Details */}
            <div className="space-y-3 mb-5">
              {task.products.map((p, i) => {
                const imgUrl = getImageUrl(p.image);
                return (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    {imgUrl ? (
                      <img src={imgUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
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

            <div className="space-y-2 border-t border-gray-100 pt-4 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Amount</span>
                <span className="font-semibold text-gray-900">{formatAmount(task.price)} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Commission ({task.profitPercent}%)</span>
                <span className="font-semibold text-emerald-600">+{formatAmount(task.profit)} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">You Receive</span>
                <span className="font-bold text-gray-900">{formatAmount(task.price + task.profit)} USDT</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PartyPopper size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Task Completed!</h3>
            <p className="text-sm text-gray-500 mb-5">Your commission has been credited</p>

            <div className="bg-emerald-50 rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Profit Earned</span>
                <span className="font-bold text-emerald-600">+{formatAmount(successData.profit)} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">New Balance</span>
                <span className="font-bold text-gray-900">{formatAmount(successData.balance)} USDT</span>
              </div>
            </div>

            <button
              onClick={() => { setShowSuccess(false); router.refresh(); }}
              className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}
