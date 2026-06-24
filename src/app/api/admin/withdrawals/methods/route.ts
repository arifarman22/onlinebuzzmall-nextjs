import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') return null;
  return { session, roleSlug: (session.user as any).roleSlug || 'super-admin' };
}

// GET: List all methods
export async function GET() {
  const guard = await checkAdmin();
  if (!guard) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const methods = await db.withdrawMethod.findMany({ orderBy: { id: 'desc' } });
  return NextResponse.json({ success: true, data: methods });
}

// POST: Create new method
export async function POST(req: NextRequest) {
  const guard = await checkAdmin();
  if (!guard) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (guard.roleSlug !== 'super-admin') return NextResponse.json({ success: false, message: 'Super Admin only' }, { status: 403 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });

  await db.withdrawMethod.create({
    data: {
      name: body.name.trim(),
      currency: body.currency || null,
      min_limit: Number(body.min_limit) || 0,
      max_limit: Number(body.max_limit) || 0,
      fixed_charge: Number(body.fixed_charge) || 0,
      percent_charge: Number(body.percent_charge) || 0,
      rate: Number(body.rate) || 1,
      description: body.description || null,
      user_data: body.user_data || null,
      status: body.status !== undefined ? Number(body.status) : 1,
    },
  });

  return NextResponse.json({ success: true, message: 'Withdrawal method created' });
}

// PUT: Update method
export async function PUT(req: NextRequest) {
  const guard = await checkAdmin();
  if (!guard) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (guard.roleSlug !== 'super-admin') return NextResponse.json({ success: false, message: 'Super Admin only' }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

  const data: any = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.currency !== undefined) data.currency = body.currency || null;
  if (body.min_limit !== undefined) data.min_limit = Number(body.min_limit) || 0;
  if (body.max_limit !== undefined) data.max_limit = Number(body.max_limit) || 0;
  if (body.fixed_charge !== undefined) data.fixed_charge = Number(body.fixed_charge) || 0;
  if (body.percent_charge !== undefined) data.percent_charge = Number(body.percent_charge) || 0;
  if (body.rate !== undefined) data.rate = Number(body.rate) || 1;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.user_data !== undefined) data.user_data = body.user_data || null;
  if (body.status !== undefined) data.status = Number(body.status);

  await db.withdrawMethod.update({ where: { id: body.id }, data });
  return NextResponse.json({ success: true, message: 'Withdrawal method updated' });
}

// DELETE: Remove method
export async function DELETE(req: NextRequest) {
  const guard = await checkAdmin();
  if (!guard) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (guard.roleSlug !== 'super-admin') return NextResponse.json({ success: false, message: 'Super Admin only' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

  await db.withdrawMethod.delete({ where: { id } });
  return NextResponse.json({ success: true, message: 'Withdrawal method deleted' });
}
