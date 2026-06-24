import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') return null;
  return { session, roleSlug: (session.user as any).roleSlug || 'super-admin' };
}

function isSuperAdmin(roleSlug: string) { return roleSlug === 'super-admin'; }

export async function POST(req: NextRequest) {
  const guard = await checkAdmin();
  if (!guard) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!isSuperAdmin(guard.roleSlug)) return NextResponse.json({ success: false, message: 'Super Admin only' }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, message: 'Name required' }, { status: 400 });

    const slug = (body.slug || body.name.toLowerCase().replace(/[\s]+/g, '-').replace(/[^a-z0-9-]/g, '')).trim();
    const existingSlug = await db.platform.findFirst({ where: { slug } });
    if (existingSlug) return NextResponse.json({ success: false, message: 'Slug already exists' }, { status: 400 });

    await db.platform.create({
      data: {
        name: body.name,
        slug,
        image: body.image || null,
        description: body.description || null,
        commission: Number(body.commission) || 0,
        currency: body.currency || 'USDT',
        start_price: Number(body.start_price) || 0,
        end_price: Number(body.end_price) || 0,
        vip_level: Number(body.vip_level) || 1,
        max_orders_per_day: Number(body.max_orders_per_day) || 40,
        min_orders: Number(body.min_orders) || 0,
        show_on_dashboard: body.show_on_dashboard !== undefined ? Number(body.show_on_dashboard) : 1,
        allow_orders: body.allow_orders !== undefined ? Number(body.allow_orders) : 1,
        featured: body.featured !== undefined ? Number(body.featured) : 0,
        auto_approval: body.auto_approval !== undefined ? Number(body.auto_approval) : 0,
        status: body.status !== undefined ? Number(body.status) : 1,
      },
    });
    return NextResponse.json({ success: true, message: 'Platform created' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await checkAdmin();
  if (!guard) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!isSuperAdmin(guard.roleSlug)) return NextResponse.json({ success: false, message: 'Super Admin only' }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.slug !== undefined) {
      const slug = body.slug?.trim() || null;
      if (slug) {
        const existing = await db.platform.findFirst({ where: { slug, id: { not: body.id } } });
        if (existing) return NextResponse.json({ success: false, message: 'Slug already in use by another platform' }, { status: 400 });
      }
      data.slug = slug;
    }
    if (body.image !== undefined) data.image = body.image || null;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.commission !== undefined) data.commission = Number(body.commission);
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.start_price !== undefined) data.start_price = Number(body.start_price);
    if (body.end_price !== undefined) data.end_price = Number(body.end_price);
    if (body.vip_level !== undefined) data.vip_level = Number(body.vip_level);
    if (body.max_orders_per_day !== undefined) data.max_orders_per_day = Number(body.max_orders_per_day);
    if (body.min_orders !== undefined) data.min_orders = Number(body.min_orders);
    if (body.show_on_dashboard !== undefined) data.show_on_dashboard = Number(body.show_on_dashboard);
    if (body.allow_orders !== undefined) data.allow_orders = Number(body.allow_orders);
    if (body.featured !== undefined) data.featured = Number(body.featured);
    if (body.auto_approval !== undefined) data.auto_approval = Number(body.auto_approval);
    if (body.status !== undefined) data.status = Number(body.status);

    await db.platform.update({ where: { id: body.id }, data });
    return NextResponse.json({ success: true, message: 'Platform updated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await checkAdmin();
  if (!guard) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!isSuperAdmin(guard.roleSlug)) return NextResponse.json({ success: false, message: 'Super Admin only' }, { status: 403 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    await db.platform.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Platform deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed' }, { status: 500 });
  }
}
