import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type') || 'browser';

  let data: { name: string; value: number }[] = [];

  switch (type) {
    case 'browser': {
      const loginResults = await db.userLogin.groupBy({
        by: ['browser'],
        _count: true,
        where: { browser: { not: null, notIn: ['', 'Unknown'] } },
        orderBy: { _count: { browser: 'desc' } },
        take: 8,
      });
      data = loginResults.map((r) => ({ name: r.browser || 'Unknown', value: r._count }));
      break;
    }

    case 'os': {
      const loginResults = await db.userLogin.groupBy({
        by: ['os'],
        _count: true,
        where: { os: { not: null, notIn: ['', 'Unknown'] } },
        orderBy: { _count: { os: 'desc' } },
        take: 8,
      });
      data = loginResults.map((r) => ({ name: r.os || 'Unknown', value: r._count }));
      break;
    }

    case 'country': {
      const loginResults = await db.userLogin.groupBy({
        by: ['country'],
        _count: true,
        where: { country: { not: null, notIn: ['', 'Unknown'] } },
        orderBy: { _count: { country: 'desc' } },
        take: 8,
      });
      data = loginResults.map((r) => ({ name: r.country || 'Unknown', value: r._count }));
      break;
    }
  }

  return NextResponse.json({ success: true, data });
}
