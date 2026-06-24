import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = Number(session.user.id);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect('/login');

  const platforms = await db.platform.findMany({
    where: { status: 1, show_on_dashboard: 1 },
    orderBy: [{ vip_level: 'asc' }, { name: 'asc' }],
  });

  const assignments = await db.orderSetAssign.findMany({
    where: { user_id: userId },
    include: {
      orderSet: { include: { platform: true, _count: { select: { orders: true } } } },
    },
  });

  const completedCount = await db.orderComplete.count({ where: { user_id: userId, status: 1 } });
  const totalProfit = await db.orderComplete.aggregate({ where: { user_id: userId, status: 1 }, _sum: { profit: true } });
  const pendingCount = await db.orderComplete.count({ where: { user_id: userId, status: 0 } });

  const orderHistory = await db.orderComplete.findMany({
    where: { user_id: userId },
    include: {
      order: { include: { orderDetails: { include: { product: true } }, platform: true } },
      orderSet: { include: { platform: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 50,
  });

  return (
    <OrdersClient
      user={{ balance: user.balance, freeze_amount: user.freeze_amount }}
      platforms={platforms.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        commission: p.commission,
        currency: p.currency,
        start_price: p.start_price,
        end_price: p.end_price,
        vip_level: p.vip_level,
        max_orders_per_day: p.max_orders_per_day,
      }))}
      assignments={assignments.map((a) => ({
        id: a.id,
        order_set_id: a.order_set_id,
        percentage_completed: a.percentage_completed,
        platform_id: a.orderSet?.platform?.id || null,
        platform_vip: a.orderSet?.platform?.vip_level || 0,
        orderSetName: a.orderSet?.name || null,
        orderCount: a.orderSet?._count?.orders || 0,
      }))}
      stats={{ completed: completedCount, pending: pendingCount, totalProfit: totalProfit._sum.profit || 0 }}
    />
  );
}
