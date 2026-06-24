import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const products = await db.product.findMany({
    where: { status: 1 },
    select: { id: true, name: true, price: true, platform_id: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ success: true, data: products });
}
