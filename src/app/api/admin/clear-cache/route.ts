import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { invalidateCache } from '@/lib/settings';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const roleSlug = (session.user as any).roleSlug || 'super-admin';
  if (roleSlug !== 'super-admin') {
    return NextResponse.json({ success: false, message: 'Super Admin only' }, { status: 403 });
  }

  try {
    // Clear settings cache
    invalidateCache();

    // Revalidate all pages
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/admin', 'layout');

    return NextResponse.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed' }, { status: 500 });
  }
}
