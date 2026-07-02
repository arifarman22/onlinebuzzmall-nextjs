import { NextRequest, NextResponse } from 'next/server';
import { getApiUserId } from '@/lib/api-auth';
import { getUserNotifications, markAsRead, markAllAsRead } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const notifications = await getUserNotifications(userId);
  return NextResponse.json({ success: true, data: notifications });
}

export async function POST(req: NextRequest) {
  const userId = await getApiUserId(req);
  if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const { action, id } = await req.json();

  if (action === 'read' && id) {
    await markAsRead(id);
    return NextResponse.json({ success: true });
  }

  if (action === 'read_all') {
    await markAllAsRead(userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
