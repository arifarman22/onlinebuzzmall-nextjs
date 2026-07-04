import { getSessionUser } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import TasksClient from './TasksClient';

export default async function PlatformTasksPage({ params }: { params: Promise<{ platformId: string }> }) {
  const user0 = await getSessionUser();
  if (!user0?.id) redirect('/login');
  const userId = Number(user0.id);
  const { platformId } = await params;
  const platId = Number(platformId);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect('/login');

  const platform = await db.platform.findUnique({ where: { id: platId } });
  if (!platform) redirect('/orders');

  // Threshold = user's current balance
  const threshold = user.balance;

  // Determine which platform the user should be on
  const [alibabaPlatform, aliexpressPlatform] = await Promise.all([
    db.platform.findFirst({ where: { name: { contains: 'alibaba' }, status: 1 }, select: { id: true } }),
    db.platform.findFirst({ where: { name: { contains: 'aliexpress' }, status: 1 }, select: { id: true } }),
  ]);

  const correctPlatformId =
    threshold > 899 ? aliexpressPlatform?.id :
    threshold > 499 ? alibabaPlatform?.id :
    null;

  // Only redirect if: user is on wrong platform AND they have an assignment on the correct one
  if (correctPlatformId && platId !== correctPlatformId) {
    const hasAssignment = await db.orderSetAssign.findFirst({
      where: { user_id: userId, orderSet: { platform_id: correctPlatformId }, percentage_completed: { lt: 100 } },
      select: { id: true },
    });
    if (hasAssignment) redirect(`/orders/${correctPlatformId}`);
  }

  // Get all assignments for this platform, pick the first incomplete one
  const allAssignments = await db.orderSetAssign.findMany({
    where: { user_id: userId, orderSet: { platform_id: platId } },
    include: { orderSet: { include: { orders: { orderBy: { id: 'asc' }, include: { orderDetails: { include: { product: true } } } } } } },
    orderBy: { id: 'asc' },
  });

  if (!allAssignments.length) redirect('/orders');

  // Check for any globally pending order (across all sets) — needed to match start API logic
  const globalPending = await db.orderComplete.findFirst({
    where: { user_id: userId, status: 0 },
    select: { order_id: true, id: true, order_no: true, order_set_id: true },
  });

  // Pick assignment: prefer the one with the pending order, else first incomplete
  const assignment =
    allAssignments.find((a) => a.order_set_id === globalPending?.order_set_id) ||
    allAssignments.find((a) => a.percentage_completed < 100) ||
    allAssignments[0];

  // Get completed orders for this set
  const completedOrders = await db.orderComplete.findMany({
    where: { user_id: userId, order_set_id: assignment.order_set_id },
    select: { order_id: true, status: true, id: true, profit: true, created_at: true, order_no: true },
  });

  const completedOrderIds = completedOrders.filter((c) => c.status === 1).map((c) => c.order_id);
  const pendingOrder = completedOrders.find((c) => c.status === 0);

  // Today's & yesterday's commission from ALL completed orders across all sets
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const [todayOrders, yesterdayOrders, teamCommission] = await Promise.all([
    db.orderComplete.aggregate({
      where: { user_id: userId, status: 1, end_at: { gte: todayStart } },
      _sum: { profit: true },
    }),
    db.orderComplete.aggregate({
      where: { user_id: userId, status: 1, end_at: { gte: yesterdayStart, lt: todayStart } },
      _sum: { profit: true },
    }),
    db.transaction.aggregate({
      where: { user_id: userId, trx_type: '+', remark: { in: ['referral_commission', 'team_commission', 'bv_commission', 'ref_commission'] }, created_at: { gte: yesterdayStart, lt: todayStart } },
      _sum: { amount: true },
    }),
  ]);

  const todayCommission = todayOrders._sum.profit || 0;
  const yesterdayCommission = yesterdayOrders._sum.profit || 0;

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
      orderNo: isPending ? (pendingOrder as any).order_no : null,
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
