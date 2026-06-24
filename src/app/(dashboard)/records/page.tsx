import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import RecordsClient from './RecordsClient';

export default async function RecordsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = Number(session.user.id);

  const orderHistory = await db.orderComplete.findMany({
    where: { user_id: userId },
    include: {
      order: { include: { orderDetails: { include: { product: true } }, platform: true } },
      orderSet: { include: { platform: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  return (
    <RecordsClient
      orders={orderHistory.map((o) => ({
        id: o.id,
        order_no: o.order_no,
        price: o.price,
        profit: o.profit,
        balance: o.balance,
        status: o.status,
        type: o.type,
        created_at: o.created_at.toISOString(),
        platformName: o.orderSet?.platform?.name || o.order?.platform?.name || '-',
        products: o.order?.orderDetails.map((d) => ({ name: d.product?.name || '', image: d.product?.image || null, price: d.price, quantity: d.quantity })) || [],
      }))}
    />
  );
}
