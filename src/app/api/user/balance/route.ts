import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ balance: 0 });

  const user = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { balance: true },
  });

  return NextResponse.json({ balance: user?.balance || 0 });
}
