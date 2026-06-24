import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminProductSchema } from '@/lib/validations';
import { requirePermission } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  const guard = await requirePermission('products.create');
  if (!guard.authorized) return guard.response;

  const body = await req.json();
  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, platform_id, price, quantity, status } = parsed.data;
  await db.product.create({ data: { name, platform_id, price: price || 0, quantity: quantity || 1, status: status ?? 1 } });
  return NextResponse.json({ success: true, message: 'Product created successfully' });
}

export async function PUT(req: NextRequest) {
  const guard = await requirePermission('products.edit');
  if (!guard.authorized) return guard.response;

  const body = await req.json();
  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id, name, platform_id, price, quantity, status } = parsed.data;
  if (!id) return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });

  await db.product.update({ where: { id }, data: { name, platform_id, price, quantity, status } });
  return NextResponse.json({ success: true, message: 'Product updated successfully' });
}

export async function DELETE(req: NextRequest) {
  const guard = await requirePermission('products.delete');
  if (!guard.authorized) return guard.response;

  const { id } = await req.json();
  if (!id || typeof id !== 'number') return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
  await db.product.delete({ where: { id } });
  return NextResponse.json({ success: true, message: 'Product deleted successfully' });
}
