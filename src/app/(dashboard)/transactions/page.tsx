import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatAmount, formatDateTime } from '@/lib/utils';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

const PER_PAGE = 30;

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where: { user_id: userId },
      orderBy: { id: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.transaction.count({ where: { user_id: userId } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Transactions</h2>
        <p className="text-xs text-slate-500">Your transaction history</p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800">
        {transactions.length === 0 ? (
          <p className="text-center text-slate-500 py-12 text-sm">No transactions found</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.trx_type === '+' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {t.trx_type === '+' ? <ArrowDownToLine size={15} className="text-emerald-400" /> : <ArrowUpFromLine size={15} className="text-red-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-200">{t.details || t.remark || 'Transaction'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDateTime(t.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${t.trx_type === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.trx_type}{formatAmount(t.amount)}
                  </p>
                  <p className="text-[10px] text-slate-500">Bal: {formatAmount(t.post_balance)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-800">
            {page > 1 && (
              <a href={`/transactions?page=${page - 1}`} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700">Prev</a>
            )}
            <span className="text-xs text-slate-500">{page} / {totalPages}</span>
            {page < totalPages && (
              <a href={`/transactions?page=${page + 1}`} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700">Next</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
