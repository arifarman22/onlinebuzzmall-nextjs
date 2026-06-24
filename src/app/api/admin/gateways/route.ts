import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get('search') || '';
  const id = req.nextUrl.searchParams.get('id');

  if (id) {
    const gateway = await db.gateway.findUnique({
      where: { id: Number(id) },
      include: { fields: { orderBy: { sort_order: 'asc' } } },
    });
    return NextResponse.json({ success: true, data: gateway });
  }

  const where: any = {};
  if (search) where.name = { contains: search };

  const gateways = await db.gateway.findMany({
    where,
    include: { fields: { orderBy: { sort_order: 'asc' } }, _count: { select: { fields: true } } },
    orderBy: { sort_order: 'asc' },
  });

  return NextResponse.json({ success: true, data: gateways });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, message: 'Gateway name is required' }, { status: 400 });

    const gateway = await db.gateway.create({
      data: buildGatewayData(body),
    });

    return NextResponse.json({ success: true, message: 'Gateway created successfully', data: gateway });
  } catch (err: any) {
    console.error('Gateway create error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to create gateway' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

    const existing = await db.gateway.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, message: 'Gateway not found' }, { status: 404 });

    await db.gateway.update({
      where: { id },
      data: buildGatewayData(body),
    });

    return NextResponse.json({ success: true, message: 'Gateway updated successfully' });
  } catch (err: any) {
    console.error('Gateway update error:', err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to update gateway' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    await db.gateway.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Gateway deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to delete' }, { status: 500 });
  }
}

// Explicit field mapping - only known database columns
function buildGatewayData(body: any) {
  return {
    name: body.name || undefined,
    alias: body.name ? body.name.toLowerCase().replace(/[\s-]+/g, '_') : undefined,
    currency: body.currency ?? 'USD',
    country: body.country || null,
    exchange_rate: Number(body.exchange_rate) || 1,
    min_amount: Number(body.min_amount) || 10,
    max_amount: Number(body.max_amount) || 100000,
    fixed_charge: Number(body.fixed_charge) || 0,
    percent_charge: Number(body.percent_charge) || 0,
    instructions: body.instructions || null,
    qr_code: body.qr_code || null,
    wallet_address: body.wallet_address || null,
    logo: body.logo || null,
    category: body.category || null,
    sort_order: Number(body.sort_order) || 0,
    status: body.status !== undefined ? Number(body.status) : 1,
    show_qr: body.show_qr !== undefined ? Number(body.show_qr) : 1,
    show_wallet: body.show_wallet !== undefined ? Number(body.show_wallet) : 1,
    show_copy_btn: body.show_copy_btn !== undefined ? Number(body.show_copy_btn) : 1,
    show_charge: body.show_charge !== undefined ? Number(body.show_charge) : 0,
    show_instructions: body.show_instructions !== undefined ? Number(body.show_instructions) : 1,
    show_proof: body.show_proof !== undefined ? Number(body.show_proof) : 1,
    proof_types: body.proof_types || 'jpg,png,webp',
    proof_max_size: Number(body.proof_max_size) || 5,
  };
}
