import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 15));
  const search = searchParams.get('search')?.trim() || '';

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { platform: { name: { contains: search } } },
    ];
  }

  const [orderSets, total] = await Promise.all([
    db.orderSet.findMany({
      where,
      include: {
        platform: { select: { id: true, name: true } },
        _count: { select: { orders: true, orderSetAssigns: true } },
      },
      orderBy: { id: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.orderSet.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: orderSets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
