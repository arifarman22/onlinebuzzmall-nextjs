import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);
    const orderId = params.get('order_id');
    const status = params.get('status');
    const token = params.get('token');

    if (!orderId) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });

    // Verify callback token if configured
    const callbackSecret = process.env.COINGATE_CALLBACK_SECRET;
    if (callbackSecret) {
      // CoinGate sends a token parameter that should match your configured callback token
      if (token !== callbackSecret) {
        console.error('CoinGate webhook: Invalid token');
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    // Also verify via IP whitelist (CoinGate IPs)
    const allowedIPs = ['52.28.107.115', '52.29.173.151', '52.58.230.219'];
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || '';
    
    if (process.env.NODE_ENV === 'production' && callbackSecret && !allowedIPs.includes(clientIP)) {
      console.error('CoinGate webhook: Unauthorized IP', clientIP.replace(/[\r\n\x00-\x1f]/g, ''));
      return NextResponse.json({ error: 'Unauthorized IP' }, { status: 403 });
    }

    // CoinGate statuses: new, pending, confirming, paid, invalid, expired, canceled
    if (status !== 'paid') {
      return NextResponse.json({ received: true });
    }

    await db.$transaction(async (tx) => {
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
