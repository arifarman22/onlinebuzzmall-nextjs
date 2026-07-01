import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatAmount, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowDownToLine, ArrowUpFromLine, User,
  Wallet, TrendingUp, Clock, Shield, CheckCircle,
  ArrowRight, Eye, Crown, Lock, Calendar,
} from 'lucide-react';
import PlatformRulesCards from '@/components/dashboard/PlatformRulesCards';

export default async function DashboardPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const user = await db.user.findUnique({ where: { id: userId }, include: { userExtra: true } });
  if (!user) return <div className="text-center py-20 text-slate-500">Please log in to view your dashboard.</div>;

  const [userRank, recentTx] = await Promise.all([
    user.rank_id > 0 ? db.userRankSetting.findFirst({ where: { id: user.rank_id } }) : Promise.resolve(null),
    db.transaction.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: 5 }),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero Card */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-slate-400 text-xs font-medium">Welcome back,</p>
              {userRank && (
                <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center gap-1">
                  <Crown size={10} className="text-amber-400" />
                  <span className="text-[9px] font-semibold text-amber-300">{userRank.name}</span>
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold">{user.firstname || user.username}</h2>
            <div className="mt-4">
              <p className="text-slate-400 text-[11px] uppercase tracking-widest font-medium">Total Balance</p>
              <p className="text-3xl md:text-4xl font-bold mt-1 tracking-tight">{formatAmount(user.balance)}</p>
              {user.freeze_amount > 0 && (
                <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1"><Lock size={11} /> Frozen: {formatAmount(user.freeze_amount)}</p>
              )}
            </div>

            {userRank && (
              <div className="mt-4 flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><TrendingUp size={11} className="text-emerald-400" /> {userRank.commission}% commission</span>
                <span className="text-slate-700">|</span>
                <span className="flex items-center gap-1"><Crown size={11} className="text-amber-400" /> {userRank.name}</span>
              </div>
            )}
          </div>

          {/* Profile Image - Right Corner */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
            {user.image ? (
              <img src={user.image.startsWith('http') || user.image.startsWith('/') ? user.image : `/${user.image}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-white/40" />
            )}
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-emerald-400" />
          <h3 className="text-xs font-semibold text-white">Account Status</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className={`p-2 rounded-lg text-center ${user.ev === 1 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <CheckCircle size={14} className={`mx-auto mb-1 ${user.ev === 1 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <p className="text-[9px] text-slate-400">Email</p>
            <p className={`text-[9px] font-semibold ${user.ev === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>{user.ev === 1 ? 'Verified' : 'Pending'}</p>
          </div>
          <div className={`p-2 rounded-lg text-center ${user.kv === 1 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <Shield size={14} className={`mx-auto mb-1 ${user.kv === 1 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <p className="text-[9px] text-slate-400">KYC</p>
            <p className={`text-[9px] font-semibold ${user.kv === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>{user.kv === 1 ? 'Verified' : 'Pending'}</p>
          </div>
          <div className={`p-2 rounded-lg text-center ${user.ts === 1 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <Lock size={14} className={`mx-auto mb-1 ${user.ts === 1 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <p className="text-[9px] text-slate-400">2FA</p>
            <p className={`text-[9px] font-semibold ${user.ts === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>{user.ts === 1 ? 'Active' : 'Off'}</p>
          </div>
          <div className={`p-2 rounded-lg text-center ${user.status === 1 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <User size={14} className={`mx-auto mb-1 ${user.status === 1 ? 'text-emerald-400' : 'text-red-400'}`} />
            <p className="text-[9px] text-slate-400">Account</p>
            <p className={`text-[9px] font-semibold ${user.status === 1 ? 'text-emerald-400' : 'text-red-400'}`}>{user.status === 1 ? 'Active' : 'Banned'}</p>
          </div>
        </div>
      </div>

      {/* Platform Rules */}
      <PlatformRulesCards />

      {/* Account Overview */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-cyan-500/10 rounded-lg flex items-center justify-center">
            <Wallet size={14} className="text-cyan-400" />
          </div>
          <h3 className="text-[13px] font-semibold text-white">Account Overview</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <Wallet size={16} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{formatAmount(user.balance)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Total Balance</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <Lock size={16} className="text-amber-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-white">{formatAmount(user.freeze_amount)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Frozen Amount</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <Calendar size={16} className="text-indigo-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">{formatDate(user.created_at)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Member Since</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center">
              <Clock size={13} className="text-slate-400" />
            </div>
            <h3 className="text-[13px] font-semibold text-white">Recent Transactions</h3>
          </div>
          <Link href="/transactions" className="flex items-center gap-1 text-[11px] text-cyan-400 font-medium hover:underline">
            View All <ArrowRight size={11} />
          </Link>
        </div>
        <div className="px-5 py-3">
          {recentTx.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.trx_type === '+' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {tx.trx_type === '+' ? <ArrowDownToLine size={14} className="text-emerald-400" /> : <ArrowUpFromLine size={14} className="text-red-400" />}
                    </div>
                    <div>
                      <p className="text-[12px] text-slate-200 font-medium leading-tight">{tx.details || tx.remark}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[13px] font-semibold ${tx.trx_type === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.trx_type === '+' ? '+' : '-'}{formatAmount(tx.amount)}
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
