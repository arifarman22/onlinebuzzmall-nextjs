import { NextRequest, NextResponse } from 'next/server';
import { getApiUserId } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return NextResponse.json({ balance: 0 });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  return NextResponse.json({ balance: user?.balance || 0 });
}
