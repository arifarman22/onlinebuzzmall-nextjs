import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { transferSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const rlKey = getRateLimitKey(req, `transfer:${session.user.id}`);
  const rl = rateLimit(rlKey, 5, 60 * 1000); // 5 per minute
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const userId = Number(session.user.id);
  const body = await req.json();
  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { username, amount } = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const settings = await tx.generalSetting.findFirst();
      if (!settings?.balance_transfer) {
        throw new Error('Balance transfer is disabled');
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const toUser = await tx.user.findFirst({ where: { username } });
      if (!toUser) throw new Error('Recipient not found');
      if (toUser.id === userId) throw new Error('Cannot transfer to yourself');

      if (settings.balance_transfer_min && amount < settings.balance_transfer_min) {
        throw new Error(`Minimum transfer: $${settings.balance_transfer_min}`);
      }
      if (settings.balance_transfer_max && amount > settings.balance_transfer_max) {
        throw new Error(`Maximum transfer: $${settings.balance_transfer_max}`);
      }

      const charge = (settings.balance_transfer_fixed_charge || 0) + (amount * (settings.balance_transfer_per_charge || 0) / 100);
      const totalDeduct = amount + charge;

      if (user.balance < totalDeduct) {
        throw new Error('Insufficient balance');
      }

      const trx = generateTrx();

      // Deduct from sender
      await tx.user.update({ where: { id: userId }, data: { balance: { decrement: totalDeduct } } });
      const sender = await tx.user.findUnique({ where: { id: userId } });

      await tx.transaction.create({
        data: { user_id: userId, amount: totalDeduct, post_balance: sender!.balance, charge, trx_type: '-', remark: 'balance_transfer', details: `Balance transfer to ${toUser.username}`, trx },
      });

      // Credit recipient
      await tx.user.update({ where: { id: toUser.id }, data: { balance: { increment: amount } } });
      const recipient = await tx.user.findUnique({ where: { id: toUser.id } });

      await tx.transaction.create({
        data: { user_id: toUser.id, amount, post_balance: recipient!.balance, charge: 0, trx_type: '+', remark: 'balance_transfer', details: `Balance received from ${user.username}`, trx },
      });

      return true;
    });

    return NextResponse.json({ success: true, message: 'Balance transferred successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Transfer failed' }, { status: 400 });
  }
}
