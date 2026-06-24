import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';

export async function getReferralTree(userId: number, maxLevel = 4) {
  const levels: any[][] = [];
  let currentIds = [userId];

  for (let i = 0; i < maxLevel; i++) {
    const users = await db.user.findMany({
      where: { ref_by: { in: currentIds } },
      select: { id: true, username: true, firstname: true, lastname: true, balance: true, created_at: true },
    });
    levels.push(users);
    currentIds = users.map((u) => u.id);
    if (currentIds.length === 0) break;
  }
  return levels;
}

export async function giveReferralCommission(userId: number, planPrice: number, refComPercent: number) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.ref_by) return;

  const referrer = await db.user.findUnique({ where: { id: user.ref_by } });
  if (!referrer || referrer.plan_id === 0) return;

  const referrerPlan = await db.plan.findUnique({ where: { id: referrer.plan_id } });
  if (!referrerPlan) return;

  const amount = referrerPlan.ref_com;
  const trx = generateTrx();

  await db.user.update({
    where: { id: referrer.id },
    data: {
      balance: { increment: amount },
      total_ref_com: { increment: amount },
    },
  });

  await db.transaction.create({
    data: {
      user_id: referrer.id,
      amount,
      post_balance: referrer.balance + amount,
      charge: 0,
      trx_type: '+',
      details: `Direct referral commission from ${user.username}`,
      trx,
      remark: 'referral_commission',
    },
  });
}

export async function updateBinaryTreeBV(userId: number, bv: number) {
  let currentUser: any = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) return;

  while (currentUser?.pos_id) {
    const upper = await db.user.findUnique({
      where: { id: currentUser.pos_id },
      include: { userExtra: true },
    });
    if (!upper) break;
    if (upper.plan_id === 0) {
      currentUser = upper;
      continue;
    }

    const extra = upper.userExtra;
    if (!extra) {
      currentUser = upper;
      continue;
    }

    if (currentUser.position === 1) {
      await db.userExtra.update({
        where: { id: extra.id },
        data: { total_bv_left: { increment: bv }, bv_left: { increment: bv } },
      });
    } else {
      await db.userExtra.update({
        where: { id: extra.id },
        data: { total_bv_right: { increment: bv }, bv_right: { increment: bv } },
      });
    }

    await db.bvLog.create({
      data: {
        user_id: upper.id,
        position: currentUser.position ?? 1,
        amount: bv,
        trx_type: '+',
        details: `BV from ${currentUser.username}`,
      },
    });

    currentUser = upper;
  }
}

export async function getPositioner(positionerId: number, position: number): Promise<number> {
  let currentId = positionerId;
  while (true) {
    const under = await db.user.findFirst({
      where: { pos_id: currentId, position },
      select: { id: true },
    });
    if (under) {
      currentId = under.id;
    } else {
      break;
    }
  }
  return currentId;
}

export async function updateFreeCount(userId: number) {
  let currentUser: any = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) return;

  while (currentUser?.pos_id) {
    const upper = await db.user.findUnique({
      where: { id: currentUser.pos_id },
      include: { userExtra: true },
    });
    if (!upper || !upper.userExtra) break;

    if (currentUser.position === 1) {
      await db.userExtra.update({
        where: { id: upper.userExtra.id },
        data: { free_left: { increment: 1 } },
      });
    } else {
      await db.userExtra.update({
        where: { id: upper.userExtra.id },
        data: { free_right: { increment: 1 } },
      });
    }
    currentUser = upper;
  }
}
