import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { order_id, profit } = await req.json();
  if (!order_id || profit === undefined || profit === null) {
    return NextResponse.json({ success: false, message: 'order_id and profit required' }, { status: 400 });
  }

  await db.order.update({ where: { id: order_id }, data: { profit: Number(profit) } });
  return NextResponse.json({ success: true });
}
