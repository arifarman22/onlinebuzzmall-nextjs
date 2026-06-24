import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify signature
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    if (ipnSecret) {
      const sig = req.headers.get('x-nowpayments-sig');
      if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      const sortedBody = JSON.stringify(sortObject(body));
      const hmac = crypto.createHmac('sha512', ipnSecret).update(sortedBody).digest('hex');
      if (sig !== hmac) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { order_id, payment_status } = body;

    if (payment_status !== 'finished' && payment_status !== 'confirmed') {
      return NextResponse.json({ received: true });
    }

    await db.$transaction(async (tx) => {
      const deposit = await tx.deposit.findFirst({ where: { trx: order_id } });
      if (!deposit || deposit.status === 1) return;

      await tx.deposit.update({ where: { id: deposit.id }, data: { status: 1 } });

      await tx.user.update({
        where: { id: deposit.user_id },
        data: { balance: { increment: deposit.amount } },
      });

      const user = await tx.user.findUnique({ where: { id: deposit.user_id } });

      await tx.transaction.create({
        data: {
          user_id: deposit.user_id,
          amount: deposit.amount,
          post_balance: user!.balance,
          charge: deposit.charge,
          trx_type: '+',
          details: 'Deposit via NOWPayments (Crypto)',
          trx: deposit.trx || generateTrx(),
          remark: 'deposit',
        },
      });
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('NOWPayments webhook error:', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

function sortObject(obj: any): any {
  return Object.keys(obj).sort().reduce((result: any, key) => {
    result[key] = obj[key] && typeof obj[key] === 'object' ? sortObject(obj[key]) : obj[key];
    return result;
  }, {});
}
