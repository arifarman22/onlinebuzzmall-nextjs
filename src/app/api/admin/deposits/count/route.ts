import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const pending = await db.deposit.count({ where: { status: 2 } });

  return NextResponse.json({ success: true, pending });
}
