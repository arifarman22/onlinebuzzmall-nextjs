import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminPlanSchema } from '@/lib/validations';
import { requirePermission } from '@/lib/rbac';

export async function GET() {
  const guard = await requirePermission('plans.view');
  if (!guard.authorized) return guard.response;

  const plans = await db.plan.findMany({ where: { status: 1 }, select: { id: true, name: true, price: true }, orderBy: { id: 'asc' } });
  return NextResponse.json({ success: true, plans });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('plans.create');
  if (!guard.authorized) return guard.response;

  const body = await req.json();
  const parsed = adminPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, price, bv, ref_com, tree_com } = parsed.data;
  await db.plan.create({ data: { name, price, bv, ref_com, tree_com, status: 1 } });
  return NextResponse.json({ success: true, message: 'Plan created' });
}

export async function PUT(req: NextRequest) {
  const guard = await requirePermission('plans.edit');
  if (!guard.authorized) return guard.response;

  const body = await req.json();
  const parsed = adminPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id, name, price, bv, ref_com, tree_com, status } = parsed.data;
  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

  await db.plan.update({ where: { id }, data: { name, price, bv, ref_com, tree_com, status } });
  return NextResponse.json({ success: true, message: 'Plan updated' });
}
