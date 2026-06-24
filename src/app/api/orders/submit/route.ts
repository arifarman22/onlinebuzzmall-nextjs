import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTrx, generateOrderNo } from '@/lib/utils';
import { orderSubmitSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rlKey = getRateLimitKey(req, `order:${session.user.id}`);
  const rl = rateLimit(rlKey, 30, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const userId = Number(session.user.id);
  const body = await req.json();
  const parsed = orderSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }

  const { order_id } = parsed.data;

  try {
    const result = await db.$transaction(async (tx: any) => {
      // Lock user row to prevent race conditions on balance
      const [user] = await tx.$queryRaw`SELECT * FROM users WHERE id = ${userId} FOR UPDATE` as any[];
      if (!user) throw new Error('User not found');

      const orderComplete = await tx.orderComplete.findUnique({ where: { id: order_id } });
      if (!orderComplete) throw new Error('Order not found');
      if (orderComplete.status === 1) throw new Error('Order already completed');
      if (orderComplete.user_id !== userId) throw new Error('Unauthorized');

      // Get order details
      const order = await tx.order.findUnique({
        where: { id: orderComplete.order_id },
        include: { platform: true, orderSet: { include: { platform: true } } },
      });
      if (!order) throw new Error('Order data not found');

      // Calculate price and profit
      const orderDetails = await tx.orderDetail.findMany({ where: { order_id: order.id } });
      const totalPrice = orderDetails.reduce((sum: number, d: { price: number; quantity: number }) => sum + d.price * d.quantity, 0);
      const profit = totalPrice * (order.profit / 100);

      // Check balance
      const availableBalance = user.balance - user.freeze_amount;
      if (availableBalance < totalPrice) {
        const remaining = totalPrice - availableBalance;
        throw new Error(`Insufficient balance. You need $${remaining.toFixed(2)} more.`);
      }

      // Deduct balance
      await tx.user.update({ where: { id: userId }, data: { balance: { decrement: totalPrice } } });
      const afterDeduct = await tx.user.findUnique({ where: { id: userId } });

      await tx.transaction.create({
        data: {
          user_id: userId, amount: totalPrice, post_balance: afterDeduct!.balance,
          charge: 0, trx_type: '-', details: `Order ${orderComplete.order_no}`,
          trx: generateTrx(), remark: 'order',
        },
      });

      // Credit balance + profit
      await tx.user.update({ where: { id: userId }, data: { balance: { increment: profit + totalPrice } } });
      const finalUser = await tx.user.findUnique({ where: { id: userId } });

      await tx.transaction.create({
        data: {
          user_id: userId, amount: profit + totalPrice, post_balance: finalUser!.balance,
          charge: 0, trx_type: '+', details: `Profit from order ${orderComplete.order_no}`,
          trx: generateTrx(), remark: 'order',
        },
      });

      // Mark order as completed
      await tx.orderComplete.update({
        where: { id: order_id },
        data: { profit, balance: finalUser!.balance, end_at: new Date(), status: 1 },
      });

      // Update order set progress
      if (order.order_set_id) {
        const orderSetAssign = await tx.orderSetAssign.findFirst({
          where: { user_id: userId, order_set_id: order.order_set_id },
        });

        if (orderSetAssign) {
          const totalOrdersInSet = await tx.order.count({ where: { order_set_id: order.order_set_id } });
          const completedInSet = await tx.orderComplete.count({
            where: { user_id: userId, order_set_id: order.order_set_id, status: 1 },
          });

          const percent = totalOrdersInSet > 0 ? Math.min((completedInSet / totalOrdersInSet) * 100, 100) : 0;
          await tx.orderSetAssign.update({
            where: { id: orderSetAssign.id },
            data: { percentage_completed: percent },
          });

          // DO NOT auto-queue next order here.
          // User must click "Order Now" to start next task.
          // This prevents race conditions and enforces single-active-task rule.
        }
      }

      return { success: true };
    });

    return NextResponse.json({ success: true, message: 'Order completed successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit order' }, { status: 400 });
  }
}
