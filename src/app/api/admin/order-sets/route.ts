import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') return null;
  return session;
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { name, platform_id, user_rank_id, total_profit, status } = await req.json();
  await db.orderSet.create({ data: { name, platform_id, user_rank_id, total_profit, status } });
  return NextResponse.json({ success: true, message: 'Order set created' });
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id, name, platform_id, user_rank_id, total_profit, status } = await req.json();
  await db.orderSet.update({ where: { id }, data: { name, platform_id, user_rank_id, total_profit, status } });
  return NextResponse.json({ success: true, message: 'Order set updated' });
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { action, username, order_set_id } = await req.json();

  if (action === 'assign') {
    const user = await db.user.findFirst({ where: { username } });
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const orderSet = await db.orderSet.findUnique({ where: { id: order_set_id }, include: { orders: true } });
    if (!orderSet) return NextResponse.json({ success: false, message: 'Order set not found' }, { status: 404 });

    const existing = await db.orderSetAssign.findFirst({ where: { user_id: user.id, order_set_id } });
    if (existing) return NextResponse.json({ success: false, message: 'Already assigned to this user' }, { status: 400 });

    if (orderSet.orders.length === 0) {
      return NextResponse.json({ success: false, message: 'Order set has no orders. Add orders first.' }, { status: 400 });
    }

    // Create the assignment
    await db.orderSetAssign.create({ data: { user_id: user.id, order_set_id, percentage_completed: 0 } });

    // Create FIRST OrderComplete record (subsequent ones auto-queued on completion)
    const { generateOrderNo } = await import('@/lib/utils');
    const firstOrder = orderSet.orders[0];
    if (firstOrder) {
      const orderDetails = await db.orderDetail.findMany({ where: { order_id: firstOrder.id } });
      const totalPrice = orderDetails.reduce((sum, d) => sum + d.price * d.quantity, 0);

      await db.orderComplete.create({
        data: {
          order_set_id,
          user_id: user.id,
          order_id: firstOrder.id,
          order_no: generateOrderNo(),
          price: totalPrice,
          profit: 0,
          balance: user.balance,
          order_count: 0,
          status: 0,
        },
      });
    }

    return NextResponse.json({ success: true, message: `Order set assigned to ${username} with ${orderSet.orders.length} order(s)` });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await db.orderSet.delete({ where: { id } });
  return NextResponse.json({ success: true, message: 'Order set deleted' });
}
