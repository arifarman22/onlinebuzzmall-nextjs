import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import TasksClient from './TasksClient';

export default async function PlatformTasksPage({ params }: { params: Promise<{ platformId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = Number(session.user.id);
  const { platformId } = await params;
  const platId = Number(platformId);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect('/login');

  const platform = await db.platform.findUnique({ where: { id: platId } });
  if (!platform) redirect('/orders');

  // Get user's assignment for this platform
  const assignment = await db.orderSetAssign.findFirst({
    where: { user_id: userId, orderSet: { platform_id: platId } },
    include: { orderSet: { include: { orders: { orderBy: { id: 'asc' }, include: { orderDetails: { include: { product: true } } } } } } },
  });

  if (!assignment) redirect('/orders');

  // Get completed orders for this set
  const completedOrders = await db.orderComplete.findMany({
    where: { user_id: userId, order_set_id: assignment.order_set_id },
    select: { order_id: true, status: true, id: true, profit: true, created_at: true },
  });

  const completedOrderIds = completedOrders.filter((c) => c.status === 1).map((c) => c.order_id);
  const pendingOrder = completedOrders.find((c) => c.status === 0);

  // Today's & yesterday's commission
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const todayCommission = completedOrders
    .filter(c => c.status === 1 && c.created_at >= todayStart)
    .reduce((s, c) => s + (c.profit || 0), 0);

  const yesterdayCommission = completedOrders
    .filter(c => c.status === 1 && c.created_at >= yesterdayStart && c.created_at < todayStart)
    .reduce((s, c) => s + (c.profit || 0), 0);

  // Team commission (from transactions)
  const teamCommission = await db.transaction.aggregate({
    where: { user_id: userId, trx_type: { in: ['referral_commission', 'team_commission', 'bv_commission'] }, created_at: { gte: yesterdayStart, lt: todayStart } },
    _sum: { amount: true },
  });

  // Build task list
  const tasks = (assignment.orderSet?.orders || []).map((order, idx) => {
    const totalPrice = order.orderDetails.reduce((s, d) => s + d.price * d.quantity, 0);
    const profit = totalPrice * (order.profit / 100);
    const isCompleted = completedOrderIds.includes(order.id);
    const isPending = pendingOrder?.order_id === order.id;
    const products = order.orderDetails.map((d) => ({
      name: d.product?.name || '',
      image: d.product?.image || null,
      price: d.price,
      quantity: d.quantity,
    }));

    return {
      id: order.id,
      orderCompleteId: isPending ? pendingOrder.id : null,
      index: idx + 1,
      type: order.type || 'single',
      price: totalPrice,
      profit,
      profitPercent: order.profit,
      status: isCompleted ? 'completed' as const : isPending ? 'pending' as const : 'locked' as const,
      products,
    };
  });

  return (
    <TasksClient
      platform={{ id: platform.id, name: platform.name, image: platform.image, commission: platform.commission }}
      tasks={tasks}
      userBalance={user.balance}
      freezeAmount={user.freeze_amount}
      todayCommission={todayCommission}
      yesterdayCommission={yesterdayCommission}
      yesterdayTeamCommission={teamCommission._sum.amount || 0}
    />
  );
}
