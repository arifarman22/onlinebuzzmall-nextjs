import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const rules = await db.platformRules.findMany({
    where: { status: 1 },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, description: true, content: true, image: true },
  });
  return NextResponse.json({ success: true, data: rules });
}
