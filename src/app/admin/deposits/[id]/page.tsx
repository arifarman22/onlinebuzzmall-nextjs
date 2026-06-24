import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatAmount, formatDateTime } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import DepositActions from '@/components/admin/DepositActions';
import Link from 'next/link';

export default async function AdminDepositDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const depositId = Number(id);

  const deposit = await db.deposit.findUnique({
    where: { id: depositId },
    include: { user: { select: { id: true, username: true, email: true, firstname: true, lastname: true, balance: true, freeze_amount: true, created_at: true, status: true } } },
  });

  if (!deposit) return notFound();

  const detail = deposit.detail as any;
  const submittedFields = detail?.submitted_fields || {};
  const gatewayName = detail?.gateway_name || 'Unknown';
  const proofUrl = detail?.proof_url || null;

  // Fetch user's recent deposits
  const userDeposits = await db.deposit.findMany({
    where: { user_id: deposit.user_id },
    orderBy: { id: 'desc' },
    take: 10,
    select: { id: true, trx: true, amount: true, status: true, method_currency: true, created_at: true, detail: true },
  });

  // Fetch user's recent transactions
  const userTransactions = await db.transaction.findMany({
    where: { user_id: deposit.user_id },
    orderBy: { id: 'desc' },
    take: 15,
    select: { id: true, trx: true, trx_type: true, amount: true, post_balance: true, details: true, remark: true, created_at: true },
  });

  // User stats
  const totalDeposits = await db.deposit.aggregate({ where: { user_id: deposit.user_id, status: 1 }, _sum: { amount: true }, _count: true });
  const totalWithdrawals = await db.withdrawal.aggregate({ where: { user_id: deposit.user_id, status: 1 }, _sum: { amount: true }, _count: true });

  const statusMap: Record<number, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
    0: { label: 'Initiated', variant: 'default' },
    1: { label: 'Approved', variant: 'success' },
    2: { label: 'Pending', variant: 'warning' },
    3: { label: 'Rejected', variant: 'danger' },
  };

  const status = statusMap[deposit.status] || statusMap[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/deposits?filter=pending" className="text-sm text-indigo-600 hover:underline">← Back</Link>
          <h2 className="text-2xl font-bold text-gray-900">Deposit Details</h2>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Action Bar for Pending */}
      {deposit.status === 2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-800">This deposit is awaiting approval</p>
            <p className="text-xs text-amber-600 mt-0.5">Review the details below before taking action</p>
          </div>
          <DepositActions depositId={deposit.id} />
        </div>
      )}

      {/* Deposit Info + User Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Deposit Information</h3></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <InfoRow label="Transaction ID" value={deposit.trx || '-'} mono />
              <InfoRow label="Gateway" value={gatewayName} />
              <InfoRow label="Amount" value={formatAmount(deposit.amount)} bold />
              <InfoRow label="Charge" value={formatAmount(deposit.charge)} />
              <InfoRow label="Exchange Rate" value={String(deposit.rate)} />
              <InfoRow label="Final Amount" value={formatAmount(deposit.final_amo)} bold color="text-indigo-600" />
              <InfoRow label="Currency" value={deposit.method_currency || 'USD'} />
              <InfoRow label="Submitted At" value={formatDateTime(deposit.created_at)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">User Information</h3></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <InfoRow label="Username" value={`@${deposit.user?.username}`} />
              <InfoRow label="Name" value={`${deposit.user?.firstname || ''} ${deposit.user?.lastname || ''}`.trim() || '-'} />
              <InfoRow label="Email" value={deposit.user?.email || '-'} />
              <InfoRow label="Current Balance" value={`${formatAmount(deposit.user?.balance || 0)} USDT`} bold color="text-emerald-600" />
              <InfoRow label="Frozen Amount" value={`${formatAmount(deposit.user?.freeze_amount || 0)} USDT`} />
              <InfoRow label="Account Status" value={deposit.user?.status === 1 ? 'Active' : 'Banned'} color={deposit.user?.status === 1 ? 'text-emerald-600' : 'text-red-600'} />
              <InfoRow label="Joined" value={formatDateTime(deposit.user?.created_at)} />
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Link href={`/admin/users/${deposit.user_id}`} className="text-xs text-indigo-600 hover:underline font-medium">
                View Full User Profile →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Account Summary */}
      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">User Account Summary</h3></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-[11px] text-gray-500 mb-1">Total Deposited</p>
              <p className="text-sm font-bold text-emerald-700">{formatAmount(totalDeposits._sum.amount || 0)}</p>
              <p className="text-[10px] text-gray-400">{totalDeposits._count} deposits</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-[11px] text-gray-500 mb-1">Total Withdrawn</p>
              <p className="text-sm font-bold text-red-700">{formatAmount(totalWithdrawals._sum.amount || 0)}</p>
              <p className="text-[10px] text-gray-400">{totalWithdrawals._count} withdrawals</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 text-center">
              <p className="text-[11px] text-gray-500 mb-1">Current Balance</p>
              <p className="text-sm font-bold text-indigo-700">{formatAmount(deposit.user?.balance || 0)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-[11px] text-gray-500 mb-1">Frozen</p>
              <p className="text-sm font-bold text-amber-700">{formatAmount(deposit.user?.freeze_amount || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Proof */}
      {proofUrl && (
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Payment Proof</h3></CardHeader>
          <CardContent>
            <a href={proofUrl} target="_blank" rel="noopener noreferrer">
              <img src={proofUrl} alt="Payment Proof" className="max-w-md rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
            </a>
            <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-indigo-600 hover:underline">Open Full Size →</a>
          </CardContent>
        </Card>
      )}

      {/* Submitted Fields */}
      {Object.keys(submittedFields).length > 0 && (
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Submitted Data</h3></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(submittedFields).map(([key, value]) => {
                const isImage = typeof value === 'string' && value.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                const isFile = typeof value === 'string' && (value.startsWith('/uploads/') || value.match(/\.(jpg|jpeg|png|gif|pdf)$/i));
                return (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                    {isImage ? (
                      <a href={String(value)} target="_blank" rel="noopener noreferrer">
                        <img src={String(value)} alt={key} className="max-w-[200px] rounded border border-gray-200" />
                      </a>
                    ) : isFile ? (
                      <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline font-medium">View File →</a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 break-words">{String(value) || '-'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User's Deposit History */}
      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">User&apos;s Deposit History</h3></CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">TRX</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Amount</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Gateway</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Status</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Date</th>
                </tr>
              </thead>
              <tbody>
                {userDeposits.map((d) => (
                  <tr key={d.id} className={`border-b border-gray-50 ${d.id === depositId ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                    <td className="py-2.5 px-4 font-mono text-xs">{d.trx || '-'}</td>
                    <td className="py-2.5 px-4 font-semibold">{formatAmount(d.amount)}</td>
                    <td className="py-2.5 px-4 text-xs text-gray-500">{(d.detail as any)?.gateway_name || '-'}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant={statusMap[d.status]?.variant || 'default'}>
                        {statusMap[d.status]?.label || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-gray-500">{formatDateTime(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User's Recent Transactions */}
      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900">User&apos;s Recent Transactions</h3></CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">TRX</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Type</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Amount</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Post Balance</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Details</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs">Date</th>
                </tr>
              </thead>
              <tbody>
                {userTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-xs">No transactions found</td></tr>
                ) : (
                  userTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-mono text-xs">{t.trx || '-'}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          t.trx_type === '+' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {t.trx_type === '+' ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 font-semibold ${t.trx_type === '+' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.trx_type}{formatAmount(t.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-700">{formatAmount(t.post_balance)}</td>
                      <td className="py-2.5 px-4 text-xs text-gray-500 max-w-[200px] truncate">{t.details || t.remark || '-'}</td>
                      <td className="py-2.5 px-4 text-xs text-gray-500">{formatDateTime(t.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Admin Feedback */}
      {deposit.admin_feedback && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-medium">Admin Feedback:</p>
          <p className="text-xs mt-1">{deposit.admin_feedback}</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, bold, color }: { label: string; value: string; mono?: boolean; bold?: boolean; color?: string }) {
  return (
    <div className="flex justify-between p-2 bg-gray-50 rounded">
      <span className="text-gray-500">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${bold ? 'font-bold' : 'font-medium'} ${color || 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
