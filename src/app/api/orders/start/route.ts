import { NextRequest, NextResponse } from 'next/server';
import { getApiUserId } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { generateOrderNo } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { platform_id } = body;

  if (!platform_id) {
    return NextResponse.json({ success: false, message: 'Platform ID required' }, { status: 400 });
  }

  try {
    // FIX #10 (Medium): Block status 0 (pending) AND any non-completed states
    // status: 0 = pending, status: 1 = completed — only allow new start if none pending
    const existingPending = await db.orderComplete.findFirst({
      where: { user_id: userId, status: 0 },
    });
    if (existingPending) {
      return NextResponse.json({ success: false, message: 'Complete your active task first.' }, { status: 400 });
    }

    // ===== Find user's assignment for this platform =====
    const assignment = await db.orderSetAssign.findFirst({
      where: { user_id: userId, orderSet: { platform_id }, percentage_completed: { lt: 100 } },
      include: { orderSet: { include: { platform: true } } },
      orderBy: { id: 'asc' },
    });

    if (!assignment) {
      return NextResponse.json({ success: false, message: 'No order set assigned for this platform.' }, { status: 400 });
    }

    if (assignment.percentage_completed >= 100) {
      return NextResponse.json({ success: false, message: 'All tasks completed for this platform.' }, { status: 400 });
    }

    // ===== Queue next order from the assigned set =====
    const allOrders = await db.order.findMany({
      where: { order_set_id: assignment.order_set_id },
      orderBy: { id: 'asc' },
    });

    const existingCompletes = await db.orderComplete.findMany({
      where: { user_id: userId, order_set_id: assignment.order_set_id },
      select: { order_id: true, status: true },
    });

    // Find next order that hasn't been completed (status=1)
    const completedOrderIds = existingCompletes.filter((c) => c.status === 1).map((c) => c.order_id);
    const nextOrder = allOrders.find((o) => !completedOrderIds.includes(o.id));

    if (!nextOrder) {
      return NextResponse.json({ success: false, message: 'No more orders available in this set.' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    const details = await db.orderDetail.findMany({ where: { order_id: nextOrder.id } });
    const price = details.reduce((sum, d) => sum + d.price * d.quantity, 0);

    await db.orderComplete.create({
      data: {
        order_set_id: assignment.order_set_id,
        user_id: userId,
        order_id: nextOrder.id,
        order_no: generateOrderNo(),
        price,
        profit: 0,
        balance: user?.balance || 0,
        order_count: completedOrderIds.length,
        status: 0,
      },
    });

    const created = await db.orderComplete.findFirst({
      where: { user_id: userId, order_id: nextOrder.id, status: 0 },
      select: { id: true, order_no: true },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ success: true, message: 'Order started successfully.', order_complete_id: created?.id, order_no: created?.order_no });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to start order' }, { status: 500 });
  }
}
