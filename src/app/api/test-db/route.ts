import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const count = await db.user.count();
    return NextResponse.json({ success: true, userCount: count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack?.split('\n').slice(0, 5) });
  }
}
