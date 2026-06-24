import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateOrderNo } from '@/lib/utils';

// POST: Ensure each active assignment has a pending OrderComplete queued
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { order_set_id, user_id } = await req.json();

  if (!order_set_id) {
    return NextResponse.json({ success: false, message: 'order_set_id required' }, { status: 400 });
  }

  const orderSet = await db.orderSet.findUnique({
    where: { id: order_set_id },
    include: { orders: { orderBy: { id: 'asc' } } },
  });

  if (!orderSet) return NextResponse.json({ success: false, message: 'Order set not found' }, { status: 404 });
  if (orderSet.orders.length === 0) return NextResponse.json({ success: false, message: 'Order set has no orders.' }, { status: 400 });

  // Get assignments (specific user or all)
  const where: any = { order_set_id };
  if (user_id) where.user_id = user_id;
  const assignments = await db.orderSetAssign.findMany({ where });

  let created = 0;

  for (const assign of assignments) {
    if (assign.percentage_completed >= 100) continue;

    const user = await db.user.findUnique({ where: { id: assign.user_id } });
    if (!user) continue;

    // Check if there's already a pending order for this user+set
    const existingPending = await db.orderComplete.findFirst({
      where: { user_id: assign.user_id, order_set_id, status: 0 },
    });
    if (existingPending) continue; // Already has a queued task

    // Find which orders are completed
    const completedCompletes = await db.orderComplete.findMany({
      where: { user_id: assign.user_id, order_set_id, status: 1 },
      select: { order_id: true },
    });
    const completedOrderIds = completedCompletes.map((c) => c.order_id);

    // Find next order not yet completed
    const nextOrder = orderSet.orders.find((o) => !completedOrderIds.includes(o.id));
    if (!nextOrder) continue; // All done

    const orderDetails = await db.orderDetail.findMany({ where: { order_id: nextOrder.id } });
    const totalPrice = orderDetails.reduce((sum, d) => sum + d.price * d.quantity, 0);

    await db.orderComplete.create({
      data: {
        order_set_id,
        user_id: assign.user_id,
        order_id: nextOrder.id,
        order_no: generateOrderNo(),
        price: totalPrice,
        profit: 0,
        balance: user.balance,
        order_count: completedOrderIds.length,
        status: 0,
      },
    });
    created++;
  }

  return NextResponse.json({ success: true, message: `Refreshed: ${created} order(s) queued for ${assignments.length} user(s)` });
}
