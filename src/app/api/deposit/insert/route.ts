import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { depositInsertSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const rlKey = getRateLimitKey(req, `deposit:${session.user.id}`);
  const rl = rateLimit(rlKey, 10, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const userId = Number(session.user.id);
  const body = await req.json();
  const parsed = depositInsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { method_code, amount } = parsed.data;

  const gateway = await db.gatewayCurrency.findFirst({
    where: { method_code },
    include: { gateway: true },
  });

  if (!gateway || gateway.gateway?.status !== 1) {
    return NextResponse.json({ success: false, message: 'Payment method not available' }, { status: 400 });
  }

  if (amount < gateway.min_amount || amount > gateway.max_amount) {
    return NextResponse.json({ success: false, message: `Amount must be between $${gateway.min_amount} and $${gateway.max_amount}` }, { status: 400 });
  }

  const charge = gateway.fixed_charge + (amount * gateway.percent_charge / 100);
  const finalAmount = amount + charge;

  await db.deposit.create({
    data: {
      user_id: userId,
      method_code,
      amount,
      charge,
      rate: gateway.rate,
      final_amo: finalAmount,
      trx: generateTrx(),
      status: 2,
    },
  });

  return NextResponse.json({ success: true, message: 'Deposit request submitted. Awaiting approval.' });
}
