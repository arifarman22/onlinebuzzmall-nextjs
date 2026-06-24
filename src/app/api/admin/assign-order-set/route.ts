import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateOrderNo } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const userId = Number(req.nextUrl.searchParams.get('user_id'));
  if (!userId) return NextResponse.json({ success: false, message: 'user_id required' }, { status: 400 });

  const assignments = await db.orderSetAssign.findMany({
    where: { user_id: userId },
    include: { orderSet: { include: { platform: { select: { name: true } } } } },
    orderBy: { id: 'desc' },
  });

  const allOrderSets = await db.orderSet.findMany({
    where: { status: 1 },
    include: { platform: { select: { name: true } }, _count: { select: { orders: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ success: true, data: { assignments, allOrderSets } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { action, user_id, order_set_id } = await req.json();

  if (!user_id || !order_set_id) {
    return NextResponse.json({ success: false, message: 'user_id and order_set_id required' }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: user_id } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  if (action === 'assign') {
    const existing = await db.orderSetAssign.findFirst({ where: { user_id, order_set_id } });
    if (existing) return NextResponse.json({ success: false, message: 'Already assigned' }, { status: 400 });

    const orderSet = await db.orderSet.findUnique({ where: { id: order_set_id }, include: { orders: true } });
    if (!orderSet) return NextResponse.json({ success: false, message: 'Order set not found' }, { status: 404 });

    // Create assignment
    await db.orderSetAssign.create({ data: { user_id, order_set_id, percentage_completed: 0 } });

    // Create OrderComplete records for each order
    for (const order of orderSet.orders) {
      const orderDetails = await db.orderDetail.findMany({ where: { order_id: order.id } });
      const totalPrice = orderDetails.reduce((s, d) => s + d.price * d.quantity, 0);

      await db.orderComplete.create({
        data: {
          order_set_id,
          user_id,
          order_id: order.id,
          order_no: generateOrderNo(),
          price: totalPrice,
          profit: 0,
          balance: user.balance,
          status: 0,
        },
      });
    }

    return NextResponse.json({ success: true, message: `Assigned with ${orderSet.orders.length} order(s)` });
  }

  if (action === 'remove') {
    // Remove assignment and pending order completes
    await db.orderComplete.deleteMany({ where: { user_id, order_set_id, status: 0 } });
    await db.orderSetAssign.deleteMany({ where: { user_id, order_set_id } });
    return NextResponse.json({ success: true, message: 'Assignment removed' });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
