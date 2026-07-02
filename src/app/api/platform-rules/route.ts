import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

const getRules = unstable_cache(
  () => db.platformRules.findMany({
    where: { status: 1 },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, description: true, content: true, image: true },
  }),
  ['platform-rules'],
  { revalidate: 300 }
);

export async function GET() {
  const rules = await getRules();
  return NextResponse.json({ success: true, data: rules }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
