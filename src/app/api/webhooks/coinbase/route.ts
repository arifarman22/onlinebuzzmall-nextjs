import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('x-cc-webhook-signature');

    // Verify signature
    const secret = process.env.COINBASE_WEBHOOK_SECRET;
    if (secret) {
      if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
      if (sig !== hmac) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event?.type;

    if (eventType !== 'charge:confirmed' && eventType !== 'charge:resolved') {
      return NextResponse.json({ received: true });
    }

    const orderId = event.event?.data?.metadata?.order_id;
    if (!orderId) return NextResponse.json({ received: true });

    await db.$transaction(async (tx: any) => {
      const deposit = await tx.deposit.findFirst({ where: { trx: orderId } });
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
          details: 'Deposit via Coinbase Commerce (Crypto)',
          trx: deposit.trx || generateTrx(),
          remark: 'deposit',
        },
      });
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Coinbase webhook error:', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
