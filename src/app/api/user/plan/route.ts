import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { giveReferralCommission, updateBinaryTreeBV } from '@/lib/mlm';
import { planPurchaseSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const rlKey = getRateLimitKey(req, `plan:${session.user.id}`);
  const rl = rateLimit(rlKey, 3, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const userId = Number(session.user.id);
  const body = await req.json();
  const parsed = planPurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
  }

  const { plan_id } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const plan = await db.plan.findUnique({ where: { id: plan_id } });
    if (!plan || plan.status !== 1) throw new Error('Plan not found');

    if (user.balance < plan.price) throw new Error('Insufficient balance');

    await db.user.update({
      where: { id: userId },
      data: { balance: { decrement: plan.price }, plan_id: plan.id, total_invest: { increment: plan.price } },
    });

    const updatedUser = await db.user.findUnique({ where: { id: userId } });

    await db.transaction.create({
      data: {
        user_id: userId, amount: plan.price, trx_type: '-',
        details: `Purchased ${plan.name}`, remark: 'purchased_plan',
        trx: generateTrx(), post_balance: updatedUser!.balance, charge: 0,
      },
    });

    // MLM commissions (outside transaction as they're non-critical)
    if (plan.bv > 0) await updateBinaryTreeBV(userId, plan.bv);
    if (plan.ref_com > 0) await giveReferralCommission(userId, plan.price, plan.ref_com);

    return NextResponse.json({ success: true, message: 'Plan purchased successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Purchase failed' }, { status: 400 });
  }
}
