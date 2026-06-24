import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatAmount, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import WithdrawForm from '@/components/dashboard/WithdrawForm';
import { Wallet, ArrowUpFromLine } from 'lucide-react';

export default async function WithdrawPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const methods = await db.withdrawMethod.findMany({ where: { status: 1 } });

  const withdrawals = await db.withdrawal.findMany({
    where: { user_id: userId, status: { not: 0 } },
    orderBy: { id: 'desc' },
    take: 20,
  });

  const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
    1: { label: 'Approved', variant: 'success' },
    2: { label: 'Pending', variant: 'warning' },
    3: { label: 'Rejected', variant: 'danger' },
  };

  const availableBalance = user.balance - user.freeze_amount;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Withdraw</h2>
        <p className="text-xs text-slate-500">Withdraw funds from your account</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">Available Balance</p>
            <p className="text-2xl font-bold mt-0.5">{formatAmount(availableBalance)} <span className="text-sm font-normal text-white/70">USDT</span></p>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <ArrowUpFromLine size={20} className="text-white/80" />
          </div>
        </div>
      </div>

      {/* Withdraw Form */}
      <WithdrawForm methods={methods} balance={availableBalance} />

      {/* Withdrawal History */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Withdrawal History</h3>
        </div>
        <div className="px-5 py-3">
          {withdrawals.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-xs">No withdrawals yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-2 font-medium text-slate-500 text-xs">TRX</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-500 text-xs">Amount</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-500 text-xs">Charge</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-500 text-xs">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-500 text-xs">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-slate-800/50">
                      <td className="py-3 px-2 font-mono text-xs text-slate-300">{w.trx}</td>
                      <td className="py-3 px-2 font-semibold text-white">{formatAmount(w.amount)}</td>
                      <td className="py-3 px-2 text-slate-400 text-xs">{formatAmount(w.charge)}</td>
                      <td className="py-3 px-2">
                        <Badge variant={statusMap[w.status]?.variant || 'default'}>
                          {statusMap[w.status]?.label || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-slate-500 text-xs">{formatDate(w.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
