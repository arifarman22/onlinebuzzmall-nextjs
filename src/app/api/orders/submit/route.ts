import { NextRequest, NextResponse } from 'next/server';
import { getApiUserId } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { orderSubmitSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit(`order:${userId}`, 30, 60 * 1000);
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
    // Pre-fetch read-only data OUTSIDE the transaction to reduce queries inside it
    // These don't need to be atomic — only the balance writes do
    const [orderComplete, user] = await Promise.all([
      db.orderComplete.findFirst({ where: { id: order_id, user_id: userId, status: 0 } }),
      db.user.findUnique({ where: { id: userId } }),
    ]);

    if (!orderComplete) throw new Error('Order not found or already completed');
    if (!user) throw new Error('User not found');

    const [order, orderDetails] = await Promise.all([
      db.order.findUnique({
        where: { id: orderComplete.order_id },
        include: { platform: true, orderSet: { include: { platform: true } } },
      }),
      db.orderDetail.findMany({ where: { order_id: orderComplete.order_id } }),
    ]);

    if (!order) throw new Error('Order data not found');

    const totalPrice = orderDetails.reduce((sum, d) => sum + d.price * d.quantity, 0);
    const profit = totalPrice * (order.profit / 100);

    // Balance check before entering transaction (early exit, saves a round trip)
    const availableBalance = user.balance - user.freeze_amount;
    if (availableBalance < totalPrice) {
      const remaining = totalPrice - availableBalance;
      throw new Error(`Insufficient balance. You need $${remaining.toFixed(2)} more.`);
    }

    // Atomic block: only the writes that MUST be atomic go here
    // Re-check balance inside transaction to prevent race condition
    // Timeout raised to 15s to handle TiDB Cloud remote latency
    const finalBalance = await db.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({ where: { id: userId } });
      if (!freshUser) throw new Error('User not found');

      const freshAvailable = freshUser.balance - freshUser.freeze_amount;
      if (freshAvailable < totalPrice) {
        const remaining = totalPrice - freshAvailable;
        throw new Error(`Insufficient balance. You need $${remaining.toFixed(2)} more.`);
      }

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

      await tx.orderComplete.update({
        where: { id: order_id },
        data: { profit, price: totalPrice, balance: finalUser.balance, end_at: new Date(), status: 1 },
      });

      return finalUser.balance;
    }, { timeout: 15000 });

    // Update order set progress OUTSIDE transaction — not financial, doesn't need to be atomic
    if (order.order_set_id) {
      const orderSetAssign = await db.orderSetAssign.findFirst({
        where: { user_id: userId, order_set_id: order.order_set_id },
      });
      if (orderSetAssign) {
        const [totalOrdersInSet, completedInSet] = await Promise.all([
          db.order.count({ where: { order_set_id: order.order_set_id } }),
          db.orderComplete.count({ where: { user_id: userId, order_set_id: order.order_set_id, status: 1 } }),
        ]);
        const percent = totalOrdersInSet > 0 ? Math.min((completedInSet / totalOrdersInSet) * 100, 100) : 0;
        await db.orderSetAssign.update({
          where: { id: orderSetAssign.id },
          data: { percentage_completed: percent },
        });
      }
    }

    // Platform progression — threshold is available balance (balance minus freeze)
    const currentPlatformId = order.platform_id || order.orderSet?.platform_id || null;
    const orderSetId = order.order_set_id;
    const freshUser = await db.user.findUnique({ where: { id: userId }, select: { freeze_amount: true } });
    const threshold = finalBalance - (freshUser?.freeze_amount || 0);

    let redirectPlatformId: number | null = null;
    let redirectType: 'vip2' | 'vip3' | null = null;
    let targetPlatform: { id: number; commission: number } | null = null;

    if (threshold > 899) {
      targetPlatform = await db.platform.findFirst({
        where: { name: { contains: 'aliexpress' }, status: 1 },
        select: { id: true, commission: true },
      });
      if (targetPlatform && currentPlatformId !== targetPlatform.id) {
        redirectPlatformId = targetPlatform.id;
        redirectType = 'vip3';
      }
    } else if (threshold > 499) {
      targetPlatform = await db.platform.findFirst({
        where: { name: { contains: 'alibaba' }, status: 1 },
        select: { id: true, commission: true },
      });
      if (targetPlatform && currentPlatformId !== targetPlatform.id) {
        redirectPlatformId = targetPlatform.id;
        redirectType = 'vip2';
      }
    }

    // Migrate the order set to the new platform:
    // 1. Update OrderSet.platform_id
    // 2. Update all incomplete Order.profit to new commission rate
    // 3. Update all incomplete Order.platform_id to new platform
    if (redirectPlatformId && targetPlatform && orderSetId) {
      const completedOrderIds = await db.orderComplete.findMany({
        where: { user_id: userId, order_set_id: orderSetId, status: 1 },
        select: { order_id: true },
      });
      const completedIds = completedOrderIds.map((c) => c.order_id);

      await Promise.all([
        db.orderSet.update({
          where: { id: orderSetId },
          data: { platform_id: redirectPlatformId },
        }),
        db.order.updateMany({
          where: { order_set_id: orderSetId, id: { notIn: completedIds.length ? completedIds : [-1] } },
          data: { platform_id: redirectPlatformId, profit: targetPlatform.commission },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Order completed successfully!',
      ...(redirectPlatformId && { redirect_platform_id: redirectPlatformId, redirect_type: redirectType }),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to submit order' }, { status: 400 });
  }
}
