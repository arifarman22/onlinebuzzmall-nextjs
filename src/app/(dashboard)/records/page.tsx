import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import RecordsClient from './RecordsClient';

export default async function RecordsPage() {
  const user0 = await getSessionUser();
  if (!user0?.id) redirect('/login');
  const userId = Number(user0.id);

  const [orderHistory, transactions] = await Promise.all([
    db.orderComplete.findMany({
      where: { user_id: userId },
      include: {
        order: { include: { orderDetails: { include: { product: true } }, platform: true } },
        orderSet: { include: { platform: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 250,
    }),
    db.transaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 250,
    }),
  ]);

  return (
    <RecordsClient
      orders={orderHistory.map((o) => ({
        id: o.id,
        order_no: o.order_no,
        price: Number(o.price ?? 0),
        profit: Number(o.profit ?? 0),
        balance: Number(o.balance ?? 0),
        status: o.status,
        type: o.type,
        created_at: o.created_at.toISOString(),
        end_at: o.end_at?.toISOString() ?? null,
        platformName: o.orderSet?.platform?.name || o.order?.platform?.name || '-',
        products: o.order?.orderDetails.map((d) => ({ name: d.product?.name || '', image: d.product?.image || null, price: Number(d.price ?? 0), quantity: d.quantity })) || [],
      }))}
      transactions={transactions.map((t) => ({
        id: t.id,
        trx: t.trx,
        amount: Number(t.amount ?? 0),
        trx_type: t.trx_type,
        remark: t.remark,
        balance: Number(t.post_balance ?? 0),
        created_at: t.created_at.toISOString(),
      }))}
    />
  );
}
