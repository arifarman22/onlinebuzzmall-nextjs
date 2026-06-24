import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { order_set_id, product_ids, profit_percent, type } = await req.json();

  if (!order_set_id || !product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
    return NextResponse.json({ success: false, message: 'Order set ID and at least one product required' }, { status: 400 });
  }

  const orderSet = await db.orderSet.findUnique({ where: { id: order_set_id } });
  if (!orderSet) return NextResponse.json({ success: false, message: 'Order set not found' }, { status: 404 });

  try {
    // Create the order
    const order = await db.order.create({
      data: {
        order_set_id,
        platform_id: orderSet.platform_id,
        type: type || 'single',
        profit: profit_percent || 5,
        status: 1,
      },
    });

    // Add order details for each product
    for (const productId of product_ids) {
      const product = await db.product.findUnique({ where: { id: productId } });
      if (product) {
        await db.orderDetail.create({
          data: {
            order_id: order.id,
            product_id: product.id,
            price: product.price,
            quantity: 1,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: `Order added with ${product_ids.length} product(s)` });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Failed to add order' }, { status: 500 });
  }
}
