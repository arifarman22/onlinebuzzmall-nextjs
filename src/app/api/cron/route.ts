import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';

// This endpoint should be called by a cron job (e.g., via cron-job.org or VPS crontab)
// GET /api/cron?secret=YOUR_CRON_SECRET

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const settings = await db.generalSetting.findFirst();
  if (!settings) return NextResponse.json({ success: false, message: 'No settings' });

  // Check if matching bonus should run
  const lastPaid = settings.last_paid;
  if (lastPaid && new Date(lastPaid).toDateString() === new Date().toDateString()) {
    return NextResponse.json({ success: true, message: 'Already paid today' });
  }

  const matchingBonus = settings.matching_bonus || 0;
  if (matchingBonus <= 0) {
    return NextResponse.json({ success: true, message: 'Matching bonus is 0' });
  }

  // Get all users with BV on both sides
  const userExtras = await db.userExtra.findMany({
    where: { bv_left: { gt: 0 }, bv_right: { gt: 0 } },
    include: { user: true },
  });

  let paidCount = 0;

  for (const extra of userExtras) {
    if (!extra.user || extra.user.plan_id === 0) continue;

    const weak = Math.min(extra.bv_left, extra.bv_right);
    const maxBv = settings.max_bv || 999999;
    const paidBv = Math.min(weak, maxBv);
    const bonus = paidBv * matchingBonus / 100;

    if (bonus <= 0) continue;

    // Credit user
    await db.user.update({
      where: { id: extra.user.id },
      data: { balance: { increment: bonus } },
    });

    const updatedUser = await db.user.findUnique({ where: { id: extra.user.id } });

    await db.transaction.create({
      data: {
        user_id: extra.user.id,
        amount: bonus,
        post_balance: updatedUser!.balance,
        charge: 0,
        trx_type: '+',
        details: `Matching bonus for ${paidBv} BV`,
        trx: generateTrx(),
        remark: 'matching_bonus',
      },
    });

    // Cut BV based on cary_flash setting
    const caryFlash = settings.cary_flash || 0;
    if (caryFlash === 0) {
      // Cut paid BV from both
      await db.userExtra.update({
        where: { id: extra.id },
        data: { bv_left: { decrement: paidBv }, bv_right: { decrement: paidBv } },
      });
    } else if (caryFlash === 1) {
      // Cut weak from both
      await db.userExtra.update({
        where: { id: extra.id },
        data: { bv_left: { decrement: weak }, bv_right: { decrement: weak } },
      });
    } else {
      // Flush all
      await db.userExtra.update({
        where: { id: extra.id },
        data: { bv_left: 0, bv_right: 0 },
      });
    }

    await db.bvLog.create({
      data: { user_id: extra.user.id, position: 1, amount: paidBv, trx_type: '-', details: `Matching bonus paid: $${bonus.toFixed(2)}` },
    });
    await db.bvLog.create({
      data: { user_id: extra.user.id, position: 2, amount: paidBv, trx_type: '-', details: `Matching bonus paid: $${bonus.toFixed(2)}` },
    });

    paidCount++;
  }

  // Update last paid
  await db.generalSetting.updateMany({ data: { last_paid: new Date() } });

  return NextResponse.json({ success: true, message: `Matching bonus distributed to ${paidCount} users` });
}
