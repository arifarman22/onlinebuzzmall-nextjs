import { NextRequest, NextResponse } from 'next/server';
import { getApiUserId } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { orderSubmitSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rlKey = getRateLimitKey(req, `order:${userId}`);
  const rl = rateLimit(rlKey, 30, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = orderSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }

  const { order_id } = parsed.data;

  try {
    // FIX #1 (Critical): Entire financial operation wrapped in db.$transaction
    // Prevents race condition where two simultaneous requests both pass balance check
    await db.$transaction(async (tx) => {
      // FIX #4 (High): Single query with ownership + status check — no info leak
      const orderComplete = await tx.orderComplete.findFirst({
        where: { id: order_id, user_id: userId, status: 0 },
      });
      if (!orderComplete) throw new Error('Order not found or already completed');

      const order = await tx.order.findUnique({
        where: { id: orderComplete.order_id },
        include: { platform: true, orderSet: { include: { platform: true } } },
      });
      if (!order) throw new Error('Order data not found');

      const orderDetails = await tx.orderDetail.findMany({ where: { order_id: order.id } });
      const totalPrice = orderDetails.reduce((sum, d) => sum + d.price * d.quantity, 0);
      const profit = totalPrice * (order.profit / 100);

      // Re-fetch user inside transaction for accurate balance
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const availableBalance = user.balance - user.freeze_amount;
      if (availableBalance < totalPrice) {
        const remaining = totalPrice - availableBalance;
        throw new Error(`Insufficient balance. You need $${remaining.toFixed(2)} more.`);
      }

      // Deduct balance
      const afterDeduct = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalPrice } },
      });

      await tx.transaction.create({
        data: {
          user_id: userId, amount: totalPrice, post_balance: afterDeduct.balance,
          charge: 0, trx_type: '-', details: `Order ${orderComplete.order_no}`,
          trx: generateTrx(), remark: 'order',
        },
      });

      // Credit balance + profit
      const finalUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: profit + totalPrice } },
      });

      await tx.transaction.create({
        data: {
          user_id: userId, amount: profit + totalPrice, post_balance: finalUser.balance,
          charge: 0, trx_type: '+', details: `Profit from order ${orderComplete.order_no}`,
          trx: generateTrx(), remark: 'order',
        },
      });

      // Mark order as completed
      await tx.orderComplete.update({
        where: { id: order_id },
        data: { profit, balance: finalUser.balance, end_at: new Date(), status: 1 },
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
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Order completed successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit order' }, { status: 400 });
  }
}
