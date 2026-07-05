import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { order_id, profit, product_ids, quantities, prices, type } = await req.json();
  if (!order_id) return NextResponse.json({ success: false, message: 'order_id required' }, { status: 400 });

  await db.$transaction(async (tx) => {
    const orderUpdate: Record<string, unknown> = {};
    if (profit !== undefined && profit !== null) orderUpdate.profit = Number(profit);
    if (type !== undefined) orderUpdate.type = type;
    if (Object.keys(orderUpdate).length > 0) {
      await tx.order.update({ where: { id: order_id }, data: orderUpdate });
    }

    // Replace order details if product_ids provided
    if (Array.isArray(product_ids) && product_ids.length > 0) {
      const products = await tx.product.findMany({ where: { id: { in: product_ids } } });
      await tx.orderDetail.deleteMany({ where: { order_id } });
      await tx.orderDetail.createMany({
        data: product_ids.map((pid: number, i: number) => ({
          order_id,
          product_id: pid,
          quantity: quantities?.[i] ?? 1,
          price: prices?.[i] ?? products.find((p) => p.id === pid)?.price ?? 0,
        })),
      });
    }
  });

  return NextResponse.json({ success: true });
}
