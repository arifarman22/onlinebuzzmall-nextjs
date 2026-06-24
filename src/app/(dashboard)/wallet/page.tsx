import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatAmount, formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Eye, Lock,
  TrendingUp, Clock, ArrowRight, Copy,
} from 'lucide-react';
import WalletActions from '@/components/dashboard/WalletActions';

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = Number(session.user.id);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect('/login');

  const [totalDeposit, totalWithdraw, totalProfit, recentTx] = await Promise.all([
    db.deposit.aggregate({ where: { user_id: userId, status: 1 }, _sum: { amount: true } }),
    db.withdrawal.aggregate({ where: { user_id: userId, status: 1 }, _sum: { amount: true } }),
    db.orderComplete.aggregate({ where: { user_id: userId, status: 1 }, _sum: { profit: true } }),
    db.transaction.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 10 }),
  ]);

  // Get pending deposits/withdrawals
  const [pendingDeposits, pendingWithdrawals] = await Promise.all([
    db.deposit.findMany({ where: { user_id: userId, status: 2 }, orderBy: { created_at: 'desc' }, take: 5 }),
    db.withdrawal.findMany({ where: { user_id: userId, status: 2 }, orderBy: { created_at: 'desc' }, take: 5 }),
  ]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Wallet</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage your funds and transactions</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-cyan-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-white/70" />
            <span className="text-xs text-white/70">Available Balance</span>
          </div>
          <p className="text-3xl font-bold">{formatAmount(user.balance)} <span className="text-base font-normal text-white/70">USDT</span></p>

          {user.freeze_amount > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-white/60 text-xs">
              <Lock size={11} />
              <span>Frozen: {formatAmount(user.freeze_amount)} USDT</span>
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <Link href="/deposit" className="flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-medium transition-colors">
              <ArrowDownToLine size={13} /> Deposit
            </Link>
            <Link href="/withdraw" className="flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-medium transition-colors">
              <ArrowUpFromLine size={13} /> Withdraw
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 text-center">
          <ArrowDownToLine size={14} className="text-emerald-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{formatAmount(totalDeposit._sum.amount || 0)}</p>
          <p className="text-[9px] text-slate-500">Total Deposit</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 text-center">
          <ArrowUpFromLine size={14} className="text-orange-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{formatAmount(totalWithdraw._sum.amount || 0)}</p>
          <p className="text-[9px] text-slate-500">Total Withdrawn</p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 text-center">
          <TrendingUp size={14} className="text-cyan-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{formatAmount(totalProfit._sum.profit || 0)}</p>
          <p className="text-[9px] text-slate-500">Total Profit</p>
        </div>
      </div>

      {/* Crypto Wallet Addresses */}
      <WalletActions />

      {/* Pending Transactions */}
      {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Pending</h3>
          </div>
          <div className="space-y-2">
            {pendingDeposits.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine size={12} className="text-emerald-400" />
                  <span className="text-xs text-slate-300">Deposit</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-white">{formatAmount(d.amount)}</p>
                  <p className="text-[9px] text-amber-400">Pending</p>
                </div>
              </div>
            ))}
            {pendingWithdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUpFromLine size={12} className="text-orange-400" />
                  <span className="text-xs text-slate-300">Withdrawal</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-white">{formatAmount(w.amount)}</p>
                  <p className="text-[9px] text-amber-400">Pending</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
          <Link href="/transactions" className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
            View All <ArrowRight size={10} />
          </Link>
        </div>
        <div className="px-4 py-2">
          {recentTx.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No transactions yet</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.trx_type === '+' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {tx.trx_type === '+' ? <ArrowDownToLine size={12} className="text-emerald-400" /> : <ArrowUpFromLine size={12} className="text-red-400" />}
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-200 font-medium">{tx.details || tx.remark || 'Transaction'}</p>
                      <p className="text-[9px] text-slate-500">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${tx.trx_type === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.trx_type}{formatAmount(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
