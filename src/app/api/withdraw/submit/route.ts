import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { withdrawSchema } from '@/lib/validations';
import { sendAdminNotification } from '@/lib/notifications';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { getApiUserId } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rlKey = getRateLimitKey(req, `withdraw:${userId}`);
  const rl = rateLimit(rlKey, 5, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }
  const body = await req.json();
  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { method_id, amount } = parsed.data;

  try {
    const method = await db.withdrawMethod.findUnique({ where: { id: method_id } });
    if (!method || method.status !== 1) throw new Error('Method not available');

    // Block withdrawal if user has incomplete task assignments
    const incompleteTask = await db.orderSetAssign.findFirst({
      where: { user_id: userId, percentage_completed: { lt: 100 } },
      select: { id: true },
    });
    if (incompleteTask) throw new Error('You can not perform withdraw without completing all the tasks');

    if (amount < method.min_limit || amount > method.max_limit) {
      throw new Error(`Amount must be between $${method.min_limit} and $${method.max_limit}`);
    }

    const charge = method.fixed_charge + (amount * method.percent_charge / 100);
    const afterCharge = amount - charge;
    const trx = generateTrx();

    // FIX #2 (Critical): Entire financial operation in db.$transaction
    // Re-fetch user inside transaction so balance check is atomic
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const availableBalance = user.balance - user.freeze_amount;
      if (availableBalance < amount) throw new Error('Insufficient balance');

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });

      await tx.withdrawal.create({
        data: {
          user_id: userId, method_id, amount,
          currency: method.currency, rate: method.rate, charge,
          final_amount: afterCharge * method.rate, after_charge: afterCharge,
          trx, status: 2,
        },
      });

      await tx.transaction.create({
        data: {
          user_id: userId, amount, post_balance: updatedUser.balance, charge,
          trx_type: '-', details: `Withdraw via ${method.name}`,
          trx: generateTrx(), remark: 'withdraw',
        },
      });
    }, { timeout: 15000 });

    sendAdminNotification({
      title: 'New Withdrawal Request',
      message: `User #${userId} requested withdrawal of ${amount}. Pending approval.`,
      type: 'withdrawal',
    });

    return NextResponse.json({ success: true, message: 'Withdrawal request submitted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Withdrawal failed' }, { status: 400 });
  }
}
