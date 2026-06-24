import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { order_id } = await req.json();
  if (!order_id) return NextResponse.json({ success: false, message: 'Order ID required' }, { status: 400 });

  try {
    // Delete order details first
    await db.orderDetail.deleteMany({ where: { order_id } });
    // Delete any order completes
    await db.orderComplete.deleteMany({ where: { order_id } });
    // Delete the order
    await db.order.delete({ where: { id: order_id } });

    return NextResponse.json({ success: true, message: 'Order deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to delete' }, { status: 500 });
  }
}
