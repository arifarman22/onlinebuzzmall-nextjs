import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { createCoinGatePayment, createNOWPayment, createCoinbasePayment, getManualCryptoAddress } from '@/lib/crypto-payments';
import { cryptoDepositSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const rlKey = getRateLimitKey(req, `crypto:${session.user.id}`);
  const rl = rateLimit(rlKey, 10, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const userId = Number(session.user.id);
  const body = await req.json();
  const parsed = cryptoDepositSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { amount, gateway, pay_currency } = parsed.data;
  const trx = generateTrx();

  const deposit = await db.deposit.create({
    data: {
      user_id: userId,
      amount,
      charge: 0,
      rate: 1,
      final_amo: amount,
      trx,
      status: 0,
      method_code: gateway === 'coingate' ? 1001 : gateway === 'nowpayments' ? 1002 : gateway === 'coinbase' ? 1003 : 1004,
    },
  });

  let result;

  switch (gateway) {
    case 'coingate':
      result = await createCoinGatePayment(trx, amount);
      break;
    case 'nowpayments':
      result = await createNOWPayment(trx, amount, pay_currency || 'btc');
      break;
    case 'coinbase':
      result = await createCoinbasePayment(trx, amount);
      break;
    case 'manual':
      result = getManualCryptoAddress(pay_currency || 'usdt_trc20');
      break;
  }

  if (!result.success) {
    await db.deposit.delete({ where: { id: deposit.id } });
    return NextResponse.json({ success: false, message: result.message }, { status: 400 });
  }

  if (gateway === 'manual') {
    await db.deposit.update({ where: { id: deposit.id }, data: { status: 2 } });
  }

  await db.deposit.update({
    where: { id: deposit.id },
    data: {
      btc_amo: result.amount_crypto || null,
      btc_wallet: result.wallet_address || result.payment_id || null,
      detail: { gateway, payment_id: result.payment_id, pay_currency } as any,
    },
  });

  return NextResponse.json({
    success: true,
    message: gateway === 'manual' ? 'Send the exact amount to the address below' : 'Payment initiated',
    data: {
      payment_url: result.payment_url,
      wallet_address: result.wallet_address,
      amount_crypto: result.amount_crypto,
      currency: result.currency,
      trx,
    },
  });
}
