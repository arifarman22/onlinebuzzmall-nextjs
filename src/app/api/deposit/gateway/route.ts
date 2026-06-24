import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateTrx } from '@/lib/utils';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { sendAdminNotification } from '@/lib/notifications';

// GET: List active gateways with only visible fields
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const gateways = await db.gateway.findMany({
    where: { status: 1 },
    include: { fields: { where: { status: 1 }, orderBy: { sort_order: 'asc' } } },
    orderBy: { sort_order: 'asc' },
  });

  const data = gateways.map((gw) => ({
    id: gw.id,
    name: gw.name,
    currency: gw.currency,
    logo: gw.logo,
    min_amount: gw.min_amount,
    max_amount: gw.max_amount,
    // Only include if toggled on
    qr_code: gw.show_qr ? gw.qr_code : null,
    wallet_address: gw.show_wallet ? gw.wallet_address : null,
    show_copy_btn: gw.show_copy_btn === 1,
    show_charge: gw.show_charge === 1,
    fixed_charge: gw.show_charge ? gw.fixed_charge : 0,
    percent_charge: gw.show_charge ? gw.percent_charge : 0,
    instructions: gw.show_instructions ? gw.instructions : null,
    show_proof: gw.show_proof === 1,
    proof_types: gw.proof_types || 'jpg,png,webp',
    proof_max_size: gw.proof_max_size || 5,
    exchange_rate: gw.exchange_rate,
    fields: gw.fields.map((f) => ({
      id: f.id,
      label: f.label,
      field_name: f.field_name,
      placeholder: f.placeholder,
      type: f.type,
      options: f.options,
      required: f.required,
    })),
  }));

  return NextResponse.json({ success: true, data });
}

// POST: Submit deposit
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const rlKey = getRateLimitKey(req, `gw-deposit:${session.user.id}`);
  const rl = rateLimit(rlKey, 5, 60 * 1000);
  if (!rl.success) return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });

  const userId = Number(session.user.id);
  const body = await req.json();
  const { gateway_id, amount, fields: submittedFields, proof_url } = body;

  if (!gateway_id || !amount || amount <= 0) {
    return NextResponse.json({ success: false, message: 'Gateway and amount are required' }, { status: 400 });
  }

  const gateway = await db.gateway.findUnique({
    where: { id: gateway_id },
    include: { fields: { where: { status: 1 } } },
  });

  if (!gateway || gateway.status !== 1) {
    return NextResponse.json({ success: false, message: 'Gateway not available' }, { status: 400 });
  }

  if (amount < gateway.min_amount || amount > gateway.max_amount) {
    return NextResponse.json({ success: false, message: `Amount must be between ${gateway.min_amount} and ${gateway.max_amount}` }, { status: 400 });
  }

  // Validate required fields
  for (const field of gateway.fields) {
    if (field.required === 1) {
      const value = submittedFields?.[field.field_name];
      if (!value || (typeof value === 'string' && !value.trim())) {
        return NextResponse.json({ success: false, message: `${field.label} is required` }, { status: 400 });
      }
    }
  }

  // Validate proof if required
  if (gateway.show_proof === 1 && !proof_url) {
    return NextResponse.json({ success: false, message: 'Payment proof is required' }, { status: 400 });
  }

  const charge = gateway.fixed_charge + (amount * gateway.percent_charge / 100);
  const finalAmount = (amount + charge) * gateway.exchange_rate;
  const trx = generateTrx();

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') || 'unknown';

  await db.deposit.create({
    data: {
      user_id: userId,
      gateway_id: gateway.id,
      method_code: gateway.code,
      amount,
      method_currency: gateway.currency,
      charge,
      rate: gateway.exchange_rate,
      final_amo: finalAmount,
      trx,
      status: 2,
      detail: JSON.stringify({
        gateway_name: gateway.name,
        proof_url: proof_url || null,
        submitted_fields: submittedFields || {},
        ip,
        submitted_at: new Date().toISOString(),
      }),
    },
  });

  // Notify admin
  sendAdminNotification({
    title: 'New Deposit Request',
    message: `User #${userId} submitted a deposit of ${amount} ${gateway.currency} via ${gateway.name}. TRX: ${trx}`,
    type: 'deposit',
  });

  return NextResponse.json({ success: true, message: 'Deposit submitted. Awaiting approval.', data: { trx } });
  } catch (error: any) {
    console.error('Deposit POST error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Something went wrong', debug: String(error) }, { status: 500 });
  }
}
