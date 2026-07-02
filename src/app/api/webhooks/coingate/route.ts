import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';

// CoinGate official callback IPs
const COINGATE_IPS = ['52.28.107.115', '52.29.173.151', '52.58.230.219'];

export async function POST(req: NextRequest) {
  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || '';

    // FIX #5 (High): IP check is now unconditional in production
    // Previously only ran when callbackSecret was set — allowing bypass if env var missing
    if (process.env.NODE_ENV === 'production' && !COINGATE_IPS.includes(clientIP)) {
      console.error('CoinGate webhook: Unauthorized IP', clientIP.replace(/[\r\n\x00-\x1f]/g, ''));
      return NextResponse.json({ error: 'Unauthorized IP' }, { status: 403 });
    }

    const body = await req.text();
    const params = new URLSearchParams(body);
    const orderId = params.get('order_id');
    const status = params.get('status');
    const token = params.get('token');

    if (!orderId) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });

    // Verify callback token
    const callbackSecret = process.env.COINGATE_CALLBACK_SECRET;
    if (callbackSecret && token !== callbackSecret) {
      console.error('CoinGate webhook: Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (status !== 'paid') {
      return NextResponse.json({ received: true });
    }

    await db.$transaction(async (tx) => {
      const deposit = await tx.deposit.findFirst({ where: { trx: orderId } });
      if (!deposit || deposit.status === 1) return;

      await tx.deposit.update({ where: { id: deposit.id }, data: { status: 1 } });

      const updatedUser = await tx.user.update({
        where: { id: deposit.user_id },
        data: { balance: { increment: deposit.amount } },
      });

      await tx.transaction.create({
        data: {
          user_id: deposit.user_id,
          amount: deposit.amount,
          post_balance: updatedUser.balance,
          charge: deposit.charge,
          trx_type: '+',
          details: 'Deposit via CoinGate (Crypto)',
          trx: deposit.trx || generateTrx(),
          remark: 'deposit',
        },
      });
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('CoinGate webhook error:', err);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
