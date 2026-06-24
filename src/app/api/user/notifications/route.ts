import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserNotifications, markAsRead, markAllAsRead } from '@/lib/notifications';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const notifications = await getUserNotifications(Number(session.user.id));
  return NextResponse.json({ success: true, data: notifications });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { action, id } = await req.json();

  if (action === 'read' && id) {
    await markAsRead(id);
    return NextResponse.json({ success: true });
  }

  if (action === 'read_all') {
    await markAllAsRead(Number(session.user.id));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
