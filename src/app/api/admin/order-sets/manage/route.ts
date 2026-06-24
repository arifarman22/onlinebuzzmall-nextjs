import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

  const orderSet = await db.orderSet.findUnique({
    where: { id },
    include: {
      platform: { select: { id: true, name: true } },
      orders: {
        include: { orderDetails: { include: { product: { select: { name: true, price: true } } } } },
        orderBy: { id: 'desc' },
      },
    },
  });

  if (!orderSet) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, data: orderSet });
}
