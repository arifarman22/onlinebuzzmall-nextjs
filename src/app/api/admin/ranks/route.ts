import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const ranks = await db.userRankSetting.findMany({ orderBy: { sort_order: 'asc' } });
  return NextResponse.json({ success: true, data: ranks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  // Seed defaults
  if (body.action === 'seed') {
    const defaults = [
      { name: 'VIP 1', slug: 'vip-1', commission: 4, daily_order: 10, sort_order: 1 },
      { name: 'VIP 2', slug: 'vip-2', commission: 5, daily_order: 20, sort_order: 2 },
      { name: 'VIP 3', slug: 'vip-3', commission: 8, daily_order: 40, sort_order: 3 },
    ];
    for (const r of defaults) {
      await db.userRankSetting.upsert({
        where: { slug: r.slug },
        update: {},
        create: { ...r, status: 1, min_deposit: 0, max_deposit: 0 },
      });
    }
    return NextResponse.json({ success: true, message: 'VIP ranks seeded' });
  }

  // Update user rank
  if (body.action === 'update_user_rank') {
    const { user_id, rank_id } = body;
    if (!user_id) return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
    await db.user.update({ where: { id: user_id }, data: { rank_id: rank_id || 0 } });
    return NextResponse.json({ success: true, message: 'User rank updated' });
  }

  // Create new rank
  const { name, slug, commission, daily_order, sort_order } = body;
  if (!name || !slug) return NextResponse.json({ success: false, message: 'Name and slug required' }, { status: 400 });
  await db.userRankSetting.create({ data: { name, slug, commission: commission || 0, daily_order: daily_order || 0, sort_order: sort_order || 0, status: 1, min_deposit: 0, max_deposit: 0 } });
  return NextResponse.json({ success: true, message: 'Rank created' });
}
