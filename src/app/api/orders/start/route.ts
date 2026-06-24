import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateOrderNo } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const body = await req.json();
  const { platform_id } = body;

  if (!platform_id) {
    return NextResponse.json({ success: false, message: 'Platform ID required' }, { status: 400 });
  }

  try {
    // ===== RULE 1: Only ONE active task at a time =====
    const existingPending = await db.orderComplete.findFirst({
      where: { user_id: userId, status: 0 },
    });
    if (existingPending) {
      return NextResponse.json({ success: false, message: 'Complete your active task first.' }, { status: 400 });
    }

    // ===== Find user's assignment for this platform =====
    const assignment = await db.orderSetAssign.findFirst({
      where: { user_id: userId, orderSet: { platform_id } },
      include: { orderSet: { include: { platform: true } } },
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

    return NextResponse.json({ success: true, message: 'Order started successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to start order' }, { status: 500 });
  }
}
